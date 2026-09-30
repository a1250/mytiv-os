// T-3.2: import an engine artifact (POST, writer) / latest artifact per kind (GET, member). See lib/marketing/route-handlers.ts.
import { importArtifactRoute, listArtifactsRoute } from '@/lib/marketing/route-handlers';

export const POST = importArtifactRoute;
export const GET = listArtifactsRoute;
