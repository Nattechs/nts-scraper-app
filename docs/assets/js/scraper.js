class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use allorigins.win with get format
        this.corsProxy = 'https://api.allorigins.win/get';
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
            
            // Use simpler request format
            const proxyUrl = `${this.corsProxy}?url=${encodeURIComponent(formattedUrl)}`;
            
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.contents) {
                throw new Error('Failed to fetch webpage content');
            }

            console.log('Successfully fetched content');
            return this.processResults({ content: data.contents, url: formattedUrl });
        } catch (error) {
            // Try fallback proxy if first one fails
            try {
                console.log('Primary proxy failed, trying fallback...');
                const fallbackProxy = 'https://api.allorigins.win/raw';
                const fallbackUrl = `${fallbackProxy}?url=${encodeURIComponent(formattedUrl)}`;
                
                const fallbackResponse = await fetch(fallbackUrl);

                if (!fallbackResponse.ok) {
                    throw new Error(`Fallback HTTP error! status: ${fallbackResponse.status}`);
                }

                const fallbackContent = await fallbackResponse.text();
                
                if (!fallbackContent || fallbackContent.trim().length === 0) {
                    throw new Error('Failed to fetch webpage content from fallback');
                }

                console.log('Successfully fetched content using fallback proxy');
                return this.processResults({ content: fallbackContent, url: formattedUrl });
            } catch (fallbackError) {
                // Try one last proxy
                try {
                    console.log('Fallback failed, trying last resort...');
                    const lastProxy = 'https://cors.eu.org/';
                    const lastUrl = lastProxy + formattedUrl;
                    
                    const lastResponse = await fetch(lastUrl);
                    
                    if (!lastResponse.ok) {
                        throw new Error(`Last resort HTTP error! status: ${lastResponse.status}`);
                    }

                    const lastContent = await lastResponse.text();
                    
                    if (!lastContent || lastContent.trim().length === 0) {
                        throw new Error('Failed to fetch webpage content from last resort');
                    }

                    console.log('Successfully fetched content using last resort proxy');
                    return this.processResults({ content: lastContent, url: formattedUrl });
                } catch (lastError) {
                    console.error('All proxies failed:', {
                        originalError: error.message,
                        fallbackError: fallbackError.message,
                        lastError: lastError.message,
                        url: url
                    });
                    throw new Error(`Failed to scan website: All proxies failed`);
                }
            }
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