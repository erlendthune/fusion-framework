// Test functions for CSP violations
function loadExternalScript() {
    logMessage('Attempting to load external script...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js';
    script.onerror = function() {
        logMessage('Failed to load external script (blocked by CSP?)');
    };
    document.head.appendChild(script);
}

function loadExternalImage() {
    logMessage('Attempting to load external image...');
    const img = document.createElement('img');
    img.src = 'https://via.placeholder.com/200x100/ff0000/ffffff?text=External+Image';
    img.alt = 'External test image';
    img.onerror = function() {
        logMessage('Failed to load external image (blocked by CSP?)');
    };
    img.onload = function() {
        logMessage('External image loaded successfully');
    };
    document.getElementById('image-container').appendChild(img);
}

function loadExternalCSS() {
    logMessage('Attempting to load external CSS...');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap';
    link.onerror = function() {
        logMessage('Failed to load external CSS (blocked by CSP?)');
    };
    document.head.appendChild(link);
}

function makeExternalRequest() {
    logMessage('Attempting to make external fetch request...');
    fetch('https://jsonplaceholder.typicode.com/posts/1')
        .then(response => {
            if (response.ok) {
                logMessage('External request successful');
                return response.json();
            }
            throw new Error('Request failed');
        })
        .then(data => {
            logMessage('Response received: ' + JSON.stringify(data, null, 2));
        })
        .catch(error => {
            logMessage('External request blocked or failed: ' + error.message);
        });
}

function loadEquinorImage() {
    logMessage('Attempting to load image from Equinor CDN...');
    const img = document.createElement('img');
    img.src = 'https://cdn.equinor.com/images/h61q9gi9/global/cb8f3a7e979835e9d667ba9c04d5536efeedf7ad-11377x8083.jpg?rect=0,2333,11377,3418&w=2560&h=769&q=100&auto=format';
    img.alt = 'Equinor image from CDN';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.onerror = function() {
        logMessage('Equinor image failed to load (blocked by CSP or network error)');
    };
    img.onload = function() {
        logMessage('Equinor image loaded successfully - CSP allows *.equinor.com');
    };
    document.getElementById('image-container').appendChild(img);
}

// Utility functions
function logMessage(message) {
    const logContainer = document.getElementById('violation-log');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Test data URL image (should work with CSP)
function loadDataURLImage() {
    logMessage('Loading data URL image (should be allowed)...');
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzRDQUY1MCIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRhdGEgVVJMIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    img.alt = 'Data URL test image';
    img.onload = function() {
        logMessage('Data URL image loaded successfully');
    };
    document.getElementById('image-container').appendChild(img);
}