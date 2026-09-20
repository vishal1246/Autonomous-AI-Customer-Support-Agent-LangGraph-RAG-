// infra/main.bicep
// Root Bicep template — orchestrates all Azure resources for the Email Agent project.
//
// Deploy with:
//   az deployment group create \
//     --resource-group email-agent-rg \
//     --template-file infra/main.bicep \
//     --parameters infra/parameters.json

@description('Environment name prefix for all resources (e.g. prod, staging)')
param environmentName string = 'prod'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Google Gemini API key (stored as a secret)')
@secure()
param googleApiKey string

@description('MongoDB Atlas connection string (stored as a secret)')
@secure()
param mongoUri string

// ── Shared naming convention ─────────────────────────────────────────────────
var prefix = 'email-agent-${environmentName}'

// NOTE: Azure Static Web Apps is NOT deployed via Bicep.
// It must be created manually via Azure Portal → Static Web Apps → Create,
// then linked to your GitHub repo. Azure will generate a deployment token
// which you add as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub Secrets.
// The frontend-deploy.yml workflow handles all subsequent deployments.

// ── Azure Container Registry ─────────────────────────────────────────────────
module acr 'modules/container-registry.bicep' = {
  name: 'acr-deploy'
  params: {
    location: location
    registryName: replace('${prefix}acr', '-', '') // ACR names cannot contain hyphens
  }
}

// ── Azure Container Apps (Backend) ───────────────────────────────────────────
module backend 'modules/container-app.bicep' = {
  name: 'backend-deploy'
  params: {
    location: location
    containerAppName: '${prefix}-backend'
    containerAppEnvName: '${prefix}-env'
    acrLoginServer: acr.outputs.loginServer
    googleApiKey: googleApiKey
    mongoUri: mongoUri
  }
}

// ── Azure Blob Storage (File Uploads) ────────────────────────────────────────
module storage 'modules/storage.bicep' = {
  name: 'storage-deploy'
  params: {
    location: location
    storageAccountName: replace('${prefix}storage', '-', '')
    containerName: 'uploads'
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output backendUrl string = backend.outputs.appUrl
output acrLoginServer string = acr.outputs.loginServer
output storageAccountName string = storage.outputs.storageAccountName
