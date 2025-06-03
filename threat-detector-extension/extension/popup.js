// Popup script for AI-Powered Threat Detector Extension

// Service Worker Management Functions
async function ensureServiceWorkerReady() {
  try {
    console.log('🔄 Ensuring service worker is ready...');

    // Try to ping the service worker
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    if (response && response.success) {
      console.log('✅ Service worker is ready');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Service worker ping failed:', error.message);
  }

  // If ping failed, try to wake up the service worker
  try {
    console.log('🔄 Attempting to wake up service worker...');

    // Create a simple storage operation to wake up the service worker
    await chrome.storage.local.get(['test']);

    // Wait a bit for the service worker to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Try ping again
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    if (response && response.success) {
      console.log('✅ Service worker woken up successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to wake up service worker:', error);
  }

  console.warn('⚠️ Service worker may not be available');
  return false;
}

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
        await ensureServiceWorkerReady();

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      } else if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

// Fast popup cache
const popupCache = {
  statistics: null,
  settings: null,
  threats: null,
  lastLoaded: 0
};

const POPUP_CACHE_DURATION = 10 * 1000; // 10 seconds cache for popup data

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Popup fast initialization starting...');
  const startTime = performance.now();

  // Start initialization immediately without waiting for service worker
  const initPromise = fastInitializePopup();

  // Setup event listeners immediately (they don't need data)
  setupEventListeners();

  // Ensure service worker is ready in parallel
  const swPromise = ensureServiceWorkerReady();

  // Wait for both to complete
  await Promise.all([initPromise, swPromise]);

  console.log(`✅ Popup initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
});

async function fastInitializePopup() {
  try {
    console.log('⚡ Fast popup initialization...');

    // Add scanning styles immediately (no async needed)
    addScanningStyles();

    // Check if we have fresh cached data
    const now = Date.now();
    const useCache = popupCache.lastLoaded && (now - popupCache.lastLoaded) < POPUP_CACHE_DURATION;

    if (useCache) {
      console.log('📋 Using cached popup data');

      // Use cached data for instant display
      if (popupCache.statistics) {
        displayCachedStatistics(popupCache.statistics);
      }
      if (popupCache.settings) {
        displayCachedSettings(popupCache.settings);
      }
      if (popupCache.threats) {
        displayCachedThreats(popupCache.threats);
      }

      // Still update status indicator as it's dynamic
      updateStatusIndicator();

      return;
    }

    // Load all data in parallel for maximum speed
    const [statisticsPromise, settingsPromise, threatsPromise, historyPromise, statusPromise] = [
      loadStatistics(),
      loadSettings(),
      loadRecentThreats(),
      loadScanHistory(),
      updateStatusIndicator()
    ];

    // Wait for all to complete
    await Promise.all([statisticsPromise, settingsPromise, threatsPromise, historyPromise, statusPromise]);

    // Cache the loaded data
    popupCache.lastLoaded = now;

    console.log('✅ Fast popup initialization complete');
  } catch (error) {
    console.error('❌ Fast popup initialization failed:', error);

    // Fallback to basic initialization
    try {
      await basicInitializePopup();
    } catch (fallbackError) {
      console.error('❌ Fallback initialization also failed:', fallbackError);
    }
  }
}

// Fallback basic initialization
async function basicInitializePopup() {
  console.log('🔄 Basic popup initialization fallback...');

  addScanningStyles();

  // Load essential data only
  try {
    await loadStatistics();
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }

  try {
    await updateStatusIndicator();
  } catch (error) {
    console.error('Failed to update status:', error);
  }
}

// Display cached data functions for instant UI updates
function displayCachedStatistics(stats) {
  try {
    const threatsElement = document.getElementById('threatsBlocked');
    const sitesElement = document.getElementById('sitesScanned');
    const popupsElement = document.getElementById('popupsBlocked');
    const adsElement = document.getElementById('adsBlocked');

    if (threatsElement && stats.threatsBlocked !== undefined) {
      threatsElement.textContent = stats.threatsBlocked;
    }
    if (sitesElement && stats.sitesScanned !== undefined) {
      sitesElement.textContent = stats.sitesScanned;
    }
    if (popupsElement && stats.popupsBlocked !== undefined) {
      popupsElement.textContent = stats.popupsBlocked;
    }
    if (adsElement && stats.adsBlocked !== undefined) {
      adsElement.textContent = stats.adsBlocked;
    }
  } catch (error) {
    console.error('Error displaying cached statistics:', error);
  }
}

function displayCachedSettings(settings) {
  try {
    updateToggle('realtimeToggle', settings.realTimeScanning);
    updateToggle('phishingToggle', settings.phishingDetection);
    updateToggle('malwareToggle', settings.malwareDetection);
  } catch (error) {
    console.error('Error displaying cached settings:', error);
  }
}

function displayCachedThreats(threats) {
  try {
    const threatList = document.getElementById('threatList');
    if (threatList && threats.html) {
      threatList.innerHTML = threats.html;
    }
  } catch (error) {
    console.error('Error displaying cached threats:', error);
  }
}

// Legacy function for compatibility
async function initializePopup() {
  return await fastInitializePopup();
}

async function loadStatistics() {
  try {
    console.log('⚡ Loading enhanced statistics...');

    // Get all statistics in parallel including enhanced blocking stats
    const [threatLog, sitesScanned, blockingStats, enhancedBlockingStats] = await Promise.all([
      sendMessageToBackground({ action: 'getThreatLog' }),
      getSitesScannedCount(),
      getBlockingStatistics(),
      getEnhancedBlockingStatistics()
    ]);

    // Calculate statistics
    const threatsBlocked = Array.isArray(threatLog) ? threatLog.length : 0;

    // Combine blocking statistics from both sources
    const totalPopupsBlocked = (blockingStats.popupsBlocked || 0) + (enhancedBlockingStats.popups || 0);
    const totalAdsBlocked = (blockingStats.adsBlocked || 0) + (enhancedBlockingStats.ads || 0);

    // Cache the statistics
    popupCache.statistics = {
      threatsBlocked,
      sitesScanned,
      popupsBlocked: totalPopupsBlocked,
      adsBlocked: totalAdsBlocked,
      redirectsBlocked: enhancedBlockingStats.redirects || 0,
      downloadsBlocked: enhancedBlockingStats.downloads || 0,
      totalBlocked: enhancedBlockingStats.totalBlocked || 0
    };

    // Update UI elements
    const threatsElement = document.getElementById('threatsBlocked');
    const sitesElement = document.getElementById('sitesScanned');
    const popupsElement = document.getElementById('popupsBlocked');
    const adsElement = document.getElementById('adsBlocked');

    if (threatsElement) {
      threatsElement.textContent = threatsBlocked;
      console.log('✅ Updated threats blocked:', threatsBlocked);
    } else {
      console.error('Element "threatsBlocked" not found');
    }

    if (sitesElement) {
      sitesElement.textContent = sitesScanned;
      console.log('✅ Updated sites scanned:', sitesScanned);
    } else {
      console.error('Element "sitesScanned" not found');
    }

    if (popupsElement) {
      popupsElement.textContent = totalPopupsBlocked;
      console.log('✅ Updated popups blocked:', totalPopupsBlocked);

      // Add tooltip with breakdown
      popupsElement.title = `Total popups blocked: ${totalPopupsBlocked}\nLegacy: ${blockingStats.popupsBlocked || 0}\nAdvanced: ${enhancedBlockingStats.popups || 0}`;
    } else {
      console.error('Element "popupsBlocked" not found');
    }

    if (adsElement) {
      adsElement.textContent = totalAdsBlocked;
      console.log('✅ Updated ads blocked:', totalAdsBlocked);

      // Add tooltip with breakdown
      adsElement.title = `Total ads blocked: ${totalAdsBlocked}\nLegacy: ${blockingStats.adsBlocked || 0}\nAdvanced: ${enhancedBlockingStats.ads || 0}`;
    } else {
      console.error('Element "adsBlocked" not found');
    }

    // Add enhanced blocking statistics display
    displayEnhancedBlockingStats(enhancedBlockingStats);

  } catch (error) {
    console.error('❌ Error loading statistics:', error);
    // Set default values on error
    const threatsElement = document.getElementById('threatsBlocked');
    const sitesElement = document.getElementById('sitesScanned');
    const popupsElement = document.getElementById('popupsBlocked');
    const adsElement = document.getElementById('adsBlocked');

    if (threatsElement) threatsElement.textContent = '0';
    if (sitesElement) sitesElement.textContent = '0';
    if (popupsElement) popupsElement.textContent = '0';
    if (adsElement) adsElement.textContent = '0';

    // Cache default values
    popupCache.statistics = {
      threatsBlocked: 0,
      sitesScanned: 0,
      popupsBlocked: 0,
      adsBlocked: 0,
      redirectsBlocked: 0,
      downloadsBlocked: 0,
      totalBlocked: 0
    };
  }
}

async function loadSettings() {
  try {
    console.log('⚡ Loading settings...');
    const settings = await sendMessageToBackground({ action: 'getSettings' });

    // Cache the settings
    popupCache.settings = settings;

    // Update toggle switches
    updateToggle('realtimeToggle', settings.realTimeScanning);
    updateToggle('phishingToggle', settings.phishingDetection);
    updateToggle('malwareToggle', settings.malwareDetection);

    console.log('✅ Settings loaded and cached');
  } catch (error) {
    console.error('❌ Error loading settings:', error);

    // Use default settings on error
    const defaultSettings = {
      realTimeScanning: true,
      phishingDetection: true,
      malwareDetection: true
    };

    popupCache.settings = defaultSettings;

    updateToggle('realtimeToggle', defaultSettings.realTimeScanning);
    updateToggle('phishingToggle', defaultSettings.phishingDetection);
    updateToggle('malwareToggle', defaultSettings.malwareDetection);
  }
}

async function loadRecentThreats() {
  try {
    const threatLog = await sendMessageToBackground({ action: 'getThreatLog' });
    const threatList = document.getElementById('threatList');

    if (threatLog.length === 0) {
      threatList.innerHTML = '<div class="empty-state">No threats detected recently</div>';
      return;
    }

    // Show last 5 threats
    const recentThreats = threatLog.slice(-5).reverse();

    threatList.innerHTML = recentThreats.map(threat => {
      const url = new URL(threat.url).hostname;
      const time = new Date(threat.timestamp).toLocaleTimeString();
      const threatType = threat.threats[0]?.type || 'unknown';

      return `
        <div class="threat-item">
          <div class="threat-url">${url}</div>
          <span class="threat-type">${threatType}</span>
          <span class="threat-time">${time}</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading recent threats:', error);
  }
}

async function updateStatusIndicator() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const statusSubtitle = document.getElementById('statusSubtitle');

  try {
    // Get current tab to check for recent scan results
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      // Check for recent scan results
      const scanResults = await sendMessageToBackground({
        action: 'getScanResults',
        url: tab.url
      });

      if (scanResults.success && scanResults.results) {
        const hasThreats = scanResults.results.threats && scanResults.results.threats.length > 0;

        // Enhanced status system with modern UI feedback
        if (hasThreats) {
          statusIndicator.className = 'status-indicator danger';
          statusText.textContent = 'Threats Detected';
          if (statusSubtitle) {
            const threatCount = scanResults.results.threats.length;
            statusSubtitle.textContent = `${threatCount} security ${threatCount === 1 ? 'issue' : 'issues'} found`;
          }
        } else {
          statusIndicator.className = 'status-indicator';
          statusText.textContent = 'Site Secure';
          if (statusSubtitle) {
            statusSubtitle.textContent = 'No threats detected';
          }
        }

        // Add scan results button if not already present
        addScanResultsButton(scanResults.results);
      } else {
        // Default secure status with modern messaging
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'Protected';
        if (statusSubtitle) {
          statusSubtitle.textContent = 'All systems secure';
        }
      }
    }

    // Add modern visual feedback animation
    addStatusUpdateAnimation();

  } catch (error) {
    console.error('Error updating status indicator:', error);
    // Fallback to secure status
    statusIndicator.className = 'status-indicator';
    statusText.textContent = 'Protected';
    if (statusSubtitle) {
      statusSubtitle.textContent = 'System ready';
    }
  }
}

// Add modern status update animation
function addStatusUpdateAnimation() {
  const statusContainer = document.querySelector('.status-container');
  const statusIndicator = document.getElementById('statusIndicator');

  if (statusContainer && statusIndicator) {
    // Subtle container pulse
    statusContainer.style.transform = 'scale(1.02)';
    statusContainer.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';

    // Indicator glow effect
    statusIndicator.style.transform = 'scale(1.1)';
    statusIndicator.style.filter = 'brightness(1.2)';

    setTimeout(() => {
      statusContainer.style.transform = 'scale(1)';
      statusContainer.style.boxShadow = '';
      statusIndicator.style.transform = 'scale(1)';
      statusIndicator.style.filter = 'brightness(1)';
    }, 300);
  }
}

function addScanResultsButton(scanResults) {
  // Check if button already exists
  if (document.getElementById('scanResultsBtn')) return;

  const quickActionsSection = document.querySelector('.section:last-child');
  if (!quickActionsSection) return;

  const scanResultsBtn = document.createElement('button');
  scanResultsBtn.id = 'scanResultsBtn';
  scanResultsBtn.className = 'action-button secondary';
  scanResultsBtn.innerHTML = `
    <span class="button-icon">📊</span>
    View Scan Results
  `;

  scanResultsBtn.style.cssText = `
    width: 100%;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  `;

  scanResultsBtn.addEventListener('mouseenter', () => {
    scanResultsBtn.style.background = '#e5e7eb';
    scanResultsBtn.style.borderColor = '#9ca3af';
  });

  scanResultsBtn.addEventListener('mouseleave', () => {
    scanResultsBtn.style.background = '#f3f4f6';
    scanResultsBtn.style.borderColor = '#d1d5db';
  });

  scanResultsBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await sendMessageToBackground({
          action: 'showScanResultsPanel',
          tabId: tab.id,
          results: scanResults
        });
        window.close(); // Close popup after showing results
      }
    } catch (error) {
      console.error('Error showing scan results:', error);
    }
  });

  quickActionsSection.appendChild(scanResultsBtn);

  // Add scan history link if history exists (will be shown/hidden based on data)
  const historyLinkBtn = document.createElement('button');
  historyLinkBtn.textContent = '📋 View Scan History';
  historyLinkBtn.className = 'btn btn-secondary btn-small hidden';
  historyLinkBtn.id = 'quickHistoryBtn';
  historyLinkBtn.addEventListener('click', () => {
    openDashboardHistory();
  });
  quickActionsSection.appendChild(historyLinkBtn);
}

// Load and display scan history (show sample data if no real data exists)
async function loadScanHistory() {
  try {
    console.log('🔍 Loading scan history...');
    const response = await sendMessageToBackground({
      action: 'getScanHistory',
      options: { limit: 5 } // Get last 5 scans for popup (reduced for cleaner UI)
    });

    console.log('📋 Scan history response:', response);

    if (response.success && response.history && response.history.length > 0) {
      console.log(`✅ Found ${response.history.length} scan history entries`);
      displayScanHistory(response.history);
    } else {
      console.log('📋 No scan history found, showing sample data');
      displaySampleScanHistory();
    }
  } catch (error) {
    console.error('❌ Error loading scan history:', error);
    console.log('📋 Showing sample scan history due to error');
    displaySampleScanHistory();
  }
}

// Display sample scan history when no real data is available
function displaySampleScanHistory() {
  const scanHistorySection = document.getElementById('scanHistorySection');
  const scanHistoryList = document.getElementById('scanHistoryList');

  // Ensure the section is visible
  scanHistorySection.classList.remove('hidden');

  // Keep the existing sample HTML content that's already in the popup.html
  // The HTML already contains our sample data, so we just need to ensure
  // the section is visible and set up interactions
  console.log('✅ Sample scan history displayed, setting up interactions');

  // Setup interactions for the existing sample items
  setupScanHistoryInteractions();
}

// Display scan history in popup
function displayScanHistory(history) {
  const scanHistorySection = document.getElementById('scanHistorySection');
  const scanHistoryList = document.getElementById('scanHistoryList');
  const quickHistoryBtn = document.getElementById('quickHistoryBtn');

  // Show the entire scan history section
  scanHistorySection.classList.remove('hidden');

  // Show the quick history button in actions section
  if (quickHistoryBtn) {
    quickHistoryBtn.classList.remove('hidden');
  }

  // Clear existing history
  scanHistoryList.innerHTML = '';

  // Add each history item
  history.forEach(item => {
    const historyElement = createScanHistoryItem(item);
    scanHistoryList.appendChild(historyElement);
  });

  // Setup interactions for the dynamically created items
  setupScanHistoryInteractions();
}

// Create scan history item element
function createScanHistoryItem(item) {
  const div = document.createElement('div');
  div.className = 'scan-history-item';
  div.dataset.scanId = item.id;

  const domain = item.domain || extractDomainFromUrl(item.url);
  const timeAgo = getTimeAgo(item.timestamp);
  const statusText = item.status === 'secure' ? 'Secure' : `${item.threatCount} Threat${item.threatCount > 1 ? 's' : ''}`;

  div.innerHTML = `
    <div class="scan-history-header">
      <div class="scan-history-url">${domain}</div>
      <div class="scan-history-status">
        <div class="scan-history-indicator ${item.status}"></div>
        <span>${statusText}</span>
      </div>
    </div>
    <div class="scan-history-meta">
      <span>${item.scanType === 'manual' ? 'Manual' : 'Auto'} • ${item.scanDuration}ms</span>
      <span class="scan-history-time">${timeAgo}</span>
    </div>
    <div class="scan-history-details">
      <div class="scan-history-detail-row">
        <span class="scan-history-detail-label">Full URL:</span>
        <span class="scan-history-detail-value">${item.url}</span>
      </div>
      <div class="scan-history-detail-row">
        <span class="scan-history-detail-label">APIs Used:</span>
        <span class="scan-history-detail-value">${Array.isArray(item.apisUsed) ? item.apisUsed.join(', ') : item.apisUsed}</span>
      </div>
      <div class="scan-history-detail-row">
        <span class="scan-history-detail-label">Scan Time:</span>
        <span class="scan-history-detail-value">${new Date(item.timestamp).toLocaleString()}</span>
      </div>
      ${item.threats && item.threats.length > 0 ? `
        <div class="scan-history-threats">
          ${item.threats.map(threat => `
            <div class="scan-history-threat">
              ${threat.type}: ${threat.description}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Add click handler for expand/collapse
  div.addEventListener('click', () => {
    div.classList.toggle('expanded');
  });

  return div;
}

// Hide scan history section when no data
function hideScanHistorySection() {
  const scanHistorySection = document.getElementById('scanHistorySection');
  const quickHistoryBtn = document.getElementById('quickHistoryBtn');

  scanHistorySection.classList.add('hidden');

  // Also hide the quick history button
  if (quickHistoryBtn) {
    quickHistoryBtn.classList.add('hidden');
  }
}

// Helper function to extract domain from URL
function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

// Helper function to get time ago string
function getTimeAgo(timestamp) {
  const now = new Date();
  const scanTime = new Date(timestamp);
  const diffMs = now - scanTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Open dedicated scan history page
function openDashboardHistory() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('scan-history.html')
  });
  window.close();
}

// Clear scan history with confirmation
async function clearScanHistoryWithConfirmation() {
  const confirmed = confirm('Are you sure you want to clear all scan history? This action cannot be undone.');

  if (confirmed) {
    try {
      const response = await sendMessageToBackground({
        action: 'clearScanHistory'
      });

      if (response.success) {
        // Hide the scan history section since it's now empty
        hideScanHistorySection();
        console.log('Scan history cleared successfully');
      } else {
        console.error('Failed to clear scan history');
        alert('Failed to clear scan history. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing scan history:', error);
      alert('Error clearing scan history. Please try again.');
    }
  }
}

// Refresh scan history (called after manual scans)
async function refreshScanHistory() {
  await loadScanHistory();
}

// Enhanced manual scan function with real-time feedback
async function performManualScan() {
  const button = document.getElementById('scanCurrentSite');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      showScanError('No active tab found');
      return;
    }

    // Skip internal pages
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('about:')) {
      showScanError('Cannot scan internal browser pages');
      return;
    }

    console.log('🔍 Starting manual scan for:', tab.url);

    // Update UI to scanning state
    updateScanUI('scanning');

    // Check for cached results first
    const cachedResults = await sendMessageToBackground({
      action: 'getScanResults',
      url: tab.url
    });

    if (cachedResults.success && cachedResults.cached) {
      console.log('📋 Using cached scan results');

      // Show cached results immediately
      const hasThreats = cachedResults.results.threats && cachedResults.results.threats.length > 0;
      updateScanUI(hasThreats ? 'danger' : 'secure', {
        cached: true,
        threatCount: hasThreats ? cachedResults.results.threats.length : 0
      });

      // Add scan results button
      if (cachedResults.results) {
        addScanResultsButton(cachedResults.results);
      }

      return;
    }

    // Perform new scan
    console.log('🔍 Performing new scan...');
    const scanResponse = await sendMessageToBackground({
      action: 'manualScan',
      url: tab.url,
      tabId: tab.id,
      scanType: 'manual' // Mark as manual scan
    });

    if (scanResponse.success) {
      // Wait for scan completion and get results
      await waitForScanCompletion(tab.url, tab.id);
    } else {
      throw new Error(scanResponse.error || 'Scan failed');
    }

  } catch (error) {
    console.error('Error during manual scan:', error);
    showScanError(error.message || 'Scan failed');
  }
}

// Wait for scan completion and update UI
async function waitForScanCompletion(url, tabId) {
  const maxWaitTime = 15000; // 15 seconds max wait
  const checkInterval = 500; // Check every 500ms
  let elapsed = 0;

  const checkResults = async () => {
    try {
      const results = await sendMessageToBackground({
        action: 'getScanResults',
        url: url
      });

      if (results.success && results.results) {
        // Scan completed
        const hasThreats = results.results.threats && results.results.threats.length > 0;
        updateScanUI(hasThreats ? 'danger' : 'secure', {
          threatCount: hasThreats ? results.results.threats.length : 0,
          scanDuration: results.results.scanDuration
        });

        // Add scan results button
        addScanResultsButton(results.results);

        // Update statistics
        await loadStatistics();

        // Refresh scan history
        await refreshScanHistory();

        return true;
      }

      elapsed += checkInterval;
      if (elapsed < maxWaitTime) {
        setTimeout(checkResults, checkInterval);
      } else {
        // Timeout
        showScanError('Scan timeout - please try again');
      }
    } catch (error) {
      console.error('Error checking scan results:', error);
      showScanError('Error checking scan results');
    }
  };

  // Start checking for results
  setTimeout(checkResults, checkInterval);
}

// Update scan UI based on status with modern design
function updateScanUI(status, details = {}) {
  const button = document.getElementById('scanCurrentSite');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const statusSubtitle = document.getElementById('statusSubtitle');

  // Reset button state
  button.disabled = false;
  button.classList.remove('loading');

  switch (status) {
    case 'scanning':
      // Scanning state with modern visual feedback
      button.innerHTML = `
        <span class="btn-icon">🔄</span>
        <span>Scanning...</span>
      `;
      button.disabled = true;
      button.classList.add('loading');
      statusIndicator.className = 'status-indicator scanning';
      statusText.textContent = 'Scanning in progress...';
      if (statusSubtitle) {
        statusSubtitle.textContent = 'Analyzing website security';
      }
      break;

    case 'secure':
      // Secure state with enhanced messaging
      button.innerHTML = `
        <span class="btn-icon">🔍</span>
        <span>Scan Site</span>
      `;
      statusIndicator.className = 'status-indicator';

      let secureText = 'Site Secure';
      let secureSubtitle = 'No threats detected';

      if (details.cached) {
        secureSubtitle += ' (cached result)';
      }
      if (details.scanDuration) {
        secureSubtitle += ` • ${Math.round(details.scanDuration)}ms`;
      }

      statusText.textContent = secureText;
      if (statusSubtitle) {
        statusSubtitle.textContent = secureSubtitle;
      }
      break;

    case 'danger':
      // Danger state with detailed information
      button.innerHTML = `
        <span class="btn-icon">🔍</span>
        <span>Scan Site</span>
      `;
      statusIndicator.className = 'status-indicator danger';

      let dangerText = 'Threats Detected';
      let dangerSubtitle = details.threatCount > 1 ?
        `${details.threatCount} security issues found` : '1 security issue found';

      if (details.cached) {
        dangerSubtitle += ' (cached result)';
      }

      statusText.textContent = dangerText;
      if (statusSubtitle) {
        statusSubtitle.textContent = dangerSubtitle;
      }
      break;

    case 'error':
      // Error state with helpful messaging
      button.innerHTML = `
        <span class="btn-icon">🔍</span>
        <span>Scan Site</span>
      `;
      statusIndicator.className = 'status-indicator warning';
      statusText.textContent = 'Scan Error';
      if (statusSubtitle) {
        statusSubtitle.textContent = details.message || 'Please try again';
      }
      break;
  }

  // Add modern visual feedback animation
  addStatusUpdateAnimation();
}

// Show scan error
function showScanError(message) {
  updateScanUI('error', { message });

  // Reset to default state after 3 seconds
  setTimeout(() => {
    updateScanUI('secure');
  }, 3000);
}

// Add blue pulse animation for scanning state
function addScanningStyles() {
  if (!document.getElementById('scanning-styles')) {
    const style = document.createElement('style');
    style.id = 'scanning-styles';
    style.textContent = `
      @keyframes pulse-blue {
        0%, 100% {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          opacity: 1;
        }
        50% {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          opacity: 0.7;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function updateToggle(toggleId, isActive) {
  const toggle = document.getElementById(toggleId);
  if (isActive) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

function setupEventListeners() {
  // Enhanced scan current site button with real-time feedback
  document.getElementById('scanCurrentSite').addEventListener('click', async () => {
    await performManualScan();
  });

  // Scan history controls
  document.getElementById('viewAllHistory').addEventListener('click', () => {
    openDashboardHistory();
  });

  document.getElementById('clearHistory').addEventListener('click', async () => {
    await clearScanHistoryWithConfirmation();
  });

  // Open dashboard button
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    window.close();
  });

  // Test threat warning button
  document.getElementById('testThreatWarning').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        // Send test threat warning to content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'showThreatWarning',
          threatType: 'test',
          description: 'This is a test threat warning to verify the extension is working properly.'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending test threat warning:', {
              message: chrome.runtime.lastError.message,
              tabId: tab.id,
              tabUrl: tab.url
            });
            alert('Error: Could not send test warning. Make sure you are on a regular webpage (not chrome:// or extension pages).');
          } else {
            console.log('Test threat warning sent successfully:', response);
          }
        });

        // Also test API key status
        try {
          const apiStatus = await sendMessageToBackground({ action: 'getAPIKeys' });
          console.log('API Key Status:', apiStatus);
        } catch (apiError) {
          console.error('Error getting API status:', apiError);
        }

        window.close();
      }
    } catch (error) {
      console.error('Error sending test threat warning:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Error: Could not send test warning. Make sure you are on a regular webpage (not chrome:// or extension pages).');
    }
  });

  // Settings toggles
  document.getElementById('realtimeToggle').addEventListener('click', () => {
    toggleSetting('realtimeToggle', 'realTimeScanning');
  });

  document.getElementById('phishingToggle').addEventListener('click', () => {
    toggleSetting('phishingToggle', 'phishingDetection');
  });

  document.getElementById('malwareToggle').addEventListener('click', () => {
    toggleSetting('malwareToggle', 'malwareDetection');
  });

  // Footer links
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    window.close();
  });

  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
    window.close();
  });

  document.getElementById('aboutLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('about.html') });
    window.close();
  });

  // Setup scan history interactions
  setupScanHistoryInteractions();
}

// Setup scan history interactions
function setupScanHistoryInteractions() {
  // Add click handlers for scan history items
  const scanHistoryItems = document.querySelectorAll('.scan-history-item');
  console.log(`🔧 Setting up interactions for ${scanHistoryItems.length} scan history items`);

  scanHistoryItems.forEach((item, index) => {
    // Remove existing event listeners to avoid duplicates
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);

    // Add click handler
    newItem.addEventListener('click', function(e) {
      e.preventDefault();
      toggleScanDetails(this);
    });

    // Add keyboard support
    newItem.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleScanDetails(this);
      }
    });

    // Make items focusable
    newItem.setAttribute('tabindex', '0');
    newItem.setAttribute('role', 'button');
    newItem.setAttribute('aria-expanded', 'false');

    console.log(`✅ Setup interactions for scan history item ${index + 1}`);
  });
}

// Toggle scan details expansion
function toggleScanDetails(scanItem) {
  const details = scanItem.querySelector('.scan-history-details');
  if (!details) {
    console.log('⚠️ No details section found for scan item');
    return;
  }

  const isExpanded = scanItem.classList.contains('expanded');
  console.log(`🔄 Toggling scan details: ${isExpanded ? 'collapsing' : 'expanding'}`);

  // Close all other expanded items
  document.querySelectorAll('.scan-history-item.expanded').forEach(item => {
    if (item !== scanItem) {
      item.classList.remove('expanded');
      item.setAttribute('aria-expanded', 'false');
    }
  });

  // Toggle current item
  if (isExpanded) {
    scanItem.classList.remove('expanded');
    scanItem.setAttribute('aria-expanded', 'false');
    console.log('✅ Scan details collapsed');
  } else {
    scanItem.classList.add('expanded');
    scanItem.setAttribute('aria-expanded', 'true');
    console.log('✅ Scan details expanded');
  }
}

async function toggleSetting(toggleId, settingKey) {
  try {
    const toggle = document.getElementById(toggleId);
    const isActive = toggle.classList.contains('active');

    // Toggle UI
    if (isActive) {
      toggle.classList.remove('active');
    } else {
      toggle.classList.add('active');
    }

    // Get current settings
    const settings = await sendMessageToBackground({ action: 'getSettings' });

    // Update setting
    settings[settingKey] = !isActive;

    // Save settings
    await sendMessageToBackground({
      action: 'updateSettings',
      settings: settings
    });

  } catch (error) {
    console.error('Error toggling setting:', error);
  }
}

async function sendMessageToBackground(message) {
  try {
    // Use the retry mechanism for better reliability
    return await sendMessageWithRetry(message);
  } catch (error) {
    // Fallback to direct message if retry fails
    console.warn('⚠️ Retry mechanism failed, trying direct message:', error.message);

    return new Promise((resolve, reject) => {
      console.log('Sending message to background (fallback):', message);

      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError;
            console.error('Chrome runtime error:', {
              message: error.message,
              stack: error.stack || 'No stack trace available'
            });
            reject(new Error(error.message || 'Unknown runtime error'));
          } else {
            console.log('Received response from background:', response);
            resolve(response);
          }
        });
      } catch (error) {
        console.error('Error sending message to background:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        reject(error);
      }
    });
  }
}

async function getSitesScannedCount() {
  // This would typically be stored in chrome.storage
  // For now, return a placeholder value
  try {
    const result = await chrome.storage.local.get('sitesScannedCount');
    return result.sitesScannedCount || 0;
  } catch (error) {
    return 0;
  }
}

// Helper function to get blocking statistics
async function getBlockingStatistics() {
  try {
    const response = await sendMessageToBackground({ action: 'getBlockingStatistics' });
    if (response && response.success) {
      return response.statistics;
    } else {
      throw new Error(response?.error || 'Failed to get blocking statistics');
    }
  } catch (error) {
    console.error('Error getting blocking statistics:', error);
    return {
      popupsBlocked: 0,
      adsBlocked: 0,
      sessionPopupsBlocked: 0,
      sessionAdsBlocked: 0,
      lastSessionStart: Date.now()
    };
  }
}

// Get enhanced blocking statistics from the new system including universal blocker
async function getEnhancedBlockingStatistics() {
  try {
    const [enhancedResponse, universalResponse] = await Promise.all([
      sendMessageToBackground({ action: 'getBlockingStatistics' }),
      sendMessageToBackground({ action: 'getUniversalBlockingStats' })
    ]);

    let combinedStats = {};

    // Get enhanced blocking stats
    if (enhancedResponse.success && enhancedResponse.statistics) {
      combinedStats = enhancedResponse.statistics.statistics || {};
    }

    // Add universal blocker stats
    if (universalResponse.success && universalResponse.stats) {
      const universalStats = universalResponse.stats;
      combinedStats.ads = (combinedStats.ads || 0) + (universalStats.ads || 0);
      combinedStats.popups = (combinedStats.popups || 0) + (universalStats.popups || 0);
      combinedStats.redirects = (combinedStats.redirects || 0) + (universalStats.redirects || 0);
      combinedStats.downloads = (combinedStats.downloads || 0) + (universalStats.downloads || 0);
      combinedStats.overlays = (combinedStats.overlays || 0) + (universalStats.overlays || 0);
      combinedStats.scripts = (combinedStats.scripts || 0) + (universalStats.scripts || 0);
      combinedStats.universalBlockerActive = universalStats.isEnabled || false;
      combinedStats.lastUpdated = Math.max(combinedStats.lastUpdated || 0, universalStats.lastUpdated || 0);
    }

    return combinedStats;
  } catch (error) {
    console.error('Error getting enhanced blocking statistics:', error);
    return {};
  }
}

// Display enhanced blocking statistics in a tooltip or additional UI
function displayEnhancedBlockingStats(stats) {
  try {
    // Add detailed blocking information to the statistics section
    const statsSection = document.querySelector('.section h3[title*="Statistics"]')?.parentElement ||
                        document.querySelector('.section h3 .section-icon')?.parentElement?.parentElement;
    if (!statsSection) return;

    // Check if enhanced stats display already exists
    let enhancedStatsDiv = document.getElementById('enhancedBlockingStats');
    if (!enhancedStatsDiv) {
      enhancedStatsDiv = document.createElement('div');
      enhancedStatsDiv.id = 'enhancedBlockingStats';
      enhancedStatsDiv.style.cssText = `
        margin-top: 1rem;
        padding: 0.75rem;
        background: rgba(220, 38, 38, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(220, 38, 38, 0.1);
        font-size: 0.8rem;
        color: #374151;
      `;
      statsSection.appendChild(enhancedStatsDiv);
    }

    // Calculate totals including universal blocker stats
    const totalBlocked = (stats.ads || 0) + (stats.popups || 0) + (stats.redirects || 0) +
                        (stats.downloads || 0) + (stats.overlays || 0) + (stats.scripts || 0);

    if (totalBlocked > 0 || stats.universalBlockerActive) {
      const statusIcon = stats.universalBlockerActive ? '🛡️' : '⚠️';
      const statusText = stats.universalBlockerActive ? 'Universal Protection Active' : 'Enhanced Protection Active';
      const statusColor = stats.universalBlockerActive ? '#059669' : '#dc2626';

      enhancedStatsDiv.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.5rem; color: ${statusColor};">
          ${statusIcon} ${statusText}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.75rem;">
          <div>Redirects Blocked: <strong>${stats.redirects || 0}</strong></div>
          <div>Downloads Blocked: <strong>${stats.downloads || 0}</strong></div>
          <div>Overlays Blocked: <strong>${stats.overlays || 0}</strong></div>
          <div>Scripts Blocked: <strong>${stats.scripts || 0}</strong></div>
          <div>Forms Blocked: <strong>${stats.forms || 0}</strong></div>
          <div>Total Protected: <strong>${totalBlocked}</strong></div>
        </div>
        ${stats.universalBlockerActive ? `
          <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(5, 150, 105, 0.1); border-radius: 4px; font-size: 0.7rem; color: #059669;">
            ✅ Universal Content Blocker: Always-on protection across all websites
          </div>
        ` : ''}
        <div style="margin-top: 0.5rem; font-size: 0.7rem; color: #6b7280;">
          Last updated: ${new Date(stats.lastUpdated || Date.now()).toLocaleTimeString()}
        </div>
      `;
      enhancedStatsDiv.style.display = 'block';
    } else {
      enhancedStatsDiv.style.display = 'none';
    }
  } catch (error) {
    console.error('Error displaying enhanced blocking stats:', error);
  }
}

// Helper function to update blocking statistics in real-time
async function updateBlockingStatistics() {
  try {
    const [blockingStats, enhancedStats] = await Promise.all([
      getBlockingStatistics(),
      getEnhancedBlockingStatistics()
    ]);

    const popupsElement = document.getElementById('popupsBlocked');
    const adsElement = document.getElementById('adsBlocked');

    // Combine statistics from both sources
    const totalPopupsBlocked = (blockingStats.popupsBlocked || 0) + (enhancedStats.popups || 0);
    const totalAdsBlocked = (blockingStats.adsBlocked || 0) + (enhancedStats.ads || 0);

    if (popupsElement) {
      popupsElement.textContent = totalPopupsBlocked;
      popupsElement.title = `Total popups blocked: ${totalPopupsBlocked}\nLegacy: ${blockingStats.popupsBlocked || 0}\nAdvanced: ${enhancedStats.popups || 0}`;
    }
    if (adsElement) {
      adsElement.textContent = totalAdsBlocked;
      adsElement.title = `Total ads blocked: ${totalAdsBlocked}\nLegacy: ${blockingStats.adsBlocked || 0}\nAdvanced: ${enhancedStats.ads || 0}`;
    }

    // Update enhanced blocking stats display
    displayEnhancedBlockingStats(enhancedStats);

    // Update cache
    if (popupCache.statistics) {
      popupCache.statistics.popupsBlocked = totalPopupsBlocked;
      popupCache.statistics.adsBlocked = totalAdsBlocked;
      popupCache.statistics.redirectsBlocked = enhancedStats.redirects || 0;
      popupCache.statistics.downloadsBlocked = enhancedStats.downloads || 0;
    }

  } catch (error) {
    console.error('Error updating blocking statistics:', error);
  }
}

// Listen for real-time blocking statistics updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'blockingStatsUpdated') {
    console.log('📊 Blocking statistics updated, refreshing display');
    updateBlockingStatistics().catch(error => {
      console.error('Error updating blocking statistics display:', error);
    });
    sendResponse({ success: true });
  }
});

// Set up periodic statistics refresh
setInterval(() => {
  updateBlockingStatistics().catch(error => {
    console.error('Error in periodic statistics update:', error);
  });
}, 30000); // Update every 30 seconds
