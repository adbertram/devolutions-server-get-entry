# Devolutions Server Get SecretEntry Action

This GitHub Action authenticates with a Devolutions Server instance and retrieves a secret entry from a specified vault. The retrieved secret can be stored in an environment variable for use in subsequent workflow steps.

## Inputs

### `server_url`

**Required** The URL of your Devolutions Server instance.

### `app_key`

**Required** The application key used for authentication with Devolutions Server.

### `app_secret`

**Required** The application secret used for authentication with Devolutions Server.

### `vault_name`

**Required** The name of the vault containing the secret entry you want to retrieve.

### `entry_name`

**Required** The name of the secret entry to retrieve from the vault.

### `output_variable`

**Optional** The name of the environment variable where the retrieved secret will be stored. Default: `"DVLS_ENTRY_SECRET"`.

## Example usage

```yaml
uses: adbertram/devolutions-server-get-entry@v1
with:
server_url: 'https://your-server.devolutions.app'
app_key: ${{ secrets.DVLS_APP_KEY }}
app_secret: ${{ secrets.DVLS_APP_SECRET }}
vault_name: 'MyVault'
entry_name: 'MySecret'
output_variable: 'MY_SECRET_VALUE'
```

## Security Notes

- Store your `app_key` and `app_secret` as GitHub Secrets
- The retrieved secret will be stored in an environment variable accessible to subsequent workflow steps
- Be cautious when logging or displaying the environment variable contents to prevent secret exposure

## Prerequisites

- A Devolutions Server instance
- A Devolutions Server application identity with appropriate permissions to access the vault
