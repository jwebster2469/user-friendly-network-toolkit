// Market Research Tools Implementation

class MarketResearch {
    constructor() {
        this.data = [];
    }

    fetchData(apiEndpoint) {
        return fetch(apiEndpoint)
            .then(response => response.json())
            .then(data => {
                this.data = data;
                this.renderData();
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    renderData() {
        const container = document.getElementById('market-research-results');
        container.innerHTML = ''; // Clear previous results
        this.data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'research-item';
            div.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            `;
            container.appendChild(div);
        });
    }
}

// Usage
const marketResearch = new MarketResearch();
marketResearch.fetchData('https://api.example.com/market-research');
