import nextEnv from "@next/env";
import { generateIntroDraft } from "@/ai/introduction";
import { generateMatchExplanation } from "@/ai/explanation";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

nextEnv.loadEnvConfig(process.cwd());

const store = createSeedStore();
const customer = store.profiles.find((profile) => profile.assignedMatchmakerId !== null)!;
const candidate = store.profiles.find((profile) => profile.assignedMatchmakerId === null && profile.gender !== customer.gender)!;
const match = scoreMatch(customer, candidate);

const intro = await generateIntroDraft(customer, candidate, match);
const explanation = await generateMatchExplanation(customer, candidate, match);

console.log("INTRO SOURCE:", intro.source, intro.label, intro.fallbackReason ?? "");
console.log(intro.introText);
console.log("\nEXPLANATION SOURCE:", explanation.source, explanation.label, explanation.fallbackReason ?? "");
console.log(explanation.explanation);
