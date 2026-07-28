/**
 * Phase 0 seed: creates the Mytiv business + its owner user, plus a second
 * test business ("Acme Test Co") owned by the same user — this second
 * business exists purely to verify cross-tenant data isolation (see the
 * Phase 0 milestone in the plan). Safe to run once against a fresh database;
 * re-running skips creation if the owner email already exists.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users, businesses, businessMemberships } from "../lib/db/schema";

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in .env.local before seeding.");
  }

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    [user] = await db.insert(users).values({ email, passwordHash, name: "Eliran" }).returning();
    console.log(`Created user ${user.email}`);
  } else {
    console.log(`User ${user.email} already exists, skipping creation`);
  }

  const businessSeeds = [
    { name: "Mytiv", slug: "mytiv", accentColor: "#6366f1" },
    { name: "Acme Test Co", slug: "acme-test-co", accentColor: "#e8b44f" },
  ];

  for (const seed of businessSeeds) {
    let [business] = await db.select().from(businesses).where(eq(businesses.slug, seed.slug)).limit(1);
    if (!business) {
      [business] = await db.insert(businesses).values(seed).returning();
      console.log(`Created business ${business.name} (${business.slug})`);
    } else {
      console.log(`Business ${business.slug} already exists, skipping creation`);
    }

    const [membership] = await db
      .select()
      .from(businessMemberships)
      .where(eq(businessMemberships.businessId, business.id))
      .limit(1);
    if (!membership) {
      await db.insert(businessMemberships).values({
        businessId: business.id,
        userId: user.id,
        role: "owner",
        acceptedAt: new Date(),
      });
      console.log(`  -> membership created (owner)`);
    }
  }

  console.log("\nSeed complete. Log in with:");
  console.log(`  email:    ${email}`);
  console.log(`  password: (as set in SEED_OWNER_PASSWORD)`);
  console.log("\nWorkspaces: /mytiv and /acme-test-co");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
