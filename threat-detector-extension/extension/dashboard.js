// Dashboard script for AI-Powered Threat Detector Extension

let currentFilter = 'all';
let threatLog = [];
let stats = {
  totalThreats: 0,
  sitesScanned: 0,
  phishingBlocked: 0,
  malwareBlocked: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  await initializeDashboard();
  setupEventListeners();
});

async function initializeDashboard() {
  try {
    console.log('🚀 Initializing dashboard...');

    // Load data from background script
    await loadDashboardData();

    // Update UI
    updateStatistics();
    updateThreatList();

    console.log('✅ Dashboard initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing dashboard:', error);
    showError('Failed to load dashboard data');
  }
}

async function loadDashboardData() {
  try {
    // Load threat log
    threatLog = await sendMessageToBackground({ action: 'getThreatLog' });
    console.log('📋 Loaded threat log:', threatLog.length, 'entries');

    // Calculate statistics
    calculateStatistics();

    // Load sites scanned count
    const sitesScannedResult = await chrome.storage.local.get('sitesScannedCount');
    stats.sitesScanned = sitesScannedResult.sitesScannedCount || 0;

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Set default values
    threatLog = [];
    stats = { totalThreats: 0, sitesScanned: 0, phishingBlocked: 0, malwareBlocked: 0 };
  }
}

function calculateStatistics() {
  stats.totalThreats = threatLog.length;
  stats.phishingBlocked = threatLog.filter(threat =>
    threat.threats.some(t => t.type === 'phishing' || t.type === 'social_engineering')
  ).length;
  stats.malwareBlocked = threatLog.filter(threat =>
    threat.threats.some(t => t.type === 'malware' || t.type === 'malicious')
  ).length;

  console.log('📊 Calculated statistics:', stats);
}

function updateStatistics() {
  document.getElementById('totalThreats').textContent = stats.totalThreats;
  document.getElementById('sitesScanned').textContent = stats.sitesScanned;
  document.getElementById('phishingBlocked').textContent = stats.phishingBlocked;
  document.getElementById('malwareBlocked').textContent = stats.malwareBlocked;

  // Update change indicators (placeholder for now)
  document.getElementById('totalThreatsChange').textContent = 'Last 24 hours';
  document.getElementById('sitesScannedChange').textContent = 'All time';
  document.getElementById('phishingBlockedChange').textContent = 'All time';
  document.getElementById('malwareBlockedChange').textContent = 'All time';
}

function updateThreatList() {
  const threatListElement = document.getElementById('threatList');

  if (!threatLog || threatLog.length === 0) {
    threatListElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛡️</div>
        <p>No threats detected</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Your browsing is secure!</p>
      </div>
    `;
    return;
  }

  // Filter threats based on current filter
  const filteredThreats = filterThreats(threatLog, currentFilter);

  if (filteredThreats.length === 0) {
    threatListElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No ${currentFilter} threats found</p>
      </div>
    `;
    return;
  }

  // Sort by timestamp (newest first)
  const sortedThreats = filteredThreats.sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  threatListElement.innerHTML = sortedThreats.map(threat => {
    const primaryThreat = threat.threats[0];
    const threatType = getThreatType(primaryThreat);
    const severity = getThreatSeverity(primaryThreat);
    const timeAgo = getTimeAgo(threat.timestamp);

    return `
      <div class="threat-item">
        <div class="threat-icon ${severity}">
          ${getThreatIcon(threatType)}
        </div>
        <div class="threat-details">
          <div class="threat-url">${new URL(threat.url).hostname}</div>
          <div class="threat-description">${primaryThreat.description}</div>
          <div class="threat-meta">
            <span class="threat-badge ${threatType}">${threatType}</span>
            <span>Source: ${primaryThreat.source}</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterThreats(threats, filter) {
  if (filter === 'all') return threats;

  return threats.filter(threat => {
    return threat.threats.some(t => {
      const type = getThreatType(t);
      return type === filter;
    });
  });
}

function getThreatType(threat) {
  const type = threat.type?.toLowerCase() || '';
  if (type.includes('phishing') || type.includes('social_engineering')) {
    return 'phishing';
  } else if (type.includes('malware') || type.includes('malicious')) {
    return 'malware';
  } else {
    return 'suspicious';
  }
}

function getThreatSeverity(threat) {
  const type = threat.type?.toLowerCase() || '';
  if (type.includes('malware') || type.includes('critical')) {
    return 'high';
  } else if (type.includes('phishing')) {
    return 'medium';
  } else {
    return 'low';
  }
}

function getThreatIcon(type) {
  switch (type) {
    case 'phishing': return '🎣';
    case 'malware': return '🦠';
    case 'suspicious': return '⚠️';
    default: return '🚨';
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    const originalText = btn.textContent;
    btn.textContent = '🔄 Refreshing...';
    btn.disabled = true;

    try {
      await loadDashboardData();
      updateStatistics();
      updateThreatList();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showError('Failed to refresh data');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update filter and refresh list
      currentFilter = btn.dataset.filter;
      updateThreatList();
    });
  });

  // Quick action cards
  document.getElementById('scanCurrentSite').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        await sendMessageToBackground({
          action: 'manualScan',
          url: tab.url,
          tabId: tab.id
        });
        showSuccess('Scan initiated for current site');

        // Refresh data after a short delay
        setTimeout(async () => {
          await loadDashboardData();
          updateStatistics();
          updateThreatList();
        }, 2000);
      }
    } catch (error) {
      console.error('Error scanning current site:', error);
      showError('Failed to scan current site');
    }
  });

  document.getElementById('viewSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  // Handle export dropdown options
  document.querySelectorAll('.export-option').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const format = button.getAttribute('data-format');
      exportThreatData(format);
    });
  });

  document.getElementById('clearLog').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all threat log entries? This action cannot be undone.')) {
      try {
        await chrome.storage.local.set({ threatLog: [] });
        threatLog = [];
        calculateStatistics();
        updateStatistics();
        updateThreatList();
        showSuccess('Threat log cleared successfully');
      } catch (error) {
        console.error('Error clearing threat log:', error);
        showError('Failed to clear threat log');
      }
    }
  });
}

function exportThreatData(format = 'json') {
  try {
    const data = {
      threatLog: threatLog,
      statistics: stats,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detector-data-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detector-data-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      generatePDF(data, timestamp);
    }

    showSuccess(`Data exported successfully as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting data:', error);
    showError('Failed to export data');
  }
}

function convertToCSV(data) {
  const headers = ['Type', 'URL/Domain', 'Threat Type', 'Description', 'Source', 'Timestamp'];
  const rows = [];

  // Add threat log entries
  data.threatLog.forEach(threat => {
    if (threat.threats && threat.threats.length > 0) {
      threat.threats.forEach(t => {
        rows.push([
          'Threat',
          threat.url || 'Unknown',
          t.type || 'Unknown',
          t.description || 'No description',
          t.source || 'Unknown',
          threat.timestamp || data.exportDate
        ]);
      });
    } else {
      rows.push([
        'Threat',
        threat.url || 'Unknown',
        'Unknown',
        'No description',
        'Unknown',
        threat.timestamp || data.exportDate
      ]);
    }
  });

  // Add statistics summary
  rows.push([
    'Statistics',
    'Total Threats',
    '',
    data.statistics.threatsBlocked || 0,
    'Dashboard',
    data.exportDate
  ]);
  rows.push([
    'Statistics',
    'Sites Scanned',
    '',
    data.statistics.sitesScanned || 0,
    'Dashboard',
    data.exportDate
  ]);
  rows.push([
    'Statistics',
    'Phishing Blocked',
    '',
    data.statistics.phishingBlocked || 0,
    'Dashboard',
    data.exportDate
  ]);
  rows.push([
    'Statistics',
    'Malware Blocked',
    '',
    data.statistics.malwareBlocked || 0,
    'Dashboard',
    data.exportDate
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

async function generatePDF(data, timestamp) {
  try {
    // For extension environment, we'll create a simple text-based PDF alternative
    // Since jsPDF might not work in extension context, we'll create a formatted text file
    const content = generatePDFContent(data);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-detector-report-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    showError('Failed to generate PDF report');
  }
}

function generatePDFContent(data) {
  const lines = [];
  lines.push('AI-POWERED THREAT DETECTOR REPORT');
  lines.push('=====================================');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  // Statistics
  lines.push('STATISTICS');
  lines.push('----------');
  lines.push(`Total Threats Blocked: ${data.statistics.threatsBlocked || 0}`);
  lines.push(`Sites Scanned: ${data.statistics.sitesScanned || 0}`);
  lines.push(`Phishing Blocked: ${data.statistics.phishingBlocked || 0}`);
  lines.push(`Malware Blocked: ${data.statistics.malwareBlocked || 0}`);
  lines.push('');

  // Recent Threats
  if (data.threatLog && data.threatLog.length > 0) {
    lines.push('RECENT THREATS');
    lines.push('--------------');

    data.threatLog.slice(0, 20).forEach((threat, index) => {
      lines.push(`${index + 1}. URL: ${threat.url}`);
      if (threat.threats && threat.threats.length > 0) {
        threat.threats.forEach(t => {
          lines.push(`   Type: ${t.type || 'Unknown'}`);
          lines.push(`   Source: ${t.source || 'Unknown'}`);
          lines.push(`   Description: ${t.description || 'No description'}`);
        });
      }
      lines.push(`   Time: ${new Date(threat.timestamp).toLocaleString()}`);
      lines.push('');
    });
  } else {
    lines.push('RECENT THREATS');
    lines.push('--------------');
    lines.push('No threats detected');
    lines.push('');
  }

  lines.push('Report generated by AI-Powered Threat Detector Extension');

  return lines.join('\n');
}

async function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    console.log('📤 Sending message to background:', message);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response === undefined) {
          console.error('❌ No response received from background script');
          reject(new Error('No response received from background script'));
        } else {
          console.log('📥 Received response from background:', response);
          resolve(response);
        }
      });
    } catch (error) {
      console.error('❌ Error sending message to background:', error);
      reject(error);
    }
  });
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
  `;
  notification.textContent = message;

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}
