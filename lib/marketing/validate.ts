import Ajv from "ajv";
import c1Schema from "./contracts/C1.schema.json";
import { parseMarketingPlan, type MarketingPlan } from "./contract";
import { OpsPolicyError } from "../ops-policy";

/**
 * C1 (MarketingPlan) validation, composed in the order the vendored contract intends:
 *   1. AJV structural gate against the vendored canonical `C1.schema.json` — shape, types,
 *      enums, required keys, and `additionalProperties:false`.
 *   2. the reference contextual parser (`parseMarketingPlan`) — the rules JSON Schema cannot
 *      express: tenant scope, not-in-the-future, safe refs, priority references, dependency
 *      cycles and timing, credential/unsafe-URL rejection.
 *
 * The structural gate runs first so a malformed payload is rejected before `parseMarketingPlan`
 * (which would otherwise report a coarser error). Formats (e.g. date-time) are intentionally not
 * validated by AJV — the parser enforces them exactly — so the single `ajv` dependency suffices.
 */
const ajv = new Ajv({ allErrors: true, strict: false });
const validateStructure = ajv.compile(c1Schema);

export function validateMarketingPlan(value: unknown, expectedBusiness: string): MarketingPlan {
  if (!validateStructure(value)) {
    const first = validateStructure.errors?.[0];
    const where = first ? `${first.instancePath || "/"} ${first.message ?? ""}`.trim() : "";
    throw new OpsPolicyError(`contract_structure_invalid${where ? `: ${where}` : ""}`);
  }
  return parseMarketingPlan(value, expectedBusiness);
}
