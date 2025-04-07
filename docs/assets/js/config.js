const CONFIG = {
    API_URL: 'https://api.nattechsng.com/v1',
    API_KEY: '', // Will be set from settings
    DEFAULT_SETTINGS: {
        scanDepth: 2,
        pageLimit: 50,
        validateEmails: true,
        phoneFormat: 'all',
        followExternalLinks: false,
        resultsSorting: 'type',
        showSourceUrls: true,
        removeDuplicates: true,
        theme: 'light',
        exportFormat: 'csv'
    }
};

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('ntsScraperSettings');
    if (savedSettings) {
        return { ...CONFIG.DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }
    return CONFIG.DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem('ntsScraperSettings', JSON.stringify(settings));
}

// Initialize settings
const SETTINGS = loadSettings(); 