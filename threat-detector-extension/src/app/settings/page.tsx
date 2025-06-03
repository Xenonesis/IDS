'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, Globe, Bell, Database, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ExtensionSettings {
  realTimeScanning: boolean;
  phishingDetection: boolean;
  malwareDetection: boolean;
  anomalyDetection: boolean;
  notifications: boolean;
  autoUpdate: boolean;
  logRetentionDays: number;
}

interface APISettings {
  googleSafeBrowsingKey: string;
  virusTotalKey: string;
  phishTankEnabled: boolean;
  urlScanKey: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    realTimeScanning: true,
    phishingDetection: true,
    malwareDetection: true,
    anomalyDetection: false,
    notifications: true,
    autoUpdate: true,
    logRetentionDays: 30
  });

  const [apiSettings, setApiSettings] = useState<APISettings>({
    googleSafeBrowsingKey: '',
    virusTotalKey: '',
    phishTankEnabled: true,
    urlScanKey: '019706e5-f185-74e4-8709-f7d2360a59b9'
  });

  const [showApiKeys, setShowApiKeys] = useState({
    googleSafeBrowsingKey: false,
    virusTotalKey: false,
    urlScanKey: false
  });

  const [newWhitelistDomain, setNewWhitelistDomain] = useState('');
  const [newBlacklistDomain, setNewBlacklistDomain] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Load extension settings
        const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
        if (settingsResponse) {
          setSettings(prev => ({ ...prev, ...settingsResponse }));
        }

        // Load API keys
        const apiKeysResult = await chrome.storage.local.get(['apiKeys']);
        const apiKeys = apiKeysResult.apiKeys || {};
        setApiSettings(prev => ({
          ...prev,
          googleSafeBrowsingKey: apiKeys.googleSafeBrowsing || '',
          virusTotalKey: apiKeys.virusTotal || '',
          phishTankEnabled: !!apiKeys.phishTank,
          urlScanKey: apiKeys.urlScan || '019706e5-f185-74e4-8709-f7d2360a59b9'
        }));

        // Load whitelist
        const whitelistResponse = await chrome.runtime.sendMessage({ action: 'getWhitelist' });
        if (whitelistResponse.success) {
          setWhitelist(whitelistResponse.whitelist);
        }

        // Load blacklist
        const blacklistResponse = await chrome.runtime.sendMessage({ action: 'getBlacklist' });
        if (blacklistResponse.success) {
          setBlacklist(blacklistResponse.blacklist);
        }
      } else {
        // Fallback for development/preview
        setWhitelist(['github.com', 'stackoverflow.com', 'google.com']);
        setBlacklist(['malicious-site.com', 'phishing-example.net']);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback data
      setWhitelist(['github.com', 'stackoverflow.com', 'google.com']);
      setBlacklist(['malicious-site.com', 'phishing-example.net']);
    }
  };

  const handleSettingChange = (key: keyof ExtensionSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApiSettingChange = (key: keyof APISettings, value: string | boolean) => {
    setApiSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleApiKeyVisibility = (key: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addToWhitelist = () => {
    if (newWhitelistDomain && !whitelist.includes(newWhitelistDomain)) {
      setWhitelist(prev => [...prev, newWhitelistDomain]);
      setNewWhitelistDomain('');
    }
  };

  const addToBlacklist = () => {
    if (newBlacklistDomain && !blacklist.includes(newBlacklistDomain)) {
      setBlacklist(prev => [...prev, newBlacklistDomain]);
      setNewBlacklistDomain('');
    }
  };

  const removeFromWhitelist = (domain: string) => {
    setWhitelist(prev => prev.filter(item => item !== domain));
  };

  const removeFromBlacklist = (domain: string) => {
    setBlacklist(prev => prev.filter(item => item !== domain));
  };

  const saveSettings = async () => {
    setSaveStatus('saving');

    try {
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Save extension settings
        const settingsResponse = await chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: {
            realTimeScanning: settings.realTimeScanning,
            phishingDetection: settings.phishingDetection,
            malwareDetection: settings.malwareDetection,
            anomalyDetection: settings.anomalyDetection,
            notifications: settings.notifications,
            autoUpdate: settings.autoUpdate,
            logRetentionDays: settings.logRetentionDays
          }
        });

        if (!settingsResponse.success) {
          throw new Error('Failed to save settings');
        }

        // Save API keys
        const apiKeysResponse = await chrome.runtime.sendMessage({
          action: 'updateAPIKeys',
          apiKeys: {
            googleSafeBrowsing: apiSettings.googleSafeBrowsingKey,
            virusTotal: apiSettings.virusTotalKey,
            phishTank: apiSettings.phishTankEnabled ? 'enabled' : '',
            urlScan: apiSettings.urlScanKey
          }
        });

        if (!apiKeysResponse.success) {
          throw new Error('Failed to save API keys');
        }

        // Save whitelist
        const whitelistResponse = await chrome.runtime.sendMessage({
          action: 'updateWhitelist',
          whitelist: whitelist
        });

        if (!whitelistResponse.success) {
          throw new Error('Failed to save whitelist');
        }

        // Save blacklist
        const blacklistResponse = await chrome.runtime.sendMessage({
          action: 'updateBlacklist',
          blacklist: blacklist
        });

        if (!blacklistResponse.success) {
          throw new Error('Failed to save blacklist');
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        // Simulate save for development/preview
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Configure your threat detection preferences</p>
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Detection Settings */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Detection Settings
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Real-time Scanning</h3>
                <p className="text-sm text-gray-500">Automatically scan websites as you browse</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.realTimeScanning}
                  onChange={(e) => handleSettingChange('realTimeScanning', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Phishing Detection</h3>
                <p className="text-sm text-gray-500">Detect and warn about phishing websites</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.phishingDetection}
                  onChange={(e) => handleSettingChange('phishingDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Malware Detection</h3>
                <p className="text-sm text-gray-500">Scan downloads and links for malware</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.malwareDetection}
                  onChange={(e) => handleSettingChange('malwareDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Anomaly Detection (Beta)</h3>
                <p className="text-sm text-gray-500">AI-powered detection of suspicious behavior</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anomalyDetection}
                  onChange={(e) => handleSettingChange('anomalyDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Configuration
            </h2>
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">API Keys Required</p>
                  <p>To enable full threat detection, you need to configure API keys for external services.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Google Safe Browsing API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKeys.googleSafeBrowsingKey ? 'text' : 'password'}
                  value={apiSettings.googleSafeBrowsingKey}
                  onChange={(e) => handleApiSettingChange('googleSafeBrowsingKey', e.target.value)}
                  placeholder="Enter your Google Safe Browsing API key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('googleSafeBrowsingKey')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showApiKeys.googleSafeBrowsingKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                VirusTotal API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKeys.virusTotalKey ? 'text' : 'password'}
                  value={apiSettings.virusTotalKey}
                  onChange={(e) => handleApiSettingChange('virusTotalKey', e.target.value)}
                  placeholder="Enter your VirusTotal API key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('virusTotalKey')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showApiKeys.virusTotalKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                URLScan.io API Key
                <span className="text-gray-600 text-xs ml-1 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKeys.urlScanKey ? 'text' : 'password'}
                  value={apiSettings.urlScanKey}
                  onChange={(e) => handleApiSettingChange('urlScanKey', e.target.value)}
                  placeholder="Enter your URLScan.io API key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('urlScanKey')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showApiKeys.urlScanKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">PhishTank Integration</h3>
                <p className="text-sm text-gray-500">Use PhishTank database for phishing detection</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiSettings.phishTankEnabled}
                  onChange={(e) => handleApiSettingChange('phishTankEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Domain Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Whitelist */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Whitelist
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newWhitelistDomain}
                  onChange={(e) => setNewWhitelistDomain(e.target.value)}
                  placeholder="Enter domain (e.g., example.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={addToWhitelist}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {whitelist.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{domain}</span>
                    <button
                      onClick={() => removeFromWhitelist(domain)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blacklist */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Blacklist
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newBlacklistDomain}
                  onChange={(e) => setNewBlacklistDomain(e.target.value)}
                  placeholder="Enter domain (e.g., malicious.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={addToBlacklist}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {blacklist.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{domain}</span>
                    <button
                      onClick={() => removeFromBlacklist(domain)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
