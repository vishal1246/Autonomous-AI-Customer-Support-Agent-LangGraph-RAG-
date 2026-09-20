// infra/modules/container-app.bicep
// Azure Container Apps — hosts the FastAPI backend.
// Secrets (API keys, DB URIs) are injected at deploy time and never stored in plain text.

@description('Azure region')
param location string

@description('Container App name')
param containerAppName string

@description('Container Apps Environment name')
param containerAppEnvName string

@description('ACR login server (e.g. emailagentacr.azurecr.io)')
param acrLoginServer string

@description('Google Gemini API key')
@secure()
param googleApiKey string

@description('MongoDB Atlas URI')
@secure()
param mongoUri string

@description('ACR Admin Password')
@secure()
param acrPassword string

@description('Docker image tag to deploy')
param imageTag string = 'latest'

// ── Log Analytics Workspace (required by Container Apps Environment) ──────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${containerAppEnvName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Container Apps Environment ────────────────────────────────────────────────
resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── Container App (FastAPI backend) ──────────────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true           // Publicly accessible
        targetPort: 8000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          username: split(acrLoginServer, '.')[0] // The ACR admin username is identical to the ACR name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'google-api-key'
          value: googleApiKey
        }
        {
          name: 'mongo-uri'
          value: mongoUri
        }
        {
          name: 'acr-password'
          value: acrPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'email-agent'
          image: '${acrLoginServer}/email-agent:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'GOOGLE_API_KEY'
              secretRef: 'google-api-key'
            }
            {
              name: 'MONGO_URI'
              secretRef: 'mongo-uri'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8000
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scale'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerAppName string = containerApp.name
