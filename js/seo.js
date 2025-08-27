// js/seo.js

const CORS_PROXY = 'https://corsproxy.io/?';

async function analyzeUrl(url) {
    const resultsContainer = document.getElementById('resultsContainer');
    const seoResults = document.getElementById('seoResults');
    resultsContainer.innerHTML = '<p>Analyzing...</p>';
    seoResults.classList.remove('hidden');

    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const results = {
            title: doc.querySelector('title')?.innerText || 'Not found',
            metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'Not found',
            h1s: Array.from(doc.querySelectorAll('h1')).map(h1 => h1.innerText),
            images: Array.from(doc.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt || 'Missing alt text'
            }))
        };

        displayResults(results);

    } catch (error) {
        console.error('Error analyzing URL:', error);
        resultsContainer.innerHTML = `<p class="text-red-500">Failed to analyze URL. Please check the URL and try again. Error: ${error.message}</p>`;
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `
        <div><strong>Title:</strong> ${results.title}</div>
        <div><strong>Meta Description:</strong> ${results.metaDescription}</div>
        <div><strong>H1 Tags:</strong></div>
        <ul>
            ${results.h1s.length > 0 ? results.h1s.map(h1 => `<li>- ${h1}</li>`).join('') : '<li>No H1 tags found</li>'}
        </ul>
        <div><strong>Image Alt Texts:</strong></div>
        <ul>
            ${results.images.length > 0 ? results.images.map(img => `<li>- <strong>${img.src}</strong>: ${img.alt}</li>`).join('') : '<li>No images found</li>'}
        </ul>
    `;
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
    const url = document.getElementById('urlInput').value;
    if (url) {
        analyzeUrl(url);
    } else {
        alert('Please enter a URL.');
    }
});
