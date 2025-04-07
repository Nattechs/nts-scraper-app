class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use a more reliable CORS proxy
        this.corsProxies = [
            'https://corsproxy.org/',
            'https://proxy.cors.sh/',
            'https://cors-anywhere.azm.workers.dev/'
        ];
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

            // Try each proxy in sequence
            let lastError = null;
            for (const proxy of this.corsProxies) {
                try {
                    const proxyUrl = proxy + formattedUrl;
                    console.log('Trying proxy:', proxy);

                    const response = await fetch(proxyUrl, {
                        mode: 'cors'
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const content = await response.text();
                    
                    if (!content || content.trim().length === 0) {
                        throw new Error('Received empty content');
                    }

                    console.log('Successfully fetched content using:', proxy);
                    return this.processResults({ content, url: formattedUrl });
                } catch (error) {
                    console.warn(`Proxy ${proxy} failed:`, error.message);
                    lastError = error;
                    continue;
                }
            }

            // If we get here, all proxies failed
            throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
        } catch (error) {
            console.error('Scraping error:', {
                message: error.message,
                url: url
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