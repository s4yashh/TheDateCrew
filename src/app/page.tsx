import { redirect } from "next/navigation";
import { getServerSession } from "@/auth/session";
import { AppWorkspace } from "@/components/AppWorkspace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <AppWorkspace email={session.email} aiConfigured={Boolean(process.env.OPENAI_API_KEY)} />;
}
