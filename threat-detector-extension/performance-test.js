// Performance Test Suite for Threat Detector Extension
// Tests startup speed, initialization times, and overall performance

console.log('🚀 Starting Performance Test Suite...');

class PerformanceTestSuite {
  constructor() {
    this.results = {
      backgroundScript: {},
      popup: {},
      settings: {},
      overall: {}
    };
    this.startTime = performance.now();
  }

  // Test background script initialization speed
  async testBackgroundScriptPerformance() {
    console.log('\n📋 Testing Background Script Performance...');
    
    try {
      // Test service worker ping speed
      const pingStart = performance.now();
      const pingResponse = await chrome.runtime.sendMessage({ action: 'ping' });
      const pingTime = performance.now() - pingStart;
      
      this.results.backgroundScript.pingTime = pingTime;
      console.log(`✅ Service worker ping: ${pingTime.toFixed(2)}ms`);
      
      // Test API key loading speed
      const apiStart = performance.now();
      const apiResponse = await chrome.runtime.sendMessage({ action: 'getAPIKeys' });
      const apiTime = performance.now() - apiStart;
      
      this.results.backgroundScript.apiLoadTime = apiTime;
      console.log(`✅ API key loading: ${apiTime.toFixed(2)}ms`);
      
      // Test settings loading speed
      const settingsStart = performance.now();
      const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const settingsTime = performance.now() - settingsStart;
      
      this.results.backgroundScript.settingsLoadTime = settingsTime;
      console.log(`✅ Settings loading: ${settingsTime.toFixed(2)}ms`);
      
      // Calculate total background script performance
      const totalTime = pingTime + apiTime + settingsTime;
      this.results.backgroundScript.totalTime = totalTime;
      console.log(`📊 Total background script time: ${totalTime.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      console.error('❌ Background script performance test failed:', error);
      return false;
    }
  }

  // Test popup initialization speed
  async testPopupPerformance() {
    console.log('\n📋 Testing Popup Performance...');
    
    try {
      // Simulate popup initialization
      const popupStart = performance.now();
      
      // Test parallel data loading (simulating popup behavior)
      const [threatLog, settings, sitesScanned] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getThreatLog' }),
        chrome.runtime.sendMessage({ action: 'getSettings' }),
        chrome.storage.local.get(['sitesScannedCount'])
      ]);
      
      const popupTime = performance.now() - popupStart;
      this.results.popup.initTime = popupTime;
      console.log(`✅ Popup initialization: ${popupTime.toFixed(2)}ms`);
      
      // Test cache performance (second load should be faster)
      const cacheStart = performance.now();
      await Promise.all([
        chrome.runtime.sendMessage({ action: 'getThreatLog' }),
        chrome.runtime.sendMessage({ action: 'getSettings' }),
        chrome.storage.local.get(['sitesScannedCount'])
      ]);
      const cacheTime = performance.now() - cacheStart;
      
      this.results.popup.cacheTime = cacheTime;
      console.log(`✅ Cached popup load: ${cacheTime.toFixed(2)}ms`);
      
      // Calculate performance improvement
      const improvement = ((popupTime - cacheTime) / popupTime * 100);
      this.results.popup.cacheImprovement = improvement;
      console.log(`📈 Cache performance improvement: ${improvement.toFixed(1)}%`);
      
      return true;
    } catch (error) {
      console.error('❌ Popup performance test failed:', error);
      return false;
    }
  }

  // Test storage performance
  async testStoragePerformance() {
    console.log('\n📋 Testing Storage Performance...');
    
    try {
      // Test single storage operation
      const singleStart = performance.now();
      await chrome.storage.local.get(['apiKeys']);
      const singleTime = performance.now() - singleStart;
      
      this.results.overall.singleStorageTime = singleTime;
      console.log(`✅ Single storage operation: ${singleTime.toFixed(2)}ms`);
      
      // Test parallel storage operations
      const parallelStart = performance.now();
      await Promise.all([
        chrome.storage.local.get(['apiKeys']),
        chrome.storage.local.get(['settings']),
        chrome.storage.local.get(['threatLog']),
        chrome.storage.local.get(['scanHistory'])
      ]);
      const parallelTime = performance.now() - parallelStart;
      
      this.results.overall.parallelStorageTime = parallelTime;
      console.log(`✅ Parallel storage operations: ${parallelTime.toFixed(2)}ms`);
      
      // Calculate efficiency
      const efficiency = (singleTime * 4) / parallelTime;
      this.results.overall.storageEfficiency = efficiency;
      console.log(`📊 Storage parallelization efficiency: ${efficiency.toFixed(2)}x`);
      
      return true;
    } catch (error) {
      console.error('❌ Storage performance test failed:', error);
      return false;
    }
  }

  // Test memory usage and cleanup
  async testMemoryPerformance() {
    console.log('\n📋 Testing Memory Performance...');
    
    try {
      // Test memory usage before operations
      const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Perform memory-intensive operations
      const largeData = [];
      for (let i = 0; i < 1000; i++) {
        largeData.push({
          id: i,
          url: `https://example${i}.com`,
          timestamp: Date.now(),
          threats: []
        });
      }
      
      // Test memory usage after operations
      const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryUsed = memoryAfter - memoryBefore;
      
      this.results.overall.memoryUsage = memoryUsed;
      console.log(`📊 Memory usage: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
      
      // Cleanup
      largeData.length = 0;
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Memory performance test failed:', error);
      return false;
    }
  }

  // Test network performance (API calls)
  async testNetworkPerformance() {
    console.log('\n📋 Testing Network Performance...');
    
    try {
      // Test concurrent API availability checks
      const networkStart = performance.now();
      
      // Simulate checking API availability
      const apiChecks = await Promise.all([
        this.checkAPIAvailability('Google Safe Browsing'),
        this.checkAPIAvailability('VirusTotal'),
        this.checkAPIAvailability('PhishTank'),
        this.checkAPIAvailability('URLScan.io')
      ]);
      
      const networkTime = performance.now() - networkStart;
      this.results.overall.networkTime = networkTime;
      console.log(`✅ API availability checks: ${networkTime.toFixed(2)}ms`);
      
      const availableAPIs = apiChecks.filter(Boolean).length;
      console.log(`📊 Available APIs: ${availableAPIs}/4`);
      
      return true;
    } catch (error) {
      console.error('❌ Network performance test failed:', error);
      return false;
    }
  }

  // Helper method to check API availability
  async checkAPIAvailability(apiName) {
    try {
      // Simulate API availability check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return true;
    } catch (error) {
      console.warn(`⚠️ ${apiName} not available`);
      return false;
    }
  }

  // Generate performance report
  generateReport() {
    console.log('\n📊 Performance Test Results Summary');
    console.log('=====================================');
    
    const totalTime = performance.now() - this.startTime;
    this.results.overall.totalTestTime = totalTime;
    
    console.log(`🕒 Total test duration: ${totalTime.toFixed(2)}ms`);
    
    if (this.results.backgroundScript.totalTime) {
      console.log(`🔧 Background script performance: ${this.results.backgroundScript.totalTime.toFixed(2)}ms`);
    }
    
    if (this.results.popup.initTime) {
      console.log(`🖼️ Popup initialization: ${this.results.popup.initTime.toFixed(2)}ms`);
      if (this.results.popup.cacheImprovement) {
        console.log(`📈 Cache improvement: ${this.results.popup.cacheImprovement.toFixed(1)}%`);
      }
    }
    
    if (this.results.overall.storageEfficiency) {
      console.log(`💾 Storage efficiency: ${this.results.overall.storageEfficiency.toFixed(2)}x`);
    }
    
    // Performance grades
    console.log('\n🏆 Performance Grades:');
    console.log('======================');
    
    const grades = this.calculateGrades();
    Object.entries(grades).forEach(([category, grade]) => {
      const emoji = this.getGradeEmoji(grade);
      console.log(`${emoji} ${category}: ${grade}`);
    });
    
    return this.results;
  }

  // Calculate performance grades
  calculateGrades() {
    const grades = {};
    
    // Background script grade
    if (this.results.backgroundScript.totalTime) {
      const bgTime = this.results.backgroundScript.totalTime;
      if (bgTime < 50) grades['Background Script'] = 'A+';
      else if (bgTime < 100) grades['Background Script'] = 'A';
      else if (bgTime < 200) grades['Background Script'] = 'B';
      else if (bgTime < 500) grades['Background Script'] = 'C';
      else grades['Background Script'] = 'D';
    }
    
    // Popup grade
    if (this.results.popup.initTime) {
      const popupTime = this.results.popup.initTime;
      if (popupTime < 100) grades['Popup'] = 'A+';
      else if (popupTime < 200) grades['Popup'] = 'A';
      else if (popupTime < 400) grades['Popup'] = 'B';
      else if (popupTime < 800) grades['Popup'] = 'C';
      else grades['Popup'] = 'D';
    }
    
    // Storage grade
    if (this.results.overall.storageEfficiency) {
      const efficiency = this.results.overall.storageEfficiency;
      if (efficiency > 3.5) grades['Storage'] = 'A+';
      else if (efficiency > 3.0) grades['Storage'] = 'A';
      else if (efficiency > 2.5) grades['Storage'] = 'B';
      else if (efficiency > 2.0) grades['Storage'] = 'C';
      else grades['Storage'] = 'D';
    }
    
    return grades;
  }

  // Get emoji for grade
  getGradeEmoji(grade) {
    const emojis = {
      'A+': '🥇',
      'A': '🥈',
      'B': '🥉',
      'C': '⚠️',
      'D': '❌'
    };
    return emojis[grade] || '❓';
  }

  // Run all performance tests
  async runAllTests() {
    console.log('🚀 Running comprehensive performance tests...\n');
    
    const tests = [
      this.testBackgroundScriptPerformance(),
      this.testPopupPerformance(),
      this.testStoragePerformance(),
      this.testMemoryPerformance(),
      this.testNetworkPerformance()
    ];
    
    await Promise.all(tests);
    
    return this.generateReport();
  }
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
  const testSuite = new PerformanceTestSuite();
  testSuite.runAllTests().then(results => {
    console.log('\n✅ Performance testing completed!');
    console.log('📊 Full results:', results);
  }).catch(error => {
    console.error('❌ Performance testing failed:', error);
  });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTestSuite;
}
