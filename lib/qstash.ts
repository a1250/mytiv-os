import { Client } from "@upstash/qstash";

export const qstash = new Client({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});

/** Publishes a job trigger to the worker route (app/api/jobs/discovery). */
export async function publishDiscoveryJob(jobId: string, appUrl: string) {
  await qstash.publishJSON({
    url: `${appUrl}/api/jobs/discovery`,
    body: { jobId },
    retries: 2,
  });
}
