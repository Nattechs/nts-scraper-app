// Default settings for the scraper
const SETTINGS = {
    maxDepth: 2,
    followExternalLinks: false,
    maxLinks: 5,
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // Use allorigins.win CORS proxy with HTTPS
        this.corsProxy = 'https://api.allorigins.win/get?url=';
    }

    async scrapeUrl(url, options = {}) {
        try {
            if (!url) {
                throw new Error('URL is required');
            }

            // Validate and format URL
            let targetUrl = url.trim();
            
            // Handle protocol
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
            }
            
            // Force HTTPS for security
            targetUrl = targetUrl.replace('http://', 'https://');

            console.log('Target URL:', targetUrl);

            // Construct proxy URL
            const proxyUrl = `${this.corsProxy}${encodeURIComponent(targetUrl)}`;
            console.log('Proxy URL:', proxyUrl);

            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.contents) {
                throw new Error('No content received from proxy');
            }

            const content = data.contents;
            console.log('Successfully fetched content');
            console.log('Content length:', content.length);
            console.log('Content preview:', content.substring(0, 200));

            // Create virtual document to parse HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // Extract text content from the document
            const textContent = doc.body.textContent;

            // Process the results
            if (!textContent || textContent.trim().length === 0) {
                console.error('Empty content received');
                throw new Error('Received empty content');
            }

            const results = this.processResults({ content: textContent, url: targetUrl });
            console.log('Processed results:', results);
            return results;

        } catch (error) {
            console.error('Scraping failed:', error);
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

        try {
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
        } catch (error) {
            console.error('Error processing results:', error);
            return results;
        }
    }

    extractEmails(content) {
        try {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const matches = content.match(emailRegex) || [];
            return matches.filter(email => this.isValidEmail(email));
        } catch (error) {
            console.error('Error extracting emails:', error);
            return [];
        }
    }

    extractPhoneNumbers(content) {
        try {
            // Enhanced phone regex to catch more formats
            const phoneRegex = /(?:(?:\+?\d{1,3}[-. ]?)?(?:\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}))|(?:\d{3}[-. ]?\d{4}[-. ]?\d{4})/g;
            const matches = content.match(phoneRegex) || [];
            return matches.filter(phone => this.isValidPhoneNumber(phone));
        } catch (error) {
            console.error('Error extracting phone numbers:', error);
            return [];
        }
    }

    isValidEmail(email) {
        try {
            // Enhanced email validation
            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const valid = regex.test(email);
            console.log('Validating email:', email, valid);
            return valid;
        } catch (error) {
            console.error('Error validating email:', error);
            return false;
        }
    }

    isValidPhoneNumber(phone) {
        try {
            // Remove all non-numeric characters
            const digits = phone.replace(/\D/g, '');
            // Check if the number of digits is valid (7-15 digits)
            const valid = digits.length >= 7 && digits.length <= 15;
            console.log('Validating phone:', phone, valid);
            return valid;
        } catch (error) {
            console.error('Error validating phone number:', error);
            return false;
        }
    }

    removeDuplicates(items) {
        try {
            const seen = new Set();
            return items.filter(item => {
                const value = item.value.toLowerCase();
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        } catch (error) {
            console.error('Error removing duplicates:', error);
            return items;
        }
    }
} 