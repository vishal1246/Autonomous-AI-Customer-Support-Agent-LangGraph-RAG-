# Azure Deployment Guide

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│  Azure Static Web Apps  │────▶│  Azure Container Apps         │
│  (React/Vite Frontend)  │     │  (FastAPI Backend - Docker)   │
└─────────────────────────┘     └──────────────────────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
                   │  MongoDB    │  │  Azure Blob  │  │  Azure Key  │
                   │  Atlas      │  │  Storage     │  │  Vault      │
                   └─────────────┘  └─────────────┘  └─────────────┘
```

## First-Time Setup (Run Once)

```bash
# 1. Install Azure CLI
brew install azure-cli

# 2. Login
az login

# 3. Run bootstrap script
chmod +x scripts/setup-azure.sh
./scripts/setup-azure.sh
```

The script will output credentials — add them as GitHub Secrets (see below).

---

## GitHub Secrets Required

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Where to get it |
|---|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON | Output of `setup-azure.sh` |
| `ACR_LOGIN_SERVER` | ACR URL (e.g. `emailagentacr.azurecr.io`) | Output of `setup-azure.sh` |
| `ACR_USERNAME` | ACR admin username | Output of `setup-azure.sh` |
| `ACR_PASSWORD` | ACR admin password | Output of `setup-azure.sh` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA deployment token | Azure Portal → Static Web App → Manage deployment token |
| `VITE_API_URL` | Backend URL after first deploy | Azure Portal → Container App → Application URL |
| `VITE_JIRA_URL` | Your Jira instance URL | `https://vishalaggarwal372.atlassian.net/` |

---

## CI/CD Pipelines

### Backend ([`.github/workflows/backend-deploy.yml`](../.github/workflows/backend-deploy.yml))
- **Trigger**: Push to `main` when `app/**`, `requirements.txt`, or `Dockerfile` changes
- **Steps**: Checkout → Azure login → Build Docker image → Push to ACR → Deploy to Container Apps

### Frontend ([`.github/workflows/frontend-deploy.yml`](../.github/workflows/frontend-deploy.yml))
- **Trigger**: Push to `main` when `frontend/**` changes; also PR preview environments
- **Steps**: Checkout → Node setup → `npm ci` → `npm run build` → Deploy to Static Web Apps
- **Bonus**: Pull Requests automatically get a **preview URL** for review

---

## Infrastructure as Code

All Azure resources are defined in `infra/` using **Azure Bicep**:

```
infra/
├── main.bicep               # Root template
├── parameters.json          # Environment parameters (references Key Vault)
└── modules/
    ├── container-app.bicep      # FastAPI backend + autoscaling + health probes
    ├── container-registry.bicep # Docker image storage
    ├── static-web-app.bicep     # Frontend hosting
    └── storage.bicep            # Blob storage for file uploads
```

### Re-deploy infrastructure manually:
```bash
az deployment group create \
  --resource-group email-agent-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json
```

---

## Local Development

```bash
# Backend
cp .env.example .env   # Fill in your actual values
docker-compose up

# Frontend
cd frontend
npm install
npm run dev            # Runs on http://localhost:5173
```

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `GOOGLE_API_KEY` | Backend | Google Gemini API key for LangChain |
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `VITE_API_URL` | Frontend build | Backend API base URL |
| `VITE_JIRA_URL` | Frontend build | Jira instance URL |

> **Security**: Secrets are stored in **Azure Key Vault** in production.  
> They are injected at deploy time — never stored in plain text in code or config files.

---

## Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---|---|---|
| Azure Container Apps | Consumption (1 min replica) | ~$5–15 |
| Azure Container Registry | Basic | ~$5 |
| Azure Static Web Apps | Free | $0 |
| Azure Blob Storage | Standard LRS | ~$1–2 |
| Azure Key Vault | Standard | ~$0.03/10K ops |
| MongoDB Atlas | Existing | No change |
| **Total** | | **~$11–22/mo** |
