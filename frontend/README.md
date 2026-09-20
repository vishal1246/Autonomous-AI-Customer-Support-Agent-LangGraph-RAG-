# Frontend — React + TypeScript + Vite

A modern frontend built with **React 19**, **TypeScript**, and **Vite**, featuring React Query, React Hook Form, Framer Motion, and more.

---

## Prerequisites

Make sure the following are installed on your machine before getting started:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or higher | https://nodejs.org |
| npm | v9 or higher (bundled with Node) | — |

Verify your versions:

```bash
node -v
npm -v
```

---

## Getting Started

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and update the values as needed:

```bash
cp .env .env.local
```

Open `.env.local` and set the correct API URL:

```env
VITE_API_URL=http://localhost:8000        # URL of the FastAPI backend
VITE_JIRA_URL=https://yourcompany.atlassian.net
```

> **Note:** The backend must be running at `VITE_API_URL` for the app to work. See the root `README.md` for backend setup instructions.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173** by default.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Starts the Vite dev server with Hot Module Replacement (HMR) |
| Build | `npm run build` | Type-checks and builds the production bundle to `dist/` |
| Preview | `npm run preview` | Serves the production build locally for final verification |
| Lint | `npm run lint` | Runs Oxlint static analysis |

---

## Project Structure

```
frontend/
├── public/          # Static assets served as-is
├── src/             # Application source code
│   ├── components/  # Reusable UI components
│   ├── pages/       # Route-level page components
│   ├── hooks/       # Custom React hooks
│   ├── api/         # Axios API client & query functions
│   └── main.tsx     # App entry point
├── index.html       # HTML entry point
├── vite.config.ts   # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── package.json     # Dependencies and scripts
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | Core UI library (v19) |
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state & data fetching |
| `axios` | HTTP client |
| `react-hook-form` + `zod` | Form management & validation |
| `framer-motion` | Animations |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |
| `recharts` | Data visualization / charts |
| `react-dropzone` | Drag-and-drop file uploads |

---

## Expanding the Oxlint Configuration

For production applications, enable type-aware lint rules by installing `oxlint-tsgolint` and updating `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for all available rules.

---

## Troubleshooting

**Port already in use?**
Vite defaults to port `5173`. To use a different port:
```bash
npm run dev -- --port 3000
```

**API requests failing?**
- Confirm the backend is running at the URL in your `.env.local`.
- Check the browser console and network tab for CORS errors.
- Ensure `VITE_API_URL` does **not** have a trailing slash.

**Node version mismatch?**
Use [nvm](https://github.com/nvm-sh/nvm) to switch Node versions:
```bash
nvm use 20
```
