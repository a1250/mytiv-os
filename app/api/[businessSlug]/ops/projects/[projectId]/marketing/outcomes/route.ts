// T-3.2: record a outcome (writer, audited). See lib/marketing/route-handlers.ts.
import { recordRoute } from '@/lib/marketing/route-handlers';

export const POST = recordRoute('outcome');
