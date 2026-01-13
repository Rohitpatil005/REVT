# Electron App Configuration Guide

## Overview

The Electron app is configured to work in a **hybrid mode**:
- **Development**: Loads from local dev server (`http://localhost:5173`)
- **Production**: Loads from hosted website (`https://revt.vercel.app`)
- **Fallback**: Falls back to local built files if hosted URL fails

This allows the app to:
- Work offline with cached content
- Save PDFs to the local file system using Electron's file APIs
- Use localStorage for local data persistence per domain

## Building for Electron

### Prerequisites
- Node.js 16+ with pnpm package manager
- Visual Studio Build Tools or similar for native modules (on Windows)

### Build Commands

```bash
# Development mode - runs with hot reload
npm run electron:dev

# Build production executable (Windows NSIS)
npm run electron:build:nsis

# Build production executable (Windows APPX)
npm run electron:build:appx

# Build both formats
npm run electron:build:all
```

## File Structure

```
electron/
├── main.mjs          # Main process (window management, IPC)
├── preload.mjs       # Preload script (bridges Electron APIs to renderer)
└── index.html        # Entry point (in root)

client/
├── utils/
│   └── nativeBridge.ts   # Electron bridge utilities
└── App.tsx          # React app with error boundaries
```

## Environment Variables

### Optional Environment Variables

Set these in your shell before running commands:

```bash
# Enable debug mode (shows dev tools in production build)
export ELECTRON_DEBUG=1

# Override dev server URL (development only)
export VITE_DEV_SERVER_URL=http://localhost:5173

# Force development mode
export ELECTRON_DEV=1
```

### Windows

Use these commands to set environment variables temporarily:

```powershell
# Enable debug mode
$env:ELECTRON_DEBUG = "1"

# Force dev mode
$env:ELECTRON_DEV = "1"

# Then run
npm run electron:dev
```

## Features

### 1. Local PDF Saving
- PDFs are saved to user's Documents folder:
  - Rohit: `Documents/Invoice RE/`
  - Vighneshwar: `Documents/Invoice VT/`

### 2. Data Persistence
- Data is stored in browser's localStorage (per domain)
- When loading from `https://revt.vercel.app`, data is stored separately from the web version
- Data persists across app restarts

### 3. Offline Support
- First load caches content
- App works offline with cached resources
- When online, loads fresh content from hosted URL

### 4. Error Handling
- Error boundary catches rendering errors
- Comprehensive logging in console and `__appDebug` object
- Detailed error messages shown to user if app fails to load

## Debugging

### Enable Debug Mode

```bash
export ELECTRON_DEBUG=1
npm run electron:dev
```

This opens the Electron Developer Tools showing:
- Console logs
- Network requests
- React component tree
- Preload script execution

### Check Debug Info in Console

Once the app is running, check these in the browser console:

```javascript
// Check if Electron is available
window.electron

// View debug info
window.__appDebug
window.__electronDebug

// Check localStorage
localStorage.getItem('rbs:rohit:invoices')
```

### Common Issues

#### Blank Screen
1. Check browser console for errors (F12)
2. Check Electron console logs
3. Verify network connectivity (if loading from hosted URL)
4. Check that preload script loaded: `window.electron` should exist

#### PDF Saving Not Working
1. Check if `window.electron.savePdf` exists
2. Verify user has write permissions to Documents folder
3. Check Electron main process logs for file system errors

#### Data Not Persisting
1. Check localStorage is not disabled
2. Verify domain is correct (`https://revt.vercel.app`)
3. Check browser privacy/incognito mode

## Production Build Notes

### NSIS Installer
- Creates: `release/Rohit Billing Suite Setup 0.1.0.exe`
- User can specify installation directory
- Creates Start Menu shortcut and desktop shortcut
- Supports uninstall

### APPX Package
- Creates: `release/*.appx`
- For Windows Store or enterprise distribution
- Requires signing for production deployment

## Security Considerations

1. **Preload Script**: Uses context isolation and sandbox mode
2. **IPC Communication**: Only specific methods are exposed (`savePdf`, `readFile`)
3. **Content Security**: No inline scripts, only module-based
4. **File System Access**: Limited to invoice saving in specific directories

## Troubleshooting Build Issues

### Issue: "index.html not found" error
**Solution**: Make sure you ran `npm run build:client` first, or the dist/spa folder exists

### Issue: Preload script not loading
**Solution**: Check that `electron/preload.mjs` exists and path in main.mjs is correct

### Issue: PDF saving fails
**Solution**: 
- Check file permissions
- Ensure Documents folder exists
- Check Electron logs for detailed error

### Issue: Blank screen in production
**Solution**:
- Enable `ELECTRON_DEBUG=1` and check console
- Verify network connection (loading from hosted URL)
- Check that `https://revt.vercel.app` is accessible
- Check browser cache/cookies not interfering

## Update Checklist

When deploying new versions:

1. ✅ Test in development: `npm run electron:dev`
2. ✅ Verify build: `npm run build`
3. ✅ Test packaged version: Run the generated .exe
4. ✅ Check file saving works
5. ✅ Verify data persistence
6. ✅ Test error scenarios (network down, invalid input)

## Next Steps

1. Update the hosted URL in `electron/main.mjs` if it changes
2. Monitor error logs for issues in production
3. Consider adding auto-update mechanism for future versions
4. Test offline scenarios before major releases
