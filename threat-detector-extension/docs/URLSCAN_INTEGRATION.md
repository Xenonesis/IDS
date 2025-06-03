# URLScan.io Integration Guide

## Overview

This document describes the URLScan.io integration in the AI-Powered Threat Detector Extension. URLScan.io is a powerful service that analyzes websites and provides detailed security assessments.

## API Key Configuration

### Your URLScan.io API Key
```
019706e5-f185-74e4-8709-f7d2360a59b9
```

### Automatic Configuration
The extension automatically configures your URLScan.io API key during installation. The key is stored securely in Chrome's local storage.

### Manual Configuration
If you need to manually configure the API key:

1. **Via Settings Interface:**
   - Open the extension settings page
   - Navigate to "API Configuration" section
   - Enter your URLScan.io API key in the designated field
   - Click "Save Settings"

2. **Via Browser Console:**
   ```javascript
   // Set the API key
   chrome.storage.local.get(['apiKeys'], (result) => {
     const apiKeys = result.apiKeys || {};
     apiKeys.urlScan = '019706e5-f185-74e4-8709-f7d2360a59b9';
     chrome.storage.local.set({ apiKeys }, () => {
       console.log('URLScan.io API key configured');
     });
   });
   ```

## Integration Features

### 1. URL Scanning
- **Automatic scanning** of URLs as you browse
- **On-demand scanning** through the extension popup
- **Comprehensive analysis** including malware, phishing, and suspicious behavior detection

### 2. Threat Detection
- **Malicious URL detection** based on URLScan.io's analysis
- **Phishing detection** using behavioral analysis
- **Screenshot capture** for visual verification
- **Detailed verdicts** with confidence scores

### 3. Integration with Other APIs
URLScan.io works alongside other threat detection services:
- Google Safe Browsing
- VirusTotal
- PhishTank

## API Usage

### Basic URL Check
```javascript
import { threatDetectionAPI } from './api/threatDetection.js';

// Initialize API keys
await threatDetectionAPI.initializeAPIKeys();

// Check a specific URL
const result = await threatDetectionAPI.checkURLScan('https://example.com');

if (result) {
  console.log('Threat detected:', result.isThreat);
  console.log('Severity:', result.severity);
  console.log('Scan ID:', result.scanId);
}
```

### Comprehensive Check
```javascript
// Check URL using all available APIs including URLScan.io
const comprehensiveResult = await threatDetectionAPI.checkURL('https://example.com');

console.log('Overall threat:', comprehensiveResult.overallThreat);
console.log('URLScan.io result:', comprehensiveResult.sources.urlScan);
```

## Response Format

### URLScan.io Response
```javascript
{
  isThreat: boolean,           // Whether the URL is considered malicious
  source: 'URLScan.io',        // Source identifier
  scanId: string,              // Unique scan identifier
  verdicts: {                  // Detailed verdicts from URLScan.io
    overall: {
      malicious: boolean,
      score: number
    },
    engines: {
      // Individual engine results
    }
  },
  screenshot: string,          // URL to screenshot (if available)
  severity: string            // 'safe', 'low', 'medium', 'high', 'critical'
}
```

## Testing

### Test Scripts
Two test scripts are available:

1. **Setup Script:** `scripts/setup-urlscan-api.js`
   - Configures the API key
   - Tests API connectivity
   - Verifies integration

2. **Integration Test:** `scripts/test-urlscan-integration.js`
   - Tests complete integration
   - Validates API responses
   - Checks configuration status

### Running Tests
```javascript
// In browser console (extension context)
// Load and run setup script
await import('./scripts/setup-urlscan-api.js');

// Load and run integration tests
await import('./scripts/test-urlscan-integration.js');
```

## Configuration Files

### Settings Panel
- **File:** `components/SettingsPanel.tsx`
- **Features:** API key input, visibility toggle, validation

### Settings Page
- **File:** `src/app/settings/page.tsx`
- **Features:** Comprehensive settings interface

### Background Script
- **File:** `extension/background.js`
- **Features:** Automatic API key initialization

## Security Considerations

### API Key Storage
- API keys are stored in Chrome's local storage
- Keys are never transmitted except to the intended API endpoints
- Local storage is isolated per extension

### Data Privacy
- URLScan.io scans are marked as "public" by default
- No personal data is transmitted beyond the URL being scanned
- Scan results are cached locally for 5 minutes

### Rate Limiting
- URLScan.io has rate limits (typically 100 requests per day for free accounts)
- The extension implements caching to minimize API calls
- Failed requests are handled gracefully

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is correctly entered
   - Check URLScan.io account status
   - Ensure rate limits haven't been exceeded

2. **No Results Returned**
   - URLScan.io is marked as optional
   - Check browser console for error messages
   - Verify internet connectivity

3. **Slow Response Times**
   - URLScan.io scans take time to complete (10+ seconds)
   - Results may be cached from previous scans
   - Network conditions can affect response times

### Debug Commands
```javascript
// Check API key configuration
chrome.storage.local.get(['apiKeys'], console.log);

// Test API connectivity
fetch('https://urlscan.io/api/v1/scan/', {
  method: 'POST',
  headers: {
    'API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com', visibility: 'public' })
}).then(r => r.json()).then(console.log);
```

## Support

For issues related to:
- **URLScan.io API:** Contact URLScan.io support
- **Extension Integration:** Check the extension documentation
- **API Key Issues:** Verify your URLScan.io account status

## Version History

- **v1.0.0:** Initial URLScan.io integration
- **Current:** Full integration with comprehensive threat detection
