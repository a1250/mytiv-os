/** The marketing module (T-3.2 routes, E4 screens) is off unless MARKETING_MODULE_ENABLED is exactly "true";
 *  off = its routes and pages answer 404, as if they did not exist. */
export function marketingModuleEnabled(): boolean { return process.env.MARKETING_MODULE_ENABLED === 'true'; }
