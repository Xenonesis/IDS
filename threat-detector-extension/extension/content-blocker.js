// Advanced Content Blocker for Threat Detector Extension
// Handles ad blocking, popup blocking, and redirect protection

class ThreatContentBlocker {
  constructor() {
    this.isEnabled = false;
    this.threats = [];
    this.severity = 'none';
    this.blockedCount = {
      ads: 0,
      popups: 0,
      redirects: 0,
      downloads: 0
    };
    this.maliciousDomains = new Set();
    this.suspiciousPatterns = new Set();
    this.originalMethods = {};
    
    // Enhanced ad selectors including malicious ad networks
    this.adSelectors = [
      // Standard ad selectors
      '[class*="ad-"]', '[class*="ads-"]', '[id*="ad-"]', '[id*="ads-"]',
      '.advertisement', '.ad-banner', '.ad-container', '.google-ads', '.adsense',
      '[data-ad-slot]', 'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
      'iframe[src*="googleadservices"]',
      
      // Malicious ad networks and suspicious patterns
      'iframe[src*="malvertising"]', 'iframe[src*="clickbait"]',
      '[class*="popup-ad"]', '[class*="overlay-ad"]', '[class*="interstitial"]',
      'div[style*="position: fixed"][style*="z-index"]',
      'div[onclick*="window.open"]', 'a[onclick*="window.open"]'
    ];

    // Suspicious URL patterns that might indicate malicious ads
    this.suspiciousAdPatterns = [
      /malvertising/i, /clickbait/i, /popup/i, /overlay/i,
      /interstitial/i, /redirect/i, /affiliate/i, /tracker/i,
      /analytics\.suspicious/i, /ads\.malicious/i
    ];

    this.init();
  }

  init() {
    console.log('🛡️ ThreatContentBlocker initialized');
    this.setupMethodOverrides();
    this.setupEventListeners();
    this.setupMutationObserver();
  }

  enable(threats = [], severity = 'medium') {
    this.isEnabled = true;
    this.threats = threats;
    this.severity = severity;
    
    console.log(`🚫 Content blocking enabled (severity: ${severity}, threats: ${threats.length})`);
    
    // Extract malicious domains from threats
    this.updateMaliciousDomains(threats);
    
    // Start blocking immediately
    this.blockExistingContent();
    
    // Notify background script
    this.reportBlockingStatus('enabled');
  }

  disable() {
    this.isEnabled = false;
    this.threats = [];
    this.severity = 'none';
    this.maliciousDomains.clear();
    
    console.log('✅ Content blocking disabled');
    this.reportBlockingStatus('disabled');
  }

  updateMaliciousDomains(threats) {
    this.maliciousDomains.clear();
    
    threats.forEach(threat => {
      if (threat.domain) {
        this.maliciousDomains.add(threat.domain);
      }
      if (threat.url) {
        try {
          const domain = new URL(threat.url).hostname;
          this.maliciousDomains.add(domain);
        } catch (e) {
          console.warn('Invalid threat URL:', threat.url);
        }
      }
    });
    
    console.log(`📋 Updated malicious domains list: ${this.maliciousDomains.size} domains`);
  }

  setupMethodOverrides() {
    // Enhanced popup blocking
    this.originalMethods.windowOpen = window.open;
    window.open = (url, target, features) => {
      return this.handleWindowOpen(url, target, features);
    };

    // Enhanced redirect blocking
    this.originalMethods.locationSetter = Object.getOwnPropertyDescriptor(Location.prototype, 'href').set;
    Object.defineProperty(Location.prototype, 'href', {
      set: (value) => {
        return this.handleLocationChange(value);
      },
      get: () => {
        return window.location.href;
      }
    });

    // Block history manipulation to malicious sites
    this.originalMethods.pushState = history.pushState;
    this.originalMethods.replaceState = history.replaceState;
    
    history.pushState = (...args) => {
      return this.handleHistoryChange('pushState', ...args);
    };
    
    history.replaceState = (...args) => {
      return this.handleHistoryChange('replaceState', ...args);
    };
  }

  handleWindowOpen(url, target, features) {
    if (!this.isEnabled) {
      return this.originalMethods.windowOpen.call(window, url, target, features);
    }

    // Check if URL is malicious
    if (this.isUrlMalicious(url)) {
      console.warn('🚫 Blocked popup to malicious URL:', url);
      this.blockedCount.popups++;
      this.showBlockNotification('popup', url);
      this.logBlockedContent('popup', url);
      return null;
    }

    // Allow legitimate popups
    return this.originalMethods.windowOpen.call(window, url, target, features);
  }

  handleLocationChange(newUrl) {
    if (!this.isEnabled) {
      return this.originalMethods.locationSetter.call(location, newUrl);
    }

    if (this.isUrlMalicious(newUrl)) {
      console.warn('🚫 Blocked redirect to malicious URL:', newUrl);
      this.blockedCount.redirects++;
      this.showBlockNotification('redirect', newUrl);
      this.logBlockedContent('redirect', newUrl);
      return; // Block the redirect
    }

    return this.originalMethods.locationSetter.call(location, newUrl);
  }

  handleHistoryChange(method, ...args) {
    if (!this.isEnabled) {
      return this.originalMethods[method].apply(history, args);
    }

    const url = args[2]; // URL is the third argument
    if (url && this.isUrlMalicious(url)) {
      console.warn(`🚫 Blocked ${method} to malicious URL:`, url);
      this.blockedCount.redirects++;
      this.showBlockNotification('redirect', url);
      this.logBlockedContent('redirect', url);
      return; // Block the history change
    }

    return this.originalMethods[method].apply(history, args);
  }

  isUrlMalicious(url) {
    if (!url) return false;

    try {
      const urlObj = new URL(url, window.location.href);
      const domain = urlObj.hostname;

      // Check against known malicious domains
      if (this.maliciousDomains.has(domain)) {
        return true;
      }

      // Check for suspicious patterns
      for (const pattern of this.suspiciousAdPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }

      return false;
    } catch (e) {
      console.warn('Error checking URL:', url, e);
      return false;
    }
  }

  setupEventListeners() {
    // Block malicious downloads
    document.addEventListener('click', (event) => {
      if (!this.isEnabled) return;

      const target = event.target.closest('a');
      if (target && target.href) {
        if (this.isUrlMalicious(target.href) || target.download) {
          if (this.severity === 'high' || this.isUrlMalicious(target.href)) {
            console.warn('🚫 Blocked download from malicious source:', target.href);
            event.preventDefault();
            event.stopPropagation();
            this.blockedCount.downloads++;
            this.showBlockNotification('download', target.href);
            this.logBlockedContent('download', target.href);
          }
        }
      }
    }, true);

    // Block form submissions to malicious domains
    document.addEventListener('submit', (event) => {
      if (!this.isEnabled || this.severity !== 'high') return;

      const form = event.target;
      const action = form.action || window.location.href;

      if (this.isUrlMalicious(action)) {
        console.warn('🚫 Blocked form submission to malicious URL:', action);
        event.preventDefault();
        event.stopPropagation();
        this.showBlockNotification('form', action);
        this.logBlockedContent('form', action);
      }
    }, true);
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkAndBlockElement(node);
          }
        });
      });
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  blockExistingContent() {
    if (!this.isEnabled) return;

    // Block existing ads
    this.adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => this.blockElement(element, 'ad'));
      } catch (e) {
        console.warn('Error with selector:', selector, e);
      }
    });

    // Block elements with malicious URLs
    const links = document.querySelectorAll('a[href], iframe[src], script[src]');
    links.forEach(element => {
      const url = element.href || element.src;
      if (this.isUrlMalicious(url)) {
        this.blockElement(element, 'malicious-content');
      }
    });
  }

  checkAndBlockElement(element) {
    // Check if element matches ad selectors
    for (const selector of this.adSelectors) {
      try {
        if (element.matches && element.matches(selector)) {
          this.blockElement(element, 'ad');
          return;
        }
      } catch (e) {
        // Ignore invalid selectors
      }
    }

    // Check for malicious URLs in the element
    const url = element.href || element.src || element.action;
    if (url && this.isUrlMalicious(url)) {
      this.blockElement(element, 'malicious-content');
    }

    // Check child elements
    if (element.querySelectorAll) {
      const childLinks = element.querySelectorAll('a[href], iframe[src], script[src]');
      childLinks.forEach(child => {
        const childUrl = child.href || child.src;
        if (this.isUrlMalicious(childUrl)) {
          this.blockElement(child, 'malicious-content');
        }
      });
    }
  }

  blockElement(element, type) {
    if (element.style.display === 'none') return; // Already blocked

    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.setAttribute('data-threat-blocked', type);

    if (type === 'ad') {
      this.blockedCount.ads++;
    }

    this.logBlockedContent(type, element.src || element.href || 'unknown');
  }

  showBlockNotification(type, url) {
    // Create a non-intrusive notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    const typeLabels = {
      popup: 'Popup',
      redirect: 'Redirect',
      download: 'Download',
      form: 'Form submission',
      ad: 'Advertisement'
    };
    
    notification.textContent = `🛡️ ${typeLabels[type] || 'Content'} blocked`;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  logBlockedContent(type, url) {
    // Send to background script for logging
    chrome.runtime.sendMessage({
      action: 'logBlockedContent',
      type: type,
      url: url,
      currentUrl: window.location.href,
      timestamp: Date.now(),
      threats: this.threats
    }).catch(error => {
      console.log('Could not log blocked content:', error.message);
    });
  }

  reportBlockingStatus(status) {
    chrome.runtime.sendMessage({
      action: 'reportBlockingStatus',
      status: status,
      blockedCount: this.blockedCount,
      currentUrl: window.location.href
    }).catch(error => {
      console.log('Could not report blocking status:', error.message);
    });
  }

  getBlockingStats() {
    return {
      isEnabled: this.isEnabled,
      severity: this.severity,
      threatsCount: this.threats.length,
      blockedCount: { ...this.blockedCount },
      maliciousDomainsCount: this.maliciousDomains.size
    };
  }
}

// Initialize the content blocker
window.threatContentBlocker = new ThreatContentBlocker();

console.log('🛡️ Advanced Content Blocker loaded');
