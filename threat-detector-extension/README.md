# AI-Powered Browser Extension: Threat Detector

A comprehensive browser extension built with Next.js that detects and warns users about online cybersecurity threats using AI and external threat intelligence APIs.

## 🔧 Features

- **Phishing URL Detection** - Real-time URL scanning using Google Safe Browsing API and AI-based classification
- **Malware Link Detection** - Scans download links using VirusTotal API
- **Anomaly Detection** - AI-powered behavioral analysis for suspicious activity
- **Threat Dashboard** - Comprehensive logging and management interface
- **Customizable Settings** - Fine-tune protection levels and manage whitelists/blacklists

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Chrome browser for testing

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Keys (Optional but recommended):**
   - Get a Google Safe Browsing API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Get a VirusTotal API key from [VirusTotal](https://www.virustotal.com/gui/join-us)
   - Update the API keys in `public/background.js`

3. **Build the extension:**
   ```bash
   npm run build:extension
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

### Development

1. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

2. **View the UI components:**
   - Main page: http://localhost:3000
   - Popup demo: http://localhost:3000/popup
   - Dashboard: http://localhost:3000/dashboard
   - Settings: http://localhost:3000/settings

## 📁 Project Structure

```
threat-detector-extension/
├── public/                     # Extension files
│   ├── manifest.json          # Chrome extension manifest
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script
│   ├── popup.html             # Extension popup HTML
│   └── popup.js               # Extension popup JavaScript
├── src/
│   └── app/
│       ├── page.tsx           # Landing page
│       ├── popup/page.tsx     # Popup component demo
│       ├── dashboard/page.tsx # Dashboard interface
│       └── settings/page.tsx  # Settings interface
└── extension/                 # Built extension (after build)
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| UI Framework | Next.js 15 + React 19 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| AI/ML | TensorFlow.js |
| APIs | Google Safe Browsing, VirusTotal, PhishTank |
| Storage | Chrome Storage API |
| Language | TypeScript |

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build Next.js application
- `npm run build:extension` - Build and prepare extension files
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security Features

### Threat Detection Methods

1. **URL Reputation Checking**
   - Google Safe Browsing API integration
   - VirusTotal URL scanning
   - PhishTank database lookup

2. **Behavioral Analysis**
   - Excessive redirect detection
   - Suspicious script injection monitoring
   - Download link analysis

3. **User Controls**
   - Whitelist trusted domains
   - Blacklist known malicious sites
   - Customizable threat sensitivity

## 🚨 Important Notes

- **API Rate Limits:** Be aware of API rate limits for external services
- **Privacy:** The extension processes URLs locally and only sends hashes to external APIs when necessary
- **Performance:** Real-time scanning may impact browsing performance on slower connections

## 🆘 Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Ensure manifest.json is valid
   - Check Chrome developer console for errors

2. **API calls failing:**
   - Verify API keys are correctly configured
   - Check network connectivity
   - Review API rate limits

3. **UI not displaying correctly:**
   - Ensure all dependencies are installed
   - Check for TypeScript compilation errors
