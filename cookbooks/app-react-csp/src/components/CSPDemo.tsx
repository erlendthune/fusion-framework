import { useState, useRef } from 'react';

export const CSPDemo = () => {
  const [logs, setLogs] = useState<string[]>(['CSP violations will appear here...']);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const logMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
  };

  const loadExternalScript = () => {
    logMessage('Attempting to load external script...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js';
    script.onerror = () => {
      logMessage('Failed to load external script (blocked by CSP?)');
    };
    document.head.appendChild(script);
  };

  const loadExternalImage = () => {
    logMessage('Attempting to load external image...');
    const img = document.createElement('img');
    img.src = 'https://via.placeholder.com/200x100/ff0000/ffffff?text=External+Image';
    img.alt = 'External test image';
    img.onerror = () => {
      logMessage('Failed to load external image (blocked by CSP?)');
    };
    img.onload = () => {
      logMessage('External image loaded successfully');
    };
    if (imageContainerRef.current) {
      imageContainerRef.current.appendChild(img);
    }
  };

  const loadExternalCSS = () => {
    logMessage('Attempting to load external CSS...');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap';
    link.onerror = () => {
      logMessage('Failed to load external CSS (blocked by CSP?)');
    };
    document.head.appendChild(link);
  };

  const makeExternalRequest = () => {
    logMessage('Attempting to make external fetch request...');
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then((response) => {
        if (response.ok) {
          logMessage('External request successful');
          return response.json();
        }
        throw new Error('Request failed');
      })
      .then((data) => {
        logMessage('Response received: ' + JSON.stringify(data, null, 2));
      })
      .catch((error) => {
        logMessage('External request blocked or failed: ' + error.message);
      });
  };

  const loadEquinorImage = () => {
    logMessage('Attempting to load image from Equinor CDN...');
    const img = document.createElement('img');
    img.src =
      'https://cdn.equinor.com/images/h61q9gi9/global/cb8f3a7e979835e9d667ba9c04d5536efeedf7ad-11377x8083.jpg?rect=0,2333,11377,3418&w=2560&h=769&q=100&auto=format';
    img.alt = 'Equinor image from CDN';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.onerror = () => {
      logMessage('Equinor image failed to load (blocked by CSP or network error)');
    };
    img.onload = () => {
      logMessage('Equinor image loaded successfully - CSP allows *.equinor.com');
    };
    if (imageContainerRef.current) {
      imageContainerRef.current.appendChild(img);
    }
  };

  const loadDataURLImage = () => {
    logMessage('Loading data URL image (should be allowed)...');
    const img = document.createElement('img');
    img.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzRDQUY1MCIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRhdGEgVVJMIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    img.alt = 'Data URL test image';
    img.onload = () => {
      logMessage('Data URL image loaded successfully');
    };
    if (imageContainerRef.current) {
      imageContainerRef.current.appendChild(img);
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>CSP Violation Playground</h1>

        <div style={styles.section}>
          <h2 style={styles.h2}>Test CSP Violations</h2>
          <p style={styles.p}>Click these buttons to trigger different CSP violations:</p>

          <button type="button" style={styles.button} onClick={loadExternalScript}>
            Load External Script
          </button>
          <button type="button" style={styles.button} onClick={loadExternalImage}>
            Load External Image
          </button>
          <button type="button" style={styles.button} onClick={loadExternalCSS}>
            Load External CSS
          </button>
          <button type="button" style={styles.button} onClick={makeExternalRequest}>
            Make External Request
          </button>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>Test Allowed Sources</h2>
          <p style={styles.p}>These sources should be allowed by our CSP policy:</p>

          <button type="button" style={styles.button} onClick={loadEquinorImage}>
            Load Image from Equinor CDN
          </button>
          <button type="button" style={styles.button} onClick={loadDataURLImage}>
            Load Data URL Image
          </button>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>Image Test Area</h2>
          <div ref={imageContainerRef} style={styles.imageContainer}>
            {/* Images will be added here dynamically */}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>Violation Log</h2>
          <div style={styles.violationLog}>
            {logs.map((log, logIndex) => (
              <div key={`log-${logIndex}-${log.substring(0, 20)}`} style={styles.logEntry}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles converted from CSS to React inline styles
const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    lineHeight: '1.6',
    margin: 0,
    padding: '20px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  h1: {
    color: '#2c3e50',
    textAlign: 'center' as const,
    marginBottom: '30px',
    borderBottom: '3px solid #3498db',
    paddingBottom: '15px',
  },
  h2: {
    color: '#34495e',
    borderLeft: '4px solid #3498db',
    paddingLeft: '15px',
    marginTop: '30px',
  },
  section: {
    marginBottom: '0px',
    padding: '0px',
    background: '#fafafa',
    borderRadius: '5px',
    border: '1px solid #eee',
  },
  button: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    margin: '5px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  imageContainer: {
    minHeight: '100px',
    border: '2px dashed #bdc3c7',
    borderRadius: '4px',
    padding: '15px',
    textAlign: 'center' as const,
  },
  ul: {
    paddingLeft: '20px',
  },
  li: {
    marginBottom: '8px',
  },
  p: {
    marginBottom: '15px',
    color: '#555',
  },
  violationLog: {
    maxHeight: '300px',
    overflowY: 'auto' as const,
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  logEntry: {
    marginBottom: '5px',
    padding: '2px',
  },
};
