// Enhanced error handling utility for the threat detector extension

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Log an error with context information
   */
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace available',
      name: error.name || 'Error',
      context: context,
      url: window.location?.href || 'Unknown URL',
      userAgent: navigator.userAgent
    };

    this.errorLog.push(errorEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console with enhanced formatting
    console.error('🚨 Extension Error:', {
      error: errorEntry,
      context: context
    });

    // Store in chrome storage for debugging
    this.storeErrorLog();

    return errorEntry;
  }

  /**
   * Handle API response errors
   */
  handleAPIError(response, apiName, url) {
    const error = new Error(`${apiName} API Error: HTTP ${response.status}`);
    return this.logError(error, {
      apiName,
      url,
      status: response.status,
      statusText: response.statusText,
      type: 'API_ERROR'
    });
  }

  /**
   * Handle JSON parsing errors
   */
  handleJSONError(error, responseText, apiName) {
    const jsonError = new Error(`JSON Parse Error in ${apiName}: ${error.message}`);
    return this.logError(jsonError, {
      apiName,
      responseText: responseText.substring(0, 500), // Limit response text length
      originalError: error.message,
      type: 'JSON_PARSE_ERROR'
    });
  }

  /**
   * Handle Chrome runtime errors
   */
  handleRuntimeError(error, action) {
    const runtimeError = new Error(`Chrome Runtime Error: ${error.message || 'Unknown'}`);
    return this.logError(runtimeError, {
      action,
      type: 'RUNTIME_ERROR'
    });
  }

  /**
   * Store error log in chrome storage
   */
  async storeErrorLog() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          errorLog: this.errorLog.slice(-50) // Store last 50 errors
        });
      }
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  /**
   * Get error log from storage
   */
  async getErrorLog() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['errorLog']);
        return result.errorLog || [];
      }
      return this.errorLog;
    } catch (error) {
      console.error('Failed to retrieve error log:', error);
      return this.errorLog;
    }
  }

  /**
   * Clear error log
   */
  async clearErrorLog() {
    try {
      this.errorLog = [];
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['errorLog']);
      }
    } catch (error) {
      console.error('Failed to clear error log:', error);
    }
  }

  /**
   * Create a safe wrapper for async functions
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error, { ...context, function: fn.name, args });
        throw error;
      }
    };
  }

  /**
   * Create a safe wrapper for sync functions
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.logError(error, { ...context, function: fn.name, args });
        throw error;
      }
    };
  }

  /**
   * Serialize error for safe transmission
   */
  serializeError(error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      toString: error.toString()
    };
  }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = errorHandler;
} else if (typeof window !== 'undefined') {
  window.errorHandler = errorHandler;
}
