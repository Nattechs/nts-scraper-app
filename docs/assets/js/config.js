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
    },

    // Theme settings
    THEME: {
        LIGHT: {
            primary: '#4361ee',
            secondary: '#3f37c9',
            accent: '#4895ef',
            background: '#f8f9fa',
            text: '#212529',
            cardBg: '#ffffff',
            borderColor: '#dee2e6'
        },
        DARK: {
            primary: '#4361ee',
            secondary: '#3f37c9',
            accent: '#4895ef',
            background: '#212529',
            text: '#f8f9fa',
            cardBg: '#343a40',
            borderColor: '#495057'
        }
    }
};

// Theme management
function setTheme(theme) {
    const root = document.documentElement;
    const themeColors = theme === 'dark' ? CONFIG.THEME.DARK : CONFIG.THEME.LIGHT;

    root.style.setProperty('--primary-color', themeColors.primary);
    root.style.setProperty('--secondary-color', themeColors.secondary);
    root.style.setProperty('--accent-color', themeColors.accent);
    root.style.setProperty('--background-color', themeColors.background);
    root.style.setProperty('--text-color', themeColors.text);
    root.style.setProperty('--card-bg', themeColors.cardBg);
    root.style.setProperty('--border-color', themeColors.borderColor);

    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('ntsScraperTheme', theme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('ntsScraperTheme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeSelect = document.getElementById('themeSelect');
    
    if (themeSelect) {
        themeSelect.value = savedTheme || 'system';
    }

    if (savedTheme === 'system' || !savedTheme) {
        setTheme(systemTheme);
    } else {
        setTheme(savedTheme);
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('ntsScraperTheme') === 'system') {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

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