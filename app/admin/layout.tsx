import { getAuthUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getAuthUser();
    if (!user.admin) {
      redirect("/");
    }
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}
