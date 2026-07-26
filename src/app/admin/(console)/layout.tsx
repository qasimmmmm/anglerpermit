import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/panel";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
