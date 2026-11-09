import { useState } from "react";
import { toast } from "sonner";

function getSafeErrorMessage(error) {
  const msg = error?.message || "";
  const technicalPattern =
    /prisma|findMany|findUnique|findFirst|upsert|deleteMany|updateMany|invocation|Cannot read properties|ECONN|P10\d{2}|P20\d{2}|TypeError|ReferenceError|SyntaxError|Server Components|NEXT_REDIRECT|NEXT_NOT_FOUND/i;

  if (!msg || technicalPattern.test(msg)) {
    return "Something went wrong. Please try again in a moment.";
  }

  return msg;
}

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (err) {
      console.error("[Action Error]", err);
      setError(err);
      toast.error(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
