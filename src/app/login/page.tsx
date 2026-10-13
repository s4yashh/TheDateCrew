import { redirect } from "next/navigation";
import { getServerSession } from "@/auth/session";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getServerSession()) redirect("/");
  return <LoginForm />;
}
