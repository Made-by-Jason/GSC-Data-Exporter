// js/main.js

// This is the main entry point for the application.
// It ties together the other modules.

window.onGapiLoad = () => {
    loadGapi(onSignedInChanged);
};

function onSignedInChanged(isSignedIn) {
    if (isSignedIn) {
        showAuthenticatedState();
        getSites()
            .then(response => {
                populateSiteSelector(response.result.siteEntry);
            })
            .catch(err => {
                console.error('Error loading sites:', err);
                alert('Error loading sites: ' + (err.result?.error?.message || 'Unknown error'));
            });
    } else {
        showUnauthenticatedState();
    }
}


document.getElementById('signInBtn').addEventListener('click', () => {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    if (isSignedIn) {
        signOut();
    } else {
        signIn();
    }
});


document.getElementById('exportBtn').addEventListener('click', () => {
  const params = getExportParameters();
  if (params) {
    queryApi(params).then(response => {
      const rows = response.result.rows || [];
      const headers = ['Clicks', 'Impressions', 'CTR', 'Position', ...params.dimensions];
      const data = rows.map(row => [row.clicks, row.impressions, row.ctr, row.position, ...row.keys]);

      previewData(headers, data);

      if (params.format === 'csv') {
        exportCSV(headers, data);
      } else {
        exportXLSX(headers, data);
      }
    }).catch(err => {
      console.error('Error querying data:', err);
      alert('Error querying data: ' + (err.result?.error?.message || 'Unknown error'));
    });
  }
});

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default section
    showSection('home');

    // Setup nav links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('href').substring(1);
            if(document.getElementById(targetId)) {
                e.preventDefault();
                showSection(targetId);
            }
        });
    });

    // Setup FAQ toggles
    document.querySelectorAll('#faq .faq-question').forEach(question => {
        question.addEventListener('click', () => {
            toggleFaq(question);
        });
    });

    // Setup mobile menu toggle
    document.getElementById('menu-toggle').addEventListener('click', toggleMenu);
});
