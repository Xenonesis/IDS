// Background script for AI-Powered Threat Detector Extension

// Enhanced error handler for background script
const errorHandler = {
  handleAPIError: (response, apiName, url) => {
    console.error(`${apiName} API Error: HTTP ${response.status} ${response.statusText} for URL: ${url}`);
  },
  handleJSONError: (error, responseText, apiName) => {
    console.error(`${apiName} JSON Parse Error: ${error.message}. Response preview: ${responseText.substring(0, 200)}`);
  },
  logError: (apiName, error, context = '') => {
    console.error(`${apiName} Error${context ? ' (' + context + ')' : ''}: ${error.message || error}`);
  }
};

// Configuration for threat detection APIs
const API_CONFIG = {
  GOOGLE_SAFE_BROWSING: {
    BASE_URL: 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
  },
  VIRUSTOTAL: {
    BASE_URL: 'https://www.virustotal.com/api/v3/urls',
    REPORT_URL: 'https://www.virustotal.com/api/v3/analyses'
  },
  PHISHTANK: {
    BASE_URL: 'https://checkurl.phishtank.com/checkurl/',
    PUBLIC_URL: 'http://data.phishtank.com/data/online-valid.json'
  },
  URLSCAN: {
    BASE_URL: 'https://urlscan.io/api/v1/scan/',
    RESULT_BASE_URL: 'https://urlscan.io/api/v1/result/',
    SEARCH_URL: 'https://urlscan.io/api/v1/search/'
  }
};

// Global variable to store API keys
let apiKeys = {
  googleSafeBrowsing: null,
  virusTotal: null,
  phishTank: null,
  urlScan: null
};

// Performance optimization flags
let isInitialized = false;
let initializationPromise = null;

// Fast startup cache
const startupCache = {
  settings: null,
  apiKeys: null,
  lastLoaded: 0
};

// Cache duration for startup data (30 seconds)
const STARTUP_CACHE_DURATION = 30 * 1000;

// Storage keys
const STORAGE_KEYS = {
  THREAT_LOG: 'threatLog',
  WHITELIST: 'whitelist',
  BLACKLIST: 'blacklist',
  SETTINGS: 'settings',
  SCAN_HISTORY: 'scanHistory'
};

// Initialize API key storage with proper structure
async function initializeAPIKeyStorage() {
  try {
    const result = await chrome.storage.local.get(['apiKeys']);
    const existingApiKeys = result.apiKeys || {};

    // Define the expected API key structure
    const defaultApiKeys = {
      googleSafeBrowsing: existingApiKeys.googleSafeBrowsing || '',
      virusTotal: existingApiKeys.virusTotal || '',
      phishTank: existingApiKeys.phishTank || '',
      urlScan: existingApiKeys.urlScan || '019706e5-f185-74e4-8709-f7d2360a59b9'
    };

    // Save the properly structured API keys
    await chrome.storage.local.set({ apiKeys: defaultApiKeys });

    console.log('✅ API key storage initialized with proper structure:', {
      googleSafeBrowsing: defaultApiKeys.googleSafeBrowsing ? 'Configured' : 'Empty (ready for user input)',
      virusTotal: defaultApiKeys.virusTotal ? 'Configured' : 'Empty (ready for user input)',
      phishTank: defaultApiKeys.phishTank ? 'Configured' : 'Empty (optional)',
      urlScan: defaultApiKeys.urlScan ? 'Pre-configured' : 'Not configured'
    });

    return defaultApiKeys;
  } catch (error) {
    console.error('❌ Error initializing API key storage:', error);
    throw error;
  }
}

// Fast initialization function with caching
async function fastInitialize() {
  if (isInitialized) {
    return true;
  }

  if (initializationPromise) {
    return await initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🚀 Fast initialization starting...');
      const startTime = performance.now();

      // Check if we have cached data that's still fresh
      const now = Date.now();
      if (startupCache.lastLoaded && (now - startupCache.lastLoaded) < STARTUP_CACHE_DURATION) {
        console.log('⚡ Using cached startup data');

        if (startupCache.apiKeys) {
          Object.assign(apiKeys, startupCache.apiKeys);
        }

        isInitialized = true;
        console.log(`✅ Fast initialization completed in ${(performance.now() - startTime).toFixed(2)}ms (cached)`);
        return true;
      }

      // Load fresh data in parallel for maximum speed with retry mechanism
      const [apiKeysResult, settingsResult] = await withRetry(async () => {
        return await Promise.all([
          chrome.storage.local.get(['apiKeys']),
          chrome.storage.local.get([STORAGE_KEYS.SETTINGS])
        ]);
      });

      // Process API keys
      const storedKeys = apiKeysResult.apiKeys || {};
      apiKeys.googleSafeBrowsing = storedKeys.googleSafeBrowsing && storedKeys.googleSafeBrowsing.trim() !== '' ? storedKeys.googleSafeBrowsing : null;
      apiKeys.virusTotal = storedKeys.virusTotal && storedKeys.virusTotal.trim() !== '' ? storedKeys.virusTotal : null;
      apiKeys.phishTank = storedKeys.phishTank && storedKeys.phishTank.trim() !== '' ? storedKeys.phishTank : null;
      apiKeys.urlScan = storedKeys.urlScan && storedKeys.urlScan.trim() !== '' ? storedKeys.urlScan : null;

      // Cache the loaded data
      startupCache.apiKeys = { ...apiKeys };
      startupCache.settings = settingsResult[STORAGE_KEYS.SETTINGS];
      startupCache.lastLoaded = now;

      isInitialized = true;
      console.log(`✅ Fast initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
      console.log('🔑 API keys status:', {
        googleSafeBrowsing: apiKeys.googleSafeBrowsing ? 'Ready' : 'Not configured',
        virusTotal: apiKeys.virusTotal ? 'Ready' : 'Not configured',
        phishTank: apiKeys.phishTank ? 'Ready' : 'Not configured',
        urlScan: apiKeys.urlScan ? 'Ready' : 'Not configured'
      });

      return true;
    } catch (error) {
      console.error('❌ Fast initialization failed:', error);
      isInitialized = false;
      return false;
    } finally {
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
}

// Legacy load API keys function (kept for compatibility)
async function loadAPIKeys() {
  return await fastInitialize();
}

// Initialize universal blocking statistics
let universalBlockingStats = {
  popups: 0,
  ads: 0,
  redirects: 0,
  overlays: 0,
  downloads: 0,
  scripts: 0,
  totalBlocked: 0,
  lastUpdated: Date.now()
};

// Initialize extension with fast startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🚀 AI-Powered Threat Detector Extension installed');
  const startTime = performance.now();

  try {
    // Initialize default settings in parallel with API key setup
    const settingsPromise = chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: {
        phishingDetection: true,
        malwareDetection: true,
        anomalyDetection: false,
        realTimeScanning: true
      },
      [STORAGE_KEYS.THREAT_LOG]: [],
      [STORAGE_KEYS.WHITELIST]: [],
      [STORAGE_KEYS.BLACKLIST]: [],
      [STORAGE_KEYS.SCAN_HISTORY]: [],
      blockingStatistics: {
        popupsBlocked: 0,
        adsBlocked: 0,
        sessionPopupsBlocked: 0,
        sessionAdsBlocked: 0,
        lastSessionStart: Date.now(),
        blockedPopupEvents: [],
        blockedAdEvents: []
      },
      universalBlockingStats: universalBlockingStats
    });

    const apiKeyPromise = initializeAPIKeyStorage();

    // Wait for both operations to complete
    await Promise.all([settingsPromise, apiKeyPromise]);

    // Fast initialization
    await fastInitialize();

    console.log(`✅ Extension installation completed in ${(performance.now() - startTime).toFixed(2)}ms`);
  } catch (error) {
    console.error('❌ Extension installation failed:', error);
  }
});

// Initialize on extension startup (not just install)
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 AI-Powered Threat Detector Extension starting up');
  const startTime = performance.now();

  await fastInitialize();

  console.log(`✅ Extension startup completed in ${(performance.now() - startTime).toFixed(2)}ms`);
});

// Service Worker Ready Check
function isServiceWorkerReady() {
  return new Promise((resolve) => {
    // Check if chrome.storage is available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      resolve(true);
    } else {
      // Wait a bit and try again
      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 100);
    }
  });
}

// Retry mechanism for storage operations
async function withRetry(operation, maxRetries = 3, delay = 100) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ready = await isServiceWorkerReady();
      if (!ready && attempt < maxRetries) {
        console.log(`⏳ Service worker not ready, attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }

      return await operation();
    } catch (error) {
      if (error.message && error.message.includes('No SW') && attempt < maxRetries) {
        console.log(`🔄 Retrying operation due to SW error, attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }

      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

// Delayed initialization to ensure service worker is ready
async function delayedInitialize() {
  try {
    console.log('🚀 Background script delayed initialization...');
    const startTime = performance.now();

    // Wait for service worker to be ready
    await isServiceWorkerReady();

    // Add a small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 200));

    await withRetry(async () => {
      await fastInitialize();
    });

    console.log(`✅ Delayed initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
  } catch (error) {
    console.error('❌ Delayed initialization failed:', error);
    // Try one more time after a longer delay
    setTimeout(async () => {
      try {
        console.log('🔄 Attempting final initialization...');
        await withRetry(async () => {
          await fastInitialize();
        });
        console.log('✅ Final initialization successful');
      } catch (finalError) {
        console.error('❌ Final initialization failed:', finalError);
      }
    }, 1000);
  }
}

// Use delayed initialization instead of immediate
setTimeout(delayedInitialize, 100);

// Optimized scanning system with intelligent triggers
let scanningTabs = new Set(); // Track tabs currently being scanned
let scanCache = new Map(); // Cache scan results to avoid duplicate scans
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for intelligent re-scanning
let lastScanTimes = new Map(); // Track last scan time per URL to prevent rapid rescanning
let blockedTabs = new Set(); // Track tabs with blocked content

// Single optimized listener for navigation completion
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only scan main frame navigations (not iframes)
  if (details.frameId !== 0) return;

  // Skip internal browser pages and extensions
  if (details.url.startsWith('chrome://') ||
      details.url.startsWith('chrome-extension://') ||
      details.url.startsWith('moz-extension://') ||
      details.url.startsWith('about:')) {
    return;
  }

  // Intelligent scanning: only scan if it's been more than 30 seconds since last scan of this URL
  const lastScanTime = lastScanTimes.get(details.url);
  const now = Date.now();
  if (lastScanTime && (now - lastScanTime) < 30000) {
    console.log('⏸️ Skipping recent scan for:', details.url);
    return;
  }

  // Ensure API keys are loaded before scanning
  if (!apiKeys.urlScan && !apiKeys.googleSafeBrowsing && !apiKeys.virusTotal) {
    await loadAPIKeys();
  }

  // Perform optimized scan
  await performOptimizedScan(details.url, details.tabId);
});

// Proactive navigation monitoring for intelligent blocking
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only monitor main frame navigations
  if (details.frameId !== 0) return;

  // Skip internal browser pages
  if (details.url.startsWith('chrome://') ||
      details.url.startsWith('chrome-extension://') ||
      details.url.startsWith('moz-extension://') ||
      details.url.startsWith('about:')) {
    return;
  }

  try {
    // Check if we have cached threat data for this URL
    const cached = scanCache.get(details.url);
    if (cached && cached.threats && cached.threats.length > 0) {
      const cacheAge = Date.now() - cached.timestamp;

      // If cache is still fresh and contains threats, prepare for blocking
      if (cacheAge < CACHE_DURATION) {
        console.log(`⚠️ Navigating to known threat: ${details.url}`);
        // Pre-emptively mark tab for blocking
        blockedTabs.add(details.tabId);
      }
    }
  } catch (error) {
    console.error('Error in proactive navigation monitoring:', error);
  }
});

// Tab removal cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up tracking for closed tabs
  scanningTabs.delete(tabId);
  blockedTabs.delete(tabId);
});

// Optimized scanning function with binary status system
async function performOptimizedScan(url, tabId, scanType = 'automatic') {
  try {
    // Prevent duplicate scans for the same tab
    if (scanningTabs.has(tabId)) {
      console.log('⏸️ Already scanning tab:', tabId);
      return;
    }

    console.log('🔍 Starting optimized scan:', url);
    scanningTabs.add(tabId);
    lastScanTimes.set(url, Date.now());

    // Show scanning indicator
    await showBinaryStatus(tabId, 'scanning');

    // Intelligent cache checking with 5-minute expiration
    const cacheKey = url;
    const cached = scanCache.get(cacheKey);
    const now = Date.now();
    const cacheAge = cached ? now - cached.timestamp : Infinity;

    // Use cached result only if it's fresh (less than 5 minutes old)
    if (cached && cacheAge < CACHE_DURATION) {
      console.log(`📋 Using cached result for: ${url} (age: ${Math.round(cacheAge / 1000)}s)`);

      // Update cache access tracking
      cached.lastAccessed = now;
      cached.accessCount = (cached.accessCount || 0) + 1;
      scanCache.set(cacheKey, cached);

      scanningTabs.delete(tabId);

      // Show binary status based on cached result
      const hasThreats = cached.threats && cached.threats.length > 0;
      await showBinaryStatus(tabId, hasThreats ? 'danger' : 'secure');

      if (hasThreats) {
        await showThreatWarning(tabId, cached.threats[0].type, cached.threats[0].description);
        // Apply content blocking for cached threats
        await applyContentBlocking(tabId, url, cached.threats);
      }
      return;
    }

    // If cache is expired, log and proceed with fresh scan
    if (cached && cacheAge >= CACHE_DURATION) {
      console.log(`🔄 Cache expired for: ${url} (age: ${Math.round(cacheAge / 1000)}s), performing fresh scan`);
    }

    // Get user settings
    const settings = await getSettings();
    if (!settings.realTimeScanning) {
      console.log('⏸️ Real-time scanning disabled');
      scanningTabs.delete(tabId);
      return;
    }

    // Check whitelist/blacklist first (including temporary whitelist)
    const isWhitelisted = await isURLWhitelisted(url);
    const isBlacklisted = await isURLBlacklisted(url);
    const isTemporarilyWhitelistedUrl = isTemporarilyWhitelisted(url);

    if (isWhitelisted || isTemporarilyWhitelistedUrl) {
      const whitelistType = isTemporarilyWhitelistedUrl ? 'temporarily whitelisted' : 'whitelisted';
      console.log(`✅ URL is ${whitelistType}:`, url);
      scanCache.set(cacheKey, { threats: [], timestamp: Date.now() });
      scanningTabs.delete(tabId);
      await showBinaryStatus(tabId, 'secure');
      return;
    }

    if (isBlacklisted) {
      console.log('🚫 URL is blacklisted:', url);
      const blacklistThreat = { type: 'blacklist', description: 'This URL is in your blacklist' };
      scanCache.set(cacheKey, { threats: [blacklistThreat], timestamp: Date.now() });
      scanningTabs.delete(tabId);
      await showBinaryStatus(tabId, 'danger');
      await showThreatWarning(tabId, 'blacklist', 'This URL is in your blacklist');
      return;
    }

    // Perform threat detection with all configured APIs
    const scanStartTime = Date.now();
    const threats = await performThreatDetection(url, settings);
    const scanDuration = Date.now() - scanStartTime;

    // Enhanced cache results with metadata for intelligent management
    const cacheEntry = {
      threats,
      timestamp: Date.now(),
      scanDuration,
      scanType,
      url,
      lastAccessed: Date.now(),
      accessCount: (cached?.accessCount || 0) + 1
    };
    scanCache.set(cacheKey, cacheEntry);

    // Increment sites scanned count
    try {
      const result = await chrome.storage.local.get('sitesScannedCount');
      const newCount = (result.sitesScannedCount || 0) + 1;
      await chrome.storage.local.set({ sitesScannedCount: newCount });
    } catch (error) {
      console.error('Error incrementing sites scanned count:', error);
    }

    // Add to scan history
    const scanResult = {
      url: url,
      threats: threats,
      scanDuration: scanDuration,
      apisUsed: getUsedAPIs(settings),
      scanType: scanType,
      timestamp: new Date().toISOString()
    };
    await addToScanHistory(scanResult);

    // Show binary status and handle threats
    const hasThreats = threats.length > 0;
    await showBinaryStatus(tabId, hasThreats ? 'danger' : 'secure');

    if (hasThreats) {
      await logThreat(url, threats);
      await showThreatWarning(tabId, threats[0].type, threats[0].description);
      // Apply intelligent content blocking for detected threats
      await applyContentBlocking(tabId, url, threats);
    }

    // Always remove from scanning tabs set
    scanningTabs.delete(tabId);

  } catch (error) {
    console.error('Error in optimized scan:', error);
    scanningTabs.delete(tabId);
    // Show secure status as fallback (fail-safe approach)
    await showBinaryStatus(tabId, 'secure');
  }
}

// Simplified binary status system (secure or danger only)
async function showBinaryStatus(tabId, status) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'showBinaryStatus',
      status: status // 'scanning', 'secure', or 'danger'
    });
  } catch (error) {
    // Ignore errors if content script is not ready
  }
}

// Consolidated threat detection function
async function performThreatDetection(url, settings) {
  const threats = [];
  const detectionPromises = [];

  console.log('🔍 Starting threat detection for:', url);

  // Run all API checks in parallel for better performance
  if (settings.phishingDetection && apiKeys.googleSafeBrowsing) {
    detectionPromises.push(
      checkPhishing(url).then(result => {
        if (result.isThreat) threats.push(result);
      }).catch(error => console.error('Google Safe Browsing error:', error))
    );
  }

  if (settings.malwareDetection && apiKeys.virusTotal) {
    detectionPromises.push(
      checkMalware(url).then(result => {
        if (result.isThreat) threats.push(result);
      }).catch(error => console.error('VirusTotal error:', error))
    );
  }

  if (settings.phishingDetection) {
    detectionPromises.push(
      checkPhishTank(url).then(result => {
        if (result.isThreat) threats.push(result);
      }).catch(error => console.error('PhishTank error:', error))
    );
  }

  if ((settings.phishingDetection || settings.malwareDetection) && apiKeys.urlScan) {
    detectionPromises.push(
      checkURLScan(url).then(result => {
        if (result.isThreat) threats.push(result);
      }).catch(error => console.error('URLScan.io error:', error))
    );
  }

  // Wait for all checks to complete
  await Promise.all(detectionPromises);

  console.log(`✅ Threat detection completed. Found ${threats.length} threats.`);
  return threats;
}

// Enhanced content blocking for malicious sites
async function applyContentBlocking(tabId, url, threats) {
  try {
    console.log(`🚫 Applying enhanced content blocking for tab ${tabId} with ${threats.length} threats`);

    // Mark tab as blocked
    blockedTabs.add(tabId);

    const severity = determineThreatSeverity(threats);

    // Send blocking instructions to both content script and content blocker
    const blockingMessage = {
      action: 'enableContentBlocking',
      threats: threats,
      url: url,
      severity: severity,
      maliciousDomains: extractDomainsFromThreats(threats)
    };

    await chrome.tabs.sendMessage(tabId, blockingMessage).catch(error => {
      console.log('Content script not ready for blocking message:', error.message);
    });

    // Also send to the advanced content blocker
    await chrome.tabs.sendMessage(tabId, {
      action: 'enableAdvancedBlocking',
      threats: threats,
      severity: severity
    }).catch(error => {
      console.log('Advanced content blocker not ready:', error.message);
    });

    // For high-severity threats, apply additional network-level blocking
    if (severity === 'high') {
      console.log('🔴 High-severity threat detected, applying strict blocking');
      await applyNetworkLevelBlocking(threats);
    }

    // Log the blocking action
    await logBlockingAction(tabId, url, threats, severity);

  } catch (error) {
    console.error('Error applying content blocking:', error);
  }
}

// Extract domains from threat data for blocking
function extractDomainsFromThreats(threats) {
  const domains = new Set();

  threats.forEach(threat => {
    if (threat.domain) {
      domains.add(threat.domain);
    }
    if (threat.url) {
      try {
        const domain = new URL(threat.url).hostname;
        domains.add(domain);
      } catch (e) {
        console.warn('Invalid threat URL:', threat.url);
      }
    }
  });

  return Array.from(domains);
}

// Apply network-level blocking for high-severity threats using Manifest V3 declarativeNetRequest
async function applyNetworkLevelBlocking(threats) {
  try {
    const domains = extractDomainsFromThreats(threats);

    if (domains.length === 0) return;

    // Create declarative net request rules for blocking (Manifest V3 compatible)
    const rules = domains.map((domain, index) => ({
      id: 10000 + index, // Use high IDs to avoid conflicts with static rules
      priority: 3, // Higher priority than static rules
      action: { type: 'block' },
      condition: {
        urlFilter: `*://${domain}/*`,
        resourceTypes: ['main_frame', 'sub_frame', 'script', 'image', 'xmlhttprequest']
      }
    }));

    // Get current dynamic rules to avoid conflicts
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(rule => rule.id);

    // Filter out rules that would conflict
    const newRules = rules.filter(rule => !existingIds.includes(rule.id)).slice(0, 10);

    if (newRules.length > 0) {
      // Add the blocking rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules,
        removeRuleIds: [] // We'll manage rule cleanup separately
      });

      console.log(`🌐 Applied network-level blocking for ${newRules.length} domains using declarativeNetRequest`);

      // Schedule rule cleanup after 1 hour
      setTimeout(async () => {
        try {
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: newRules.map(rule => rule.id)
          });
          console.log('🧹 Cleaned up temporary blocking rules');
        } catch (error) {
          console.error('Error cleaning up blocking rules:', error);
        }
      }, 3600000); // 1 hour
    }

  } catch (error) {
    console.error('Error applying network-level blocking:', error);
    // Fallback to content script blocking only
    console.log('📝 Falling back to content script blocking only');
  }
}

// Log blocking actions for statistics and debugging
async function logBlockingAction(tabId, url, threats, severity) {
  try {
    const blockingLog = {
      timestamp: Date.now(),
      tabId: tabId,
      url: url,
      threats: threats.map(t => ({ type: t.type, source: t.source })),
      severity: severity,
      action: 'content_blocking_applied'
    };

    // Store in local storage for statistics
    const result = await chrome.storage.local.get('blockingLogs');
    const logs = result.blockingLogs || [];

    // Keep only last 100 logs to prevent storage bloat
    logs.push(blockingLog);
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    await chrome.storage.local.set({ blockingLogs: logs });

    console.log('📊 Logged blocking action for statistics');
  } catch (error) {
    console.error('Error logging blocking action:', error);
  }
}

// Determine threat severity for intelligent blocking decisions
function determineThreatSeverity(threats) {
  if (!threats || threats.length === 0) return 'none';

  const highSeverityTypes = ['malware', 'phishing', 'blacklist'];
  const mediumSeverityTypes = ['suspicious', 'potentially_harmful'];

  for (const threat of threats) {
    if (highSeverityTypes.includes(threat.type?.toLowerCase())) {
      return 'high';
    }
  }

  for (const threat of threats) {
    if (mediumSeverityTypes.includes(threat.type?.toLowerCase())) {
      return 'medium';
    }
  }

  return 'low';
}

// Enhanced cache cleanup function to prevent memory leaks
function cleanupCache() {
  const now = Date.now();

  // Clean scan cache with intelligent retention
  for (const [key, value] of scanCache.entries()) {
    const age = now - value.timestamp;
    const lastAccessed = now - (value.lastAccessed || value.timestamp);

    // Remove if older than cache duration or not accessed recently
    if (age > CACHE_DURATION || lastAccessed > (2 * CACHE_DURATION)) {
      scanCache.delete(key);
    }
  }

  // Clean last scan times (keep only last hour)
  for (const [key, value] of lastScanTimes.entries()) {
    if (now - value > 60 * 60 * 1000) { // 1 hour
      lastScanTimes.delete(key);
    }
  }

  // Clean blocked tabs set periodically
  if (blockedTabs.size > 100) {
    console.log('🧹 Cleaning blocked tabs set');
    blockedTabs.clear();
  }
}

// Run cache cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

// Blocking Statistics Management Functions
async function incrementBlockingStatistic(type, details = {}) {
  return await withRetry(async () => {
    const result = await chrome.storage.local.get(['blockingStatistics']);
    const stats = result.blockingStatistics || {
      popupsBlocked: 0,
      adsBlocked: 0,
      sessionPopupsBlocked: 0,
      sessionAdsBlocked: 0,
      lastSessionStart: Date.now(),
      blockedPopupEvents: [],
      blockedAdEvents: []
    };

    const now = Date.now();
    const eventData = {
      timestamp: new Date().toISOString(),
      url: details.url || 'unknown',
      domain: details.domain || 'unknown',
      ...details
    };

    // Increment counters based on type
    if (type === 'popup') {
      stats.popupsBlocked = (stats.popupsBlocked || 0) + 1;
      stats.sessionPopupsBlocked = (stats.sessionPopupsBlocked || 0) + 1;

      // Add to events log (keep last 100 events)
      stats.blockedPopupEvents = stats.blockedPopupEvents || [];
      stats.blockedPopupEvents.unshift(eventData);
      if (stats.blockedPopupEvents.length > 100) {
        stats.blockedPopupEvents = stats.blockedPopupEvents.slice(0, 100);
      }

      console.log(`🚫 Popup blocked! Total: ${stats.popupsBlocked}, Session: ${stats.sessionPopupsBlocked}`);

    } else if (type === 'ad') {
      stats.adsBlocked = (stats.adsBlocked || 0) + 1;
      stats.sessionAdsBlocked = (stats.sessionAdsBlocked || 0) + 1;

      // Add to events log (keep last 100 events)
      stats.blockedAdEvents = stats.blockedAdEvents || [];
      stats.blockedAdEvents.unshift(eventData);
      if (stats.blockedAdEvents.length > 100) {
        stats.blockedAdEvents = stats.blockedAdEvents.slice(0, 100);
      }

      console.log(`🚫 Ad blocked! Total: ${stats.adsBlocked}, Session: ${stats.sessionAdsBlocked}`);
    }

    // Save updated statistics
    await chrome.storage.local.set({ blockingStatistics: stats });

    // Notify popup to update display
    try {
      chrome.runtime.sendMessage({ action: 'blockingStatsUpdated', stats }).catch(() => {
        // Popup might not be open, ignore error
      });
    } catch (error) {
      // Ignore messaging errors when popup is closed
    }

    return stats;
  });
}

// Reset session statistics (called on extension startup)
async function resetSessionStatistics() {
  return await withRetry(async () => {
    const result = await chrome.storage.local.get(['blockingStatistics']);
    const stats = result.blockingStatistics || {};

    stats.sessionPopupsBlocked = 0;
    stats.sessionAdsBlocked = 0;
    stats.lastSessionStart = Date.now();

    await chrome.storage.local.set({ blockingStatistics: stats });
    console.log('📊 Session statistics reset');
  });
}

// Initialize session statistics on startup with retry
setTimeout(async () => {
  try {
    await resetSessionStatistics();
    await loadUniversalBlockingStats();
    console.log('✅ Session statistics initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing session statistics:', error);
  }
}, 500); // Wait 500ms to ensure service worker is ready

// Load universal blocking stats from storage
async function loadUniversalBlockingStats() {
  try {
    const result = await chrome.storage.local.get(['universalBlockingStats']);
    if (result.universalBlockingStats) {
      universalBlockingStats = {
        ...universalBlockingStats,
        ...result.universalBlockingStats
      };
      console.log('📊 Universal blocking stats loaded:', universalBlockingStats);
    }
  } catch (error) {
    console.error('Error loading universal blocking stats:', error);
  }
}

// Save universal blocking stats to storage
async function saveUniversalBlockingStats() {
  try {
    universalBlockingStats.lastUpdated = Date.now();
    await chrome.storage.local.set({ universalBlockingStats: universalBlockingStats });
  } catch (error) {
    console.error('Error saving universal blocking stats:', error);
  }
}

// Scan History Management Functions
const MAX_SCAN_HISTORY = 1000; // Keep last 1000 scans

// Add scan result to history
async function addToScanHistory(scanResult) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SCAN_HISTORY]);
    let scanHistory = result[STORAGE_KEYS.SCAN_HISTORY] || [];

    // Create comprehensive scan history entry
    const historyEntry = {
      id: Date.now() + Math.random(), // Unique ID
      url: scanResult.url,
      domain: extractDomain(scanResult.url),
      timestamp: new Date().toISOString(),
      status: scanResult.threats && scanResult.threats.length > 0 ? 'danger' : 'secure',
      threatCount: scanResult.threats ? scanResult.threats.length : 0,
      threats: scanResult.threats || [],
      scanDuration: scanResult.scanDuration || 0,
      apisUsed: scanResult.apisUsed || [],
      scanType: scanResult.scanType || 'automatic', // 'automatic' or 'manual'
      results: scanResult.results || [],
      cached: scanResult.cached || false
    };

    // Add to beginning of array (most recent first)
    scanHistory.unshift(historyEntry);

    // Keep only last MAX_SCAN_HISTORY entries
    if (scanHistory.length > MAX_SCAN_HISTORY) {
      scanHistory = scanHistory.slice(0, MAX_SCAN_HISTORY);
    }

    // Save updated history
    await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_HISTORY]: scanHistory });

    console.log('📋 Added scan to history:', {
      url: scanResult.url,
      status: historyEntry.status,
      threatCount: historyEntry.threatCount
    });

    return historyEntry;
  } catch (error) {
    console.error('Error adding to scan history:', error);
    return null;
  }
}

// Get scan history with optional filtering
async function getScanHistory(options = {}) {
  try {
    console.log('📋 Getting scan history with options:', options);
    const result = await chrome.storage.local.get([STORAGE_KEYS.SCAN_HISTORY]);
    let scanHistory = result[STORAGE_KEYS.SCAN_HISTORY] || [];

    console.log(`📊 Found ${scanHistory.length} total scan history entries in storage`);

    // Apply filters
    if (options.status && options.status !== 'all') {
      scanHistory = scanHistory.filter(entry => entry.status === options.status);
    }

    if (options.domain) {
      scanHistory = scanHistory.filter(entry =>
        entry.domain.toLowerCase().includes(options.domain.toLowerCase())
      );
    }

    if (options.dateFrom) {
      const fromDate = new Date(options.dateFrom);
      scanHistory = scanHistory.filter(entry =>
        new Date(entry.timestamp) >= fromDate
      );
    }

    if (options.dateTo) {
      const toDate = new Date(options.dateTo);
      scanHistory = scanHistory.filter(entry =>
        new Date(entry.timestamp) <= toDate
      );
    }

    if (options.threatType) {
      scanHistory = scanHistory.filter(entry =>
        entry.threats.some(threat =>
          threat.type && threat.type.toLowerCase().includes(options.threatType.toLowerCase())
        )
      );
    }

    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const total = scanHistory.length;
    const paginatedHistory = scanHistory.slice(offset, offset + limit);

    console.log(`📋 Returning ${paginatedHistory.length} scan history entries (${total} total after filtering)`);

    return {
      history: paginatedHistory,
      total: total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error getting scan history:', error);
    return { history: [], total: 0, hasMore: false };
  }
}

// Clear scan history
async function clearScanHistory() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_HISTORY]: [] });
    console.log('🗑️ Scan history cleared');
    return true;
  } catch (error) {
    console.error('Error clearing scan history:', error);
    return false;
  }
}

// Delete specific scan from history
async function deleteScanFromHistory(scanId) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SCAN_HISTORY]);
    let scanHistory = result[STORAGE_KEYS.SCAN_HISTORY] || [];

    scanHistory = scanHistory.filter(entry => entry.id !== scanId);

    await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_HISTORY]: scanHistory });
    console.log('🗑️ Deleted scan from history:', scanId);
    return true;
  } catch (error) {
    console.error('Error deleting scan from history:', error);
    return false;
  }
}

// Export scan history
async function exportScanHistory(format = 'json') {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SCAN_HISTORY]);
    const scanHistory = result[STORAGE_KEYS.SCAN_HISTORY] || [];

    if (format === 'csv') {
      return convertToCSV(scanHistory);
    } else if (format === 'pdf') {
      return convertToPDFText(scanHistory);
    } else {
      return JSON.stringify(scanHistory, null, 2);
    }
  } catch (error) {
    console.error('Error exporting scan history:', error);
    return null;
  }
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

// Helper function to convert scan history to CSV
function convertToCSV(scanHistory) {
  const headers = [
    'Timestamp',
    'URL',
    'Domain',
    'Status',
    'Threat Count',
    'Threats',
    'Scan Duration (ms)',
    'APIs Used',
    'Scan Type'
  ];

  const rows = scanHistory.map(entry => [
    entry.timestamp || 'Unknown',
    entry.url || 'Unknown',
    entry.domain || extractDomain(entry.url) || 'Unknown',
    entry.status || 'Unknown',
    entry.threatCount || 0,
    (entry.threats && Array.isArray(entry.threats))
      ? entry.threats.map(t => `${t.type || 'Unknown'}: ${t.description || 'No description'}`).join('; ')
      : 'None',
    entry.scanDuration || 0,
    Array.isArray(entry.apisUsed)
      ? entry.apisUsed.join(', ')
      : (entry.apisUsed || 'Unknown'),
    entry.scanType || 'Unknown'
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

// Helper function to convert scan history to PDF text format
function convertToPDFText(scanHistory) {
  const lines = [];
  lines.push('SCAN HISTORY REPORT');
  lines.push('==================');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Scans: ${scanHistory.length}`);
  lines.push('');

  if (scanHistory.length > 0) {
    lines.push('SCAN DETAILS');
    lines.push('------------');

    scanHistory.forEach((scan, index) => {
      lines.push(`${index + 1}. ${scan.domain || extractDomain(scan.url) || 'Unknown Domain'}`);
      lines.push(`   URL: ${scan.url || 'Unknown URL'}`);
      lines.push(`   Status: ${scan.status || 'Unknown'}`);
      lines.push(`   Threats: ${scan.threatCount || 0}`);
      if (scan.threats && Array.isArray(scan.threats) && scan.threats.length > 0) {
        scan.threats.forEach(threat => {
          lines.push(`     - ${threat.type || 'Unknown'}: ${threat.description || 'No description'}`);
        });
      }
      lines.push(`   Scan Type: ${scan.scanType || 'Unknown'}`);
      lines.push(`   Duration: ${scan.scanDuration || 0}ms`);
      lines.push(`   APIs Used: ${Array.isArray(scan.apisUsed) ? scan.apisUsed.join(', ') : scan.apisUsed || 'Unknown'}`);
      lines.push(`   Timestamp: ${scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Unknown'}`);
      lines.push('');
    });
  } else {
    lines.push('No scan history available');
  }

  lines.push('Report generated by AI-Powered Threat Detector Extension');

  return lines.join('\n');
}

// Helper function to get used APIs based on settings
function getUsedAPIs(settings) {
  const apis = [];
  if (settings.phishingDetection && apiKeys.googleSafeBrowsing) apis.push('Google Safe Browsing');
  if (settings.malwareDetection && apiKeys.virusTotal) apis.push('VirusTotal');
  if (settings.phishingDetection) apis.push('PhishTank');
  if ((settings.phishingDetection || settings.malwareDetection) && apiKeys.urlScan) apis.push('URLScan.io');
  return apis;
}

// Generate test scan history data for debugging
async function generateTestScanHistory() {
  console.log('🧪 Generating test scan history data...');

  const testScans = [
    {
      url: 'https://google.com',
      threats: [],
      scanDuration: 1250,
      apisUsed: ['Google Safe Browsing', 'VirusTotal'],
      scanType: 'automatic'
    },
    {
      url: 'https://github.com',
      threats: [],
      scanDuration: 980,
      apisUsed: ['Google Safe Browsing', 'PhishTank'],
      scanType: 'manual'
    },
    {
      url: 'https://malicious-example.com',
      threats: [
        {
          type: 'phishing',
          description: 'Phishing attempt detected',
          source: 'Google Safe Browsing'
        }
      ],
      scanDuration: 1500,
      apisUsed: ['Google Safe Browsing', 'VirusTotal'],
      scanType: 'automatic'
    },
    {
      url: 'https://stackoverflow.com',
      threats: [],
      scanDuration: 750,
      apisUsed: ['PhishTank', 'URLScan.io'],
      scanType: 'manual'
    },
    {
      url: 'https://suspicious-site.net',
      threats: [
        {
          type: 'malware',
          description: 'Malware detected',
          source: 'VirusTotal'
        }
      ],
      scanDuration: 2100,
      apisUsed: ['VirusTotal', 'URLScan.io'],
      scanType: 'automatic'
    }
  ];

  for (const scanData of testScans) {
    await addToScanHistory(scanData);
  }

  console.log(`✅ Generated ${testScans.length} test scan history entries`);
}

// Check for phishing using Google Safe Browsing API
async function checkPhishing(url) {
  try {
    if (!apiKeys.googleSafeBrowsing) {
      console.log('Google Safe Browsing API key not configured, skipping check');
      return { isThreat: false, source: 'Google Safe Browsing', error: 'API key not configured' };
    }

    const response = await fetch(`${API_CONFIG.GOOGLE_SAFE_BROWSING.BASE_URL}?key=${apiKeys.googleSafeBrowsing}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client: {
          clientId: 'threat-detector-extension',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: url }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      errorHandler.handleAPIError(response, 'Google Safe Browsing', url);
      return {
        isThreat: false,
        source: 'Google Safe Browsing',
        error: `HTTP ${response.status}: ${response.statusText}`,
        description: 'Google Safe Browsing API temporarily unavailable'
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      errorHandler.handleJSONError(new Error('Non-JSON response'), responseText, 'Google Safe Browsing');
      return {
        isThreat: false,
        source: 'Google Safe Browsing',
        error: 'Non-JSON response',
        description: 'Google Safe Browsing returned unexpected response format'
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      errorHandler.handleJSONError(jsonError, responseText, 'Google Safe Browsing');
      return {
        isThreat: false,
        source: 'Google Safe Browsing',
        error: 'JSON parse error',
        description: 'Could not parse Google Safe Browsing response'
      };
    }

    if (data.matches && data.matches.length > 0) {
      return {
        isThreat: true,
        type: 'phishing',
        description: 'Potential phishing site detected by Google Safe Browsing',
        source: 'Google Safe Browsing',
        details: data.matches[0]
      };
    }

    return { isThreat: false, source: 'Google Safe Browsing' };
  } catch (error) {
    console.error('Error checking phishing:', error);
    return { isThreat: false, source: 'Google Safe Browsing', error: error.message };
  }
}

// Check for malware using VirusTotal API v3
async function checkMalware(url) {
  try {
    if (!apiKeys.virusTotal) {
      console.log('VirusTotal API key not configured, skipping check');
      return { isThreat: false, source: 'VirusTotal', error: 'API key not configured' };
    }

    // First, submit the URL for analysis (VirusTotal v3 API)
    const urlId = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Try to get existing analysis first
    const reportResponse = await fetch(`${API_CONFIG.VIRUSTOTAL.BASE_URL}/${urlId}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKeys.virusTotal
      }
    });

    if (reportResponse.ok) {
      const contentType = reportResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const reportData = await reportResponse.json();

          if (reportData.data && reportData.data.attributes && reportData.data.attributes.stats) {
            const stats = reportData.data.attributes.stats;
            const malicious = stats.malicious || 0;
            const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;

            if (malicious > 0) {
              return {
                isThreat: true,
                type: 'malware',
                description: `Malware detected by ${malicious}/${total} security vendors`,
                source: 'VirusTotal',
                positives: malicious,
                total: total,
                scanDate: reportData.data.attributes.last_analysis_date
              };
            }

            return {
              isThreat: false,
              source: 'VirusTotal',
              description: `Clean - scanned by ${total} vendors`,
              positives: malicious,
              total: total
            };
          }
        } catch (jsonError) {
          console.log('VirusTotal: Could not parse existing report, will submit for new scan');
        }
      }
    }

    // If no existing report or error, submit for new analysis
    const submitResponse = await fetch(API_CONFIG.VIRUSTOTAL.BASE_URL, {
      method: 'POST',
      headers: {
        'x-apikey': apiKeys.virusTotal,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        url: url
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('VirusTotal submit error:', submitResponse.status, errorText);

      // Handle rate limiting gracefully
      if (submitResponse.status === 429) {
        return {
          isThreat: false,
          source: 'VirusTotal',
          error: 'Rate limit exceeded - try again later',
          rateLimited: true
        };
      }

      throw new Error(`HTTP ${submitResponse.status}: ${submitResponse.statusText}`);
    }

    const submitData = await submitResponse.json();

    return {
      isThreat: false,
      source: 'VirusTotal',
      description: 'URL submitted for analysis - results will be available shortly',
      analysisId: submitData.data?.id,
      scanInProgress: true
    };

  } catch (error) {
    console.error('Error checking VirusTotal:', error);
    return { isThreat: false, source: 'VirusTotal', error: error.message };
  }
}

// Check for phishing using PhishTank API
async function checkPhishTank(url) {
  try {
    // PhishTank has strict rate limiting, so we'll use a more conservative approach
    console.log('Checking PhishTank for URL:', url);

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(API_CONFIG.PHISHTANK.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ThreatDetectorExtension/1.0'
      },
      body: new URLSearchParams({
        url: url,
        format: 'json',
        app_key: apiKeys.phishTank || ''
      })
    });

    // Handle rate limiting (403 Forbidden)
    if (response.status === 403) {
      console.log('PhishTank: Rate limited or access denied');
      return {
        isThreat: false,
        type: 'phishing',
        description: 'PhishTank rate limit exceeded - check skipped',
        source: 'PhishTank',
        error: 'Rate limited',
        rateLimited: true
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PhishTank API error:', response.status, errorText);

      // Don't treat API errors as threats
      return {
        isThreat: false,
        type: 'phishing',
        description: 'PhishTank API temporarily unavailable',
        source: 'PhishTank',
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.log('PhishTank: Non-JSON response received');
      return {
        isThreat: false,
        type: 'phishing',
        description: 'PhishTank returned unexpected response format',
        source: 'PhishTank',
        error: 'Non-JSON response'
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      console.error('PhishTank JSON parse error:', jsonError.message);
      return {
        isThreat: false,
        type: 'phishing',
        description: 'PhishTank response parsing error',
        source: 'PhishTank',
        error: 'JSON parse error'
      };
    }

    // Check if URL is in PhishTank database
    if (data.results && data.results.in_database) {
      const isPhishing = data.results.valid === 'yes';

      return {
        isThreat: isPhishing,
        type: 'phishing',
        description: isPhishing
          ? 'Confirmed phishing site in PhishTank database'
          : 'Site found in PhishTank but not confirmed as phishing',
        source: 'PhishTank',
        verified: data.results.verified === 'yes',
        phishId: data.results.phish_id,
        submissionTime: data.results.submission_time
      };
    }

    return {
      isThreat: false,
      type: 'phishing',
      description: 'Site not found in PhishTank database',
      source: 'PhishTank'
    };

  } catch (error) {
    console.error('Error checking PhishTank:', error);
    return {
      isThreat: false,
      type: 'phishing',
      description: 'Error checking PhishTank database',
      source: 'PhishTank',
      error: error.message
    };
  }
}

// Check for threats using URLScan.io API
async function checkURLScan(url) {
  try {
    if (!apiKeys.urlScan) {
      console.log('URLScan.io API key not configured, skipping check');
      return { isThreat: false, source: 'URLScan.io', error: 'API key not configured' };
    }

    console.log('Submitting URL to URLScan.io:', url);

    // Validate URL format before submitting
    try {
      new URL(url);
    } catch (urlError) {
      return {
        isThreat: false,
        source: 'URLScan.io',
        error: 'Invalid URL format',
        description: 'URL format is not valid for scanning'
      };
    }

    // Submit URL for scanning with proper headers and error handling
    const submitResponse = await fetch(API_CONFIG.URLSCAN.BASE_URL, {
      method: 'POST',
      headers: {
        'API-Key': apiKeys.urlScan,
        'Content-Type': 'application/json',
        'User-Agent': 'ThreatDetectorExtension/1.0'
      },
      body: JSON.stringify({
        url: url,
        visibility: 'public',
        tags: ['threat-detector-extension']
      })
    });

    // Handle specific HTTP status codes
    if (submitResponse.status === 400) {
      const errorText = await submitResponse.text();
      console.error('URLScan.io: Bad Request (400):', errorText);

      // Try to parse error details
      let errorDetails = 'Invalid request format';
      try {
        const errorData = JSON.parse(errorText);
        errorDetails = errorData.message || errorData.description || errorDetails;
      } catch (e) {
        // Use default error message if parsing fails
      }

      return {
        isThreat: false,
        source: 'URLScan.io',
        error: 'Bad Request',
        description: `URLScan.io rejected the request: ${errorDetails}`,
        httpStatus: 400
      };
    }

    if (submitResponse.status === 429) {
      console.log('URLScan.io: Rate limited');
      return {
        isThreat: false,
        source: 'URLScan.io',
        error: 'Rate limited',
        description: 'URLScan.io rate limit exceeded - try again later',
        rateLimited: true
      };
    }

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('URLScan.io API error:', submitResponse.status, errorText);

      return {
        isThreat: false,
        source: 'URLScan.io',
        error: `HTTP ${submitResponse.status}`,
        description: 'URLScan.io API temporarily unavailable',
        httpStatus: submitResponse.status
      };
    }

    // Parse successful response
    const contentType = submitResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await submitResponse.text();
      console.log('URLScan.io: Non-JSON response received');
      return {
        isThreat: false,
        source: 'URLScan.io',
        error: 'Non-JSON response',
        description: 'URLScan.io returned unexpected response format'
      };
    }

    let submitData;
    try {
      submitData = await submitResponse.json();
    } catch (jsonError) {
      const responseText = await submitResponse.text();
      console.error('URLScan.io JSON parse error:', jsonError.message);
      return {
        isThreat: false,
        source: 'URLScan.io',
        error: 'JSON parse error',
        description: 'Could not parse URLScan.io response'
      };
    }

    const scanId = submitData.uuid;
    const resultUrl = submitData.result;

    console.log(`URLScan.io scan initiated for ${url}, scan ID: ${scanId}`);

    // For real-time scanning, return immediately with scan ID
    return {
      isThreat: false,
      source: 'URLScan.io',
      description: 'Scan submitted successfully, results will be available shortly',
      scanId: scanId,
      resultUrl: resultUrl,
      scanInProgress: true
    };

  } catch (error) {
    console.error('Error checking URLScan.io:', error);
    return {
      isThreat: false,
      source: 'URLScan.io',
      error: error.message,
      description: 'URLScan.io check failed due to network or API error'
    };
  }
}

// Enhanced threat warning with detailed information
async function showThreatWarning(tabId, threatType, description, threatDetails = null) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'showThreatWarning',
      threatType: threatType,
      description: description,
      threatDetails: threatDetails
    });
  } catch (error) {
    console.error('Error showing threat warning:', error);
  }
}

// Helper function to determine threat severity
function determineThreatSeverity(threats) {
  if (!threats || threats.length === 0) return 'Low';

  const severityLevels = {
    'malware': 'Critical',
    'phishing': 'High',
    'social_engineering': 'High',
    'suspicious': 'Medium',
    'blacklist': 'High'
  };

  let maxSeverity = 'Low';
  const severityOrder = ['Low', 'Medium', 'High', 'Critical'];

  threats.forEach(threat => {
    const threatSeverity = severityLevels[threat.type?.toLowerCase()] || 'Medium';
    if (severityOrder.indexOf(threatSeverity) > severityOrder.indexOf(maxSeverity)) {
      maxSeverity = threatSeverity;
    }
  });

  return maxSeverity;
}

// Helper function to calculate threat confidence
function calculateThreatConfidence(threats) {
  if (!threats || threats.length === 0) return 0;

  const sourceWeights = {
    'Google Safe Browsing': 0.9,
    'VirusTotal': 0.85,
    'PhishTank': 0.8,
    'URLScan.io': 0.75
  };

  let totalWeight = 0;
  let weightedSum = 0;

  threats.forEach(threat => {
    const weight = sourceWeights[threat.source] || 0.5;
    totalWeight += weight;
    weightedSum += weight;
  });

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 50;
}

// Utility functions
async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || {};
}

async function isURLWhitelisted(url) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const whitelist = result[STORAGE_KEYS.WHITELIST] || [];
  return whitelist.some(whitelistedUrl => url.includes(whitelistedUrl));
}

async function isURLBlacklisted(url) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKLIST);
  const blacklist = result[STORAGE_KEYS.BLACKLIST] || [];
  return blacklist.some(blacklistedUrl => url.includes(blacklistedUrl));
}

async function logThreat(url, threats) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.THREAT_LOG);
  const threatLog = result[STORAGE_KEYS.THREAT_LOG] || [];

  threatLog.push({
    url: url,
    threats: threats,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 entries
  if (threatLog.length > 100) {
    threatLog.splice(0, threatLog.length - 100);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.THREAT_LOG]: threatLog });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Background script received message:', request);

  switch (request.action) {
    case 'ping':
      // Service worker health check
      sendResponse({ success: true, timestamp: Date.now() });
      return true;
    case 'getThreatLog':
      chrome.storage.local.get(STORAGE_KEYS.THREAT_LOG).then(result => {
        const threatLog = result[STORAGE_KEYS.THREAT_LOG] || [];
        console.log('Sending threat log:', threatLog);
        sendResponse(threatLog);
      }).catch(error => {
        console.error('Error getting threat log:', error);
        sendResponse([]);
      });
      return true;

    case 'getSettings':
      getSettings().then(settings => {
        console.log('Sending settings:', settings);
        sendResponse(settings);
      }).catch(error => {
        console.error('Error getting settings:', error);
        sendResponse({
          phishingDetection: true,
          malwareDetection: true,
          anomalyDetection: false,
          realTimeScanning: true
        });
      });
      return true;

    case 'updateSettings':
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: request.settings }).then(() => {
        console.log('Settings updated successfully');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error updating settings:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'manualScan':
      // Handle manual scan request from popup
      if (request.url && request.tabId) {
        performOptimizedScan(request.url, request.tabId, 'manual').then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('Error during manual scan:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'Missing URL or tabId' });
      }
      return true;

    case 'getScanResults':
      // Handle scan results request
      if (request.url) {
        const cacheKey = request.url;
        const cachedResult = scanCache.get(cacheKey);
        const now = Date.now();
        const cacheAge = cachedResult ? now - cachedResult.timestamp : Infinity;

        if (cachedResult && cacheAge < CACHE_DURATION) {
          // Update cache access tracking
          cachedResult.lastAccessed = now;
          cachedResult.accessCount = (cachedResult.accessCount || 0) + 1;
          scanCache.set(cacheKey, cachedResult);

          // Prepare comprehensive scan results for popup
          const scanResults = cachedResult.results || {
            url: request.url,
            timestamp: new Date(cachedResult.timestamp).toISOString(),
            threats: cachedResult.threats || [],
            scanDuration: cachedResult.scanDuration || 0,
            apisUsed: 'Multiple APIs',
            cached: true,
            cacheAge: Math.round(cacheAge / 1000)
          };

          sendResponse({
            success: true,
            results: scanResults,
            cached: true
          });
        } else {
          sendResponse({
            success: false,
            error: cachedResult ? 'Cached results expired' : 'No recent scan results available'
          });
        }
      } else {
        sendResponse({ success: false, error: 'Missing URL' });
      }
      return true;

    case 'showScanResultsPanel':
      // Handle request to show scan results panel
      if (request.tabId) {
        chrome.tabs.sendMessage(request.tabId, {
          action: 'showScanResultsPanel',
          results: request.results
        }).then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          console.error('Error showing scan results panel:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'Missing tabId' });
      }
      return true;

    case 'clearCache':
      // Handle cache clearing request
      try {
        scanCache.clear();
        lastScanTimes.clear();
        console.log('🗑️ Cache cleared successfully');
        sendResponse({ success: true, message: 'Cache cleared' });
      } catch (error) {
        console.error('Error clearing cache:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'getScanHistory':
      // Handle scan history request
      getScanHistory(request.options || {}).then(result => {
        sendResponse({ success: true, ...result });
      }).catch(error => {
        console.error('Error getting scan history:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'logBlockedPopup':
      // Handle blocked popup logging
      try {
        console.log(`🚫 Popup blocked: ${request.url} from ${request.currentUrl}`);

        // Extract domain from URL for statistics
        let domain = 'unknown';
        try {
          domain = new URL(request.currentUrl).hostname;
        } catch (e) {
          domain = request.currentUrl;
        }

        // Increment blocking statistics
        await incrementBlockingStatistic('popup', {
          url: request.currentUrl,
          blockedUrl: request.url,
          domain: domain,
          threats: request.threats || []
        });

        // Add to threat log
        const blockedPopupThreat = {
          url: request.currentUrl,
          type: 'popup_blocked',
          description: `Popup blocked: ${request.url}`,
          timestamp: new Date().toISOString(),
          severity: 'medium',
          blocked: true
        };

        logThreat(request.currentUrl, [blockedPopupThreat]).catch(error => {
          console.error('Error logging blocked popup:', error);
        });

        sendResponse({ success: true, logged: true });
      } catch (error) {
        console.error('Error handling blocked popup log:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'getBlockingStatistics':
      // Handle blocking statistics request
      try {
        const result = await chrome.storage.local.get(['blockingStatistics']);
        const stats = result.blockingStatistics || {
          popupsBlocked: 0,
          adsBlocked: 0,
          sessionPopupsBlocked: 0,
          sessionAdsBlocked: 0,
          lastSessionStart: Date.now(),
          blockedPopupEvents: [],
          blockedAdEvents: []
        };
        sendResponse({ success: true, statistics: stats });
      } catch (error) {
        console.error('Error getting blocking statistics:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'logBlockedAd':
      // Handle blocked advertisement logging
      try {
        console.log(`🚫 Ad blocked: ${request.url} from ${request.currentUrl}`);

        // Extract domain from URL for statistics
        let domain = 'unknown';
        try {
          domain = new URL(request.currentUrl).hostname;
        } catch (e) {
          domain = request.currentUrl;
        }

        // Increment blocking statistics
        await incrementBlockingStatistic('ad', {
          url: request.currentUrl,
          blockedUrl: request.url,
          domain: domain,
          adType: request.adType || 'unknown',
          selector: request.selector || 'unknown'
        });

        sendResponse({ success: true, logged: true });
      } catch (error) {
        console.error('Error handling blocked ad log:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'clearScanHistory':
      // Handle clear scan history request
      clearScanHistory().then(success => {
        sendResponse({ success });
      }).catch(error => {
        console.error('Error clearing scan history:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'deleteScanFromHistory':
      // Handle delete specific scan request
      if (request.scanId) {
        deleteScanFromHistory(request.scanId).then(success => {
          sendResponse({ success });
        }).catch(error => {
          console.error('Error deleting scan from history:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: 'Missing scanId' });
      }
      return true;

    case 'exportScanHistory':
      // Handle export scan history request
      exportScanHistory(request.format || 'json').then(data => {
        if (data) {
          sendResponse({ success: true, data });
        } else {
          sendResponse({ success: false, error: 'Export failed' });
        }
      }).catch(error => {
        console.error('Error exporting scan history:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'addToBlacklist':
      chrome.storage.local.get(STORAGE_KEYS.BLACKLIST).then(result => {
        const blacklist = result[STORAGE_KEYS.BLACKLIST] || [];
        if (!blacklist.includes(request.url)) {
          blacklist.push(request.url);
          chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: blacklist });
          console.log('Added to blacklist:', request.url);
        }
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error adding to blacklist:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'checkDownload':
      // Handle download check from content script
      if (request.url) {
        checkMalware(request.url).then(result => {
          sendResponse(result);
        }).catch(error => {
          console.error('Error checking download:', error);
          sendResponse({ isThreat: false, error: error.message });
        });
      } else {
        sendResponse({ isThreat: false, error: 'Missing URL' });
      }
      return true;

    case 'reloadAPIKeys':
      // Handle API key reload request
      loadAPIKeys().then(() => {
        console.log('API keys reloaded successfully');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error reloading API keys:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'getAPIKeys':
      // Handle API key status request
      sendResponse({
        success: true,
        apiKeys: {
          googleSafeBrowsing: !!apiKeys.googleSafeBrowsing,
          virusTotal: !!apiKeys.virusTotal,
          phishTank: !!apiKeys.phishTank,
          urlScan: !!apiKeys.urlScan
        }
      });
      return true;

    case 'updateAPIKeys':
      // Handle API key update request
      console.log('🔑 Updating API keys in background script...');
      console.log('📊 Received API keys:', {
        googleSafeBrowsing: request.apiKeys.googleSafeBrowsing ? 'Provided' : 'Empty',
        virusTotal: request.apiKeys.virusTotal ? 'Provided' : 'Empty',
        phishTank: request.apiKeys.phishTank ? 'Provided' : 'Empty',
        urlScan: request.apiKeys.urlScan ? 'Provided' : 'Empty'
      });

      chrome.storage.local.get(['apiKeys']).then(result => {
        const existingKeys = result.apiKeys || {};
        console.log('📊 Existing API keys in storage:', {
          googleSafeBrowsing: existingKeys.googleSafeBrowsing ? 'Configured' : 'Empty',
          virusTotal: existingKeys.virusTotal ? 'Configured' : 'Empty',
          phishTank: existingKeys.phishTank ? 'Configured' : 'Empty',
          urlScan: existingKeys.urlScan ? 'Configured' : 'Empty'
        });

        // Merge with existing keys, ensuring we maintain the proper structure
        const updatedKeys = {
          googleSafeBrowsing: request.apiKeys.googleSafeBrowsing || existingKeys.googleSafeBrowsing || '',
          virusTotal: request.apiKeys.virusTotal || existingKeys.virusTotal || '',
          phishTank: request.apiKeys.phishTank || existingKeys.phishTank || '',
          urlScan: request.apiKeys.urlScan || existingKeys.urlScan || ''
        };

        console.log('💾 Saving updated API keys to storage:', {
          googleSafeBrowsing: updatedKeys.googleSafeBrowsing ? 'Will be saved' : 'Empty',
          virusTotal: updatedKeys.virusTotal ? 'Will be saved' : 'Empty',
          phishTank: updatedKeys.phishTank ? 'Will be saved' : 'Empty',
          urlScan: updatedKeys.urlScan ? 'Will be saved' : 'Empty'
        });

        return chrome.storage.local.set({ apiKeys: updatedKeys });
      }).then(() => {
        console.log('✅ API keys saved to storage successfully');
        return loadAPIKeys(); // Reload keys into memory
      }).then(() => {
        console.log('✅ API keys loaded into memory successfully');

        // Verify the save by reading back from storage
        return chrome.storage.local.get(['apiKeys']);
      }).then(verifyResult => {
        console.log('🔍 Verification - API keys in storage after save:', {
          googleSafeBrowsing: verifyResult.apiKeys?.googleSafeBrowsing ? 'Confirmed saved' : 'Not saved',
          virusTotal: verifyResult.apiKeys?.virusTotal ? 'Confirmed saved' : 'Not saved',
          phishTank: verifyResult.apiKeys?.phishTank ? 'Confirmed saved' : 'Not saved',
          urlScan: verifyResult.apiKeys?.urlScan ? 'Confirmed saved' : 'Not saved'
        });

        sendResponse({ success: true, savedKeys: verifyResult.apiKeys });
      }).catch(error => {
        console.error('❌ Error updating API keys:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'getWhitelist':
      chrome.storage.local.get(STORAGE_KEYS.WHITELIST).then(result => {
        const whitelist = result[STORAGE_KEYS.WHITELIST] || [];
        sendResponse({ success: true, whitelist });
      }).catch(error => {
        console.error('Error getting whitelist:', error);
        sendResponse({ success: false, error: error.message, whitelist: [] });
      });
      return true;

    case 'updateWhitelist':
      chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: request.whitelist }).then(() => {
        console.log('Whitelist updated successfully');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error updating whitelist:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'addToWhitelist':
      chrome.storage.local.get(STORAGE_KEYS.WHITELIST).then(result => {
        const whitelist = result[STORAGE_KEYS.WHITELIST] || [];
        if (!whitelist.includes(request.url)) {
          whitelist.push(request.url);
          return chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: whitelist });
        }
        return Promise.resolve();
      }).then(() => {
        console.log('Domain added to whitelist:', request.url);
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error adding to whitelist:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'getBlacklist':
      chrome.storage.local.get(STORAGE_KEYS.BLACKLIST).then(result => {
        const blacklist = result[STORAGE_KEYS.BLACKLIST] || [];
        sendResponse({ success: true, blacklist });
      }).catch(error => {
        console.error('Error getting blacklist:', error);
        sendResponse({ success: false, error: error.message, blacklist: [] });
      });
      return true;

    case 'updateBlacklist':
      chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: request.blacklist }).then(() => {
        console.log('Blacklist updated successfully');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error updating blacklist:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    // Enhanced content blocking message handlers
    case 'logBlockedContent':
      // Handle universal blocker statistics
      try {
        console.log(`🚫 Universal blocker: ${request.type} blocked - ${request.url}`);

        // Update universal blocking statistics
        universalBlockingStats[request.type] = (universalBlockingStats[request.type] || 0) + 1;
        universalBlockingStats.totalBlocked = Object.values(universalBlockingStats)
          .filter(val => typeof val === 'number')
          .reduce((a, b) => a + b, 0);

        // Save updated stats to storage
        await saveUniversalBlockingStats();

        // Log to storage for persistence
        await logBlockedContentAction(request);

        // Update blocking counters
        await updateBlockingCounters(request.type);

        sendResponse({ success: true, stats: universalBlockingStats });
      } catch (error) {
        console.error('Error logging blocked content:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'getUniversalBlockingStats':
      // Get universal blocker statistics
      try {
        const combinedStats = {
          ...universalBlockingStats,
          isEnabled: true,
          lastUpdated: Date.now()
        };
        sendResponse({ success: true, stats: combinedStats });
      } catch (error) {
        console.error('Error getting universal blocking stats:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'reportBlockingStatus':
      updateBlockingStatistics(request).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error updating blocking statistics:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'getBlockingStatistics':
      getBlockingStatistics().then(stats => {
        sendResponse({ success: true, statistics: stats });
      }).catch(error => {
        console.error('Error getting blocking statistics:', error);
        sendResponse({ success: false, error: error.message, statistics: null });
      });
      return true;

    case 'temporaryWhitelist':
      addTemporaryWhitelist(request.url, request.duration || 3600000).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error adding temporary whitelist:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'getSitesScannedCount':
      chrome.storage.local.get('sitesScannedCount').then(result => {
        sendResponse({ success: true, count: result.sitesScannedCount || 0 });
      }).catch(error => {
        console.error('Error getting sites scanned count:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'incrementSitesScanned':
      chrome.storage.local.get('sitesScannedCount').then(result => {
        const newCount = (result.sitesScannedCount || 0) + 1;
        return chrome.storage.local.set({ sitesScannedCount: newCount });
      }).then(() => {
        return chrome.storage.local.get('sitesScannedCount');
      }).then(result => {
        sendResponse({ success: true, count: result.sitesScannedCount });
      }).catch(error => {
        console.error('Error incrementing sites scanned count:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    case 'generateTestScanHistory':
      // Generate test scan history data for debugging
      generateTestScanHistory().then(() => {
        sendResponse({ success: true, message: 'Test scan history generated' });
      }).catch(error => {
        console.error('Error generating test scan history:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    default:
      console.warn('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

// Enhanced content blocking support functions
async function logBlockedContentAction(request) {
  try {
    const contentLog = {
      timestamp: Date.now(),
      type: request.type,
      url: request.url,
      currentUrl: request.currentUrl,
      threats: request.threats || []
    };

    // Store in content blocking logs
    const result = await chrome.storage.local.get('contentBlockingLogs');
    const logs = result.contentBlockingLogs || [];

    logs.push(contentLog);

    // Keep only last 200 content blocking logs
    if (logs.length > 200) {
      logs.splice(0, logs.length - 200);
    }

    await chrome.storage.local.set({ contentBlockingLogs: logs });

    // Update blocking statistics
    await updateBlockingCounters(request.type);

    console.log(`📊 Logged blocked ${request.type}:`, request.url);
  } catch (error) {
    console.error('Error logging blocked content action:', error);
  }
}

async function updateBlockingStatistics(request) {
  try {
    const result = await chrome.storage.local.get('blockingStatistics');
    const stats = result.blockingStatistics || {
      totalBlocked: 0,
      ads: 0,
      popups: 0,
      redirects: 0,
      downloads: 0,
      forms: 0,
      lastUpdated: Date.now()
    };

    // Update statistics based on blocked count
    if (request.blockedCount) {
      stats.ads += request.blockedCount.ads || 0;
      stats.popups += request.blockedCount.popups || 0;
      stats.redirects += request.blockedCount.redirects || 0;
      stats.downloads += request.blockedCount.downloads || 0;
      stats.totalBlocked = stats.ads + stats.popups + stats.redirects + stats.downloads + stats.forms;
    }

    stats.lastUpdated = Date.now();

    await chrome.storage.local.set({ blockingStatistics: stats });
    console.log('📈 Updated blocking statistics:', stats);
  } catch (error) {
    console.error('Error updating blocking statistics:', error);
  }
}

async function updateBlockingCounters(type) {
  try {
    const result = await chrome.storage.local.get('blockingStatistics');
    const stats = result.blockingStatistics || {
      totalBlocked: 0,
      ads: 0,
      popups: 0,
      redirects: 0,
      downloads: 0,
      forms: 0,
      lastUpdated: Date.now()
    };

    if (stats[type] !== undefined) {
      stats[type]++;
      stats.totalBlocked++;
      stats.lastUpdated = Date.now();

      await chrome.storage.local.set({ blockingStatistics: stats });
    }
  } catch (error) {
    console.error('Error updating blocking counters:', error);
  }
}

async function getBlockingStatistics() {
  try {
    const result = await chrome.storage.local.get(['blockingStatistics', 'contentBlockingLogs', 'blockingLogs']);

    const stats = result.blockingStatistics || {
      totalBlocked: 0,
      ads: 0,
      popups: 0,
      redirects: 0,
      downloads: 0,
      forms: 0,
      lastUpdated: Date.now()
    };

    const contentLogs = result.contentBlockingLogs || [];
    const blockingLogs = result.blockingLogs || [];

    return {
      statistics: stats,
      recentContentBlocks: contentLogs.slice(-10), // Last 10 blocked items
      recentBlockingActions: blockingLogs.slice(-5), // Last 5 blocking actions
      totalContentBlocks: contentLogs.length,
      totalBlockingActions: blockingLogs.length
    };
  } catch (error) {
    console.error('Error getting blocking statistics:', error);
    throw error;
  }
}

// Temporary whitelist for user overrides
const temporaryWhitelist = new Map();

async function addTemporaryWhitelist(url, duration = 3600000) {
  try {
    const domain = new URL(url).hostname;
    const expiryTime = Date.now() + duration;

    temporaryWhitelist.set(domain, expiryTime);

    console.log(`⏰ Added temporary whitelist for ${domain} (expires in ${duration/1000}s)`);

    // Clean up expired entries
    setTimeout(() => {
      if (temporaryWhitelist.has(domain) && temporaryWhitelist.get(domain) <= Date.now()) {
        temporaryWhitelist.delete(domain);
        console.log(`🧹 Removed expired temporary whitelist for ${domain}`);
      }
    }, duration);

  } catch (error) {
    console.error('Error adding temporary whitelist:', error);
    throw error;
  }
}

function isTemporarilyWhitelisted(url) {
  try {
    const domain = new URL(url).hostname;
    const expiryTime = temporaryWhitelist.get(domain);

    if (expiryTime && expiryTime > Date.now()) {
      return true;
    } else if (expiryTime) {
      // Clean up expired entry
      temporaryWhitelist.delete(domain);
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Initialize extension on service worker startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🔄 AI-Powered Threat Detector service worker starting up');
  try {
    await loadUniversalBlockingStats();
    console.log('✅ Universal blocking stats loaded on startup');
  } catch (error) {
    console.error('❌ Error loading stats on startup:', error);
  }
});

// Initialize extension
console.log('AI-Powered Threat Detector background script loaded with enhanced content blocking');

// Load stats immediately when script loads
loadUniversalBlockingStats().catch(error => {
  console.error('Error loading universal blocking stats on script load:', error);
});
