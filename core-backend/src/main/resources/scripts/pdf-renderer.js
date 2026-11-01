const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node pdf-renderer.js <inputHtmlPath> <outputPdfPath> [landscape]');
    process.exit(1);
  }

  const inputHtmlPath = path.resolve(args[0]);
  const outputPdfPath = path.resolve(args[1]);
  const landscape = args[2] === 'true' || args[2] === '1';

  let playwright;
  try {
    playwright = require('@playwright/test');
  } catch (e1) {
    try {
      playwright = require('playwright');
    } catch (e2) {
      const candidatePaths = [
        path.resolve(__dirname, '../../../../sms-web/node_modules/@playwright/test'),
        path.resolve(__dirname, '../../../sms-web/node_modules/@playwright/test'),
        path.resolve(process.cwd(), 'sms-web/node_modules/@playwright/test'),
        path.resolve(process.cwd(), '../sms-web/node_modules/@playwright/test'),
        path.resolve(process.cwd(), '../../sms-web/node_modules/@playwright/test'),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            playwright = require(p);
            break;
          } catch (_) {}
        }
      }
    }
  }

  if (!playwright || !playwright.chromium) {
    console.error('Playwright module not found. Falling back to Chromium CLI.');
    process.exit(2);
  }

  let browser;
  const channels = ['msedge', 'chrome', undefined];
  let lastError;

  for (const channel of channels) {
    try {
      const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      };
      if (channel) launchOptions.channel = channel;
      browser = await playwright.chromium.launch(launchOptions);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!browser) {
    console.error('Failed to launch browser with Playwright:', lastError ? lastError.message : 'Unknown error');
    process.exit(3);
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const htmlContent = fs.readFileSync(inputHtmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'load' });

    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      landscape: landscape,
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    await browser.close();
    console.log('PDF rendered successfully via Playwright to', outputPdfPath);
    process.exit(0);
  } catch (err) {
    if (browser) await browser.close();
    console.error('Error generating PDF:', err.message);
    process.exit(4);
  }
}

main();

