// Comprehensive threat detection API integration
import axios from 'axios';

class ThreatDetectionAPI {
  constructor() {
    this.apiKeys = {
      googleSafeBrowsing: null,
      virusTotal: null,
      phishTank: null,
      urlScan: null
    };
    
    this.endpoints = {
      googleSafeBrowsing: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
      virusTotal: 'https://www.virustotal.com/vtapi/v2/url/report',
      phishTank: 'https://checkurl.phishtank.com/checkurl/',
      urlScan: 'https://urlscan.io/api/v1/scan/'
    };

    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize API keys from storage
   */
  async initializeAPIKeys() {
    try {
      const result = await chrome.storage.local.get(['apiKeys']);
      if (result.apiKeys) {
        this.apiKeys = { ...this.apiKeys, ...result.apiKeys };
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }

  /**
   * Set API key for a specific service
   */
  async setAPIKey(service, key) {
    this.apiKeys[service] = key;
    
    try {
      const result = await chrome.storage.local.get(['apiKeys']);
      const apiKeys = result.apiKeys || {};
      apiKeys[service] = key;
      await chrome.storage.local.set({ apiKeys });
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }

  /**
   * Check if URL is in cache
   */
  getCachedResult(url) {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  /**
   * Cache URL result
   */
  setCachedResult(url, result) {
    this.cache.set(url, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Google Safe Browsing API check
   */
  async checkGoogleSafeBrowsing(url) {
    if (!this.apiKeys.googleSafeBrowsing) {
      throw new Error('Google Safe Browsing API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.endpoints.googleSafeBrowsing}?key=${this.apiKeys.googleSafeBrowsing}`,
        {
          client: {
            clientId: 'threat-detector-extension',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const matches = response.data.matches || [];
      if (matches.length > 0) {
        return {
          isThreat: true,
          source: 'Google Safe Browsing',
          threatType: matches[0].threatType,
          platformType: matches[0].platformType,
          severity: this.mapGoogleSeverity(matches[0].threatType),
          details: matches[0]
        };
      }

      return {
        isThreat: false,
        source: 'Google Safe Browsing',
        severity: 'safe'
      };
    } catch (error) {
      console.error('Google Safe Browsing API error:', error);
      throw new Error(`Google Safe Browsing check failed: ${error.message}`);
    }
  }

  /**
   * VirusTotal API check
   */
  async checkVirusTotal(url) {
    if (!this.apiKeys.virusTotal) {
      throw new Error('VirusTotal API key not configured');
    }

    try {
      const response = await axios.get(this.endpoints.virusTotal, {
        params: {
          apikey: this.apiKeys.virusTotal,
          resource: url,
          scan: 1
        },
        timeout: 15000
      });

      const data = response.data;
      
      if (data.response_code === 1) {
        const positives = data.positives || 0;
        const total = data.total || 0;
        const detectionRatio = total > 0 ? positives / total : 0;

        return {
          isThreat: positives > 0,
          source: 'VirusTotal',
          positives,
          total,
          detectionRatio,
          severity: this.mapVirusTotalSeverity(detectionRatio),
          scanDate: data.scan_date,
          permalink: data.permalink,
          scans: data.scans
        };
      } else if (data.response_code === 0) {
        return {
          isThreat: false,
          source: 'VirusTotal',
          message: 'URL not found in VirusTotal database',
          severity: 'unknown'
        };
      } else {
        throw new Error(`VirusTotal API error: ${data.verbose_msg}`);
      }
    } catch (error) {
      console.error('VirusTotal API error:', error);
      throw new Error(`VirusTotal check failed: ${error.message}`);
    }
  }

  /**
   * PhishTank API check
   */
  async checkPhishTank(url) {
    try {
      const response = await axios.post(
        this.endpoints.phishTank,
        new URLSearchParams({
          url: url,
          format: 'json',
          app_key: this.apiKeys.phishTank || ''
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      
      if (data.results && data.results.in_database) {
        return {
          isThreat: data.results.valid === 'yes',
          source: 'PhishTank',
          phishId: data.results.phish_id,
          submissionTime: data.results.submission_time,
          verified: data.results.verified === 'yes',
          severity: data.results.valid === 'yes' ? 'high' : 'low'
        };
      }

      return {
        isThreat: false,
        source: 'PhishTank',
        message: 'URL not found in PhishTank database',
        severity: 'safe'
      };
    } catch (error) {
      console.error('PhishTank API error:', error);
      // PhishTank errors are not critical, return safe result
      return {
        isThreat: false,
        source: 'PhishTank',
        error: error.message,
        severity: 'unknown'
      };
    }
  }

  /**
   * URLScan.io API check (optional)
   */
  async checkURLScan(url) {
    if (!this.apiKeys.urlScan) {
      return null; // Optional service
    }

    try {
      // Submit URL for scanning
      const submitResponse = await axios.post(
        this.endpoints.urlScan,
        { url, visibility: 'public' },
        {
          headers: {
            'API-Key': this.apiKeys.urlScan,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const scanId = submitResponse.data.uuid;
      
      // Wait a bit for scan to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Get scan results
      const resultResponse = await axios.get(
        `https://urlscan.io/api/v1/result/${scanId}/`,
        { timeout: 10000 }
      );

      const result = resultResponse.data;
      
      return {
        isThreat: result.verdicts?.overall?.malicious || false,
        source: 'URLScan.io',
        scanId,
        verdicts: result.verdicts,
        screenshot: result.task?.screenshotURL,
        severity: result.verdicts?.overall?.malicious ? 'medium' : 'safe'
      };
    } catch (error) {
      console.error('URLScan.io API error:', error);
      return null; // Optional service, don't fail
    }
  }

  /**
   * Comprehensive threat check using all available APIs
   */
  async checkURL(url) {
    // Check cache first
    const cached = this.getCachedResult(url);
    if (cached) {
      return cached;
    }

    const results = {
      url,
      timestamp: new Date().toISOString(),
      sources: {},
      overallThreat: false,
      severity: 'safe',
      confidence: 0
    };

    const checks = [];

    // Google Safe Browsing
    if (this.apiKeys.googleSafeBrowsing) {
      checks.push(
        this.checkGoogleSafeBrowsing(url)
          .then(result => { results.sources.googleSafeBrowsing = result; })
          .catch(error => { results.sources.googleSafeBrowsing = { error: error.message }; })
      );
    }

    // VirusTotal
    if (this.apiKeys.virusTotal) {
      checks.push(
        this.checkVirusTotal(url)
          .then(result => { results.sources.virusTotal = result; })
          .catch(error => { results.sources.virusTotal = { error: error.message }; })
      );
    }

    // PhishTank
    checks.push(
      this.checkPhishTank(url)
        .then(result => { results.sources.phishTank = result; })
        .catch(error => { results.sources.phishTank = { error: error.message }; })
    );

    // URLScan.io (optional)
    if (this.apiKeys.urlScan) {
      checks.push(
        this.checkURLScan(url)
          .then(result => { 
            if (result) results.sources.urlScan = result; 
          })
          .catch(error => { results.sources.urlScan = { error: error.message }; })
      );
    }

    // Wait for all checks to complete
    await Promise.all(checks);

    // Analyze results
    this.analyzeResults(results);

    // Cache result
    this.setCachedResult(url, results);

    return results;
  }

  /**
   * Analyze results from all sources and determine overall threat level
   */
  analyzeResults(results) {
    const sources = results.sources;
    let threatCount = 0;
    let totalSources = 0;
    let maxSeverity = 'safe';

    Object.values(sources).forEach(source => {
      if (source && !source.error) {
        totalSources++;
        if (source.isThreat) {
          threatCount++;
          if (this.compareSeverity(source.severity, maxSeverity) > 0) {
            maxSeverity = source.severity;
          }
        }
      }
    });

    // Determine overall threat
    results.overallThreat = threatCount > 0;
    results.severity = maxSeverity;
    results.confidence = totalSources > 0 ? (threatCount / totalSources) : 0;

    // Adjust confidence based on source reliability
    if (sources.googleSafeBrowsing?.isThreat) {
      results.confidence = Math.max(results.confidence, 0.9);
    }
    if (sources.virusTotal?.isThreat && sources.virusTotal.detectionRatio > 0.3) {
      results.confidence = Math.max(results.confidence, 0.8);
    }
  }

  /**
   * Map Google Safe Browsing threat types to severity levels
   */
  mapGoogleSeverity(threatType) {
    const severityMap = {
      'MALWARE': 'critical',
      'SOCIAL_ENGINEERING': 'high',
      'UNWANTED_SOFTWARE': 'medium',
      'POTENTIALLY_HARMFUL_APPLICATION': 'medium'
    };
    return severityMap[threatType] || 'medium';
  }

  /**
   * Map VirusTotal detection ratio to severity levels
   */
  mapVirusTotalSeverity(ratio) {
    if (ratio >= 0.5) return 'critical';
    if (ratio >= 0.3) return 'high';
    if (ratio >= 0.1) return 'medium';
    if (ratio > 0) return 'low';
    return 'safe';
  }

  /**
   * Compare severity levels
   */
  compareSeverity(severity1, severity2) {
    const levels = { 'safe': 0, 'unknown': 1, 'low': 2, 'medium': 3, 'high': 4, 'critical': 5 };
    return levels[severity1] - levels[severity2];
  }
}

// Export singleton instance
export const threatDetectionAPI = new ThreatDetectionAPI();
export default ThreatDetectionAPI;
