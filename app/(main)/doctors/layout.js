export const metadata = {
  title: "Find Doctors - MediMeet",
  description: "Browse and book appointments with top healthcare providers",
};

export default async function DoctorsLayout({ children }) {
  return (
    <div className="w-full px-3 sm:px-6 pt-7 pb-6">
      <div className="w-full">{children}</div>
    </div>
  );
}
