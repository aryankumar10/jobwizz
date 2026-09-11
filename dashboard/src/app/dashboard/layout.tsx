export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  );
}
