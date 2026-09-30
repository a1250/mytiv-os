// T-3.2: record a receipt (writer, audited). See lib/marketing/route-handlers.ts.
import { recordRoute } from '@/lib/marketing/route-handlers';

export const POST = recordRoute('receipt');
