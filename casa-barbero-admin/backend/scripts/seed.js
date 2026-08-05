import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  barbers,
  blockedTimes,
  bookings,
  services,
  transactions,
  workingHours
} from "../../shared/data/casaData.js";
import { supabase } from "../src/config/supabase.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.join(scriptDirectory, "..", "data");
const outputFile = path.join(outputDirectory, "seed-output.json");

const payload = {
  generatedAt: new Date().toISOString(),
  barbers,
  services,
  workingHours,
  blockedTimes,
  bookings,
  transactions
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2));
console.log(`Wrote ${bookings.length} bookings, ${transactions.length} transactions, and ${barbers.length} barbers to ${outputFile}`);

if (supabase) {
  console.log("Supabase credentials detected. Use the generated JSON as the source payload for table upserts.");
} else {
  console.log("No Supabase credentials found, so the seed script generated local seed-output.json only.");
}
