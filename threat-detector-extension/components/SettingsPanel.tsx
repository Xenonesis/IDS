'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Key, Globe, AlertTriangle, Save, Eye, EyeOff } from 'lucide-react';

interface SettingsData {
  phishingDetection: boolean;
  malwareDetection: boolean;
  anomalyDetection: boolean;
  realTimeScanning: boolean;
  apiKeys: {
    googleSafeBrowsing: string;
    virusTotal: string;
    phishTank: string;
    urlScan: string;
  };
  whitelist: string[];
  blacklist: string[];
}

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    phishingDetection: true,
    malwareDetection: true,
    anomalyDetection: false,
    realTimeScanning: true,
    apiKeys: {
      googleSafeBrowsing: '',
      virusTotal: '',
      phishTank: '',
      urlScan: '019706e5-f185-74e4-8709-f7d2360a59b9'
    },
    whitelist: [],
    blacklist: []
  });

  const [showApiKeys, setShowApiKeys] = useState({
    googleSafeBrowsing: false,
    virusTotal: false,
    phishTank: false,
    urlScan: false
  });

  const [newWhitelistUrl, setNewWhitelistUrl] = useState('');
  const [newBlacklistUrl, setNewBlacklistUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        setSettings(prev => ({
          ...prev,
          apiKeys: {
            googleSafeBrowsing: apiKeys.googleSafeBrowsing || '',
            virusTotal: apiKeys.virusTotal || '',
            phishTank: apiKeys.phishTank || '',
            urlScan: apiKeys.urlScan || '019706e5-f185-74e4-8709-f7d2360a59b9'
          }
        }));

        // Load whitelist
        const whitelistResponse = await chrome.runtime.sendMessage({ action: 'getWhitelist' });
        if (whitelistResponse.success) {
          setSettings(prev => ({ ...prev, whitelist: whitelistResponse.whitelist }));
        }

        // Load blacklist
        const blacklistResponse = await chrome.runtime.sendMessage({ action: 'getBlacklist' });
        if (blacklistResponse.success) {
          setSettings(prev => ({ ...prev, blacklist: blacklistResponse.blacklist }));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Save extension settings
        const settingsResponse = await chrome.runtime.sendMessage({
          action: 'updateSettings',
          settings: {
            phishingDetection: settings.phishingDetection,
            malwareDetection: settings.malwareDetection,
            anomalyDetection: settings.anomalyDetection,
            realTimeScanning: settings.realTimeScanning
          }
        });

        if (!settingsResponse.success) {
          throw new Error('Failed to save settings');
        }

        // Save API keys
        const apiKeysResponse = await chrome.runtime.sendMessage({
          action: 'updateAPIKeys',
          apiKeys: settings.apiKeys
        });

        if (!apiKeysResponse.success) {
          throw new Error('Failed to save API keys');
        }

        // Save whitelist
        const whitelistResponse = await chrome.runtime.sendMessage({
          action: 'updateWhitelist',
          whitelist: settings.whitelist
        });

        if (!whitelistResponse.success) {
          throw new Error('Failed to save whitelist');
        }

        // Save blacklist
        const blacklistResponse = await chrome.runtime.sendMessage({
          action: 'updateBlacklist',
          blacklist: settings.blacklist
        });

        if (!blacklistResponse.success) {
          throw new Error('Failed to save blacklist');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateFeatureSetting = (feature: keyof SettingsData, value: boolean) => {
    setSettings(prev => ({ ...prev, [feature]: value }));
  };

  const updateApiKey = (service: keyof SettingsData['apiKeys'], value: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [service]: value }
    }));
  };

  const toggleApiKeyVisibility = (service: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const addToWhitelist = () => {
    if (newWhitelistUrl.trim() && !settings.whitelist.includes(newWhitelistUrl.trim())) {
      setSettings(prev => ({
        ...prev,
        whitelist: [...prev.whitelist, newWhitelistUrl.trim()]
      }));
      setNewWhitelistUrl('');
    }
  };

  const removeFromWhitelist = (url: string) => {
    setSettings(prev => ({
      ...prev,
      whitelist: prev.whitelist.filter(item => item !== url)
    }));
  };

  const addToBlacklist = () => {
    if (newBlacklistUrl.trim() && !settings.blacklist.includes(newBlacklistUrl.trim())) {
      setSettings(prev => ({
        ...prev,
        blacklist: [...prev.blacklist, newBlacklistUrl.trim()]
      }));
      setNewBlacklistUrl('');
    }
  };

  const removeFromBlacklist = (url: string) => {
    setSettings(prev => ({
      ...prev,
      blacklist: prev.blacklist.filter(item => item !== url)
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Extension Settings</h1>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-8">
        {/* Feature Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Protection Features</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Phishing Detection</h3>
                <p className="text-sm text-gray-600">Detect and block phishing websites</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.phishingDetection}
                  onChange={(e) => updateFeatureSetting('phishingDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Malware Detection</h3>
                <p className="text-sm text-gray-600">Scan downloads and links for malware</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.malwareDetection}
                  onChange={(e) => updateFeatureSetting('malwareDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Anomaly Detection</h3>
                <p className="text-sm text-gray-600">AI-powered behavioral analysis (experimental)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.anomalyDetection}
                  onChange={(e) => updateFeatureSetting('anomalyDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Real-time Scanning</h3>
                <p className="text-sm text-gray-600">Automatically scan websites as you browse</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.realTimeScanning}
                  onChange={(e) => updateFeatureSetting('realTimeScanning', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.apiKeys).map(([service, key]) => (
              <div key={service} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900 capitalize">
                  {service.replace(/([A-Z])/g, ' $1').trim()} API Key
                  {service === 'phishTank' || service === 'urlScan' ? (
                    <span className="text-gray-600 text-xs ml-1 font-normal">(Optional)</span>
                  ) : (
                    <span className="text-red-600 text-xs ml-1 font-normal">(Required)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[service as keyof typeof showApiKeys] ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => updateApiKey(service as keyof SettingsData['apiKeys'], e.target.value)}
                    placeholder={`Enter your ${service} API key`}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility(service as keyof typeof showApiKeys)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                  >
                    {showApiKeys[service as keyof typeof showApiKeys] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">API Key Security</p>
                <p>API keys are stored locally in your browser and never transmitted to external servers except for the intended API calls.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Whitelist Management */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Trusted Sites (Whitelist)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newWhitelistUrl}
                onChange={(e) => setNewWhitelistUrl(e.target.value)}
                placeholder="Enter domain (e.g., example.com)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onKeyPress={(e) => e.key === 'Enter' && addToWhitelist()}
              />
              <button
                onClick={addToWhitelist}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto">
              {settings.whitelist.length === 0 ? (
                <p className="text-gray-500 text-sm">No trusted sites added</p>
              ) : (
                <div className="space-y-2">
                  {settings.whitelist.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                      <span className="text-sm text-gray-900">{url}</span>
                      <button
                        onClick={() => removeFromWhitelist(url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blacklist Management */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Blocked Sites (Blacklist)</h2>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newBlacklistUrl}
                onChange={(e) => setNewBlacklistUrl(e.target.value)}
                placeholder="Enter domain (e.g., malicious-site.com)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                onKeyPress={(e) => e.key === 'Enter' && addToBlacklist()}
              />
              <button
                onClick={addToBlacklist}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Add
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto">
              {settings.blacklist.length === 0 ? (
                <p className="text-gray-500 text-sm">No blocked sites added</p>
              ) : (
                <div className="space-y-2">
                  {settings.blacklist.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                      <span className="text-sm text-gray-900">{url}</span>
                      <button
                        onClick={() => removeFromBlacklist(url)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
