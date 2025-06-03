'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Settings, BarChart3, Scan, ExternalLink } from 'lucide-react';

interface ThreatLog {
  url: string;
  threats: Array<{
    type: string;
    description: string;
    source: string;
  }>;
  timestamp: string;
}

interface ExtensionSettings {
  realTimeScanning: boolean;
  phishingDetection: boolean;
  malwareDetection: boolean;
  anomalyDetection: boolean;
}

export default function PopupPage() {
  const [threatLog, setThreatLog] = useState<ThreatLog[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings>({
    realTimeScanning: true,
    phishingDetection: true,
    malwareDetection: true,
    anomalyDetection: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({
    threatsBlocked: 0,
    sitesScanned: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // In a real extension, this would communicate with the background script
      // For now, we'll use mock data
      setStats({
        threatsBlocked: 12,
        sitesScanned: 156
      });
      
      setThreatLog([
        {
          url: 'https://suspicious-site.com',
          threats: [{ type: 'phishing', description: 'Phishing attempt detected', source: 'Google Safe Browsing' }],
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleScanCurrentSite = async () => {
    setIsScanning(true);
    try {
      // Simulate scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      // In a real extension, this would trigger a scan via the background script
    } catch (error) {
      console.error('Error scanning site:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSetting = (key: keyof ExtensionSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatusColor = () => {
    if (threatLog.length > 0) return 'text-red-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (threatLog.length > 0) return 'Threats Detected';
    return 'Protected';
  };

  return (
    <div className="w-80 min-h-96 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6" />
          <h1 className="text-lg font-semibold">Threat Detector</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${threatLog.length > 0 ? 'bg-yellow-400' : 'bg-green-400'}`} />
          <span className="text-sm">{getStatusText()}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Statistics */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-xl font-bold text-red-600">{stats.threatsBlocked}</div>
              <div className="text-xs text-gray-500">Threats Blocked</div>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <div className="text-xl font-bold text-red-600">{stats.sitesScanned}</div>
              <div className="text-xs text-gray-500">Sites Scanned</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={handleScanCurrentSite}
              disabled={isScanning}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Scan className="w-4 h-4" />
              {isScanning ? 'Scanning...' : 'Scan Site'}
            </button>
            <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-300 flex items-center justify-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Settings</h3>
          <div className="space-y-2">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <button
                  onClick={() => toggleSetting(key as keyof ExtensionSettings)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    value ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      value ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Threats */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recent Threats</h3>
          <div className="max-h-32 overflow-y-auto">
            {threatLog.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                No threats detected recently
              </div>
            ) : (
              <div className="space-y-2">
                {threatLog.slice(-3).reverse().map((threat, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-700 font-medium mb-1 break-all">
                      {new URL(threat.url).hostname}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        {threat.threats[0]?.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(threat.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white p-3">
        <div className="flex justify-between text-xs">
          <button className="text-gray-600 hover:text-red-600 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Settings
          </button>
          <button className="text-gray-600 hover:text-red-600">Help</button>
          <button className="text-gray-600 hover:text-red-600">About</button>
        </div>
      </div>
    </div>
  );
}
