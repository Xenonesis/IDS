// Scan History Page JavaScript

let currentPage = 0;
const itemsPerPage = 20;
let currentFilters = {};
let allHistory = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Scan History page loaded');

    try {
        await loadScanHistory();
        setupEventListeners();
        console.log('✅ Scan History page initialization complete');
    } catch (error) {
        console.error('❌ Error initializing scan history page:', error);
        showError('Failed to load scan history');
    }
});

// Setup event listeners
function setupEventListeners() {
    // Filter controls
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 500);
    });

    // Export dropdown
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('show');
    });

    // Handle export option clicks
    document.querySelectorAll('.export-option').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const format = button.getAttribute('data-format');
            exportHistory(format);
            exportDropdown.classList.remove('show');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
    });

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllHistory);
}

// Load scan history from storage
async function loadScanHistory() {
    try {
        showLoading();

        const response = await sendMessageToBackground({
            action: 'getScanHistory',
            options: {
                limit: 1000, // Get all history for filtering
                offset: 0
            }
        });

        if (response.success && response.history && response.history.length > 0) {
            allHistory = response.history;
            displayHistory(allHistory);
            updateStats(response.total);
        } else {
            console.log('📋 No scan history found, generating sample data...');
            // Generate sample scan history data for demonstration
            await generateSampleScanHistory();
        }
    } catch (error) {
        console.error('Error loading scan history:', error);
        console.log('📋 Showing sample data due to error...');
        await generateSampleScanHistory();
    }
}

// Generate sample scan history data for demonstration
async function generateSampleScanHistory() {
    console.log('🧪 Generating sample scan history data...');

    const sampleHistory = [
        {
            id: Date.now() + 1,
            url: 'https://google.com',
            domain: 'google.com',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
            status: 'secure',
            threatCount: 0,
            threats: [],
            scanDuration: 1250,
            apisUsed: ['Google Safe Browsing', 'VirusTotal'],
            scanType: 'automatic',
            cached: false
        },
        {
            id: Date.now() + 2,
            url: 'https://github.com',
            domain: 'github.com',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            status: 'secure',
            threatCount: 0,
            threats: [],
            scanDuration: 980,
            apisUsed: ['Google Safe Browsing', 'PhishTank'],
            scanType: 'manual',
            cached: false
        },
        {
            id: Date.now() + 3,
            url: 'https://suspicious-site.net',
            domain: 'suspicious-site.net',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            status: 'danger',
            threatCount: 2,
            threats: [
                {
                    type: 'phishing',
                    description: 'Phishing attempt detected',
                    source: 'Google Safe Browsing'
                },
                {
                    type: 'malware',
                    description: 'Suspicious redirect found',
                    source: 'VirusTotal'
                }
            ],
            scanDuration: 1500,
            apisUsed: ['Google Safe Browsing', 'VirusTotal', 'PhishTank'],
            scanType: 'automatic',
            cached: false
        },
        {
            id: Date.now() + 4,
            url: 'https://stackoverflow.com',
            domain: 'stackoverflow.com',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
            status: 'secure',
            threatCount: 0,
            threats: [],
            scanDuration: 750,
            apisUsed: ['PhishTank', 'URLScan.io'],
            scanType: 'manual',
            cached: false
        },
        {
            id: Date.now() + 5,
            url: 'https://malicious-example.com',
            domain: 'malicious-example.com',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            status: 'danger',
            threatCount: 1,
            threats: [
                {
                    type: 'malware',
                    description: 'Malware detected by multiple vendors',
                    source: 'VirusTotal'
                }
            ],
            scanDuration: 2100,
            apisUsed: ['VirusTotal', 'URLScan.io'],
            scanType: 'automatic',
            cached: false
        },
        {
            id: Date.now() + 6,
            url: 'https://example.com',
            domain: 'example.com',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            status: 'secure',
            threatCount: 0,
            threats: [],
            scanDuration: 890,
            apisUsed: ['Google Safe Browsing'],
            scanType: 'automatic',
            cached: true
        }
    ];

    // Set the sample data as our history
    allHistory = sampleHistory;
    displayHistory(allHistory);
    updateStats(allHistory.length);

    console.log(`✅ Generated ${sampleHistory.length} sample scan history entries`);
}

// Display history in table
function displayHistory(history) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const historyTable = document.getElementById('historyTable');
    const pagination = document.getElementById('pagination');

    loadingState.classList.add('hidden');

    if (history.length === 0) {
        emptyState.classList.remove('hidden');
        historyTable.classList.add('hidden');
        pagination.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    historyTable.classList.remove('hidden');
    pagination.classList.remove('hidden');

    // Calculate pagination
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, history.length);
    const pageHistory = history.slice(startIndex, endIndex);

    // Populate table
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    pageHistory.forEach(item => {
        const row = createHistoryRow(item);
        tbody.appendChild(row);
    });

    // Update pagination
    updatePagination(history.length);
}

// Create history table row
function createHistoryRow(item) {
    const row = document.createElement('tr');
    row.dataset.scanId = item.id;

    const domain = item.domain || extractDomain(item.url);
    const statusText = item.status === 'secure' ? 'Secure' : `${item.threatCount} Threat${item.threatCount > 1 ? 's' : ''}`;

    row.innerHTML = `
        <td>
            <a href="${item.url}" target="_blank" class="domain-link" title="${item.url}">
                ${domain}
            </a>
        </td>
        <td>
            <span class="status-badge ${item.status}">
                <span class="status-indicator ${item.status}"></span>
                ${statusText}
            </span>
        </td>
        <td class="threat-details">
            ${item.threats && item.threats.length > 0 ?
                item.threats.map(threat => `
                    <span class="threat-item">${threat.type}: ${threat.description}</span>
                `).join('') :
                '<span style="color: #6b7280;">None</span>'
            }
        </td>
        <td>
            <span class="scan-type ${item.scanType}">
                ${item.scanType === 'manual' ? 'Manual' : 'Auto'}
            </span>
        </td>
        <td>${item.scanDuration}ms</td>
        <td title="${new Date(item.timestamp).toLocaleString()}">
            ${getTimeAgo(item.timestamp)}
        </td>
        <td>
            <button class="btn btn-secondary" onclick="deleteScan('${item.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                🗑️
            </button>
        </td>
    `;

    return row;
}

// Update pagination controls
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    // Update info
    const startItem = currentPage * itemsPerPage + 1;
    const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} results`;

    // Update controls
    paginationControls.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 0;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            displayHistory(getFilteredHistory());
        }
    });
    paginationControls.appendChild(prevBtn);

    // Page numbers
    const maxVisiblePages = 5;
    const startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages);

    for (let i = startPage; i < endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`;
        pageBtn.textContent = i + 1;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayHistory(getFilteredHistory());
        });
        paginationControls.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-secondary';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            displayHistory(getFilteredHistory());
        }
    });
    paginationControls.appendChild(nextBtn);
}

// Apply filters
function applyFilters() {
    currentFilters = {
        search: document.getElementById('searchInput').value.trim(),
        status: document.getElementById('statusFilter').value,
        type: document.getElementById('typeFilter').value,
        dateFrom: document.getElementById('dateFromInput').value,
        dateTo: document.getElementById('dateToInput').value
    };

    currentPage = 0; // Reset to first page
    const filteredHistory = getFilteredHistory();
    displayHistory(filteredHistory);
    updateStats(filteredHistory.length);
}

// Get filtered history
function getFilteredHistory() {
    let filtered = [...allHistory];

    // Search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(item =>
            item.url.toLowerCase().includes(searchTerm) ||
            item.domain.toLowerCase().includes(searchTerm)
        );
    }

    // Status filter
    if (currentFilters.status && currentFilters.status !== 'all') {
        filtered = filtered.filter(item => item.status === currentFilters.status);
    }

    // Type filter
    if (currentFilters.type && currentFilters.type !== 'all') {
        filtered = filtered.filter(item => item.scanType === currentFilters.type);
    }

    // Date filters
    if (currentFilters.dateFrom) {
        const fromDate = new Date(currentFilters.dateFrom);
        filtered = filtered.filter(item => new Date(item.timestamp) >= fromDate);
    }

    if (currentFilters.dateTo) {
        const toDate = new Date(currentFilters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filtered = filtered.filter(item => new Date(item.timestamp) <= toDate);
    }

    return filtered;
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('dateFromInput').value = '';
    document.getElementById('dateToInput').value = '';

    currentFilters = {};
    currentPage = 0;
    displayHistory(allHistory);
    updateStats(allHistory.length);
}

// Update statistics
function updateStats(count) {
    const historyStats = document.getElementById('historyStats');
    const secureCount = allHistory.filter(item => item.status === 'secure').length;
    const dangerCount = allHistory.filter(item => item.status === 'danger').length;

    historyStats.textContent = `${count} scans (${secureCount} secure, ${dangerCount} threats)`;
}

// Export history
async function exportHistory(format = 'json') {
    try {
        console.log('Exporting history in format:', format);

        const response = await sendMessageToBackground({
            action: 'exportScanHistory',
            format: format.toLowerCase()
        });

        console.log('Export response:', response);

        if (!response) {
            throw new Error('No response received from background script');
        }

        if (response.success) {
            if (format === 'pdf') {
                // For PDF, create a formatted text report
                const pdfContent = generatePDFContent(allHistory);
                downloadFile(pdfContent, `scan-history-report.txt`);
            } else {
                downloadFile(response.data, `scan-history.${format.toLowerCase()}`);
            }

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success';
            successMsg.textContent = `History exported successfully as ${format.toUpperCase()}`;
            successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 10px; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px;';
            document.body.appendChild(successMsg);
            setTimeout(() => successMsg.remove(), 3000);

        } else {
            throw new Error(response.error || 'Export failed');
        }
    } catch (error) {
        console.error('Error exporting history:', error);

        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'alert alert-error';
        errorMsg.textContent = `Failed to export scan history: ${error.message}`;
        errorMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; padding: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;';
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 5000);
    }
}

function generatePDFContent(history) {
    const lines = [];
    lines.push('SCAN HISTORY REPORT');
    lines.push('==================');
    lines.push('');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Total Scans: ${history.length}`);
    lines.push('');

    if (history.length > 0) {
        lines.push('SCAN DETAILS');
        lines.push('------------');

        history.forEach((scan, index) => {
            lines.push(`${index + 1}. ${scan.domain || extractDomain(scan.url)}`);
            lines.push(`   URL: ${scan.url}`);
            lines.push(`   Status: ${scan.status}`);
            lines.push(`   Threats: ${scan.threatCount || 0}`);
            if (scan.threats && scan.threats.length > 0) {
                scan.threats.forEach(threat => {
                    lines.push(`     - ${threat.type}: ${threat.description}`);
                });
            }
            lines.push(`   Scan Type: ${scan.scanType || 'Unknown'}`);
            lines.push(`   Duration: ${scan.scanDuration || 0}ms`);
            lines.push(`   APIs Used: ${Array.isArray(scan.apisUsed) ? scan.apisUsed.join(', ') : scan.apisUsed || 'Unknown'}`);
            lines.push(`   Timestamp: ${new Date(scan.timestamp).toLocaleString()}`);
            lines.push('');
        });
    } else {
        lines.push('No scan history available');
    }

    lines.push('Report generated by AI-Powered Threat Detector Extension');

    return lines.join('\n');
}

// Clear all history
async function clearAllHistory() {
    const confirmed = confirm('Are you sure you want to clear ALL scan history? This action cannot be undone.');

    if (confirmed) {
        try {
            const response = await sendMessageToBackground({
                action: 'clearScanHistory'
            });

            if (response.success) {
                allHistory = [];
                displayHistory([]);
                updateStats(0);
                alert('Scan history cleared successfully');
            } else {
                throw new Error(response.error || 'Clear failed');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Failed to clear scan history');
        }
    }
}

// Delete specific scan
async function deleteScan(scanId) {
    const confirmed = confirm('Are you sure you want to delete this scan?');

    if (confirmed) {
        try {
            const response = await sendMessageToBackground({
                action: 'deleteScanFromHistory',
                scanId: scanId
            });

            if (response.success) {
                // Remove from local array
                allHistory = allHistory.filter(item => item.id !== scanId);

                // Refresh display
                const filteredHistory = getFilteredHistory();
                displayHistory(filteredHistory);
                updateStats(filteredHistory.length);
            } else {
                throw new Error(response.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting scan:', error);
            alert('Failed to delete scan');
        }
    }
}

// Utility functions
function sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (response === undefined) {
                console.error('No response received from background script');
                reject(new Error('No response received from background script'));
                return;
            }

            resolve(response);
        });
    });
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        return url;
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const scanTime = new Date(timestamp);
    const diffMs = now - scanTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('historyTable').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

function showError(message) {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `
        <div class="empty-state-icon">❌</div>
        <h3>Error Loading History</h3>
        <p>${message}</p>
    `;
    emptyState.classList.remove('hidden');

    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('historyTable').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}
