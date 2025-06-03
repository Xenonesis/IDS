// Centralized Feedback Management System
// This module manages all visual feedback for the threat detection extension

class FeedbackManager {
  constructor() {
    this.activeIndicators = new Map();
    this.scanHistory = new Map();
    this.notificationQueue = [];
    this.isProcessingQueue = false;
  }

  // Initialize feedback manager
  init() {
    console.log('🎯 Feedback Manager initialized');
    this.setupMessageListener();
    this.startQueueProcessor();
  }

  // Setup message listener for feedback commands
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action?.startsWith('feedback_')) {
        this.handleFeedbackMessage(request, sender, sendResponse);
        return true;
      }
    });
  }

  // Handle feedback-specific messages
  async handleFeedbackMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'feedback_showStatus':
          await this.showSecurityStatus(request.status, request.details);
          sendResponse({ success: true });
          break;
          
        case 'feedback_showScanProgress':
          await this.showScanProgress(request.progress, request.details);
          sendResponse({ success: true });
          break;
          
        case 'feedback_showNotification':
          await this.showNotification(request.type, request.message, request.options);
          sendResponse({ success: true });
          break;
          
        case 'feedback_updateScanHistory':
          this.updateScanHistory(request.url, request.results);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown feedback action' });
      }
    } catch (error) {
      console.error('Error handling feedback message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Show security status with enhanced visual feedback
  async showSecurityStatus(status, details = {}) {
    const statusConfig = this.getStatusConfiguration(status);
    
    // Create or update status indicator
    const indicator = this.createStatusIndicator(statusConfig, details);
    this.activeIndicators.set('security-status', indicator);
    
    // Auto-hide for non-critical statuses
    if (status === 'secure' || status === 'info') {
      setTimeout(() => {
        this.removeIndicator('security-status');
      }, statusConfig.autoHideDelay || 5000);
    }
    
    // Sync with dashboard if available
    this.syncWithDashboard('status_update', { status, details });
  }

  // Show scan progress with real-time updates
  async showScanProgress(progress, details = {}) {
    const progressIndicator = this.createProgressIndicator(progress, details);
    this.activeIndicators.set('scan-progress', progressIndicator);
    
    // Update progress bar
    this.updateProgressBar(progress);
    
    // Complete scan feedback
    if (progress >= 100) {
      setTimeout(() => {
        this.removeIndicator('scan-progress');
      }, 1000);
    }
  }

  // Show notification with queuing system
  async showNotification(type, message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type,
      message,
      options,
      timestamp: new Date()
    };
    
    this.notificationQueue.push(notification);
    
    if (!this.isProcessingQueue) {
      this.processNotificationQueue();
    }
  }

  // Process notification queue to avoid overwhelming user
  async processNotificationQueue() {
    this.isProcessingQueue = true;
    
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      await this.displayNotification(notification);
      
      // Wait between notifications
      await this.delay(notification.options.delay || 2000);
    }
    
    this.isProcessingQueue = false;
  }

  // Display individual notification
  async displayNotification(notification) {
    const notificationElement = this.createNotificationElement(notification);
    this.activeIndicators.set(`notification-${notification.id}`, notificationElement);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeIndicator(`notification-${notification.id}`);
    }, notification.options.duration || 4000);
  }

  // Update scan history for dashboard sync
  updateScanHistory(url, results) {
    this.scanHistory.set(url, {
      ...results,
      timestamp: new Date(),
      viewed: false
    });
    
    // Keep only last 50 entries
    if (this.scanHistory.size > 50) {
      const firstKey = this.scanHistory.keys().next().value;
      this.scanHistory.delete(firstKey);
    }
    
    // Sync with dashboard
    this.syncWithDashboard('scan_history_update', { url, results });
  }

  // Get status configuration for different security states
  getStatusConfiguration(status) {
    const configs = {
      secure: {
        color: '#10b981',
        icon: '🛡️',
        text: 'Site Secure',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        autoHideDelay: 3000
      },
      warning: {
        color: '#f59e0b',
        icon: '⚠️',
        text: 'Potential Issues',
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        autoHideDelay: 5000
      },
      threat: {
        color: '#dc2626',
        icon: '🚨',
        text: 'Threat Detected',
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        autoHideDelay: null // Don't auto-hide threats
      },
      scanning: {
        color: '#10b981',
        icon: '🛡️',
        text: 'Site Secure',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        autoHideDelay: 3000
      },
      error: {
        color: '#ef4444',
        icon: '❌',
        text: 'Scan Error',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        autoHideDelay: 8000
      }
    };
    
    return configs[status] || configs.secure;
  }

  // Create status indicator element
  createStatusIndicator(config, details) {
    // Implementation would create DOM element
    // This is a placeholder for the actual DOM manipulation
    return {
      type: 'status-indicator',
      config,
      details,
      element: null // Would contain actual DOM element
    };
  }

  // Create progress indicator
  createProgressIndicator(progress, details) {
    return {
      type: 'progress-indicator',
      progress,
      details,
      element: null
    };
  }

  // Create notification element
  createNotificationElement(notification) {
    return {
      type: 'notification',
      notification,
      element: null
    };
  }

  // Update progress bar
  updateProgressBar(progress) {
    const progressBar = document.getElementById('threat-detector-progress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  // Remove indicator
  removeIndicator(id) {
    const indicator = this.activeIndicators.get(id);
    if (indicator && indicator.element) {
      indicator.element.remove();
    }
    this.activeIndicators.delete(id);
  }

  // Sync with dashboard
  async syncWithDashboard(eventType, data) {
    try {
      // Send message to dashboard if it's open
      chrome.runtime.sendMessage({
        action: 'dashboard_sync',
        eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Dashboard might not be open, ignore error
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get scan history for dashboard
  getScanHistory() {
    return Array.from(this.scanHistory.entries()).map(([url, data]) => ({
      url,
      ...data
    }));
  }

  // Clear all active indicators
  clearAllIndicators() {
    this.activeIndicators.forEach((indicator, id) => {
      this.removeIndicator(id);
    });
  }
}

// Initialize feedback manager
const feedbackManager = new FeedbackManager();
feedbackManager.init();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackManager;
}
