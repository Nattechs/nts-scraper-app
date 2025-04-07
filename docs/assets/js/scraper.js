class ScraperService {
    constructor() {
        this.settings = SETTINGS;
    }

    async scrapeUrl(url, options = {}) {
        try {
            // Use a CORS proxy to fetch the webpage
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(url));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            return this.processResults({ content, url });
        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
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