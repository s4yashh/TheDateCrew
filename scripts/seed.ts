import nextEnv from "@next/env";
import { persistenceMode, resetStore } from "../src/data/store";

// `tsx` does not load Next.js env files on its own. This makes `npm run seed`
// honour .env.local, so the same command resets either the local file or Neon.
nextEnv.loadEnvConfig(process.cwd());

const store = await resetStore();
const clients = store.profiles.filter((profile) => profile.assignedMatchmakerId !== null);
const candidates = store.profiles.filter((profile) => profile.assignedMatchmakerId === null);

console.log(`Seeded ${clients.length} assigned customers and ${candidates.length} fictional candidates.`);
console.log(`Candidate pool: ${candidates.filter((profile) => profile.gender === "woman").length} women, ${candidates.filter((profile) => profile.gender === "man").length} men.`);
console.log(`Matchmakers: ${store.matchmakers.map((matchmaker) => `${matchmaker.name} (${matchmaker.email})`).join(", ")}.`);
console.log(`Persistence: ${persistenceMode()}. Run this command again to reset the demo.`);
