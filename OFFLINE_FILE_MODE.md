# Offline File Loading Mode (No Express)

The app has been updated to load the built SPA directly from files using the `file://` protocol, without relying on an Express server.

## Changes Made

### 1. **Electron Main Process** (`electron/main.mjs`)
- **Removed**: Express server startup code (`startServer()` function)
- **Updated**: `loadProductionApp()` now loads the SPA directly from `dist/spa/index.html` using `file://` protocol
- **Removed**: Server cleanup code (`stopServer()` functions)
- **Simplified**: No need for Express in production/offline mode

### 2. **Electron API Bridge** (`client/lib/electronApi.ts`) - NEW FILE
- Created utilities to use Electron IPC for API calls
- `savePdfViaIpc()` - Saves PDFs using Electron IPC instead of HTTP
- `isElectron()` - Detects if running in Electron
- Falls back to `fetch()` if not in Electron (for web/browser mode)

### 3. **Invoices Page** (`client/pages/Invoices.tsx`)
- **Updated**: PDF save now uses `savePdfViaIpc()` instead of `fetch("/api/save-pdf")`
- **Simplified**: Removed complex response handling (no more HTTP status codes to check)
- **Removed**: Error handling for HTTP responses

## How It Works

### Development Mode
```bash
npm run dev
# Starts Vite dev server on port 5173
# Electron loads from http://localhost:5173 (ELECTRON_DEV=true)
```

### Production/Offline Mode
1. Build the SPA: `npm run build:client`
2. Built files are in `dist/spa/`
3. Electron loads: `file://.../dist/spa/index.html`
4. No network server needed
5. API calls use Electron IPC via the preload bridge

## File Structure

```
dist/spa/
├── index.html                    # Entry point
├── assets/
│   ├── index-*.js               # React app bundle
│   └── index-*.css              # Styles
```

## API Calls in Offline Mode

### PDF Saving
- **Before**: `fetch("/api/save-pdf", { method: "POST", ... })`
- **After**: Electron IPC → `ipcMain.handle("save-pdf", ...)`
- **Location**: `electron/main.mjs` (IPC handler)

The Electron preload script (`electron/preload.mjs`) exposes:
- `window.electron.savePdf(org, fileName, arrayBuffer)`
- `window.electron.readFile(fullPath)`

## Build and Run

### Build for production:
```bash
npm run build
```

This creates:
- `dist/spa/` - Static SPA files (for offline file:// loading)
- `dist/server/` - Server build (kept for backward compatibility, not used in offline mode)

### Run Electron app:

**Development mode** (with hot reload):
```bash
ELECTRON_DEV=true npm run electron:dev
```

**Production mode** (offline file:// loading):
```bash
npm run build
npm run electron:build
# Then run the installer from release/
```

## Browser vs Electron

The app works in both environments:

- **Browser**: Uses `fetch()` for API calls
- **Electron**: Uses IPC for API calls (no network required)

The `savePdfViaIpc()` utility automatically detects the environment and uses the appropriate method.

## Important Notes

1. **No localhost required** - App loads directly from files
2. **No Express server** - Removed from production flow
3. **Offline capable** - Can work without internet (except authentication)
4. **IPC-based APIs** - All API calls use Electron IPC when available
5. **Backward compatible** - App still works in browser with fetch()

## Future Improvements

If you add more API endpoints, follow this pattern:
1. Add IPC handler in `electron/main.mjs`
2. Add utility function in `client/lib/electronApi.ts`
3. Update calling code to use the utility instead of fetch
