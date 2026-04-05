# 🚀 Rohit Billing Suite (REVT)

[![Status](https://img.shields.io/badge/Status-Production--Ready-success.svg)](#)
[![License](https://img.shields.io/badge/License-Private-blue.svg)](#)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows-blueviolet.svg)](#)

A professional-grade, cross-platform billing and inventory management suite designed for small to medium-sized businesses. Built with a **local-first** philosophy, REVT ensures that your business stays running even when the internet doesn't.

---

## ✨ Key Features

- **📑 Automated Billing**: Generate professional invoices with automatic fiscal year numbering (e.g., `RE/24-25/001`).
- **👥 Customer CRM**: Maintain a centralized database of your clients and their purchase history.
- **📊 Real-time Analytics**: Interactive dashboards and reports to monitor your business growth.
- **🖨️ Professional Export**: One-click "Save as PDF" and "Export to Excel" for all your reports and invoices.
- **📡 Offline-First Design**: Work seamlessly without internet; data auto-syncs when you're back online.
- **🖥️ Desktop & Web**: Available as a modern web app and a high-performance Windows desktop application.

---

## 🛠️ Tech Stack

| Layer          | Technologies                                       |
| :------------- | :------------------------------------------------- |
| **Frontend**   | React 18, TypeScript, TailwindCSS 3, Framer Motion |
| **UI Library** | Radix UI (via Shadcn UI), Lucide Icons             |
| **Backend**    | Express.js (Integrated Node.js server)             |
| **Database**   | Firebase (Firestore/Auth) + LocalStorage Caching   |
| **Desktop**    | Electron (Packaged with Electron Builder)          |
| **State/Data** | TanStack Query, React Hook Form, Zod               |
| **Utilities**  | html2canvas, jspdf, SheetJS (xlsx)                 |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (Recommended) or npm

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd REVT
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Firebase credentials (see `.env.example`).

---

## 💻 Development Commands

| Command             | Description                                      |
| :------------------ | :----------------------------------------------- |
| `pnpm dev`          | Start the web development server (Vite)          |
| `pnpm electron:dev` | Launch the Electron app with hot-reload          |
| `pnpm build`        | Build both the React frontend and Express server |
| `pnpm test`         | Run unit tests with Vitest                       |
| `pnpm typecheck`    | Perform TypeScript validation                    |

---

## 📦 Distribution & Packaging

REVT is optimized for Windows distribution using **Electron Builder**.

### Building the Windows Installer

To generate a standalone `.exe` installer (NSIS) and a Windows App Package (`.appx`):

```bash
pnpm electron:build
```

Find your installers in the `release/` folder:

- **NSIS Installer**: `Rohit Billing Suite Setup.exe` (Recommended)
- **Windows App Package**: `Rohit Billing Suite.appx`

---

## 📂 Project Structure

```text
client/                   # React SPA frontend
├── pages/                # Route components (Dashboard, Invoices, etc.)
├── components/           # UI components and layout
├── hooks/                # Custom React hooks (Auth, Online Status)
└── lib/                  # Shared utilities and data adapters
server/                   # Express API backend (Node.js)
electron/                 # Desktop integration (Main process)
shared/                   # Logic shared between Client & Server
public/                   # Static assets (Logo, Favicons)
```

---


---

## 👨‍💻 Author

**Rohit Patil**

- [GitHub](https://github.com/Rohitpatil005)

---

> [!TIP]
> This project follows the **Fusion Starter** architecture.
