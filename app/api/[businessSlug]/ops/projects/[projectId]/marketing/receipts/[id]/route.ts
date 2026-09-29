// T-3.2: downloadable receipt JSON (writer; stamps exported_at once). See lib/marketing/route-handlers.ts.
import { exportRoute } from '@/lib/marketing/route-handlers';

export const GET = exportRoute('receipt');
