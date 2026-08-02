import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/panel";
import { warmMongo } from "@/lib/mongo";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  // Fire-and-forget warm so subsequent API/page Mongo calls reuse the pool.
  void warmMongo();
  return <AdminShell>{children}</AdminShell>;
}
