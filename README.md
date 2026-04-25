# 🎨 DRAVANUA HUB - Frontend Application

The frontend of DRAVANUA HUB is a modern, high-performance web application built with **React 19** and **Vite 8**. It hosts both the public-facing brand presence and the high-fidelity administrative dashboard, providing a seamless bridge between client services and operational management.

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) (Utilizing modern Hooks and functional architecture)
- **Build Tool**: [Vite 8](https://vitejs.dev/) (For ultra-fast HMR and optimized production builds)
- **Styling**: Vanilla CSS (Tailored **Glassmorphism** design system with dynamic theme switching)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (For fluid UI transitions and micro-interactions)
- **Communication**: [Axios](https://axios-http.com/) (Hardened API layer with interceptors for JWT security)
- **Routing**: [React Router 7](https://reactrouter.com/) (UUID-aware deep-linking and protected route management)
- **Utilities**:
    - **Finance**: [XLSX](https://sheetjs.com/) (For exporting financial audit reports)
    - **Identity**: [JsBarcode](https://lindell.me/JsBarcode/) & [jsPDF](https://parall.ax/products/jspdf) (For dynamic **Staff ID Card** generation)
    - **Media**: [html2canvas](https://html2canvas.hertzen.com/) (For capturing UI snapshots for reports)

---

## 🏛️ Visual Architecture

The application uses a **Node-Specific Color Hierarchy** to aid administrative navigation. Each functional "node" (Department) has a unique visual identifier:

*   **Studio Node**: `#32FC05` (Deep Forest)
*   **Finance Node**: Emerald / Teal Gradient
*   **Analytics Node**: Indigo / Slate
*   **Operations Node**: Burnt Orange / Amber

This color-coding is applied across sidebars, dashboards, and modal interfaces to reduce cognitive load for system managers.

---

## ✨ Specialized Administrative Modules

### 1. Identity & Security Hub
The frontend features a custom **Staff ID Card Generator**. It pulls real-time data from the `AdminUser` model to render high-resolution identification badges complete with:
- Automated Staff Code barcodes (`EMP-YYYY-####`).
- Role-based color tags and status indicators.
- Export-to-PDF functionality for immediate printing.

### 2. Operational Intelligence (Attendance)
A dedicated interface for verifying staff attendance logs. This module utilizes coordinates from the `gps_location_history` to visually flag if a staff member was within the authorized geofence during clock-in.

### 3. Financial Treasury & Analytics
High-fidelity visualization of the **5-Track Operational Ledger**. It provides real-time summaries of:
- **Daily Reports & Debt Tracking**.
- **Subscription Burn Rates** (Monitoring recurring software and utility costs).
- **Payroll Reconciliation** (Automatic net-pay visualization).

---

## 🚀 Execution Guide

```bash
# 1. Install Dependencies
npm install

# 2. Launch Development Environment
# Vite will launch at http://localhost:5173
npm run dev

# 3. Build for Production
# Outputs optimized assets to /dist for deployment
npm run build
```

---

## 🛰️ Deployment Synergy

The frontend is integrated with the **GitHub Actions** CI/CD pipeline. On build:
1.  Vite generates an optimized production bundle.
2.  The `dist/` directory is automatically synced to the remote Production VPS via SSH.
3.  The backend server serves the entry `index.html` ensuring a unified deployment.

---
© 2026 DRAVANUA HUB • Design & User Experience • Kigali, Rwanda 🇷🇼
