// infra/modules/static-web-app.bicep
// Azure Static Web Apps — hosts the React/Vite frontend.

@description('Azure region')
param location string

@description('Static Web App name')
param appName string

resource swa 'Microsoft.Web/staticSites@2023-01-01' = {
  name: appName
  location: location
  sku: {
    name: 'Free'    // Upgrade to 'Standard' for custom domains and auth
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      appLocation: 'frontend'
      outputLocation: 'dist'
      skipGithubActionWorkflowGeneration: true  // We manage our own workflow
    }
  }
}

output appUrl string = 'https://${swa.properties.defaultHostname}'
