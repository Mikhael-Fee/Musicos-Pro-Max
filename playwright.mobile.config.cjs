const config = require('./playwright.config.cjs');
module.exports = {
  ...config,
  testMatch: ['**/tonal.spec.cjs', '**/phase2.spec.cjs', '**/platform.spec.cjs'],
  outputDir: 'test-results/mobile',
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/mobile' }]] : 'list',
  use: { ...config.use, baseURL: 'http://127.0.0.1:5175', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  webServer: { command: 'npm run build && python3 -m http.server 5175 --bind 127.0.0.1 --directory dist', port: 5175, reuseExistingServer: false }
};
