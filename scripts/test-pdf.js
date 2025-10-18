#!/usr/bin/env node

/**
 * Test script to verify PDF generation works correctly
 * Run with: node scripts/test-pdf.js
 */

const os = require('os');

console.log('🧪 PDF Generation Test Suite\n');
console.log('=' .repeat(50));

// 1. Environment Check
console.log('\n📊 Environment Information:');
console.log(`  Platform: ${os.platform()}`);
console.log(`  Architecture: ${os.arch()}`);
console.log(`  Node.js: ${process.version}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

// 2. Dependency Check
console.log('\n📦 Checking Dependencies:');

try {
  const puppeteer = require('puppeteer');
  console.log('  ✅ puppeteer (full package) installed');
  
  const chromium = require('@sparticuz/chromium');
  console.log('  ✅ @sparticuz/chromium installed');
} catch (e) {
  console.log('  ❌ Missing dependencies:', e.message);
  process.exit(1);
}

// 3. Chromium Binary Check
console.log('\n🔍 Checking Bundled Chromium:');

const fs = require('fs');
const path = require('path');

const chromiumPaths = [
  'node_modules/.cache/puppeteer',
  '.cache/puppeteer',
];

let chromiumFound = false;
for (const p of chromiumPaths) {
  const fullPath = path.join(process.cwd(), p);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ Found Chromium cache at: ${p}`);
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`     Contents: ${files.join(', ')}`);
      chromiumFound = true;
      break;
    } catch (e) {
      console.log(`     ⚠️  Could not read directory: ${e.message}`);
    }
  }
}

if (!chromiumFound) {
  console.log('  ⚠️  Chromium cache not found. Run: pnpm approve-builds puppeteer');
}

// 4. Browser Launch Test
console.log('\n🚀 Testing Browser Launch:');

(async () => {
  const puppeteer = require('puppeteer');
  const chromium = require('@sparticuz/chromium');
  
  const platform = os.platform();
  const isDevelopment = process.env.NODE_ENV === 'development' || platform === 'darwin';
  
  console.log(`  Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`  Strategy: ${isDevelopment ? 'Puppeteer bundled Chromium' : '@sparticuz/chromium'}`);
  
  try {
    let browser;
    
    if (isDevelopment) {
      console.log('\n  Launching puppeteer bundled Chromium...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    } else {
      console.log('\n  Launching @sparticuz/chromium...');
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
    
    console.log('  ✅ Browser launched successfully!');
    
    // Test basic page rendering
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>');
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    
    console.log(`  ✅ PDF generated successfully! (${pdf.length} bytes)`);
    
    await browser.close();
    console.log('  ✅ Browser closed successfully');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed! PDF generation is working correctly.');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n  ❌ Browser launch failed:');
    console.error(`     Error: ${error.message}`);
    console.error(`     Code: ${error.code || 'N/A'}`);
    
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Run: pnpm approve-builds puppeteer');
    console.log('  2. Check: ls -la node_modules/.cache/puppeteer/');
    console.log('  3. Verify: pnpm list puppeteer');
    console.log('  4. See: PDF_GENERATION_SETUP.md for detailed guide');
    
    process.exit(1);
  }
})();
