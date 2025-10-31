import { useState, useRef } from 'react';

export const CSPDemo = () => {
  const [logs, setLogs] = useState<string[]>(['Log messages will appear here...']);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // URL inputs state with default values
  const [scriptUrl, setScriptUrl] = useState(
    'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js',
  );
  const [imageUrl, setImageUrl] = useState(
    'https://via.placeholder.com/200x100/ff0000/ffffff?text=External+Image',
  );
  const [cssUrl, setCssUrl] = useState(
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap',
  );
  const [fetchUrl, setFetchUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');

  const logMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
  };

  const loadExternalScript = () => {
    logMessage(`Attempting to load external script: ${scriptUrl}`);
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.onerror = () => {
      logMessage('Failed to load external script (blocked by CSP?)');
    };
    script.onload = () => {
      logMessage('External script loaded successfully');
    };
    document.head.appendChild(script);
  };

  const loadExternalImage = () => {
    logMessage(`Attempting to load external image: ${imageUrl}`);
    const img = document.createElement('img');
    img.src = imageUrl;
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
    logMessage(`Attempting to load external CSS: ${cssUrl}`);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.onerror = () => {
      logMessage('Failed to load external CSS (blocked by CSP?)');
    };
    link.onload = () => {
      logMessage('External CSS loaded successfully');
    };
    document.head.appendChild(link);
  };

  const makeExternalRequest = () => {
    logMessage(`Attempting to make external fetch request: ${fetchUrl}`);
    fetch(fetchUrl)
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

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>CSP Violation Playground</h1>

        <div style={styles.section}>
          <h2 style={styles.h2}>Test CSP Violations</h2>
          <p style={styles.p}>
            Enter your own URLs and click the buttons to test different CSP scenarios:
          </p>

          <div style={styles.inputGroup}>
            <label htmlFor="scriptUrl" style={styles.label}>
              Script URL:
            </label>
            <div style={styles.inputWithButton}>
              <input
                id="scriptUrl"
                type="url"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                style={styles.input}
                placeholder="Enter script URL to test"
              />
              <button type="button" style={styles.button} onClick={loadExternalScript}>
                Load Script
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="imageUrl" style={styles.label}>
              Image URL:
            </label>
            <div style={styles.inputWithButton}>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={styles.input}
                placeholder="Enter image URL to test"
              />
              <button type="button" style={styles.button} onClick={loadExternalImage}>
                Load Image
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="cssUrl" style={styles.label}>
              CSS URL:
            </label>
            <div style={styles.inputWithButton}>
              <input
                id="cssUrl"
                type="url"
                value={cssUrl}
                onChange={(e) => setCssUrl(e.target.value)}
                style={styles.input}
                placeholder="Enter CSS URL to test"
              />
              <button type="button" style={styles.button} onClick={loadExternalCSS}>
                Load CSS
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="fetchUrl" style={styles.label}>
              Fetch URL:
            </label>
            <div style={styles.inputWithButton}>
              <input
                id="fetchUrl"
                type="url"
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
                style={styles.input}
                placeholder="Enter API URL to test"
              />
              <button type="button" style={styles.button} onClick={makeExternalRequest}>
                Make Request
              </button>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>Image Test Area</h2>
          <div ref={imageContainerRef} style={styles.imageContainer}>
            {/* Images will be added here dynamically */}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.h2}>Log</h2>
          <div style={styles.log}>
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
    padding: '20px',
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
  log: {
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
  inputGroup: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  label: {
    fontWeight: 'bold',
    color: '#34495e',
    fontSize: '14px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    flex: 1,
    boxSizing: 'border-box' as const,
  },
  inputWithButton: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
};
