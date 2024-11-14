// Multi-Platform Listing Capability Implementation

class MultiPlatformListing {
    constructor() {
        this.platforms = ['Facebook Marketplace', 'eBay', 'Craigslist'];
    }

    listOnPlatforms(listingData) {
        this.platforms.forEach(platform => {
            this.postListing(platform, listingData);
        });
    }

    postListing(platform, listingData) {
        // Simulate posting to the platform
        console.log(`Posting to ${platform}:`, listingData);
        // Here you would implement the actual API call to the platform
    }
}

// Usage
const multiPlatformListing = new MultiPlatformListing();
const listingData = {
    title: 'Sample Product',
    description: 'This is a sample product description.',
    images: ['image1.jpg', 'image2.jpg']
};
multiPlatformListing.listOnPlatforms(listingData);
