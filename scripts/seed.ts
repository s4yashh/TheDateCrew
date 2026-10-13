import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSeedStore } from "../src/data/seed";

const store = createSeedStore();
const directory = resolve(process.cwd(), ".data");
mkdirSync(directory, { recursive: true });
writeFileSync(resolve(directory, "demo-store.json"), `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
console.log(`Seeded ${store.profiles.filter((profile) => profile.assigned).length} assigned customers and ${store.profiles.filter((profile) => !profile.assigned).length} fictional candidates.`);
console.log("Demo state written to .data/demo-store.json; run this command again to reset the demo.");
