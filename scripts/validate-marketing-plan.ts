import fs from 'node:fs';
import { parseMarketingPlan } from '../lib/marketing/contract';
const [business, file] = process.argv.slice(2);
if (!business || !file) throw new Error('Usage: node --import tsx scripts/validate-marketing-plan.ts <marketing-business> <plan.json>');
const plan = parseMarketingPlan(JSON.parse(fs.readFileSync(file, 'utf8')), business);
console.log(JSON.stringify({ valid: true, revision: plan.revision, priorities: plan.priorities.length, items: plan.items.length, reviews: plan.reviews.length }));
