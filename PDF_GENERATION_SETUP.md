# PDF Generation Setup Guide

## Overview

Rankora AI uses **Puppeteer** for PDF generation with an environment-aware strategy:

- **Development/macOS**: Uses Puppeteer's bundled Chromium (cross-platform compatible)
- **Production/AWS Lambda**: Uses `@sparticuz/chromium` (optimized for serverless)

This approach solves the macOS ENOEXEC error caused by `@sparticuz/chromium` being compiled only for AWS Lambda (Linux x86-64).

## Installation

### 1. Install Dependencies

```bash
pnpm install
```

This will automatically install:
- `puppeteer` (includes bundled Chromium ~300MB)
- `@sparticuz/chromium` (for production use)

### 2. Approve Puppeteer Build Scripts

On first install, approve Puppeteer's postinstall script to download Chromium:

```bash
pnpm approve-builds puppeteer
```

This downloads the bundled Chromium binary (~300MB) that works on all platforms.

## How It Works

### Environment Detection

The PDF generation automatically detects the environment:

```typescript
const isDevelopment = process.env.NODE_ENV === "development" || platform === "darwin";

if (isDevelopment) {
  // Use puppeteer's bundled Chromium (works on macOS, Windows, Linux)
  browser = await puppeteer.launch({ headless: true, ... });
} else {
  // Production: Use @sparticuz/chromium for AWS Lambda
  browser = await puppeteer.launch({ 
    executablePath: await chromium.executablePath(),
    ...
  });
}
```

### Platform-Specific Behavior

| Environment | Browser Used | Notes |
|-------------|--------------|-------|
| **macOS (development)** | Puppeteer bundled Chromium | ✅ Works out of the box |
| **Windows (development)** | Puppeteer bundled Chromium | ✅ Works out of the box |
| **Linux (development)** | Puppeteer bundled Chromium | ✅ Works out of the box |
| **AWS Lambda (production)** | @sparticuz/chromium | ✅ Optimized for serverless |

## Testing PDF Generation

### 1. Start Development Server

```bash
pnpm dev
```

### 2. Generate a Test PDF

Navigate to:
```
http://localhost:3000/insights
```

Search for a business, generate an insight, and click "Download PDF".

### 3. Expected Output

You should see console logs like:

```
[PDF] 🚀 Launching puppeteer bundled Chromium (darwin)
[PDF] ✅ Puppeteer bundled Chromium launched successfully
[PDF] Rendering HTML with options: { includeCharts: false }
[PDF] PDF generated successfully (size: 123456 bytes)
```

## Troubleshooting

### Issue: "Failed to launch browser"

**Solution**: Verify Chromium was downloaded:

```bash
# Check if Chromium exists
ls -la node_modules/.cache/puppeteer/chrome/
```

If missing, re-run:
```bash
pnpm approve-builds puppeteer
```

### Issue: "ENOEXEC" error on macOS

**Solution**: This should no longer occur with the new setup. If you still see it:

1. Verify you're using `puppeteer` (not `puppeteer-core`):
   ```bash
   pnpm list puppeteer
   ```

2. Check environment detection:
   ```bash
   echo $NODE_ENV
   node -p "require('os').platform()"
   ```

### Issue: Charts not rendering

**Expected behavior**: Charts are automatically disabled on macOS to prevent canvas-related issues.

You'll see:
```
[PDF] Charts disabled on darwin platform
```

This is intentional and prevents memory issues with `chartjs-node-canvas` on macOS.

## Production Deployment

### Vercel Deployment

No additional configuration needed! The code automatically detects production environment and uses `@sparticuz/chromium`.

### Environment Variables (Optional)

You can force specific behavior:

```bash
# Force use of @sparticuz/chromium (not recommended for local dev)
FORCE_CHROMIUM=true

# Explicitly set Node environment
NODE_ENV=production
```

## Why This Approach?

### Problem with Previous Setup

- `@sparticuz/chromium` is compiled **only for AWS Lambda** (Linux x86-64)
- macOS cannot execute Linux binaries → **ENOEXEC error**
- Searching for local Chrome installations is unreliable (users may not have Chrome)

### Solution Benefits

✅ **Cross-platform compatibility**: Works on macOS, Windows, Linux out of the box  
✅ **No manual Chrome installation**: Puppeteer includes Chromium automatically  
✅ **Production-optimized**: Still uses `@sparticuz/chromium` in AWS Lambda  
✅ **Zero configuration**: Environment detection handles everything  
✅ **Reliable**: No dependency on system-installed browsers  

## Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [@sparticuz/chromium GitHub](https://github.com/Sparticuz/chromium)
- [Puppeteer vs Puppeteer-Core](https://pptr.dev/guides/puppeteer-vs-puppeteer-core)

## Support

If you encounter issues:

1. Check console logs for `[PDF]` prefixed messages
2. Verify Chromium was downloaded: `ls node_modules/.cache/puppeteer/`
3. Ensure `NODE_ENV` is set correctly
4. Review error details in terminal output

For production issues, check Vercel logs and ensure `@sparticuz/chromium` is working correctly in the Lambda environment.
