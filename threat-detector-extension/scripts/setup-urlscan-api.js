// Script to set up URLScan.io API key for the threat detector extension
// This script can be run in the browser console or as part of the extension initialization

/**
 * Set URLScan.io API key in Chrome storage
 */
async function setupURLScanAPI() {
  const urlScanApiKey = '019706e5-f185-74e4-8709-f7d2360a59b9';
  
  try {
    // Get existing API keys from storage
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKeys = result.apiKeys || {};
    
    // Add URLScan.io API key
    apiKeys.urlScan = urlScanApiKey;
    
    // Save back to storage
    await chrome.storage.local.set({ apiKeys });
    
    console.log('✅ URLScan.io API key has been successfully configured!');
    console.log('API Key:', urlScanApiKey);
    
    // Verify the key was saved
    const verification = await chrome.storage.local.get(['apiKeys']);
    console.log('Stored API keys:', verification.apiKeys);
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up URLScan.io API key:', error);
    return false;
  }
}

/**
 * Test URLScan.io API connection
 */
async function testURLScanAPI() {
  try {
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKey = result.apiKeys?.urlScan;
    
    if (!apiKey) {
      console.error('❌ URLScan.io API key not found in storage');
      return false;
    }
    
    console.log('🔍 Testing URLScan.io API connection...');
    
    // Test with a simple URL scan
    const testUrl = 'https://example.com';
    const response = await fetch('https://urlscan.io/api/v1/scan/', {
      method: 'POST',
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: testUrl,
        visibility: 'public'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ URLScan.io API test successful!');
      console.log('Scan UUID:', data.uuid);
      console.log('Result URL:', data.result);
      return true;
    } else {
      console.error('❌ URLScan.io API test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing URLScan.io API:', error);
    return false;
  }
}

/**
 * Initialize URLScan.io integration
 */
async function initializeURLScanIntegration() {
  console.log('🚀 Initializing URLScan.io integration...');
  
  // Step 1: Set up API key
  const setupSuccess = await setupURLScanAPI();
  if (!setupSuccess) {
    console.error('❌ Failed to set up URLScan.io API key');
    return false;
  }
  
  // Step 2: Test API connection
  const testSuccess = await testURLScanAPI();
  if (!testSuccess) {
    console.error('❌ URLScan.io API test failed');
    return false;
  }
  
  console.log('🎉 URLScan.io integration successfully initialized!');
  return true;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    setupURLScanAPI,
    testURLScanAPI,
    initializeURLScanIntegration
  };
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined' && window.chrome && window.chrome.storage) {
  console.log('🔧 Setting up URLScan.io API key...');
  setupURLScanAPI().then(success => {
    if (success) {
      console.log('✅ Setup complete! You can now test the API by running: testURLScanAPI()');
    }
  });
}
