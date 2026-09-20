// infra/modules/storage.bicep
// Azure Blob Storage — persists uploaded files outside the container.

@description('Azure region')
param location string

@description('Storage account name (3-24 chars, alphanumeric only, globally unique)')
param storageAccountName string

@description('Blob container name for uploads')
param containerName string = 'uploads'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'   // Locally redundant — cheapest option; use GRS for production
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false   // Keep private — serve via SAS tokens or backend API
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7    // Soft-delete protection for accidental deletions
    }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}

output storageAccountName string = storageAccount.name
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
