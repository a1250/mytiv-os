// T-3.2: record a decision (writer, audited). See lib/marketing/route-handlers.ts.
import { recordRoute } from '@/lib/marketing/route-handlers';

export const POST = recordRoute('decision');
