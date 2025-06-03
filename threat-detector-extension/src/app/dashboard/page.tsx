'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, TrendingUp, Clock, Globe, Settings, Download, Trash2 } from 'lucide-react';

interface ThreatLog {
  url: string;
  threats: Array<{
    type: string;
    description: string;
    source: string;
  }>;
  timestamp: string;
}

export default function DashboardPage() {
  const [threatLog, setThreatLog] = useState<ThreatLog[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [stats, setStats] = useState({
    threatsBlocked: 0,
    sitesScanned: 0,
    phishingBlocked: 0,
    malwareBlocked: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Load threat log from background script
        const threatLogResponse = await chrome.runtime.sendMessage({ action: 'getThreatLog' });
        const threatLogData = Array.isArray(threatLogResponse) ? threatLogResponse : [];
        setThreatLog(threatLogData);

        // Calculate statistics from threat log
        const phishingCount = threatLogData.filter(threat =>
          threat.threats.some((t: any) => t.type === 'phishing' || t.type === 'social_engineering')
        ).length;

        const malwareCount = threatLogData.filter(threat =>
          threat.threats.some((t: any) => t.type === 'malware' || t.type === 'malicious')
        ).length;

        // Load sites scanned count
        const sitesScannedResult = await chrome.storage.local.get('sitesScannedCount');
        const sitesScanned = sitesScannedResult.sitesScannedCount || 0;

        setStats({
          threatsBlocked: threatLogData.length,
          sitesScanned: sitesScanned,
          phishingBlocked: phishingCount,
          malwareBlocked: malwareCount
        });

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

        console.log('✅ Dashboard data loaded from extension');
      } else {
        // Fallback mock data for development
        setStats({
          threatsBlocked: 47,
          sitesScanned: 1234,
          phishingBlocked: 32,
          malwareBlocked: 15
        });

        setThreatLog([
          {
            url: 'https://malicious-site.com/login',
            threats: [{ type: 'phishing', description: 'Phishing login page detected', source: 'Google Safe Browsing' }],
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            url: 'https://suspicious-download.net/file.exe',
            threats: [{ type: 'malware', description: 'Malware detected in download', source: 'VirusTotal' }],
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          }
        ]);

        setWhitelist(['github.com', 'stackoverflow.com', 'google.com']);
        setBlacklist(['malicious-site.com', 'phishing-example.net']);

        console.log('⚠️ Using mock data (extension context not available)');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      // Use fallback data on error
      setStats({ threatsBlocked: 0, sitesScanned: 0, phishingBlocked: 0, malwareBlocked: 0 });
      setThreatLog([]);
      setWhitelist([]);
      setBlacklist([]);
    }
  };

  const clearThreatLog = () => {
    setThreatLog([]);
  };

  const removeFromWhitelist = (domain: string) => {
    setWhitelist(prev => prev.filter(item => item !== domain));
  };

  const removeFromBlacklist = (domain: string) => {
    setBlacklist(prev => prev.filter(item => item !== domain));
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const exportData = (format: 'json' | 'csv' | 'pdf') => {
    const data = {
      threatLog,
      whitelist,
      blacklist,
      stats,
      exportDate: new Date().toISOString()
    };

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detector-data-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detector-data-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      generatePDF(data, timestamp);
    }

    setShowExportDropdown(false);
  };

  const convertToCSV = (data: any) => {
    const headers = ['Type', 'URL/Domain', 'Threat Type', 'Description', 'Source', 'Timestamp'];
    const rows: string[][] = [];

    // Add threat log entries
    data.threatLog.forEach((threat: any) => {
      threat.threats.forEach((t: any) => {
        rows.push([
          'Threat',
          threat.url,
          t.type || 'Unknown',
          t.description || 'No description',
          t.source || 'Unknown',
          threat.timestamp
        ]);
      });
    });

    // Add whitelist entries
    data.whitelist.forEach((domain: string) => {
      rows.push(['Whitelist', domain, '', '', '', data.exportDate]);
    });

    // Add blacklist entries
    data.blacklist.forEach((domain: string) => {
      rows.push(['Blacklist', domain, '', '', '', data.exportDate]);
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generatePDF = async (data: any, timestamp: string) => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text('AI-Powered Threat Detector Report', 20, 20);

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

      let yPosition = 50;

      // Statistics
      doc.setFontSize(16);
      doc.text('Statistics', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text(`Total Threats Blocked: ${data.stats.threatsBlocked}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Sites Scanned: ${data.stats.sitesScanned}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Phishing Blocked: ${data.stats.phishingBlocked}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Malware Blocked: ${data.stats.malwareBlocked}`, 20, yPosition);
      yPosition += 15;

      // Recent Threats
      if (data.threatLog.length > 0) {
        doc.setFontSize(16);
        doc.text('Recent Threats', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        data.threatLog.slice(0, 10).forEach((threat: any) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.text(`URL: ${threat.url}`, 20, yPosition);
          yPosition += 6;
          if (threat.threats[0]) {
            doc.text(`Type: ${threat.threats[0].type} | Source: ${threat.threats[0].source}`, 20, yPosition);
            yPosition += 6;
            doc.text(`Description: ${threat.threats[0].description}`, 20, yPosition);
            yPosition += 6;
          }
          doc.text(`Time: ${new Date(threat.timestamp).toLocaleString()}`, 20, yPosition);
          yPosition += 10;
        });
      }

      // Save the PDF
      doc.save(`threat-detector-report-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI-Powered Threat Detector</h1>
                <p className="text-sm text-gray-500">Security Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => exportData('json')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="text-blue-600">📄</span>
                        JSON Format
                      </button>
                      <button
                        type="button"
                        onClick={() => exportData('csv')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="text-green-600">📊</span>
                        CSV Format
                      </button>
                      <button
                        type="button"
                        onClick={() => exportData('pdf')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="text-red-600">📋</span>
                        PDF Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Threats Blocked</p>
                <p className="text-3xl font-bold text-red-600">{stats.threatsBlocked}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sites Scanned</p>
                <p className="text-3xl font-bold text-blue-600">{stats.sitesScanned}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phishing Blocked</p>
                <p className="text-3xl font-bold text-orange-600">{stats.phishingBlocked}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Malware Blocked</p>
                <p className="text-3xl font-bold text-purple-600">{stats.malwareBlocked}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Threat Log */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Threats</h2>
                <button
                  onClick={clearThreatLog}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Log
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {threatLog.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No threats detected</p>
                </div>
              ) : (
                <div className="divide-y">
                  {threatLog.map((threat, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {threat.url}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {threat.threats[0]?.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              threat.threats[0]?.type === 'phishing'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {threat.threats[0]?.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {threat.threats[0]?.source}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-4">
                          <Clock className="w-3 h-3" />
                          {new Date(threat.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Whitelist & Blacklist */}
          <div className="space-y-6">
            {/* Whitelist */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Whitelist</h2>
                <p className="text-sm text-gray-600">Trusted domains that will not be scanned</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {whitelist.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No whitelisted domains</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {whitelist.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between p-4">
                        <span className="text-sm text-gray-900">{domain}</span>
                        <button
                          onClick={() => removeFromWhitelist(domain)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Blacklist */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Blacklist</h2>
                <p className="text-sm text-gray-600">Blocked domains that will always show warnings</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {blacklist.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No blacklisted domains</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {blacklist.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between p-4">
                        <span className="text-sm text-gray-900">{domain}</span>
                        <button
                          onClick={() => removeFromBlacklist(domain)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
