class ScraperService {
    constructor() {
        this.settings = SETTINGS;
    }

    async scrapeUrl(url, options = {}) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.API_KEY}`
                },
                body: JSON.stringify({
                    url,
                    scanType: options.scanEntireWebsite ? 'website' : 'single',
                    maxDepth: options.scanEntireWebsite ? this.settings.scanDepth : 1,
                    pageLimit: this.settings.pageLimit,
                    validateEmails: this.settings.validateEmails,
                    phoneFormat: this.settings.phoneFormat,
                    followExternalLinks: this.settings.followExternalLinks
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.processResults(data);
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

        // Process single page results
        if (data.content) {
            this.extractContactInfo(data.content, data.url, results);
        }

        // Process multiple page results
        if (data.pages) {
            data.pages.forEach(page => {
                if (page.content) {
                    this.extractContactInfo(page.content, page.url, results);
                }
            });
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
        
        // Extract phone numbers
        const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
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
    }

    isValidEmail(email) {
        // More comprehensive email validation
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    isValidPhoneNumber(phone) {
        // Basic phone number validation
        return phone.length >= 10;
    }

    removeDuplicates(results) {
        return {
            emails: [...new Map(results.emails.map(item => [item.value, item])).values()],
            phones: [...new Map(results.phones.map(item => [item.value, item])).values()]
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