const core = require('@actions/core');
const axios = require('axios');
const https = require('https');

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

async function getAuthToken(serverUrl, appKey, appSecret) {
  core.debug('Attempting to get auth token...');
  const response = await axiosInstance.post(`${serverUrl}/api/v1/login`, {
    appKey: appKey,
    appSecret: appSecret
  });
  core.debug('Successfully obtained auth token');
  return response.data.tokenId;
}

async function getVaultId(serverUrl, token, vaultName) {
  core.debug(`Attempting to get vault ID for vault: ${vaultName}`);
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault`, {
    headers: { tokenId: token }
  });
  core.debug(`Found ${response.data.data.length} vaults`);
  
  const vault = response.data.data.find(v => v.name === vaultName);
  if (vault) {
    core.debug(`Found vault ID: ${vault.id}`);
  } else {
    core.debug(`Available vaults: ${response.data.data.map(v => v.name).join(', ')}`);
  }
  return vault ? vault.id : null;
}

async function getEntryId(serverUrl, token, vaultId, entryName) {
  core.debug(`Attempting to get entry ID for entry: ${entryName} in vault: ${vaultId}`);
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault/${vaultId}/entry`, {
    headers: { tokenId: token },
    params: { name: entryName }
  });
  
  if (!response.data.data || !response.data.data.id) {
    core.debug('No entry found with the specified name');
    throw new Error(`Entry '${entryName}' not found in vault`);
  }

  core.debug(`Found entry ID: ${response.data.data.id}`);
  return response.data.data.id;
}

async function getPassword(serverUrl, token, vaultId, entryId) {
  core.debug(`Attempting to get password for entry: ${entryId} in vault: ${vaultId}`);
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault/${vaultId}/entry/${entryId}`, {
    headers: { tokenId: token },
    params: { includeSensitiveData: true }
  });
  core.debug('Successfully retrieved password');
  return response.data.data.password;
}

async function makeRequest(description, requestFn) {
  try {
    core.debug(`Starting request: ${description}`);
    const result = await requestFn();
    core.debug(`Successfully completed request: ${description}`);
    return result;
  } catch (error) {
    core.debug('Full error object:');
    core.debug(JSON.stringify({
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      url: error.config?.url,
      method: error.config?.method
    }, null, 2));

    const apiMessage = error.response?.data?.message;
    throw new Error(`${description} failed: ${apiMessage || error.message} (Status: ${error.response?.status})`);
  }
}

async function run() {
  try {
    core.debug('Starting action execution');
    
    const serverUrl = core.getInput('server_url');
    const appKey = core.getInput('app_key');
    const appSecret = core.getInput('app_secret');
    const vaultName = core.getInput('vault_name');
    const entryName = core.getInput('entry_name');
    const outputVariable = core.getInput('output_variable');

    core.debug(`Server URL: ${serverUrl}`);
    core.debug(`Vault Name: ${vaultName}`);
    core.debug(`Entry Name: ${entryName}`);

    const token = await makeRequest('Authentication', () => 
      getAuthToken(serverUrl, appKey, appSecret)
    );
    
    const vaultId = await makeRequest('Get Vault ID', () => 
      getVaultId(serverUrl, token, vaultName)
    );
    if (!vaultId) {
      throw new Error(`Vault '${vaultName}' not found`);
    }
    
    const entryId = await makeRequest('Get Entry ID', () => 
      getEntryId(serverUrl, token, vaultId, entryName)
    );
    
    const password = await makeRequest('Get Password', () => 
      getPassword(serverUrl, token, vaultId, entryId)
    );

    core.setSecret(password);
    core.exportVariable(outputVariable, password);
    core.setOutput('password', password);
    core.debug('Action completed successfully');
  } catch (error) {
    core.debug(`Action failed: ${error.message}`);
    core.setFailed(error.message);
  }
}

run();