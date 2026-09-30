// T-3.2: record a proposal (writer, audited). See lib/marketing/route-handlers.ts.
import { recordRoute } from '@/lib/marketing/route-handlers';

export const POST = recordRoute('proposal');
