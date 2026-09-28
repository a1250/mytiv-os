const config = { test: { include: ['tests/*.vitest.ts'], environment: 'node' }, resolve: { alias: { '@': new URL('../', import.meta.url).pathname } } };

export default config;
