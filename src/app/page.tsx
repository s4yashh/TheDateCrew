import { redirect } from "next/navigation";
import { isAiConfigured } from "@/ai/gemini";
import { getServerSession } from "@/auth/session";
import { persistenceMode, readStore } from "@/data/store";
import { AppWorkspace } from "@/components/AppWorkspace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Resolve the matchmaker from the store so a deleted or stale account cannot
  // keep using an old signed cookie.
  const store = await readStore();
  const matchmaker = store.matchmakers.find((item) => item.id === session.matchmakerId);
  if (!matchmaker) redirect("/login");

  return (
    <AppWorkspace
      email={matchmaker.email}
      matchmaker={{ name: matchmaker.name, initials: matchmaker.initials }}
      aiConfigured={isAiConfigured()}
      persistence={persistenceMode()}
    />
  );
}
