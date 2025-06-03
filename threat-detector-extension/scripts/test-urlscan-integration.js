// Test script for URLScan.io integration in the threat detector extension

/**
 * Test the complete URLScan.io integration
 */
async function testURLScanIntegration() {
  console.log('🧪 Testing URLScan.io Integration...');
  
  try {
    // Import the threat detection API
    const { threatDetectionAPI } = await import('../api/threatDetection.js');
    
    // Initialize API keys
    await threatDetectionAPI.initializeAPIKeys();
    
    // Test URLs
    const testUrls = [
      'https://example.com',           // Safe URL
      'https://google.com',            // Safe URL
      'https://malware-test.com'       // Test URL (may or may not be flagged)
    ];
    
    console.log('📋 Testing URLs:', testUrls);
    
    for (const url of testUrls) {
      console.log(`\n🔍 Testing: ${url}`);
      
      try {
        // Test URLScan.io specifically
        const urlScanResult = await threatDetectionAPI.checkURLScan(url);
        
        if (urlScanResult) {
          console.log('✅ URLScan.io Result:', {
            isThreat: urlScanResult.isThreat,
            severity: urlScanResult.severity,
            scanId: urlScanResult.scanId,
            verdicts: urlScanResult.verdicts
          });
        } else {
          console.log('ℹ️ URLScan.io: No result (API key may not be configured)');
        }
        
        // Test comprehensive check
        const comprehensiveResult = await threatDetectionAPI.checkURL(url);
        console.log('📊 Comprehensive Result:', {
          overallThreat: comprehensiveResult.overallThreat,
          severity: comprehensiveResult.severity,
          confidence: comprehensiveResult.confidence,
          sources: Object.keys(comprehensiveResult.sources)
        });
        
      } catch (error) {
        console.error(`❌ Error testing ${url}:`, error.message);
      }
    }
    
    console.log('\n🎉 URLScan.io integration test completed!');
    
  } catch (error) {
    console.error('❌ Failed to test URLScan.io integration:', error);
  }
}

/**
 * Test URLScan.io API key configuration
 */
async function testAPIKeyConfiguration() {
  console.log('🔑 Testing API Key Configuration...');
  
  try {
    // Check if API key is stored
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKeys = result.apiKeys || {};
    
    console.log('📋 Stored API Keys:', {
      googleSafeBrowsing: apiKeys.googleSafeBrowsing ? '✅ Configured' : '❌ Not configured',
      virusTotal: apiKeys.virusTotal ? '✅ Configured' : '❌ Not configured',
      phishTank: apiKeys.phishTank ? '✅ Configured' : '❌ Not configured',
      urlScan: apiKeys.urlScan ? '✅ Configured' : '❌ Not configured'
    });
    
    if (apiKeys.urlScan) {
      console.log('🔍 URLScan.io API Key:', apiKeys.urlScan.substring(0, 8) + '...');
      
      // Test API key validity
      const testResponse = await fetch('https://urlscan.io/api/v1/scan/', {
        method: 'POST',
        headers: {
          'API-Key': apiKeys.urlScan,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          visibility: 'public'
        })
      });
      
      if (testResponse.ok) {
        console.log('✅ URLScan.io API key is valid and working!');
        const data = await testResponse.json();
        console.log('📊 Test scan initiated:', data.uuid);
      } else {
        console.error('❌ URLScan.io API key test failed:', testResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API key configuration:', error);
  }
}

/**
 * Display URLScan.io integration status
 */
async function displayIntegrationStatus() {
  console.log('📊 URLScan.io Integration Status');
  console.log('================================');
  
  try {
    // Check API key
    const result = await chrome.storage.local.get(['apiKeys']);
    const urlScanKey = result.apiKeys?.urlScan;
    
    console.log('🔑 API Key:', urlScanKey ? '✅ Configured' : '❌ Not configured');
    
    if (urlScanKey) {
      console.log('🔍 Key Preview:', urlScanKey.substring(0, 8) + '...');
      
      // Check if threat detection API is available
      try {
        const { threatDetectionAPI } = await import('../api/threatDetection.js');
        console.log('📡 Threat Detection API:', '✅ Available');
        
        // Initialize and check
        await threatDetectionAPI.initializeAPIKeys();
        console.log('🔧 API Initialization:', '✅ Complete');
        
        // Check if URLScan method is available
        if (typeof threatDetectionAPI.checkURLScan === 'function') {
          console.log('🛠️ URLScan Method:', '✅ Available');
        } else {
          console.log('🛠️ URLScan Method:', '❌ Not available');
        }
        
      } catch (error) {
        console.log('📡 Threat Detection API:', '❌ Error loading');
        console.error('Error:', error.message);
      }
    }
    
    console.log('\n💡 To test the integration, run: testURLScanIntegration()');
    
  } catch (error) {
    console.error('❌ Error checking integration status:', error);
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testURLScanIntegration,
    testAPIKeyConfiguration,
    displayIntegrationStatus
  };
}

// Auto-run status check if this script is executed directly
if (typeof window !== 'undefined' && window.chrome && window.chrome.storage) {
  displayIntegrationStatus();
}
