# Rohit Billing Suite - Setup & Distribution Guide

## Building the Windows Installer

Your app is now configured to create Windows installers that can be distributed to any device.

### Quick Start

1. **Build the application:**
   ```bash
   npm run electron:build
   ```

2. **Find your installers in the `release/` folder:**
   - `Rohit Billing Suite Setup 1.0.0.exe` - NSIS Installer (Recommended for distribution)
   - `Rohit Billing Suite.appx` - Windows App Package

### Installer Options

#### NSIS Installer (.exe) - Recommended
- **Best for**: General distribution, easier installation
- **Features**:
  - Traditional Windows installer wizard
  - Ask user where to install
  - Create desktop shortcut
  - Create Start Menu shortcuts
  - Uninstall support

#### App Package (.appx)
- **Best for**: Microsoft Store, enterprise deployment
- **Requirements**: Windows 10+ with developer mode or signed certificate

## Customizing Your App

### Adding Your Logo

1. **Replace the logo file:**
   - Your logo image should be saved as: `REVT/public/logo.png`
   - Currently using SVG: `REVT/public/logo.svg`
   - For Windows installer icons, use ICO format (256x256 or larger)

2. **Create proper icon files:**
   - NSIS installer icon: `REVT/public/logo.ico` (256x256)
   - App icon: `REVT/public/appIcon.png` (512x512 minimum)

3. **Update icon references in `package.json`:**
   ```json
   "win": {
     "icon": "public/logo.ico"
   }
   ```

### Updating App Info

Edit `REVT/package.json` in the `build` section:
- `productName`: "Rohit Billing Suite"
- `appId`: "com.rohit.billing"
- `appx.publisher`: "CN=Rohit"

## Offline Installation

The installer includes:
- ✅ Full application files
- ✅ Offline invoice saving to local folders
- ✅ Auto-sync when online
- ✅ All dependencies bundled

Users can run the installer without internet and start working immediately.

## Distribution

### For Internal Team:
```bash
npm run electron:build
# Share the .exe file from release/ folder
```

### For Public Release:
1. Sign the executable with a certificate
2. Create a version manifest
3. Consider hosting on your website or app store

### System Requirements:
- Windows 10 or later (x64)
- At least 500MB free space
- .NET Framework 4.7+ (for some features)

## First Time Setup

When users launch the app for the first time:
1. They can sign in with their credentials
2. Or work completely offline
3. Invoices auto-save locally to:
   - `C:\Users\[Username]\Documents\Invoice RE` (Rohit Enterprises)
   - `C:\Users\[Username]\Documents\Invoice VT` (Vighneshwar Traders)

## Build Commands Reference

```bash
# Development with hot reload
npm run electron:dev

# Production build (both installers)
npm run electron:build

# Build only NSIS (.exe)
npm run build && electron-builder -w nsis

# Build only APPX
npm run build && electron-builder -w appx

# Build both formats
npm run electron:build:all
```

## Troubleshooting

### Icon not showing in installer:
- Make sure `public/logo.ico` exists
- Run `npm run build` before `npm run electron:build`

### Installer won't run:
- Check Windows Defender SmartScreen allows it
- Ensure app is built with `npm run electron:build:all`

### App not finding files offline:
- Check user has write permission to Documents folder
- Verify folders `Invoice RE` and `Invoice VT` exist (auto-created on first invoice save)
