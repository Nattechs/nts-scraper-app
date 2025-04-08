class ScraperService {
    constructor() {
        this.settings = SETTINGS;
        // List of CORS proxies to try in order
        this.corsProxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
    }

    async scrapeUrl(url, options = {}) {
        try {
            if (!url) {
                throw new Error('URL is required');
            }

            // Validate URL format
            try {
                new URL(url);
            } catch (e) {
                // If URL doesn't include protocol, prepend https://
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
            }

            // Add cache-busting parameter to the URL
            const cacheBuster = `_t=${Date.now()}`;
            const urlWithCacheBuster = url + (url.includes('?') ? '&' : '?') + cacheBuster;

            // Try each CORS proxy in sequence until one works
            let lastError = null;
            for (const proxyUrl of this.corsProxies) {
                try {
                    console.log('Trying proxy:', proxyUrl);
                    const response = await fetch(proxyUrl + encodeURIComponent(urlWithCacheBuster), {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                    }

                    const content = await response.text();
                    
                    if (!content || content.trim().length === 0) {
                        throw new Error('Received empty content from the server');
                    }

                    console.log('Successfully fetched content using proxy:', proxyUrl);
                    console.log('Content length:', content.length);
                    return this.processResults({ content, url });
                } catch (error) {
                    console.warn(`Proxy ${proxyUrl} failed:`, error.message);
                    lastError = error;
                    continue; // Try next proxy
                }
            }

            // If we get here, all proxies failed
            throw new Error(`All proxies failed. Last error: ${lastError.message}`);
        } catch (error) {
            console.error('Detailed scraping error:', {
                message: error.message,
                url: url,
                stack: error.stack
            });
            throw new Error(`Failed to scan website: ${error.message}`);
        }
    }

    processResults(data) {
        let results = {
            emails: [],
            phones: []
        };

        // Process the page content
        if (data.content) {
            this.extractContactInfo(data.content, data.url, results);
        }

        // Remove duplicates if enabled
        if (this.settings.removeDuplicates) {
            results = this.removeDuplicates(results);
        }

        // Sort results based on settings
        results = this.sortResults(results);

        return results;
    }

    extractContactInfo(content, sourceUrl, results) {
        // Extract emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = content.match(emailRegex) || [];
        
        // Extract phone numbers (improved regex)
        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = content.match(phoneRegex) || [];

        // Add to results with source URL
        emails.forEach(email => {
            if (this.settings.validateEmails && !this.isValidEmail(email)) return;
            results.emails.push({ value: email, source: sourceUrl });
        });

        phones.forEach(phone => {
            if (!this.isValidPhoneNumber(phone)) return;
            results.phones.push({ value: phone, source: sourceUrl });
        });

        // Also try to find links if scanning entire website is enabled
        if (this.settings.followExternalLinks) {
            const links = this.extractLinks(content, sourceUrl);
            // Process first 5 links asynchronously
            links.slice(0, 5).forEach(async (link) => {
                try {
                    const subPageResults = await this.scrapeUrl(link);
                    results.emails.push(...subPageResults.emails);
                    results.phones.push(...subPageResults.phones);
                } catch (error) {
                    console.error(`Error scraping ${link}:`, error);
                }
            });
        }
    }

    extractLinks(content, baseUrl) {
        const links = [];
        const linkRegex = /href=["'](https?:\/\/[^"']+)["']/g;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            const link = match[1];
            if (link.startsWith(baseUrl)) {
                links.push(link);
            }
        }
        
        return links;
    }

    isValidEmail(email) {
        // More comprehensive email validation
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    isValidPhoneNumber(phone) {
        // Improved phone number validation
        const cleanPhone = phone.replace(/[^\d]/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }

    removeDuplicates(results) {
        return {
            emails: [...new Map(results.emails.map(item => [item.value.toLowerCase(), item])).values()],
            phones: [...new Map(results.phones.map(item => [item.value.replace(/[^\d]/g, ''), item])).values()]
        };
    }

    sortResults(results) {
        const sortFn = (a, b) => {
            switch (this.settings.resultsSorting) {
                case 'alphabetical':
                    return a.value.localeCompare(b.value);
                case 'source':
                    return a.source.localeCompare(b.source);
                default:
                    return 0;
            }
        };

        return {
            emails: results.emails.sort(sortFn),
            phones: results.phones.sort(sortFn)
        };
    }
} 