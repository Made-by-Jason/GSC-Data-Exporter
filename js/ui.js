// js/ui.js

/**
 * Updates the UI to reflect the authenticated state.
 */
function showAuthenticatedState() {
  document.getElementById('authStatus').textContent = 'Authenticated successfully.';
  document.getElementById('signInBtn').textContent = 'Sign Out';
  document.querySelectorAll('#gscExportForm input, #gscExportForm select, #exportBtn').forEach(el => el.disabled = false);
}

/**
 * Updates the UI to reflect the unauthenticated state.
 */
function showUnauthenticatedState() {
  document.getElementById('authStatus').textContent = '';
  document.getElementById('signInBtn').textContent = 'Sign in with Google';
  document.querySelectorAll('#gscExportForm input, #gscExportForm select, #exportBtn').forEach(el => el.disabled = true);
  document.getElementById('siteSelect').innerHTML = '';
}

/**
 * Populates the site selector dropdown with the user's sites.
 * @param {Array} sites - An array of site objects from the API.
 */
function populateSiteSelector(sites) {
  const siteSelect = document.getElementById('siteSelect');
  siteSelect.innerHTML = '';
  sites.forEach(site => {
    const option = document.createElement('option');
    option.value = site.siteUrl;
    option.textContent = site.siteUrl;
    siteSelect.appendChild(option);
  });
}

/**
 * Displays a preview of the data in a table.
 * @param {Array} headers - An array of table headers.
 * @param {Array} data - An array of data rows.
 */
function previewData(headers, data) {
  const table = document.getElementById('previewTable');
  table.innerHTML = '';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  document.getElementById('previewSection').classList.remove('hidden');
}

/**
 * Exports the data to a CSV file.
 * @param {Array} headers - An array of table headers.
 * @param {Array} data - An array of data rows.
 */
function exportCSV(headers, data) {
  const csv = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
  downloadFile('gsc_data.csv', 'text/csv', csv);
}

/**
 * Exports the data to an XLSX file.
 * @param {Array} headers - An array of table headers.
 * @param {Array} data - An array of data rows.
 */
function exportXLSX(headers, data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  XLSX.utils.book_append_sheet(wb, ws, 'GSC Data');
  XLSX.writeFile(wb, 'gsc_data.xlsx');
}

/**
 * Downloads a file with the given content.
 * @param {string} filename - The name of the file to download.
 * @param {string} type - The MIME type of the file.
 * @param {string} content - The content of the file.
 */
function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Gets the export parameters from the form.
 * @returns {object|null} - An object with the export parameters, or null if validation fails.
 */
function getExportParameters() {
  const siteUrl = document.getElementById('siteSelect').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const dimensions = Array.from(document.querySelectorAll('#gscExportForm input[type="checkbox"]:checked')).map(cb => cb.value);
  const format = document.getElementById('exportFormat').value;

  if (!siteUrl || !startDate || !endDate) {
    alert('Please select a site and date range.');
    return null;
  }

  return { siteUrl, startDate, endDate, dimensions, format };
}

/**
 * Shows a specific section of the page and hides the others.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.classList.add('hidden');
    });
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden');
    }
}

/**
 * Toggles the visibility of the mobile menu.
 */
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const toggleBtn = document.getElementById('menu-toggle');
    if (menu) {
        const isHidden = menu.classList.toggle('hidden');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', !isHidden ? 'true' : 'false');
        }
    }
}

/**
 * Toggles the visibility of an FAQ answer.
 * @param {HTMLElement} element - The FAQ question element.
 */
function toggleFaq(element) {
    const answer = element.nextElementSibling;
    if (answer) {
        answer.classList.toggle('hidden');
    }
}
