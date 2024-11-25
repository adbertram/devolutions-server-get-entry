const core = require('@actions/core');
const axios = require('axios');
const https = require('https');

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

async function getAuthToken(serverUrl, appKey, appSecret) {
  const response = await axiosInstance.post(`${serverUrl}/api/v1/login`, {
    appKey: appKey,
    appSecret: appSecret
  });
  return response.data.tokenId;
}

async function getVaultId(serverUrl, token, vaultName) {
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault`, {
    headers: { tokenId: token }
  });
  const vault = response.data.data.find(v => v.name === vaultName);
  return vault ? vault.id : null;
}

async function getEntryId(serverUrl, token, vaultId, entryName) {
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault/${vaultId}/entry`, {
    headers: { tokenId: token },
    params: { name: entryName }
  });
  return response.data.data.id;
}

async function getPassword(serverUrl, token, vaultId, entryId) {
  const response = await axiosInstance.get(`${serverUrl}/api/v1/vault/${vaultId}/entry/${entryId}`, {
    headers: { tokenId: token },
    params: { includeSensitiveData: true }
  });
  return response.data.data.password;
}

async function run() {
  try {
    const serverUrl = core.getInput('server_url');
    const appKey = core.getInput('app_key');
    const appSecret = core.getInput('app_secret');
    const vaultName = core.getInput('vault_name');
    const entryName = core.getInput('entry_name');
    const outputVariable = core.getInput('output_variable');

    const token = await getAuthToken(serverUrl, appKey, appSecret);
    const vaultId = await getVaultId(serverUrl, token, vaultName);
    if (!vaultId) throw new Error('Vault not found');
    
    const entryId = await getEntryId(serverUrl, token, vaultId, entryName);
    const password = await getPassword(serverUrl, token, vaultId, entryId);

    core.setSecret(password);
    core.exportVariable(outputVariable, password);
    core.setOutput('password', password);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
