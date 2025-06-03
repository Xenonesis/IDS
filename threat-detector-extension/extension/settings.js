// Settings page JavaScript for Threat Detector Extension

let currentSettings = {
  realTimeScanning: true,
  phishingDetection: true,
  malwareDetection: true,
  anomalyDetection: false
};

let currentApiKeys = {
  googleSafeBrowsing: '',
  virusTotal: '',
  phishTank: '',
  urlScan: ''
};

let whitelist = [];
let blacklist = [];

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

// Fast settings cache
const settingsCache = {
  settings: null,
  apiKeys: null,
  whitelist: null,
  blacklist: null,
  lastLoaded: 0
};

const SETTINGS_CACHE_DURATION = 15 * 1000; // 15 seconds cache

// Initialize settings page with maximum speed
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Settings page fast initialization starting...');
  const startTime = performance.now();

  // Setup event listeners immediately (they don't need data)
  setupEventListeners();

  // Start all loading operations in parallel for maximum speed
  const [settingsPromise, apiKeysPromise, whitelistPromise, blacklistPromise, swPromise] = [
    fastLoadSettings(),
    fastLoadApiKeys(),
    fastLoadWhitelist(),
    fastLoadBlacklist(),
    ensureServiceWorkerReady()
  ];

  // Wait for all operations to complete
  await Promise.all([settingsPromise, apiKeysPromise, whitelistPromise, blacklistPromise, swPromise]);

  console.log(`✅ Settings page initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
});

// Fast loading functions with caching
async function fastLoadSettings() {
  const now = Date.now();

  // Use cache if available and fresh
  if (settingsCache.settings && settingsCache.lastLoaded &&
      (now - settingsCache.lastLoaded) < SETTINGS_CACHE_DURATION) {
    console.log('📋 Using cached settings');
    currentSettings = { ...settingsCache.settings };
    updateSettingsUI();
    return;
  }

  return await loadSettings();
}

async function fastLoadApiKeys() {
  const now = Date.now();

  // Use cache if available and fresh
  if (settingsCache.apiKeys && settingsCache.lastLoaded &&
      (now - settingsCache.lastLoaded) < SETTINGS_CACHE_DURATION) {
    console.log('📋 Using cached API keys');
    currentApiKeys = { ...settingsCache.apiKeys };
    updateApiKeysUI();
    return;
  }

  return await loadApiKeys();
}

async function fastLoadWhitelist() {
  const now = Date.now();

  // Use cache if available and fresh
  if (settingsCache.whitelist && settingsCache.lastLoaded &&
      (now - settingsCache.lastLoaded) < SETTINGS_CACHE_DURATION) {
    console.log('📋 Using cached whitelist');
    whitelist = [...settingsCache.whitelist];
    updateWhitelistUI();
    return;
  }

  return await loadWhitelist();
}

async function fastLoadBlacklist() {
  const now = Date.now();

  // Use cache if available and fresh
  if (settingsCache.blacklist && settingsCache.lastLoaded &&
      (now - settingsCache.lastLoaded) < SETTINGS_CACHE_DURATION) {
    console.log('📋 Using cached blacklist');
    blacklist = [...settingsCache.blacklist];
    updateBlacklistUI();
    return;
  }

  return await loadBlacklist();
}

// Load settings from Chrome storage
async function loadSettings() {
  try {
    console.log('⚡ Loading settings...');
    const response = await sendMessageWithRetry({ action: 'getSettings' });
    if (response) {
      currentSettings = { ...currentSettings, ...response };

      // Cache the settings
      settingsCache.settings = { ...currentSettings };
      settingsCache.lastLoaded = Date.now();

      updateSettingsUI();
      console.log('✅ Settings loaded and cached');
    }
  } catch (error) {
    console.error('❌ Error loading settings:', error);

    // Use defaults on error
    settingsCache.settings = { ...currentSettings };
    settingsCache.lastLoaded = Date.now();
    updateSettingsUI();
  }
}

// Load API keys from Chrome storage with service worker error handling
async function loadApiKeys() {
  try {
    console.log('🔄 Loading API keys from storage...');

    // First try to load directly from storage (more reliable)
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKeys = result.apiKeys || {};

    console.log('📊 Raw API keys from storage:', apiKeys);

    currentApiKeys = {
      googleSafeBrowsing: apiKeys.googleSafeBrowsing || '',
      virusTotal: apiKeys.virusTotal || '',
      phishTank: apiKeys.phishTank || '',
      urlScan: apiKeys.urlScan || ''
    };

    // Cache the API keys
    settingsCache.apiKeys = { ...currentApiKeys };
    if (!settingsCache.lastLoaded) {
      settingsCache.lastLoaded = Date.now();
    }

    console.log('✅ API keys loaded and cached:', {
      googleSafeBrowsing: currentApiKeys.googleSafeBrowsing ? 'Configured' : 'Empty',
      virusTotal: currentApiKeys.virusTotal ? 'Configured' : 'Empty',
      phishTank: currentApiKeys.phishTank ? 'Configured' : 'Empty',
      urlScan: currentApiKeys.urlScan ? 'Configured' : 'Empty'
    });

    updateApiKeysUI();
  } catch (error) {
    console.error('❌ Error loading API keys:', error);

    // Check if it's a service worker error
    if (error.message && error.message.includes('No SW')) {
      console.warn('⚠️ Service worker not available, attempting to wake it up...');
      await ensureServiceWorkerReady();

      // Retry loading after service worker is ready
      try {
        const result = await chrome.storage.local.get(['apiKeys']);
        const apiKeys = result.apiKeys || {};

        currentApiKeys = {
          googleSafeBrowsing: apiKeys.googleSafeBrowsing || '',
          virusTotal: apiKeys.virusTotal || '',
          phishTank: apiKeys.phishTank || '',
          urlScan: apiKeys.urlScan || ''
        };

        updateApiKeysUI();
        return;
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
      }
    }

    // Initialize with empty values on error
    currentApiKeys = {
      googleSafeBrowsing: '',
      virusTotal: '',
      phishTank: '',
      urlScan: ''
    };
    updateApiKeysUI();
  }
}

// Load whitelist from Chrome storage
async function loadWhitelist() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getWhitelist' });
    if (response && response.success) {
      whitelist = response.whitelist || [];
    } else {
      console.warn('Failed to load whitelist, using empty array');
      whitelist = [];
    }
    updateWhitelistUI();
  } catch (error) {
    console.error('Error loading whitelist:', error);
    whitelist = [];
    updateWhitelistUI();
  }
}

// Load blacklist from Chrome storage
async function loadBlacklist() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getBlacklist' });
    if (response && response.success) {
      blacklist = response.blacklist || [];
    } else {
      console.warn('Failed to load blacklist, using empty array');
      blacklist = [];
    }
    updateBlacklistUI();
  } catch (error) {
    console.error('Error loading blacklist:', error);
    blacklist = [];
    updateBlacklistUI();
  }
}

// Update settings UI elements
function updateSettingsUI() {
  updateToggle('realTimeToggle', currentSettings.realTimeScanning);
  updateToggle('phishingToggle', currentSettings.phishingDetection);
  updateToggle('malwareToggle', currentSettings.malwareDetection);
  updateToggle('anomalyToggle', currentSettings.anomalyDetection);
}

// Update API keys UI elements
function updateApiKeysUI() {
  document.getElementById('googleApiKey').value = currentApiKeys.googleSafeBrowsing;
  document.getElementById('virusTotalApiKey').value = currentApiKeys.virusTotal;
  document.getElementById('phishTankApiKey').value = currentApiKeys.phishTank;
  document.getElementById('urlScanApiKey').value = currentApiKeys.urlScan;

  // Update status indicators
  updateApiStatus('googleStatus', currentApiKeys.googleSafeBrowsing);
  updateApiStatus('virusTotalStatus', currentApiKeys.virusTotal);
  updateApiStatus('phishTankStatus', currentApiKeys.phishTank);
  updateApiStatus('urlScanStatus', currentApiKeys.urlScan);
}

// Update whitelist UI
function updateWhitelistUI() {
  const container = document.getElementById('whitelistContainer');
  container.innerHTML = '';

  if (whitelist.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; text-align: center; color: #9ca3af;">No whitelisted domains</div>';
    return;
  }

  whitelist.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';

    const span = document.createElement('span');
    span.textContent = domain;

    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = 'Remove';
    button.addEventListener('click', () => removeWhitelistDomain(index));

    item.appendChild(span);
    item.appendChild(button);
    container.appendChild(item);
  });
}

// Update blacklist UI
function updateBlacklistUI() {
  const container = document.getElementById('blacklistContainer');
  container.innerHTML = '';

  if (blacklist.length === 0) {
    container.innerHTML = '<div style="padding: 1rem; text-align: center; color: #9ca3af;">No blacklisted domains</div>';
    return;
  }

  blacklist.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';

    const span = document.createElement('span');
    span.textContent = domain;

    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = 'Remove';
    button.addEventListener('click', () => removeBlacklistDomain(index));

    item.appendChild(span);
    item.appendChild(button);
    container.appendChild(item);
  });
}

// Update toggle switch state
function updateToggle(toggleId, isActive) {
  const toggle = document.getElementById(toggleId);
  if (toggle) {
    if (isActive) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }
}

// Update API status indicator
function updateApiStatus(statusId, apiKey) {
  const status = document.getElementById(statusId);
  if (status) {
    if (apiKey && apiKey.trim() !== '') {
      status.textContent = 'Configured';
      status.className = 'api-status configured';
    } else {
      status.textContent = 'Not Configured';
      status.className = 'api-status not-configured';
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Toggle switches
  document.getElementById('realTimeToggle').addEventListener('click', () => {
    toggleSetting('realTimeScanning');
  });

  document.getElementById('phishingToggle').addEventListener('click', () => {
    toggleSetting('phishingDetection');
  });

  document.getElementById('malwareToggle').addEventListener('click', () => {
    toggleSetting('malwareDetection');
  });

  document.getElementById('anomalyToggle').addEventListener('click', () => {
    toggleSetting('anomalyDetection');
  });

  // API key inputs
  document.getElementById('googleApiKey').addEventListener('input', (e) => {
    currentApiKeys.googleSafeBrowsing = e.target.value;
    updateApiStatus('googleStatus', e.target.value);
  });

  document.getElementById('virusTotalApiKey').addEventListener('input', (e) => {
    currentApiKeys.virusTotal = e.target.value;
    updateApiStatus('virusTotalStatus', e.target.value);
  });

  document.getElementById('phishTankApiKey').addEventListener('input', (e) => {
    currentApiKeys.phishTank = e.target.value;
    updateApiStatus('phishTankStatus', e.target.value);
  });

  document.getElementById('urlScanApiKey').addEventListener('input', (e) => {
    currentApiKeys.urlScan = e.target.value;
    updateApiStatus('urlScanStatus', e.target.value);
  });

  // Enter key handlers for adding domains
  document.getElementById('newWhitelistDomain').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addWhitelistDomain();
    }
  });

  document.getElementById('newBlacklistDomain').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBlacklistDomain();
    }
  });

  // Back link
  document.getElementById('backLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
  });

  // Save button
  document.getElementById('saveButton').addEventListener('click', saveSettings);

  // Add whitelist button
  document.getElementById('addWhitelistBtn').addEventListener('click', addWhitelistDomain);

  // Add blacklist button
  document.getElementById('addBlacklistBtn').addEventListener('click', addBlacklistDomain);

  // Password toggle buttons
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.getAttribute('data-target');
      if (targetId) {
        togglePassword(targetId, button);
      }
    });
  });
}

// Toggle setting value
function toggleSetting(settingName) {
  currentSettings[settingName] = !currentSettings[settingName];
  updateSettingsUI();
}

// Toggle password visibility
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const eyeIcon = button.querySelector('.eye-icon');

  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.textContent = '🙈';
    button.setAttribute('data-visible', 'true');
    button.title = 'Hide API key';
  } else {
    input.type = 'password';
    eyeIcon.textContent = '👁️';
    button.setAttribute('data-visible', 'false');
    button.title = 'Show API key';
  }
}

// Add domain to whitelist
function addWhitelistDomain() {
  const input = document.getElementById('newWhitelistDomain');
  const domain = input.value.trim();

  if (domain && !whitelist.includes(domain)) {
    whitelist.push(domain);
    input.value = '';
    updateWhitelistUI();
  }
}

// Remove domain from whitelist
function removeWhitelistDomain(index) {
  whitelist.splice(index, 1);
  updateWhitelistUI();
}

// Add domain to blacklist
function addBlacklistDomain() {
  const input = document.getElementById('newBlacklistDomain');
  const domain = input.value.trim();

  if (domain && !blacklist.includes(domain)) {
    blacklist.push(domain);
    input.value = '';
    updateBlacklistUI();
  }
}

// Remove domain from blacklist
function removeBlacklistDomain(index) {
  blacklist.splice(index, 1);
  updateBlacklistUI();
}

// Save all settings
async function saveSettings() {
  const saveButton = document.getElementById('saveButton');
  const saveStatus = document.getElementById('saveStatus');

  try {
    console.log('💾 Starting settings save process...');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    saveStatus.style.display = 'none';

    // Get current form values for settings (using toggle states, not hidden checkboxes)
    const formSettings = {
      phishingDetection: currentSettings.phishingDetection,
      malwareDetection: currentSettings.malwareDetection,
      anomalyDetection: currentSettings.anomalyDetection,
      realTimeScanning: currentSettings.realTimeScanning
    };

    // Get current form values for API keys (using correct HTML IDs)
    const formApiKeys = {
      googleSafeBrowsing: document.getElementById('googleApiKey').value.trim(),
      virusTotal: document.getElementById('virusTotalApiKey').value.trim(),
      phishTank: document.getElementById('phishTankApiKey').value.trim(),
      urlScan: document.getElementById('urlScanApiKey').value.trim()
    };

    console.log('📊 Settings to save:', formSettings);
    console.log('🔑 API keys to save:', {
      googleSafeBrowsing: formApiKeys.googleSafeBrowsing ? 'Provided' : 'Empty',
      virusTotal: formApiKeys.virusTotal ? 'Provided' : 'Empty',
      phishTank: formApiKeys.phishTank ? 'Provided' : 'Empty',
      urlScan: formApiKeys.urlScan ? 'Provided' : 'Empty'
    });

    // Validate API keys
    const validationErrors = validateAPIKeys(formApiKeys);
    if (validationErrors.length > 0) {
      console.warn('⚠️ API key validation warnings:', validationErrors);
    }

    // Save settings with retry mechanism
    console.log('💾 Saving settings...');
    const settingsResponse = await sendMessageWithRetry({
      action: 'updateSettings',
      settings: formSettings
    });

    if (!settingsResponse || !settingsResponse.success) {
      throw new Error('Failed to save settings: ' + (settingsResponse?.error || 'Unknown error'));
    }
    console.log('✅ Settings saved successfully');

    // Save API keys with retry mechanism
    console.log('🔑 Saving API keys...');
    const apiKeysResponse = await sendMessageWithRetry({
      action: 'updateAPIKeys',
      apiKeys: formApiKeys
    });

    if (!apiKeysResponse || !apiKeysResponse.success) {
      throw new Error('Failed to save API keys: ' + (apiKeysResponse?.error || 'Unknown error'));
    }
    console.log('✅ API keys saved successfully');

    // Update current state
    currentSettings = formSettings;
    currentApiKeys = formApiKeys;

    // Save whitelist with retry mechanism
    const whitelistResponse = await sendMessageWithRetry({
      action: 'updateWhitelist',
      whitelist: whitelist
    });

    if (!whitelistResponse.success) {
      throw new Error('Failed to save whitelist');
    }

    // Save blacklist with retry mechanism
    const blacklistResponse = await sendMessageWithRetry({
      action: 'updateBlacklist',
      blacklist: blacklist
    });

    if (!blacklistResponse.success) {
      throw new Error('Failed to save blacklist');
    }

    // Reload API keys in background script with retry mechanism
    console.log('🔄 Reloading API keys in background script...');
    const reloadResponse = await sendMessageWithRetry({ action: 'reloadAPIKeys' });
    if (reloadResponse && reloadResponse.success) {
      console.log('✅ API keys reloaded in background script');
    } else {
      console.warn('⚠️ Failed to reload API keys in background script:', reloadResponse?.error);
    }

    // Verify the save by re-loading from storage
    console.log('🔍 Verifying save by re-loading from storage...');
    await loadApiKeys();

    // Show success message
    saveStatus.textContent = '✅ Settings and API keys saved successfully!';
    saveStatus.className = 'save-status success';
    saveStatus.style.display = 'inline-block';

    setTimeout(() => {
      saveStatus.style.display = 'none';
    }, 3000);

  } catch (error) {
    console.error('❌ Error saving settings:', error);
    saveStatus.textContent = '❌ Error saving settings: ' + error.message;
    saveStatus.className = 'save-status error';
    saveStatus.style.display = 'inline-block';
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  }
}

// Validate API keys
function validateAPIKeys(apiKeys) {
  const errors = [];

  // Google Safe Browsing API key validation
  if (apiKeys.googleSafeBrowsing && apiKeys.googleSafeBrowsing.length < 10) {
    errors.push('Google Safe Browsing API key seems too short');
  }

  // VirusTotal API key validation (should be 64 characters)
  if (apiKeys.virusTotal && apiKeys.virusTotal.length !== 64) {
    errors.push('VirusTotal API key should be 64 characters long');
  }

  // URLScan.io API key validation (UUID format)
  if (apiKeys.urlScan && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKeys.urlScan)) {
    errors.push('URLScan.io API key should be in UUID format');
  }

  return errors;
}
