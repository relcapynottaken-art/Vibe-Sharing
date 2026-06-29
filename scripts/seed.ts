import "dotenv/config";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { categories, users } from "../src/db/schema";

const ADMIN_USERNAME = "Capy";
const PASSWORD_LENGTH = 100;

// Unambiguous-but-strong alphabet for the generated admin password.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.?";

function generatePassword(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

const DEFAULT_CATEGORIES = [
  "Web Apps",
  "Games",
  "Tools & Utilities",
  "AI & Bots",
  "Art & Design",
  "Experiments",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const db = drizzle(neon(url));

  // Seed categories (idempotent).
  for (const name of DEFAULT_CATEGORIES) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values({ name, slug });
      console.log(`+ category: ${name}`);
    }
  }

  // Seed the single admin account.
  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(
      `\nAdmin "${ADMIN_USERNAME}" already exists — password left unchanged.`,
    );
    return;
  }

  const password = generatePassword(PASSWORD_LENGTH);
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    username: ADMIN_USERNAME,
    passwordHash,
    role: "admin",
  });

  console.log("\n========================================================");
  console.log("  ADMIN ACCOUNT CREATED — SAVE THIS NOW (shown once)");
  console.log("========================================================");
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Password (${password.length} chars):`);
  console.log(`  ${password}`);
  console.log("========================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
