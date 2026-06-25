import { createRequire } from 'node:module';
import { defineConfig } from 'cypress';
import mochawesomePlugin from 'cypress-mochawesome-reporter/plugin';

// In this npm workspace the reporter is hoisted to the repo-root node_modules,
// where Cypress's reporter loader won't look. Resolve it to an absolute path.
const require = createRequire(import.meta.url);

// Cypress E2E for the WAT tests.
// Drives the Vite dev server on :5173 (which proxies /api and /ws to the backend) against the isolated seeded backend on :3001 from e2e/server-launch.mjs.
export default defineConfig({
  // Self-contained HTML report at cypress/reports/index.html (uploaded in CI).
  reporter: require.resolve('cypress-mochawesome-reporter'),
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'WAT Cypress E2E',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    overwrite: false,
    html: true,
    json: false,
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: false,
    video: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on) {
      mochawesomePlugin(on);
    },
  },
  // Seeded admin credentials (match e2e/server-launch.mjs).
  // Override with CYPRESS_seedEmail / CYPRESS_seedPassword env vars if needed.
  env: {
    seedEmail: 'e2e@trek.local',
    seedPassword: 'E2eTest12345!',
    newPassword: 'E2eChanged12345!',
  },
});
