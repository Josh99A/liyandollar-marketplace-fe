import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  const authSession = cookieStore.get("auth-session");

  if (!authToken && !authSession) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:gap-6 lg:px-8">
        <DashboardTopbar />
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
          <DashboardSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
