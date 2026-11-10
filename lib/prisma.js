import path from "path";
import { PrismaClient } from "@prisma/client";

function clientHasExpectedSchema(client) {
  if (!client) return false;
  const appointmentFields =
    client._runtimeDataModel?.models?.Appointment?.fields || [];
  const userFields = client._runtimeDataModel?.models?.User?.fields || [];
  const hasAppointmentVideoFields =
    appointmentFields.some((f) => f.name === "videoSessionId") &&
    appointmentFields.some((f) => f.name === "videoSessionToken");
  const hasUserQualification = userFields.some(
    (f) => f.name === "qualification"
  );

  return (
    typeof client.weeklyAvailability === "object" &&
    typeof client.availabilityOverride === "object" &&
    typeof client.creditTransaction === "object" &&
    hasAppointmentVideoFields &&
    hasUserQualification
  );
}

function getNodeRequire() {
  if (typeof process !== "undefined" && typeof process.getBuiltinModule === "function") {
    const mod = process.getBuiltinModule("module");
    if (mod && typeof mod.createRequire === "function") {
      return mod.createRequire(path.join(process.cwd(), "package.json"));
    }
  }
  return null;
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // During Next.js dev HMR, Node's require.cache may still hold an older @prisma/client
  // instance from before `prisma generate` updated node_modules/.prisma/client/index.js.
  // Use process.getBuiltinModule("module") so Webpack does not statically stub createRequire.
  if (process.env.NODE_ENV !== "production" && !clientHasExpectedSchema(client)) {
    try {
      const nodeRequire = getNodeRequire();
      if (nodeRequire && nodeRequire.cache) {
        for (const key of Object.keys(nodeRequire.cache)) {
          if (key.includes(".prisma") || key.includes("@prisma")) {
            delete nodeRequire.cache[key];
          }
        }
        const { PrismaClient: FreshPrismaClient } = nodeRequire("@prisma/client");
        const freshClient = new FreshPrismaClient({
          log: ["warn", "error"],
        });
        if (clientHasExpectedSchema(freshClient)) {
          return freshClient;
        }
      }
    } catch (reloadErr) {
      console.warn("[Prisma] Cache reload fallback failed:", reloadErr.message);
    }
    console.warn(
      "[Prisma] Loaded PrismaClient is out of date with prisma/schema. Stop the dev server, run `npx prisma generate`, and restart."
    );
  }

  return client;
};

const basePrisma = clientHasExpectedSchema(globalThis.prisma)
  ? globalThis.prisma
  : prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = basePrisma;
}

/**
 * Retry-aware Prisma proxy for Neon Serverless PostgreSQL.
 * 
 * Neon suspends idle compute endpoints after ~5 minutes of inactivity.
 * The first query after wake-up often fails with P1001 ("Can't reach database server").
 * This proxy transparently retries any failed Prisma model operation once after a
 * short delay, giving the Neon endpoint time to cold-start.
 */
function createRetryProxy(prisma) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 800;

  async function withRetry(fn) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isConnectionError =
          error.code === "P1001" ||
          error.code === "P1002" ||
          error.code === "P1008" ||
          error.code === "P1017" ||
          (error.message &&
            (error.message.includes("Can't reach database server") ||
              error.message.includes("Server has closed the connection") ||
              error.message.includes("Connection terminated") ||
              error.message.includes("Closed")));

        if (!isConnectionError || attempt === MAX_RETRIES) {
          throw error;
        }

        console.warn(
          `[Prisma Retry] Neon connection failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAY_MS}ms...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    throw lastError;
  }

  const handler = {
    get(target, prop) {
      const value = target[prop];

      // Retry interactive $transaction on Neon cold-start connection errors
      // and give remote Neon interactive transactions a safe timeout window.
      if (prop === "$transaction" && typeof value === "function") {
        return async function (arg1, arg2, ...rest) {
          if (typeof arg1 === "function") {
            const txOptions = {
              maxWait: 10000,
              timeout: 20000,
              ...(arg2 && typeof arg2 === "object" ? arg2 : {}),
            };
            return await withRetry(() => value.call(target, arg1, txOptions, ...rest));
          }
          return await withRetry(() => value.apply(target, [arg1, arg2, ...rest]));
        };
      }

      // Only wrap Prisma model accessors; skip internal properties and $-prefixed methods.
      if (
        typeof prop === "symbol" ||
        prop.startsWith("$") ||
        prop.startsWith("_") ||
        typeof value !== "object" ||
        value === null
      ) {
        return value;
      }

      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelMethod = modelTarget[modelProp];

          if (typeof modelMethod !== "function") {
            return modelMethod;
          }

          return async function (...args) {
            return await withRetry(() => modelMethod.apply(modelTarget, args));
          };
        },
      });
    },
  };

  return new Proxy(prisma, handler);
}

export const db = createRetryProxy(basePrisma);
