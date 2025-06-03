// Service Worker Error Fix Test Script
// This script tests the "No SW" error handling improvements

console.log('🧪 Starting Service Worker Error Fix Tests...');

// Test 1: Service Worker Availability Check
async function testServiceWorkerAvailability() {
  console.log('\n📋 Test 1: Service Worker Availability Check');
  
  try {
    // Try to ping the service worker
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    
    if (response && response.success) {
      console.log('✅ Service worker is available and responding');
      console.log('📊 Response:', response);
      return true;
    } else {
      console.log('❌ Service worker ping failed or returned invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Service worker ping error:', error.message);
    return false;
  }
}

// Test 2: API Key Loading with Error Handling
async function testApiKeyLoading() {
  console.log('\n📋 Test 2: API Key Loading with Error Handling');
  
  try {
    // Test direct storage access (more reliable)
    const result = await chrome.storage.local.get(['apiKeys']);
    console.log('✅ Direct storage access successful');
    console.log('📊 API Keys from storage:', {
      googleSafeBrowsing: result.apiKeys?.googleSafeBrowsing ? 'Present' : 'Missing',
      virusTotal: result.apiKeys?.virusTotal ? 'Present' : 'Missing',
      phishTank: result.apiKeys?.phishTank ? 'Present' : 'Missing',
      urlScan: result.apiKeys?.urlScan ? 'Present' : 'Missing'
    });
    
    // Test service worker API key retrieval
    try {
      const swResponse = await chrome.runtime.sendMessage({ action: 'getAPIKeys' });
      console.log('✅ Service worker API key retrieval successful');
      console.log('📊 API Keys from service worker:', swResponse);
    } catch (swError) {
      console.log('⚠️ Service worker API key retrieval failed:', swError.message);
      console.log('💡 This is expected if service worker is not available');
    }
    
    return true;
  } catch (error) {
    console.log('❌ API key loading test failed:', error.message);
    return false;
  }
}

// Test 3: Message Retry Mechanism
async function testMessageRetryMechanism() {
  console.log('\n📋 Test 3: Message Retry Mechanism');
  
  // Simulate the retry function from settings.js
  async function sendMessageWithRetry(message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Sending message (attempt ${attempt}/${maxRetries}):`, message);
        
        const response = await chrome.runtime.sendMessage(message);
        console.log('📥 Received response:', response);
        return response;
      } catch (error) {
        console.warn(`⚠️ Message attempt ${attempt} failed:`, error.message);
        
        if (error.message && error.message.includes('No SW') && attempt < maxRetries) {
          console.log('🔄 Service worker not available, attempting to wake it up...');
          
          // Try to wake up service worker
          try {
            await chrome.storage.local.get(['test']);
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (wakeError) {
            console.log('⚠️ Wake up attempt failed:', wakeError.message);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        } else if (attempt === maxRetries) {
          throw error;
        }
      }
    }
  }
  
  try {
    // Test with a simple ping message
    const response = await sendMessageWithRetry({ action: 'ping' });
    console.log('✅ Message retry mechanism successful');
    return true;
  } catch (error) {
    console.log('❌ Message retry mechanism failed:', error.message);
    return false;
  }
}

// Test 4: Settings Save with Error Handling
async function testSettingsSave() {
  console.log('\n📋 Test 4: Settings Save with Error Handling');
  
  try {
    // Test saving settings directly to storage
    const testSettings = {
      phishingDetection: true,
      malwareDetection: true,
      anomalyDetection: false,
      realTimeScanning: true
    };
    
    await chrome.storage.local.set({ settings: testSettings });
    console.log('✅ Direct settings save successful');
    
    // Test retrieving settings
    const result = await chrome.storage.local.get(['settings']);
    console.log('✅ Settings retrieval successful:', result.settings);
    
    return true;
  } catch (error) {
    console.log('❌ Settings save test failed:', error.message);
    return false;
  }
}

// Test 5: Extension Health Check
async function testExtensionHealth() {
  console.log('\n📋 Test 5: Extension Health Check');
  
  const healthChecks = {
    storageAccess: false,
    serviceWorkerPing: false,
    manifestAccess: false,
    tabsPermission: false
  };
  
  // Test storage access
  try {
    await chrome.storage.local.get(['test']);
    healthChecks.storageAccess = true;
    console.log('✅ Storage access: OK');
  } catch (error) {
    console.log('❌ Storage access: FAILED -', error.message);
  }
  
  // Test service worker ping
  try {
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    if (response && response.success) {
      healthChecks.serviceWorkerPing = true;
      console.log('✅ Service worker ping: OK');
    } else {
      console.log('❌ Service worker ping: FAILED - Invalid response');
    }
  } catch (error) {
    console.log('❌ Service worker ping: FAILED -', error.message);
  }
  
  // Test manifest access
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.name) {
      healthChecks.manifestAccess = true;
      console.log('✅ Manifest access: OK -', manifest.name);
    } else {
      console.log('❌ Manifest access: FAILED - No manifest data');
    }
  } catch (error) {
    console.log('❌ Manifest access: FAILED -', error.message);
  }
  
  // Test tabs permission
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      healthChecks.tabsPermission = true;
      console.log('✅ Tabs permission: OK');
    } else {
      console.log('❌ Tabs permission: FAILED - No tabs found');
    }
  } catch (error) {
    console.log('❌ Tabs permission: FAILED -', error.message);
  }
  
  console.log('\n📊 Health Check Summary:', healthChecks);
  
  const passedChecks = Object.values(healthChecks).filter(Boolean).length;
  const totalChecks = Object.keys(healthChecks).length;
  
  console.log(`📈 Health Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
  
  return passedChecks === totalChecks;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive service worker error fix tests...\n');
  
  const testResults = {
    serviceWorkerAvailability: await testServiceWorkerAvailability(),
    apiKeyLoading: await testApiKeyLoading(),
    messageRetryMechanism: await testMessageRetryMechanism(),
    settingsSave: await testSettingsSave(),
    extensionHealth: await testExtensionHealth()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  
  Object.entries(testResults).forEach(([testName, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${testName}: ${status}`);
  });
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log('================================');
  console.log(`Overall Score: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Service worker error handling is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return testResults;
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
  });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testServiceWorkerAvailability,
    testApiKeyLoading,
    testMessageRetryMechanism,
    testSettingsSave,
    testExtensionHealth,
    runAllTests
  };
}
