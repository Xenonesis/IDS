// Content script for AI-Powered Threat Detector Extension

// Global variables for feedback management
let scanningIndicator = null;
let securityStatusIndicator = null;
let scanResultsPanel = null;
let currentScanResults = null;

// Enhanced threat warning overlay with modern design
function createThreatWarning(threatType, description, threatDetails = null) {
  console.log('Creating enhanced threat warning:', threatType, description, threatDetails);

  // Remove existing warning if present
  const existingWarning = document.getElementById('threat-detector-warning');
  if (existingWarning) {
    existingWarning.remove();
  }

  // Create modern warning overlay with animations
  const overlay = document.createElement('div');
  overlay.id = 'threat-detector-warning';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(0, 0, 0, 0.8) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 20px !important;
    animation: fadeIn 0.3s ease-out !important;
  `;

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);

  // Create modern warning content box
  const warningBox = document.createElement('div');
  warningBox.style.cssText = `
    background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
    padding: 2.5rem !important;
    border-radius: 16px !important;
    max-width: 520px !important;
    width: 90% !important;
    text-align: center !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    border: 2px solid #ef4444 !important;
    box-sizing: border-box !important;
    margin: 0 auto !important;
    position: relative !important;
    animation: slideUp 0.4s ease-out !important;
    overflow: hidden !important;
  `;

  // Add a subtle pattern overlay
  const pattern = document.createElement('div');
  pattern.style.cssText = `
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 50%) !important;
    pointer-events: none !important;
  `;
  warningBox.appendChild(pattern);

  // Modern warning icon with animation
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    position: relative !important;
    z-index: 1 !important;
    margin-bottom: 1.5rem !important;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = '🛡️';
  icon.style.cssText = `
    font-size: 4rem !important;
    line-height: 1 !important;
    animation: pulse 2s infinite !important;
    filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3)) !important;
  `;
  iconContainer.appendChild(icon);

  // Modern warning title
  const title = document.createElement('h2');
  title.textContent = 'Security Threat Detected';
  title.style.cssText = `
    color: #1f2937 !important;
    margin: 0 0 1rem 0 !important;
    font-size: 1.75rem !important;
    font-weight: 700 !important;
    font-family: inherit !important;
    position: relative !important;
    z-index: 1 !important;
    letter-spacing: -0.025em !important;
  `;

  // Threat type indicator
  const threatTypeIndicator = document.createElement('div');
  threatTypeIndicator.style.cssText = `
    display: inline-block !important;
    background: ${getThreatColor(threatType)} !important;
    color: white !important;
    padding: 4px 12px !important;
    border-radius: 20px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    margin-bottom: 1rem !important;
  `;
  threatTypeIndicator.textContent = getThreatTypeLabel(threatType);

  // Enhanced warning description
  const desc = document.createElement('p');
  desc.textContent = description || 'A potential security threat has been detected on this website. Your safety is our priority.';
  desc.style.cssText = `
    color: #4b5563 !important;
    margin: 0 0 1.5rem 0 !important;
    line-height: 1.6 !important;
    font-size: 1.1rem !important;
    font-family: inherit !important;
    position: relative !important;
    z-index: 1 !important;
  `;

  // Modern threat type badge
  const badge = document.createElement('span');
  badge.textContent = (threatType || 'THREAT').toUpperCase();
  badge.style.cssText = `
    background: linear-gradient(135deg, #fef2f2, #fee2e2) !important;
    color: #dc2626 !important;
    padding: 0.5rem 1rem !important;
    border-radius: 12px !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    margin-bottom: 2rem !important;
    display: inline-block !important;
    font-family: inherit !important;
    position: relative !important;
    z-index: 1 !important;
    border: 1px solid #fecaca !important;
    letter-spacing: 0.05em !important;
  `;

  // Modern action buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    justify-content: center !important;
    position: relative !important;
    z-index: 1 !important;
  `;

  // Primary action button (Go Back)
  const goBackButton = document.createElement('button');
  goBackButton.textContent = '← Go Back to Safety';
  goBackButton.style.cssText = `
    background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
    color: white !important;
    border: none !important;
    padding: 1rem 2rem !important;
    border-radius: 12px !important;
    cursor: pointer !important;
    font-weight: 600 !important;
    font-size: 1rem !important;
    font-family: inherit !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
    position: relative !important;
    overflow: hidden !important;
  `;

  // Add hover effects
  goBackButton.addEventListener('mouseenter', () => {
    goBackButton.style.transform = 'translateY(-2px)';
    goBackButton.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
  });
  goBackButton.addEventListener('mouseleave', () => {
    goBackButton.style.transform = 'translateY(0)';
    goBackButton.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
  });

  goBackButton.addEventListener('click', () => {
    window.history.back();
  });

  // Secondary actions container
  const secondaryContainer = document.createElement('div');
  secondaryContainer.style.cssText = `
    display: flex !important;
    gap: 0.5rem !important;
    justify-content: center !important;
  `;

  const continueButton = document.createElement('button');
  continueButton.textContent = 'Continue Anyway';
  continueButton.style.cssText = `
    background: transparent !important;
    color: #6b7280 !important;
    border: 2px solid #d1d5db !important;
    padding: 0.75rem 1.25rem !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    font-weight: 500 !important;
    font-size: 0.9rem !important;
    font-family: inherit !important;
    transition: all 0.2s ease !important;
    flex: 1 !important;
  `;

  continueButton.addEventListener('mouseenter', () => {
    continueButton.style.borderColor = '#9ca3af';
    continueButton.style.color = '#374151';
  });
  continueButton.addEventListener('mouseleave', () => {
    continueButton.style.borderColor = '#d1d5db';
    continueButton.style.color = '#6b7280';
  });

  continueButton.addEventListener('click', () => {
    overlay.remove();
  });

  const whitelistButton = document.createElement('button');
  whitelistButton.textContent = 'Trust Site';
  whitelistButton.style.cssText = `
    background: transparent !important;
    color: #059669 !important;
    border: 2px solid #10b981 !important;
    padding: 0.75rem 1.25rem !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    font-weight: 500 !important;
    font-size: 0.9rem !important;
    font-family: inherit !important;
    transition: all 0.2s ease !important;
    flex: 1 !important;
  `;

  whitelistButton.addEventListener('mouseenter', () => {
    whitelistButton.style.background = '#10b981';
    whitelistButton.style.color = 'white';
  });
  whitelistButton.addEventListener('mouseleave', () => {
    whitelistButton.style.background = 'transparent';
    whitelistButton.style.color = '#059669';
  });
  whitelistButton.addEventListener('click', () => {
    try {
      chrome.runtime.sendMessage({
        action: 'addToWhitelist',
        url: window.location.hostname
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error adding to whitelist:', chrome.runtime.lastError);
        } else {
          console.log('Successfully added to whitelist');
        }
      });
      overlay.remove();
    } catch (error) {
      console.error('Error sending whitelist message:', error);
      overlay.remove();
    }
  });

  // Assemble the modern warning
  secondaryContainer.appendChild(continueButton);
  secondaryContainer.appendChild(whitelistButton);

  buttonContainer.appendChild(goBackButton);
  buttonContainer.appendChild(secondaryContainer);

  warningBox.appendChild(iconContainer);
  warningBox.appendChild(threatTypeIndicator);
  warningBox.appendChild(title);
  warningBox.appendChild(desc);

  // Add threat details if available
  if (threatDetails) {
    const threatDetailsSection = createThreatDetailsSection(threatDetails);
    warningBox.appendChild(threatDetailsSection);
  }

  warningBox.appendChild(buttonContainer);
  overlay.appendChild(warningBox);

  // Ensure the overlay is added to the document
  try {
    if (document.body) {
      document.body.appendChild(overlay);
    } else if (document.documentElement) {
      document.documentElement.appendChild(overlay);
    } else {
      // Wait for DOM to be ready
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }
    console.log('Threat warning overlay added to DOM');
  } catch (error) {
    console.error('Error adding threat warning to DOM:', error);
  }
}

// Helper functions for threat management
function getThreatColor(threatType) {
  switch (threatType?.toLowerCase()) {
    case 'malware':
    case 'malicious':
      return '#dc2626'; // Red
    case 'phishing':
    case 'social_engineering':
      return '#ea580c'; // Orange
    case 'suspicious':
    case 'warning':
      return '#d97706'; // Amber
    case 'blacklist':
      return '#7c2d12'; // Dark red
    default:
      return '#dc2626'; // Default red
  }
}

function getThreatTypeLabel(threatType) {
  switch (threatType?.toLowerCase()) {
    case 'malware':
      return 'Malware Detected';
    case 'phishing':
      return 'Phishing Site';
    case 'social_engineering':
      return 'Social Engineering';
    case 'suspicious':
      return 'Suspicious Content';
    case 'blacklist':
      return 'Blocked Site';
    default:
      return 'Security Threat';
  }
}

function createThreatDetailsSection(threatDetails) {
  const section = document.createElement('div');
  section.style.cssText = `
    background: rgba(249, 250, 251, 0.9) !important;
    border: 1px solid rgba(229, 231, 235, 0.8) !important;
    border-radius: 8px !important;
    padding: 1rem !important;
    margin: 1rem 0 !important;
    text-align: left !important;
  `;

  const title = document.createElement('h4');
  title.textContent = 'Threat Details';
  title.style.cssText = `
    color: #1f2937 !important;
    margin: 0 0 0.75rem 0 !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
  `;

  const detailsList = document.createElement('div');
  detailsList.style.cssText = `
    display: grid !important;
    gap: 0.5rem !important;
  `;

  if (threatDetails.source) {
    const sourceItem = createDetailItem('Source', threatDetails.source);
    detailsList.appendChild(sourceItem);
  }

  if (threatDetails.severity) {
    const severityItem = createDetailItem('Severity', threatDetails.severity);
    detailsList.appendChild(severityItem);
  }

  if (threatDetails.timestamp) {
    const timeItem = createDetailItem('Detected', new Date(threatDetails.timestamp).toLocaleString());
    detailsList.appendChild(timeItem);
  }

  if (threatDetails.confidence) {
    const confidenceItem = createDetailItem('Confidence', `${threatDetails.confidence}%`);
    detailsList.appendChild(confidenceItem);
  }

  section.appendChild(title);
  section.appendChild(detailsList);
  return section;
}

function createDetailItem(label, value) {
  const item = document.createElement('div');
  item.style.cssText = `
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 0.25rem 0 !important;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5) !important;
  `;

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  labelSpan.style.cssText = `
    font-weight: 500 !important;
    color: #374151 !important;
    font-size: 0.875rem !important;
  `;

  const valueSpan = document.createElement('span');
  valueSpan.textContent = value;
  valueSpan.style.cssText = `
    color: #6b7280 !important;
    font-size: 0.875rem !important;
  `;

  item.appendChild(labelSpan);
  item.appendChild(valueSpan);
  return item;
}

// Simplified Binary Security Status Indicator
function createBinaryStatusIndicator(status = 'scanning') {
  // Remove existing indicator
  removeBinaryStatusIndicator();

  securityStatusIndicator = document.createElement('div');
  securityStatusIndicator.id = 'threat-detector-status';

  const statusConfig = getBinaryStatusConfig(status);

  securityStatusIndicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${statusConfig.background};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px ${statusConfig.shadow};
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideInRight 0.3s ease-out;
      transition: all 0.2s ease;
      border: 1px solid ${statusConfig.border};
    ">
      ${statusConfig.icon}
      <span>${statusConfig.text}</span>
      ${status === 'scanning' ? `
        <div style="
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      ` : ''}
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    </style>
  `;

  // Safely append to document
  if (document.body) {
    document.body.appendChild(securityStatusIndicator);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        document.body.appendChild(securityStatusIndicator);
      }
    });
  }

  // Auto-hide secure status after 3 seconds
  if (status === 'secure') {
    setTimeout(() => {
      removeBinaryStatusIndicator();
    }, 3000);
  }
}

// Simplified binary status configuration (only secure, danger, scanning)
function getBinaryStatusConfig(status) {
  switch (status) {
    case 'secure':
      return {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        shadow: 'rgba(16, 185, 129, 0.3)',
        border: 'rgba(16, 185, 129, 0.5)',
        icon: '🛡️',
        text: 'Secure'
      };
    case 'danger':
      return {
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        shadow: 'rgba(220, 38, 38, 0.3)',
        border: 'rgba(220, 38, 38, 0.5)',
        icon: '🚨',
        text: 'Danger'
      };
    case 'scanning':
    default:
      // Remove scanning visual feedback: do nothing or fall through
      return {
        background: '',
        shadow: '',
        border: '',
        icon: '',
        text: ''
      };
  }
}

function removeBinaryStatusIndicator() {
  if (securityStatusIndicator) {
    securityStatusIndicator.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (securityStatusIndicator && securityStatusIndicator.parentNode) {
        securityStatusIndicator.parentNode.removeChild(securityStatusIndicator);
      }
      securityStatusIndicator = null;
    }, 300);
  }
}

// Content blocking state
let contentBlockingEnabled = false;
let blockedThreats = [];
let threatSeverity = 'none';

// Monitor for suspicious behavior
function monitorPageBehavior() {
  let redirectCount = 0;
  let suspiciousScripts = 0;
  let scriptCheckStartTime = Date.now();

  // Monitor redirects
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    redirectCount++;

    // Block excessive redirects if content blocking is enabled
    if (contentBlockingEnabled && redirectCount > 5) {
      console.warn('🚫 Blocking excessive redirects due to threat detection:', redirectCount);
      createThreatWarning('redirect', 'Automatic redirects blocked due to security threat');
      return; // Block the redirect
    }

    if (redirectCount > 10) { // Increased threshold to reduce false positives
      console.warn('Excessive redirects detected:', redirectCount);
      // Could trigger anomaly detection here
    }
    return originalPushState.apply(this, args);
  };

  history.replaceState = function(...args) {
    redirectCount++;
    if (redirectCount > 10) { // Increased threshold to reduce false positives
      console.warn('Excessive redirects detected:', redirectCount);
    }
    return originalReplaceState.apply(this, args);
  };

  // Monitor for suspicious script injections with better filtering
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT') {
          // Filter out legitimate scripts (e.g., from known domains, analytics, etc.)
          const src = node.src;
          const isLegitimate = src && (
            src.includes('google') ||
            src.includes('facebook') ||
            src.includes('twitter') ||
            src.includes('youtube') ||
            src.includes('cdn.') ||
            src.includes('ajax.googleapis.com') ||
            src.includes('unpkg.com') ||
            src.includes('jsdelivr.net')
          );

          if (!isLegitimate) {
            suspiciousScripts++;
            const timeSinceStart = Date.now() - scriptCheckStartTime;

            // Only warn if many scripts are added quickly (within 30 seconds)
            if (suspiciousScripts > 20 && timeSinceStart < 30000) {
              console.warn('Excessive script injections detected:', suspiciousScripts, 'in', timeSinceStart, 'ms');
              // Could trigger anomaly detection here
            }
          }
        }
      });
    });
  });

  // Only observe if document.body exists
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    // Wait for body to be available
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }
}

// Intelligent popup blocking for malicious sites
function initializePopupBlocking() {
  // Override window.open to block popups when threats are detected
  const originalWindowOpen = window.open;

  window.open = function(url, target, features) {
    // Always allow legitimate user-initiated actions
    if (!contentBlockingEnabled) {
      return originalWindowOpen.call(this, url, target, features);
    }

    // Block popups when content blocking is active
    console.warn('🚫 Popup blocked due to threat detection:', url);

    // Show user-friendly notification
    createThreatWarning('popup', 'Popup window blocked due to security threat');

    // Log the blocked popup attempt
    chrome.runtime.sendMessage({
      action: 'logBlockedPopup',
      url: url || 'unknown',
      currentUrl: window.location.href,
      threats: blockedThreats
    }).catch(error => {
      console.log('Could not log blocked popup:', error.message);
    });

    // Return null to indicate popup was blocked
    return null;
  };

  // Block automatic form submissions to malicious sites
  document.addEventListener('submit', function(event) {
    if (contentBlockingEnabled && threatSeverity === 'high') {
      const form = event.target;
      const action = form.action || window.location.href;

      // Check if form is submitting to external domain
      try {
        const formUrl = new URL(action, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (formUrl.hostname !== currentUrl.hostname) {
          console.warn('🚫 Blocking form submission to external domain due to threat:', formUrl.hostname);
          event.preventDefault();
          createThreatWarning('form', 'Form submission blocked due to security threat');
          return false;
        }
      } catch (error) {
        console.error('Error checking form submission:', error);
      }
    }
  }, true);

  // Block automatic downloads from malicious sites
  document.addEventListener('click', function(event) {
    if (contentBlockingEnabled && event.target.tagName === 'A') {
      const link = event.target;
      const href = link.href;

      if (href && (href.includes('download') || link.download)) {
        console.warn('🚫 Blocking download due to threat detection:', href);
        event.preventDefault();
        createThreatWarning('download', 'Download blocked due to security threat');
        return false;
      }
    }
  }, true);
}

// Basic advertisement blocking functionality
function initializeAdBlocking() {
  // Common ad selectors (basic implementation)
  const adSelectors = [
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    '.advertisement',
    '.ad-banner',
    '.ad-container',
    '.google-ads',
    '.adsense',
    '[data-ad-slot]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="googleadservices"]'
  ];

  let blockedAdsCount = 0;

  // Function to block ads
  function blockAds() {
    if (!contentBlockingEnabled) return;

    adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.style.display !== 'none') {
            element.style.display = 'none';
            blockedAdsCount++;

            // Log blocked ad
            chrome.runtime.sendMessage({
              action: 'logBlockedAd',
              url: element.src || element.href || 'unknown',
              currentUrl: window.location.href,
              adType: 'display',
              selector: selector
            }).catch(error => {
              console.log('Could not log blocked ad:', error.message);
            });
          }
        });
      } catch (error) {
        console.error('Error blocking ads with selector:', selector, error);
      }
    });
  }

  // Initial ad blocking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', blockAds);
  } else {
    blockAds();
  }

  // Monitor for dynamically added ads
  const adObserver = new MutationObserver((mutations) => {
    if (!contentBlockingEnabled) return;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node or its children match ad selectors
          adSelectors.forEach(selector => {
            try {
              if (node.matches && node.matches(selector)) {
                node.style.display = 'none';
                blockedAdsCount++;

                chrome.runtime.sendMessage({
                  action: 'logBlockedAd',
                  url: node.src || node.href || 'unknown',
                  currentUrl: window.location.href,
                  adType: 'dynamic',
                  selector: selector
                }).catch(() => {});
              }

              // Check children
              const childAds = node.querySelectorAll && node.querySelectorAll(selector);
              if (childAds) {
                childAds.forEach(childAd => {
                  if (childAd.style.display !== 'none') {
                    childAd.style.display = 'none';
                    blockedAdsCount++;

                    chrome.runtime.sendMessage({
                      action: 'logBlockedAd',
                      url: childAd.src || childAd.href || 'unknown',
                      currentUrl: window.location.href,
                      adType: 'dynamic',
                      selector: selector
                    }).catch(() => {});
                  }
                });
              }
            } catch (error) {
              // Ignore selector errors
            }
          });
        }
      });
    });
  });

  // Start observing
  if (document.body) {
    adObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        adObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
  }

  console.log('🚫 Ad blocking initialized');
}

// Monitor download links
function monitorDownloads() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && target.href) {
      try {
        const url = new URL(target.href);
        const suspiciousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js'];

        if (suspiciousExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
          event.preventDefault();

          // Send message to background script for malware check
          chrome.runtime.sendMessage({
            action: 'checkDownload',
            url: target.href
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error checking download:', chrome.runtime.lastError);
              // Proceed with download if check fails
              window.open(target.href, '_blank');
              return;
            }

            if (response && response.isThreat) {
              createThreatWarning('malware', 'This download may contain malware');
            } else {
              // If safe, proceed with download
              window.open(target.href, '_blank');
            }
          });
        }
      } catch (error) {
        console.error('Error processing download link:', error);
        // Don't prevent download if URL parsing fails
      }
    }
  });
}

// Legacy scanning indicator (kept for backward compatibility)
function createScanningIndicator() {
  // Scanning visual feedback permanently removed
}

function removeScanningIndicator() {
  if (scanningIndicator) {
    scanningIndicator.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (scanningIndicator && scanningIndicator.parentNode) {
        scanningIndicator.parentNode.removeChild(scanningIndicator);
      }
      scanningIndicator = null;
    }, 300);
  }
}

// Scan Results Panel with auto-close and enhanced close functionality
function showScanResultsPanel(scanResults = {}) {
  // Remove existing panel
  if (scanResultsPanel) {
    scanResultsPanel.remove();
  }

  scanResultsPanel = document.createElement('div');
  scanResultsPanel.id = 'threat-detector-results-panel';

  const hasThreats = scanResults.threats && scanResults.threats.length > 0;
  const threatCount = hasThreats ? scanResults.threats.length : 0;

  // Auto-close timer (5 seconds)
  let autoCloseTimer = null;

  // Add keyboard support (Escape key)
  const handleKeyPress = (event) => {
    if (event.key === 'Escape') {
      console.log('⌨️ Closing scan results panel with Escape key');
      closePanel();
    }
  };

  // Function to close the panel
  const closePanel = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    // Remove keyboard event listener
    document.removeEventListener('keydown', handleKeyPress);

    if (scanResultsPanel && scanResultsPanel.parentNode) {
      scanResultsPanel.style.animation = 'slideOutScale 0.3s ease-in';
      setTimeout(() => {
        if (scanResultsPanel && scanResultsPanel.parentNode) {
          scanResultsPanel.remove();
        }
      }, 300);
    }
  };

  // Set auto-close timer for 5 seconds
  autoCloseTimer = setTimeout(() => {
    console.log('🕐 Auto-closing scan results panel after 5 seconds');
    closePanel();
  }, 5000);

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyPress);

  scanResultsPanel.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      z-index: 2147483647;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInScale 0.3s ease-out;
    ">
      <div style="
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        ">Scan Results</h3>
        <button id="scan-results-close-x" style="
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        " onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#6b7280'">×</button>
      </div>

      <div style="padding: 1.5rem;">
        <div style="
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 8px;
          background: ${hasThreats ? '#fef2f2' : '#f0fdf4'};
          border: 1px solid ${hasThreats ? '#fecaca' : '#bbf7d0'};
        ">
          <div style="font-size: 1.5rem;">
            ${hasThreats ? '🚨' : '🛡️'}
          </div>
          <div>
            <div style="
              font-weight: 600;
              color: ${hasThreats ? '#dc2626' : '#059669'};
              margin-bottom: 0.25rem;
            ">
              ${hasThreats ? `${threatCount} Threat${threatCount > 1 ? 's' : ''} Detected` : 'Site Secure'}
            </div>
            <div style="
              font-size: 0.875rem;
              color: #6b7280;
            ">
              ${hasThreats ? 'Security issues found on this website' : 'No security threats detected'}
            </div>
          </div>
        </div>

        ${hasThreats ? `
          <div style="margin-bottom: 1rem;">
            <h4 style="
              margin: 0 0 0.75rem 0;
              font-size: 1rem;
              font-weight: 600;
              color: #1f2937;
            ">Detected Threats</h4>
            ${scanResults.threats.map(threat => `
              <div style="
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: 0.75rem;
                margin-bottom: 0.5rem;
              ">
                <div style="
                  font-weight: 500;
                  color: #dc2626;
                  margin-bottom: 0.25rem;
                ">${threat.type || 'Unknown Threat'}</div>
                <div style="
                  font-size: 0.875rem;
                  color: #6b7280;
                  margin-bottom: 0.5rem;
                ">${threat.description || 'No description available'}</div>
                <div style="
                  font-size: 0.75rem;
                  color: #9ca3af;
                ">Source: ${threat.source || 'Unknown'}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="margin-bottom: 1rem;">
          <h4 style="
            margin: 0 0 0.75rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
          ">Scan Information</h4>
          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 0.75rem;
          ">
            <div style="
              display: grid;
              gap: 0.5rem;
              font-size: 0.875rem;
            ">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">URL:</span>
                <span style="color: #1f2937; word-break: break-all;">${window.location.hostname}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">Scan Time:</span>
                <span style="color: #1f2937;">${new Date().toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280;">APIs Used:</span>
                <span style="color: #1f2937;">${scanResults.apisUsed || 'Multiple'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        ">
          <button id="scan-results-close-btn" style="
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">Close</button>
          <button onclick="window.open(chrome.runtime.getURL('dashboard.html'), '_blank')" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
          ">View Dashboard</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes slideInScale {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @keyframes slideOutScale {
        from {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9);
        }
      }

      .auto-close-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        border-radius: 0 0 12px 12px;
        animation: progressBar 5s linear;
      }

      @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
      }
    </style>
  `;

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2147483646;
    transition: opacity 0.3s ease;
  `;
  backdrop.addEventListener('click', closePanel);

  scanResultsPanel.appendChild(backdrop);

  // Add auto-close progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'auto-close-progress';
  const modalContent = scanResultsPanel.querySelector('div[style*="position: fixed"]');
  if (modalContent) {
    modalContent.style.position = 'relative';
    modalContent.appendChild(progressBar);
  }

  // Safely append to document
  if (document.body) {
    document.body.appendChild(scanResultsPanel);

    // Add event listeners after DOM insertion
    setTimeout(() => {
      const closeXBtn = document.getElementById('scan-results-close-x');
      const closeBtn = document.getElementById('scan-results-close-btn');

      if (closeXBtn) {
        closeXBtn.addEventListener('click', closePanel);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
      }

      // Pause auto-close on hover
      const modal = scanResultsPanel.querySelector('div[style*="position: fixed"]');
      if (modal) {
        modal.addEventListener('mouseenter', () => {
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            console.log('⏸️ Auto-close paused on hover');
          }
          if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
          }
        });

        modal.addEventListener('mouseleave', () => {
          // Resume auto-close with remaining time
          autoCloseTimer = setTimeout(() => {
            console.log('🕐 Auto-closing scan results panel (resumed)');
            closePanel();
          }, 2000); // Give 2 more seconds after mouse leave

          if (progressBar) {
            progressBar.style.animationPlayState = 'running';
          }
        });
      }
    }, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) {
        document.body.appendChild(scanResultsPanel);

        // Add event listeners after DOM insertion
        setTimeout(() => {
          const closeXBtn = document.getElementById('scan-results-close-x');
          const closeBtn = document.getElementById('scan-results-close-btn');

          if (closeXBtn) {
            closeXBtn.addEventListener('click', closePanel);
          }
          if (closeBtn) {
            closeBtn.addEventListener('click', closePanel);
          }
        }, 100);
      }
    });
  }
}

// Optimized message listener with binary status system
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'showThreatWarning':
      createThreatWarning(request.threatType, request.description, request.threatDetails);
      sendResponse({ success: true });
      break;

    case 'showBinaryStatus':
      // Simplified binary status system
      createBinaryStatusIndicator(request.status);
      sendResponse({ success: true });
      break;

    case 'showScanResultsPanel':
      showScanResultsPanel(request.results || currentScanResults);
      sendResponse({ success: true });
      break;

    case 'enableContentBlocking':
      // Enable intelligent content blocking
      contentBlockingEnabled = true;
      blockedThreats = request.threats || [];
      threatSeverity = request.severity || 'medium';

      console.log(`🚫 Content blocking enabled for ${blockedThreats.length} threats (severity: ${threatSeverity})`);

      // Initialize popup blocking if not already done
      if (typeof initializePopupBlocking === 'function') {
        initializePopupBlocking();
      }

      // Initialize ad blocking if not already done
      if (typeof initializeAdBlocking === 'function') {
        initializeAdBlocking();
      }

      sendResponse({ success: true, blocked: true });
      break;

    case 'enableAdvancedBlocking':
      // Enable advanced content blocker
      if (window.threatContentBlocker) {
        window.threatContentBlocker.enable(request.threats || [], request.severity || 'medium');
        console.log('🛡️ Advanced content blocker enabled');
        sendResponse({ success: true, advancedBlocking: true });
      } else {
        console.warn('⚠️ Advanced content blocker not available');
        sendResponse({ success: false, error: 'Advanced content blocker not available' });
      }
      break;

    case 'disableAdvancedBlocking':
      // Disable advanced content blocker
      if (window.threatContentBlocker) {
        window.threatContentBlocker.disable();
        console.log('✅ Advanced content blocker disabled');
        sendResponse({ success: true, advancedBlocking: false });
      } else {
        sendResponse({ success: false, error: 'Advanced content blocker not available' });
      }
      break;

    case 'getBlockingStats':
      // Get blocking statistics from advanced content blocker
      if (window.threatContentBlocker) {
        const stats = window.threatContentBlocker.getBlockingStats();
        sendResponse({ success: true, stats: stats });
      } else {
        sendResponse({ success: false, error: 'Advanced content blocker not available' });
      }
      break;

    case 'disableContentBlocking':
      // Disable content blocking
      contentBlockingEnabled = false;
      blockedThreats = [];
      threatSeverity = 'none';

      console.log('✅ Content blocking disabled');
      sendResponse({ success: true, blocked: false });
      break;

    // Legacy support for old scanning indicator
    case 'showScanningIndicator':
      if (request.isScanning) {
        createBinaryStatusIndicator('scanning');
      } else {
        removeBinaryStatusIndicator();
      }
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    monitorPageBehavior();
    monitorDownloads();
    initializePopupBlocking();
    initializeAdBlocking();
  });
} else {
  monitorPageBehavior();
  monitorDownloads();
  initializePopupBlocking();
  initializeAdBlocking();
}

console.log('AI-Powered Threat Detector content script loaded with intelligent blocking and ad blocking');
