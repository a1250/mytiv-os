import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The proposal PDF route reads the Heebo font files off disk at render time.
  // Files under public/ are served by the CDN and are NOT part of a serverless
  // function's bundle by default, so they must be traced in explicitly or the
  // route 500s on Vercel while working fine locally.
  outputFileTracingIncludes: {
    "/api/[businessSlug]/proposals/[id]/pdf": ["./public/fonts/**/*"],
  },
};

export default nextConfig;
