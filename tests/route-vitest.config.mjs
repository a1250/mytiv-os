const config = { test: { include: ['tests/routes.vitest.ts', 'tests/rollback.vitest.ts'], environment: 'node' }, resolve: { alias: { '@': new URL('../', import.meta.url).pathname } } };

export default config;
