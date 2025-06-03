'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Clock, Globe, Settings } from 'lucide-react';

interface ThreatLog {
  id: string;
  url: string;
  timestamp: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  blocked: boolean;
}

interface ThreatStats {
  totalThreats: number;
  blockedThreats: number;
  phishingAttempts: number;
  malwareDetections: number;
  todayThreats: number;
  weekThreats: number;
}

const ThreatDashboard: React.FC = () => {
  const [threatLogs, setThreatLogs] = useState<ThreatLog[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    totalThreats: 0,
    blockedThreats: 0,
    phishingAttempts: 0,
    malwareDetections: 0,
    todayThreats: 0,
    weekThreats: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'blocked' | 'allowed'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadThreatData();
  }, [timeRange]);

  const loadThreatData = async () => {
    try {
      setLoading(true);

      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // Load threat logs from background script
        const threatLogResponse = await chrome.runtime.sendMessage({ action: 'getThreatLog' });
        const logs = Array.isArray(threatLogResponse) ? threatLogResponse : [];

        // Convert to expected format
        const convertedLogs = logs.map((log: any, index: number) => ({
          id: `threat-${index}-${Date.now()}`,
          url: log.url,
          timestamp: log.timestamp,
          threatType: log.threats[0]?.type || 'unknown',
          severity: getSeverityFromType(log.threats[0]?.type || 'unknown'),
          source: log.threats[0]?.source || 'Unknown',
          blocked: true // Assume all logged threats were blocked
        }));

        // Filter by time range
        const filteredLogs = filterLogsByTimeRange(convertedLogs, timeRange);
        setThreatLogs(filteredLogs);

        // Calculate statistics
        calculateStats(convertedLogs);

        console.log('✅ Threat data loaded from extension');
      } else {
        // Fallback for development
        console.log('⚠️ Extension context not available, using empty data');
        setThreatLogs([]);
        calculateStats([]);
      }

    } catch (error) {
      console.error('❌ Error loading threat data:', error);
      setThreatLogs([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromType = (type: string): 'low' | 'medium' | 'high' | 'critical' => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('malware') || lowerType.includes('critical')) {
      return 'critical';
    } else if (lowerType.includes('phishing') || lowerType.includes('social_engineering')) {
      return 'high';
    } else if (lowerType.includes('suspicious')) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const filterLogsByTimeRange = (logs: ThreatLog[], range: string) => {
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      default:
        return logs;
    }

    return logs.filter(log => new Date(log.timestamp) >= cutoff);
  };

  const calculateStats = (logs: ThreatLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newStats: ThreatStats = {
      totalThreats: logs.length,
      blockedThreats: logs.filter(log => log.blocked).length,
      phishingAttempts: logs.filter(log => log.threatType.includes('phishing')).length,
      malwareDetections: logs.filter(log => log.threatType.includes('malware')).length,
      todayThreats: logs.filter(log => new Date(log.timestamp) >= today).length,
      weekThreats: logs.filter(log => new Date(log.timestamp) >= weekAgo).length
    };

    setStats(newStats);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <Eye className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredLogs = threatLogs.filter(log => {
    if (filter === 'blocked') return log.blocked;
    if (filter === 'allowed') return !log.blocked;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Threat Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadThreatData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Threats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalThreats}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked Threats</p>
              <p className="text-2xl font-bold text-green-600">{stats.blockedThreats}</p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Phishing Attempts</p>
              <p className="text-2xl font-bold text-orange-600">{stats.phishingAttempts}</p>
            </div>
            <Globe className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Malware Detections</p>
              <p className="text-2xl font-bold text-red-600">{stats.malwareDetections}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({threatLogs.length})
          </button>
          <button
            onClick={() => setFilter('blocked')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'blocked'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Blocked ({threatLogs.filter(log => log.blocked).length})
          </button>
          <button
            onClick={() => setFilter('allowed')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'allowed'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Allowed ({threatLogs.filter(log => !log.blocked).length})
          </button>
        </div>
      </div>

      {/* Threat Logs Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Threats</h2>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No threats detected in the selected time range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Threat Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={log.url}>
                        {log.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.threatType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)}
                        <span className="ml-1 capitalize">{log.severity}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.blocked ? 'text-red-800 bg-red-100' : 'text-green-800 bg-green-100'
                      }`}>
                        {log.blocked ? 'Blocked' : 'Allowed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatDashboard;
