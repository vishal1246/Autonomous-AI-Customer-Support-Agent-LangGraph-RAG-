// infra/modules/container-registry.bicep
// Azure Container Registry — stores Docker images for the backend.

@description('Azure region')
param location string

@description('ACR name (must be globally unique, alphanumeric only)')
param registryName string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true   // needed for Container Apps to pull images
  }
}

output loginServer string = acr.properties.loginServer
output registryName string = acr.name
