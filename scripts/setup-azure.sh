#!/usr/bin/env bash
# scripts/setup-azure.sh
# ─────────────────────────────────────────────────────────────────────────────
# One-time Azure bootstrap script.
# Run this ONCE before your first deployment to create all Azure prerequisites.
#
# Usage:
#   chmod +x scripts/setup-azure.sh
#   ./scripts/setup-azure.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config — edit these values ────────────────────────────────────────────────
RESOURCE_GROUP="email-agent-rg"
LOCATION="centralindia"
ACR_NAME="emailagentacr"           # Must be globally unique, alphanumeric only
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
# Key Vault name must be globally unique (3-24 chars). Using a short hash of
# your subscription ID ensures uniqueness without manual editing.
KV_SUFFIX=$(echo "$SUBSCRIPTION_ID" | sha256sum | cut -c1-6)
KEY_VAULT_NAME="eagent-kv-${KV_SUFFIX}"   # e.g. eagent-kv-d96f4c

echo "============================================"
echo " Email Agent — Azure Bootstrap Setup"
echo " Subscription: $SUBSCRIPTION_ID"
echo " Resource Group: $RESOURCE_GROUP"
echo " Location: $LOCATION"
echo "============================================"

# ── 1. Resource Group ─────────────────────────────────────────────────────────
echo ""
echo "[1/5] Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# ── 2. Azure Container Registry ───────────────────────────────────────────────
echo ""
echo "[2/5] Creating Azure Container Registry..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output table

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" --output tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"

# ── 3. Azure Key Vault (store secrets safely) ─────────────────────────────────
echo ""
echo "[3/5] Creating Azure Key Vault: $KEY_VAULT_NAME ..."

# Idempotent: skip creation if vault already exists in this resource group
if az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "Key Vault '$KEY_VAULT_NAME' already exists — skipping creation."
else
  az keyvault create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$KEY_VAULT_NAME" \
    --location "$LOCATION" \
    --enabled-for-template-deployment true \
    --output table
fi

# Ensure ARM can read secrets during Bicep deployments (required even on existing vaults)
az keyvault update \
  --name "$KEY_VAULT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --enabled-for-template-deployment true \
  --output none

# Grant the currently signed-in user the Secrets Officer role on this vault.
# Required because Key Vault uses Azure RBAC by default — even the creator
# needs an explicit role assignment to read/write secrets.
echo "Granting Key Vault Secrets Officer role to your account..."
USER_OID=$(az ad signed-in-user show --query id --output tsv)
KV_SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"

az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee "$USER_OID" \
  --scope "$KV_SCOPE" \
  --output none 2>/dev/null || echo "Role already assigned — skipping."

echo "Waiting 20s for RBAC to propagate..."
sleep 20

echo ""
echo "Storing secrets in Key Vault..."

echo -n "  → Please enter your GOOGLE_API_KEY: "
read -rs GOOGLE_API_KEY
echo ""   # move cursor to next line after silent input
[[ -z "$GOOGLE_API_KEY" ]] && { echo "ERROR: GOOGLE_API_KEY cannot be empty."; exit 1; }
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "google-api-key" --value "$GOOGLE_API_KEY" > /dev/null
echo "    ✓ google-api-key stored."

echo -n "  → Please enter your MONGO_URI: "
read -rs MONGO_URI
echo ""   # move cursor to next line after silent input
[[ -z "$MONGO_URI" ]] && { echo "ERROR: MONGO_URI cannot be empty."; exit 1; }
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "mongo-uri" --value "$MONGO_URI" > /dev/null
echo "    ✓ mongo-uri stored."

az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "acr-password" --value "$ACR_PASSWORD" > /dev/null
echo "    ✓ acr-password stored."
echo "Secrets stored successfully."


# ── 4. Service Principal for GitHub Actions ───────────────────────────────────
echo ""
echo "[4/5] Creating Service Principal for GitHub Actions CI/CD..."
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "email-agent-github-actions" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --json-auth)

echo ""
echo "============================================"
echo " IMPORTANT: Add the following as GitHub Secrets"
echo " (Settings → Secrets → Actions)"
echo "============================================"
echo ""
echo "Secret Name: AZURE_CREDENTIALS"
echo "Secret Value:"
echo "$SP_OUTPUT"
echo ""
echo "Secret Name: ACR_LOGIN_SERVER"
echo "Secret Value: $ACR_LOGIN_SERVER"
echo ""
echo "Secret Name: ACR_USERNAME"
echo "Secret Value: $ACR_USERNAME"
echo ""
echo "Secret Name: ACR_PASSWORD"
echo "Secret Value: $ACR_PASSWORD"

# ── 5. Deploy Infrastructure via Bicep ───────────────────────────────────────
echo ""
echo "[5/5] Deploying infrastructure via Bicep..."

# Update parameters.json with actual subscription ID
sed -i.bak "s/<SUBSCRIPTION_ID>/$SUBSCRIPTION_ID/g" infra/parameters.json

az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --output table

echo ""
echo "============================================"
echo " Bootstrap complete!"
echo " Next steps:"
echo "   1. Add GitHub Secrets shown above"
echo "   2. Push to main branch to trigger CI/CD"
echo "============================================"
