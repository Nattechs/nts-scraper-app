class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use ScraperAPI as the CORS proxy
        this.corsProxy = 'https://api.scraperapi.com/scrape';
        // Free API key with limited requests
        this.apiKey = 'c13d1187e8c83d5c9e45e534f4abc873';
    }

    async scrapeUrl(url, options = {}) {
        try {
            if (!url) {
                throw new Error('URL is required');
            }

            // Validate and format URL
            let formattedUrl = url;
            try {
                new URL(url);
            } catch (e) {
                // If URL doesn't include protocol, prepend https://
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    formattedUrl = 'https://' + url;
                }
            }

            console.log('Fetching URL:', formattedUrl);
            
            const response = await fetch(`${this.corsProxy}?api_key=${this.apiKey}&url=${encodeURIComponent(formattedUrl)}`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const content = await response.text();
            
            if (!content || content.trim().length === 0) {
                throw new Error('Failed to fetch webpage content');
            }

            console.log('Successfully fetched content');
            return this.processResults({ content, url: formattedUrl });
        } catch (error) {
            console.error('Detailed scraping error:', {
                message: error.message,
                url: url,
                stack: error.stack
            });
            throw new Error(`Failed to scan website: ${error.message}`);
        }
    }

    processResults({ content, url }) {
        const results = {
            emails: [],
            phones: []
        };

        if (!content) {
            return results;
        }

        // Extract emails
        const emails = this.extractEmails(content);
        results.emails = emails.map(email => ({
            value: email,
            source: url
        }));

        // Extract phone numbers
        const phones = this.extractPhoneNumbers(content);
        results.phones = phones.map(phone => ({
            value: phone,
            source: url
        }));

        // Remove duplicates
        results.emails = this.removeDuplicates(results.emails);
        results.phones = this.removeDuplicates(results.phones);

        return results;
    }

    extractEmails(content) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = content.match(emailRegex) || [];
        return matches.filter(email => this.isValidEmail(email));
    }

    extractPhoneNumbers(content) {
        const phoneRegex = /(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g;
        const matches = content.match(phoneRegex) || [];
        return matches.filter(phone => this.isValidPhoneNumber(phone));
    }

    isValidEmail(email) {
        // Basic email validation
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    isValidPhoneNumber(phone) {
        // Remove all non-numeric characters
        const digits = phone.replace(/\D/g, '');
        // Check if the number of digits is valid (10-15 digits)
        return digits.length >= 10 && digits.length <= 15;
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const value = item.value.toLowerCase();
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
} 