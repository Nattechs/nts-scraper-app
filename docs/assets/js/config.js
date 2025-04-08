// Configuration settings for NTS Scraper
const CONFIG = {
    // API endpoints
    API: {
        BASE_URL: 'https://api.cloudflareworkers.com',
        PROXY_URL: 'https://api.cloudflareworkers.com/proxy'
    },

    // Scraping settings
    SCRAPING: {
        MAX_DEPTH: 3,
        MAX_PAGES: 10,
        TIMEOUT: 30000, // 30 seconds
        FOLLOW_EXTERNAL_LINKS: false,
        MAX_EXTERNAL_LINKS: 5
    },

    // Validation settings
    VALIDATION: {
        EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        PHONE_REGEX: /^\+?[\d\s-()]{10,}$/
    },

    // UI settings
    UI: {
        TOAST_DURATION: 3000,
        LOADING_MESSAGE: 'Scanning website...',
        ERROR_MESSAGE: 'An error occurred while scanning. Please try again.'
    }
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

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