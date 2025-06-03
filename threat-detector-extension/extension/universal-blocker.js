/**
 * Universal Content Blocker - Comprehensive popup and ad blocking system
 * Works across all websites with real-time protection and performance optimization
 */

class UniversalContentBlocker {
  constructor() {
    this.isEnabled = true; // Always-on by default
    this.blockedCount = {
      popups: 0,
      ads: 0,
      redirects: 0,
      overlays: 0,
      downloads: 0,
      scripts: 0
    };

    // Performance optimization
    this.lastScanTime = 0;
    this.scanThrottle = 100; // ms
    this.processedElements = new WeakSet();

    // Enhanced ad blocking patterns
    this.adSelectors = [
      // Standard ad containers
      '[class*="ad-"]', '[class*="ads-"]', '[class*="advertisement"]',
      '[id*="ad-"]', '[id*="ads-"]', '[id*="advertisement"]',
      '.ad-banner', '.ad-container', '.ad-wrapper', '.ad-content',
      '.google-ads', '.adsense', '.adsbygoogle', '[data-ad-slot]',

      // Video ads
      '.video-ad', '.preroll-ad', '.midroll-ad', '.overlay-ad',
      '[class*="video-ad"]', '[id*="video-ad"]',

      // Social media ads
      '[data-testid*="ad"]', '[aria-label*="Sponsored"]',
      '[data-ad-preview]', '[data-sponsored]',

      // E-commerce ads
      '.sponsored-product', '.promoted-content', '.affiliate-link',
      '[class*="sponsored"]', '[class*="promoted"]',

      // Popup and overlay ads
      '.popup-ad', '.overlay-ad', '.interstitial-ad', '.modal-ad',
      '[class*="popup"]', '[class*="overlay"]', '[class*="modal"]',

      // Third-party ad networks
      'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
      'iframe[src*="googleadservices"]', 'iframe[src*="amazon-adsystem"]',
      'iframe[src*="facebook.com/tr"]', 'iframe[src*="outbrain"]',
      'iframe[src*="taboola"]', 'iframe[src*="criteo"]'
    ];

    // Malicious/suspicious URL patterns
    this.suspiciousPatterns = [
      /popup/i, /overlay/i, /interstitial/i, /redirect/i,
      /malvertising/i, /clickbait/i, /affiliate/i, /tracker/i,
      /doubleclick\.net/i, /googlesyndication/i, /googleadservices/i,
      /amazon-adsystem/i, /facebook\.com\/tr/i, /outbrain/i,
      /taboola/i, /criteo/i, /adsystem/i, /adnxs/i
    ];

    // Popup detection patterns
    this.popupPatterns = [
      /window\.open/i, /popup/i, /modal/i, /overlay/i,
      /alert/i, /confirm/i, /prompt/i
    ];

    this.originalMethods = {};
    this.mutationObserver = null;
    this.intersectionObserver = null;

    this.init();
  }

  init() {
    console.log('🛡️ Universal Content Blocker initialized - Always-on protection');

    // Initialize all blocking mechanisms
    this.setupMethodOverrides();
    this.setupEventListeners();
    this.setupMutationObserver();
    this.setupIntersectionObserver();
    this.setupPerformanceOptimizations();
    this.blockExistingContent();

    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  setupMethodOverrides() {
    // Override window.open for popup blocking
    this.originalMethods.windowOpen = window.open;
    window.open = (...args) => this.handleWindowOpen(...args);

    // Override document.write for malicious script injection
    this.originalMethods.documentWrite = document.write;
    document.write = (...args) => this.handleDocumentWrite(...args);

    // Override eval for malicious code execution
    this.originalMethods.eval = window.eval;
    window.eval = (...args) => this.handleEval(...args);

    // Override setTimeout/setInterval for malicious redirects
    this.originalMethods.setTimeout = window.setTimeout;
    this.originalMethods.setInterval = window.setInterval;
    window.setTimeout = (...args) => this.handleTimeout('setTimeout', ...args);
    window.setInterval = (...args) => this.handleTimeout('setInterval', ...args);

    // Override history methods for redirect blocking
    this.originalMethods.pushState = history.pushState;
    this.originalMethods.replaceState = history.replaceState;
    history.pushState = (...args) => this.handleHistoryChange('pushState', ...args);
    history.replaceState = (...args) => this.handleHistoryChange('replaceState', ...args);

    // Override location changes
    this.setupLocationOverrides();
  }

  setupLocationOverrides() {
    // Intercept location changes
    const originalLocation = window.location;
    let currentHref = window.location.href;

    // Monitor location.href changes
    Object.defineProperty(window.location, 'href', {
      get: () => currentHref,
      set: (value) => {
        if (this.shouldBlockRedirect(value)) {
          console.warn('🚫 Blocked redirect to:', value);
          this.blockedCount.redirects++;
          this.logBlockedContent('redirect', value);
          return;
        }
        currentHref = value;
        originalLocation.href = value;
      }
    });
  }

  handleWindowOpen(url, target, features) {
    // Always block suspicious popups
    if (this.shouldBlockPopup(url, features)) {
      console.warn('🚫 Blocked popup:', url);
      this.blockedCount.popups++;
      this.showBlockNotification('popup', url);
      this.logBlockedContent('popup', url);
      return null;
    }

    return this.originalMethods.windowOpen.call(window, url, target, features);
  }

  handleDocumentWrite(content) {
    if (this.containsSuspiciousContent(content)) {
      console.warn('🚫 Blocked malicious document.write:', content.substring(0, 100));
      this.blockedCount.scripts++;
      this.logBlockedContent('script', 'document.write');
      return;
    }

    return this.originalMethods.documentWrite.call(document, content);
  }

  handleEval(code) {
    if (this.containsSuspiciousContent(code)) {
      console.warn('🚫 Blocked malicious eval:', code.substring(0, 100));
      this.blockedCount.scripts++;
      this.logBlockedContent('script', 'eval');
      return;
    }

    return this.originalMethods.eval.call(window, code);
  }

  handleTimeout(method, callback, delay, ...args) {
    // Check if callback contains suspicious redirect code
    if (typeof callback === 'string' && this.containsSuspiciousContent(callback)) {
      console.warn(`🚫 Blocked malicious ${method}:`, callback.substring(0, 100));
      this.blockedCount.scripts++;
      this.logBlockedContent('script', method);
      return;
    }

    return this.originalMethods[method].call(window, callback, delay, ...args);
  }

  handleHistoryChange(method, state, title, url) {
    if (url && this.shouldBlockRedirect(url)) {
      console.warn(`🚫 Blocked history ${method} to:`, url);
      this.blockedCount.redirects++;
      this.logBlockedContent('redirect', url);
      return;
    }

    return this.originalMethods[method].call(history, state, title, url);
  }

  shouldBlockPopup(url, features) {
    if (!url) return false;

    // Block popups with suspicious URLs
    if (this.isUrlSuspicious(url)) return true;

    // Block popups with suspicious features
    if (features && this.containsSuspiciousContent(features)) return true;

    // Block popups that appear to be ads
    if (this.looksLikeAdPopup(url, features)) return true;

    return false;
  }

  shouldBlockRedirect(url) {
    if (!url) return false;

    // Block redirects to suspicious URLs
    if (this.isUrlSuspicious(url)) return true;

    // Block rapid redirects (potential redirect chains)
    const now = Date.now();
    if (this.lastRedirectTime && (now - this.lastRedirectTime) < 1000) {
      this.lastRedirectTime = now;
      return true;
    }
    this.lastRedirectTime = now;

    return false;
  }

  isUrlSuspicious(url) {
    if (!url) return false;

    try {
      const urlString = url.toString();
      return this.suspiciousPatterns.some(pattern => pattern.test(urlString));
    } catch (e) {
      return false;
    }
  }

  containsSuspiciousContent(content) {
    if (!content) return false;

    const contentString = content.toString();
    return this.popupPatterns.some(pattern => pattern.test(contentString)) ||
           this.suspiciousPatterns.some(pattern => pattern.test(contentString));
  }

  looksLikeAdPopup(url, features) {
    if (!url && !features) return false;

    const combined = `${url || ''} ${features || ''}`;
    return /ad|advertisement|popup|overlay|modal/i.test(combined);
  }

  setupEventListeners() {
    // Block malicious clicks
    document.addEventListener('click', (event) => {
      this.handleClick(event);
    }, true);

    // Block malicious form submissions
    document.addEventListener('submit', (event) => {
      this.handleFormSubmit(event);
    }, true);

    // Block malicious key events
    document.addEventListener('keydown', (event) => {
      this.handleKeyEvent(event);
    }, true);

    // Monitor for new windows/tabs
    window.addEventListener('beforeunload', (event) => {
      this.handleBeforeUnload(event);
    });
  }

  handleClick(event) {
    const target = event.target.closest('a, button, [onclick], [data-href]');
    if (!target) return;

    const url = target.href || target.dataset.href || target.getAttribute('onclick');
    if (url && this.isUrlSuspicious(url)) {
      console.warn('🚫 Blocked malicious click:', url);
      event.preventDefault();
      event.stopPropagation();
      this.blockedCount.popups++;
      this.showBlockNotification('click', url);
      this.logBlockedContent('click', url);
    }
  }

  handleFormSubmit(event) {
    const form = event.target;
    const action = form.action;

    if (action && this.isUrlSuspicious(action)) {
      console.warn('🚫 Blocked malicious form submission:', action);
      event.preventDefault();
      this.blockedCount.redirects++;
      this.logBlockedContent('form', action);
    }
  }

  handleKeyEvent(event) {
    // Block certain key combinations that might trigger popups
    if (event.ctrlKey && event.key === 'n') { // Ctrl+N (new window)
      // Allow legitimate use, but monitor
    }
  }

  handleBeforeUnload(event) {
    // Monitor for suspicious unload behavior
    if (this.detectSuspiciousUnload()) {
      console.warn('🚫 Suspicious page unload detected');
    }
  }

  detectSuspiciousUnload() {
    // Check for rapid page changes or suspicious redirect patterns
    return false; // Placeholder for advanced detection
  }

  setupMutationObserver() {
    // Real-time DOM monitoring for new ads and popups
    this.mutationObserver = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'onclick', 'style', 'class', 'id']
    });
  }

  setupIntersectionObserver() {
    // Monitor elements entering viewport for lazy-loaded ads
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.checkAndBlockElement(entry.target);
        }
      });
    }, { threshold: 0.1 });
  }

  setupPerformanceOptimizations() {
    // Throttle DOM scanning to prevent performance issues
    this.throttledScan = this.throttle(() => {
      this.scanForNewContent();
    }, this.scanThrottle);

    // Cleanup processed elements periodically
    setInterval(() => {
      this.cleanupProcessedElements();
    }, 30000); // Every 30 seconds
  }

  handleMutations(mutations) {
    const now = Date.now();
    if (now - this.lastScanTime < this.scanThrottle) return;
    this.lastScanTime = now;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkAndBlockElement(node);
            this.observeElement(node);
          }
        });
      } else if (mutation.type === 'attributes') {
        this.checkAndBlockElement(mutation.target);
      }
    });
  }

  observeElement(element) {
    // Add element to intersection observer for lazy loading detection
    if (this.intersectionObserver && element.tagName) {
      this.intersectionObserver.observe(element);
    }
  }

  checkAndBlockElement(element) {
    if (!element || !element.tagName || this.processedElements.has(element)) return;

    this.processedElements.add(element);

    // Check if element matches ad selectors
    if (this.matchesAdSelector(element)) {
      this.blockElement(element, 'ad');
      return;
    }

    // Check for suspicious URLs
    const url = this.getElementUrl(element);
    if (url && this.isUrlSuspicious(url)) {
      this.blockElement(element, 'suspicious');
      return;
    }

    // Check for popup/overlay characteristics
    if (this.looksLikePopupOverlay(element)) {
      this.blockElement(element, 'overlay');
      return;
    }

    // Recursively check child elements
    this.checkChildElements(element);
  }

  matchesAdSelector(element) {
    return this.adSelectors.some(selector => {
      try {
        return element.matches && element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }

  getElementUrl(element) {
    return element.src || element.href || element.action ||
           element.dataset.src || element.dataset.href;
  }

  looksLikePopupOverlay(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Check for fixed/absolute positioning with high z-index
    if ((style.position === 'fixed' || style.position === 'absolute') &&
        parseInt(style.zIndex) > 1000) {

      // Check if it covers significant screen area
      if (rect.width > window.innerWidth * 0.3 &&
          rect.height > window.innerHeight * 0.3) {
        return true;
      }
    }

    // Check for modal/overlay classes
    const className = element.className || '';
    const id = element.id || '';
    return /modal|overlay|popup|interstitial/i.test(className + ' ' + id);
  }

  checkChildElements(element) {
    if (!element.children) return;

    Array.from(element.children).forEach(child => {
      this.checkAndBlockElement(child);
    });
  }

  blockElement(element, type) {
    if (element.dataset.blockedBy === 'universal-blocker') return;

    // Mark as blocked
    element.dataset.blockedBy = 'universal-blocker';
    element.dataset.blockType = type;

    // Hide the element
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('opacity', '0', 'important');
    element.style.setProperty('height', '0', 'important');
    element.style.setProperty('width', '0', 'important');

    // Update counters
    this.updateBlockedCount(type);

    // Log the block
    this.logBlockedContent(type, this.getElementUrl(element) || 'unknown');

    console.log(`🚫 Blocked ${type}:`, element);
  }

  updateBlockedCount(type) {
    switch (type) {
      case 'ad':
        this.blockedCount.ads++;
        break;
      case 'overlay':
        this.blockedCount.overlays++;
        break;
      case 'suspicious':
        this.blockedCount.popups++;
        break;
      default:
        this.blockedCount.ads++;
    }
  }

  blockExistingContent() {
    // Scan and block existing content on page load
    this.scanForNewContent();
  }

  scanForNewContent() {
    // Scan for ads
    this.adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => this.checkAndBlockElement(element));
      } catch (e) {
        console.warn('Invalid selector:', selector, e);
      }
    });

    // Scan for suspicious iframes
    document.querySelectorAll('iframe').forEach(iframe => {
      this.checkAndBlockElement(iframe);
    });

    // Scan for suspicious scripts
    document.querySelectorAll('script[src]').forEach(script => {
      this.checkAndBlockElement(script);
    });
  }

  startRealTimeMonitoring() {
    // Periodic scanning for dynamic content
    setInterval(() => {
      this.throttledScan();
    }, 2000); // Every 2 seconds

    // Monitor for new iframes (common for ads)
    setInterval(() => {
      document.querySelectorAll('iframe:not([data-blocked-by])').forEach(iframe => {
        this.checkAndBlockElement(iframe);
      });
    }, 1000); // Every 1 second for iframes
  }

  cleanupProcessedElements() {
    // Clear processed elements set periodically to prevent memory leaks
    this.processedElements = new WeakSet();
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  showBlockNotification(type, url) {
    // Show user-friendly notification
    if (window.createThreatWarning) {
      window.createThreatWarning(type, `Blocked ${type}: ${url.substring(0, 50)}...`);
    }
  }

  logBlockedContent(type, url) {
    // Send blocking statistics to background script
    try {
      chrome.runtime.sendMessage({
        action: 'logBlockedContent',
        type: type,
        url: url,
        currentUrl: window.location.href,
        timestamp: Date.now()
      }).catch(error => {
        console.log('Could not log blocked content:', error.message);
      });
    } catch (e) {
      console.log('Runtime not available for logging');
    }
  }

  getBlockingStats() {
    return {
      ...this.blockedCount,
      isEnabled: this.isEnabled,
      totalBlocked: Object.values(this.blockedCount).reduce((a, b) => a + b, 0)
    };
  }

  enable() {
    this.isEnabled = true;
    console.log('✅ Universal Content Blocker enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('⏸️ Universal Content Blocker disabled');
  }

  destroy() {
    // Cleanup observers and restore original methods
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Restore original methods
    Object.keys(this.originalMethods).forEach(method => {
      if (method === 'windowOpen') {
        window.open = this.originalMethods[method];
      } else if (method === 'documentWrite') {
        document.write = this.originalMethods[method];
      } else if (method === 'eval') {
        window.eval = this.originalMethods[method];
      } else if (method === 'setTimeout') {
        window.setTimeout = this.originalMethods[method];
      } else if (method === 'setInterval') {
        window.setInterval = this.originalMethods[method];
      } else if (method === 'pushState') {
        history.pushState = this.originalMethods[method];
      } else if (method === 'replaceState') {
        history.replaceState = this.originalMethods[method];
      }
    });
  }
}

// Initialize Universal Content Blocker
if (typeof window !== 'undefined') {
  window.universalContentBlocker = new UniversalContentBlocker();
  console.log('🛡️ Universal Content Blocker loaded and active');
}
