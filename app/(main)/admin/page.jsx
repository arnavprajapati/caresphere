import { TabsContent } from "@/components/ui/tabs";
import { PendingDoctors } from "./components/pending-doctors";
import { VerifiedDoctors } from "./components/verified-doctors";
import { FrontDeskStaff } from "./components/front-desk-staff";
import { AuditLogs } from "./components/audit-logs";
import {
  getPendingDoctors,
  getVerifiedDoctors,
  getFrontDeskStaff,
  getAuditLogs,
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [pendingDoctorsData, verifiedDoctorsData, frontDeskData, auditLogsData] =
    await Promise.all([
      getPendingDoctors(),
      getVerifiedDoctors(),
      getFrontDeskStaff(),
      getAuditLogs(50),
    ]);

  return (
    <>
      <TabsContent value="pending" className="border-none p-0">
        <PendingDoctors initialDoctors={pendingDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="front-desk" className="border-none p-0">
        <FrontDeskStaff initialStaff={frontDeskData.staff || []} />
      </TabsContent>

      <TabsContent value="doctors" className="border-none p-0">
        <VerifiedDoctors initialDoctors={verifiedDoctorsData.doctors || []} />
      </TabsContent>

      <TabsContent value="audit" className="border-none p-0">
        <AuditLogs logs={auditLogsData.logs || []} />
      </TabsContent>
    </>
  );
}
