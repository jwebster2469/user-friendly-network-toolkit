// Automated Best Practices Implementation

class AutomatedBestPractices {
    constructor() {
        this.bestPractices = {
            'Facebook Marketplace': {
                titleLength: '50-80 characters',
                descriptionLength: '100-200 characters',
                imageCount: 'At least 3 images'
            },
            'eBay': {
                titleLength: '80-100 characters',
                descriptionLength: '200-400 characters',
                imageCount: 'At least 5 images'
            }
        };
    }

    applyBestPractices(platform, listing) {
        const practices = this.bestPractices[platform];
        if (practices) {
            console.log(`Applying best practices for ${platform}:`);
            console.log(`Title should be between ${practices.titleLength}`);
            console.log(`Description should be between ${practices.descriptionLength}`);
            console.log(`Ensure you have ${practices.imageCount}`);
        } else {
            console.log('No best practices found for this platform.');
        }
    }
}

// Usage
const bestPractices = new AutomatedBestPractices();
const listing = {
    title: 'Sample Product',
    description: 'This is a sample product description.',
    images: ['image1.jpg', 'image2.jpg']
};
bestPractices.applyBestPractices('Facebook Marketplace', listing);
