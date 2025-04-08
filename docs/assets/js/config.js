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
    console.log('Setting theme to:', theme); // Debug log
    const root = document.documentElement;
    const themeColors = theme === 'dark' ? CONFIG.THEME.DARK : CONFIG.THEME.LIGHT;

    // Apply theme colors
    Object.entries(themeColors).forEach(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.style.setProperty(`--${cssKey}`, value);
    });

    // Set theme attribute
    document.body.setAttribute('data-theme', theme);
    
    // Save theme preference
    localStorage.setItem('ntsScraperTheme', theme);
    
    // Force a repaint
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger a reflow
    document.body.style.display = '';
}

function initializeTheme() {
    console.log('Initializing theme...'); // Debug log
    const savedTheme = localStorage.getItem('ntsScraperTheme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeSelect = document.getElementById('themeSelect');
    
    console.log('Saved theme:', savedTheme); // Debug log
    console.log('System theme:', systemTheme); // Debug log
    
    if (themeSelect) {
        themeSelect.value = savedTheme || 'system';
        console.log('Theme select value set to:', themeSelect.value); // Debug log
    }

    // Apply the theme
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing theme...'); // Debug log
    initializeTheme();
});

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