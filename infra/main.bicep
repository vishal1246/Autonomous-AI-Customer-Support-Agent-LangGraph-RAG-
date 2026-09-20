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

@description('ACR Admin Password (stored as a secret)')
@secure()
param acrPassword string

// ── Shared naming convention ─────────────────────────────────────────────────
var prefix = 'email-agent-${environmentName}'

// ── Azure Container Registry ─────────────────────────────────────────────────
module acr 'modules/container-registry.bicep' = {
  name: 'acr-deploy'
  params: {
    location: location
    registryName: 'emailagentacr' // Must match the name used in setup-azure.sh
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
    acrPassword: acrPassword
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
