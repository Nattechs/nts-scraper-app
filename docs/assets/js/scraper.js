class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use Cloudflare Workers CORS proxy
        this.corsProxy = 'https://api.cloudflare.workers.dev/cors-proxy';
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

            // Use no-cors mode first
            try {
                const response = await fetch(formattedUrl, { 
                    mode: 'no-cors',
                    cache: 'no-store'
                });
                const content = await response.text();
                console.log('Successfully fetched content directly');
                return this.processResults({ content, url: formattedUrl });
            } catch (directError) {
                console.log('Direct fetch failed, trying proxy...');
                
                // If direct fetch fails, try proxy
                const proxyResponse = await fetch(this.corsProxy, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: formattedUrl
                    })
                });

                if (!proxyResponse.ok) {
                    throw new Error(`HTTP error! status: ${proxyResponse.status}`);
                }

                const data = await proxyResponse.json();
                
                if (!data.content) {
                    throw new Error('Failed to fetch webpage content');
                }

                console.log('Successfully fetched content via proxy');
                return this.processResults({ content: data.content, url: formattedUrl });
            }
        } catch (error) {
            // Try one last time with a simple fetch
            try {
                console.log('All methods failed, trying simple fetch...');
                const finalResponse = await fetch(formattedUrl);
                const content = await finalResponse.text();
                
                if (!content || content.trim().length === 0) {
                    throw new Error('Received empty content');
                }

                console.log('Successfully fetched content with simple fetch');
                return this.processResults({ content, url: formattedUrl });
            } catch (finalError) {
                console.error('All fetch attempts failed:', {
                    message: error.message,
                    finalError: finalError.message,
                    url: url
                });
                throw new Error(`Failed to scan website: Unable to fetch content`);
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