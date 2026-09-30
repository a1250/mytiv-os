// Local-Postgres integration suite (tests/db-integration/run.sh). Not part of `npm test` (no DB in CI).
const root = new URL('../../', import.meta.url).pathname;
const config = {
  test: { include: ['tests/db-integration/*.itest.ts'], environment: 'node', fileParallelism: false, testTimeout: 30000,
    // drizzle-orm is inlined so its `pg` import follows the alias below (pg is not a mytiv-os dependency).
    server: { deps: { inline: [/drizzle-orm/] } } },
  resolve: { alias: {
    '@': root,
    'server-only': new URL('./server-only-stub.mjs', import.meta.url).pathname,
    ...(process.env.ITEST_PG_MODULE ? { pg: process.env.ITEST_PG_MODULE } : {}),
  } },
};

export default config;
