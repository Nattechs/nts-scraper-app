class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use allorigins.win CORS proxy
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
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

            // Use CORS proxy
            const proxyUrl = `${this.corsProxy}${encodeURIComponent(formattedUrl)}`;
            console.log('Using proxy URL:', proxyUrl);

            const response = await fetch(proxyUrl, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            console.log('Successfully fetched content via proxy');
            console.log('Content length:', content.length);
            console.log('Content preview:', content.substring(0, 200));

            // Process the results
            if (!content || content.trim().length === 0) {
                console.error('Empty content received');
                throw new Error('Received empty content');
            }

            const results = this.processResults({ content, url: formattedUrl });
            console.log('Processed results:', results);
            return results;

        } catch (error) {
            console.error('Scraping failed:', error.message);
            throw new Error(`Failed to scan website: ${error.message}`);
        }
    }

    processResults({ content, url }) {
        console.log('Processing content...');
        const results = {
            emails: [],
            phones: []
        };

        if (!content) {
            console.log('No content to process');
            return results;
        }

        // Extract emails
        console.log('Extracting emails...');
        const emails = this.extractEmails(content);
        console.log('Found emails:', emails);
        results.emails = emails.map(email => ({
            value: email,
            source: url
        }));

        // Extract phone numbers
        console.log('Extracting phone numbers...');
        const phones = this.extractPhoneNumbers(content);
        console.log('Found phones:', phones);
        results.phones = phones.map(phone => ({
            value: phone,
            source: url
        }));

        // Remove duplicates
        results.emails = this.removeDuplicates(results.emails);
        results.phones = this.removeDuplicates(results.phones);

        console.log('Final results:', results);
        return results;
    }

    extractEmails(content) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = content.match(emailRegex) || [];
        return matches.filter(email => this.isValidEmail(email));
    }

    extractPhoneNumbers(content) {
        // Enhanced phone regex to catch more formats
        const phoneRegex = /(?:(?:\+?\d{1,3}[-. ]?)?(?:\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}))|(?:\d{3}[-. ]?\d{4}[-. ]?\d{4})/g;
        const matches = content.match(phoneRegex) || [];
        return matches.filter(phone => this.isValidPhoneNumber(phone));
    }

    isValidEmail(email) {
        // Enhanced email validation
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const valid = regex.test(email);
        console.log('Validating email:', email, valid);
        return valid;
    }

    isValidPhoneNumber(phone) {
        // Remove all non-numeric characters
        const digits = phone.replace(/\D/g, '');
        // Check if the number of digits is valid (7-15 digits)
        const valid = digits.length >= 7 && digits.length <= 15;
        console.log('Validating phone:', phone, valid);
        return valid;
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