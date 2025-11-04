import { useState, useRef, useEffect, useCallback } from 'react';
import JoditEditor from 'jodit-react';

// Import the CSP violation service
import { cspViolationService, type CSPViolation } from '../services/csp-violation.service';

export const CSPDemo = () => {
  const [logs, setLogs] = useState<string[]>(['Log messages will appear here...']);
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Add refs to prevent recursive violations
  const isHandlingViolation = useRef(false);
  const violationTimeouts = useRef<Map<string, number>>(new Map());

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

  // Jodit editor state
  const [editorContent, setEditorContent] = useState(
    '<h2>CSP Test with Rich Text Editor</h2><p>This is a <strong>rich text editor</strong> that might trigger CSP violations when trying to load external resources or execute inline scripts.</p>',
  );

  const logMessage = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logEntry]);
  }, []);

  // Set up CSP violation detection
  useEffect(() => {
    // Set up a simple console logger for the CSP service
    cspViolationService.setLogger({
      debug: (...args) => console.debug('[CSP]', ...args),
      warn: (...args) => console.warn('[CSP]', ...args),
      error: (...args) => console.error('[CSP]', ...args),
    });

    // Start listening for violations
    cspViolationService.startListening();

    // Add our handler for violations with recursive protection
    const removeHandler = cspViolationService.addHandler((violation: CSPViolation) => {
      // Prevent recursive violations
      if (isHandlingViolation.current) {
        return;
      }

      // Create a unique key for this violation type to debounce similar violations
      const violationKey = `${violation.violatedDirective}-${violation.blockedURI}`;
      const now = Date.now();
      const lastViolationTime = violationTimeouts.current.get(violationKey);

      // Debounce: ignore violations of the same type within 1 second
      if (lastViolationTime && now - lastViolationTime < 1000) {
        return;
      }

      violationTimeouts.current.set(violationKey, now);
      isHandlingViolation.current = true;

      try {
        // Use setTimeout to defer the state update and prevent immediate recursion
        setTimeout(() => {
          logMessage(
            `🚫 CSP Violation: ${violation.violatedDirective} - Blocked: ${violation.blockedURI}`,
          );
          setViolations((prev) => [...prev, violation]);
          isHandlingViolation.current = false;

          // Update the CSP button badge
          const updateButton = (window as { updateCSPButton?: () => void }).updateCSPButton;
          if (updateButton) {
            setTimeout(updateButton, 50);
          }
        }, 0);
      } catch (error) {
        console.error('Error handling CSP violation:', error);
        isHandlingViolation.current = false;
      }
    });

    // Cleanup on unmount
    return () => {
      removeHandler();
      cspViolationService.stopListening();
    };
  }, [logMessage]);

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
      <h1 style={styles.mainTitle}>CSP Violation Playground</h1>

      <div style={styles.twoColumnLayout}>
        {/* Left Column - CSP Demo */}
        <div style={styles.leftColumn}>
          <div style={styles.container}>
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

              <div style={styles.inputGroup}>
                <button
                  type="button"
                  style={{ ...styles.button, backgroundColor: '#28a745', margin: '10px 0' }}
                  onClick={() => {
                    // Create a simple CSP violation by trying to load external script
                    const script = document.createElement('script');
                    script.src = 'https://example.com/test.js';
                    document.head.appendChild(script);
                    logMessage('🧪 Test CSP violation triggered - check the security icon!');
                  }}
                >
                  🧪 Trigger Test Violation
                </button>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.h2}>Image Test Area</h2>
              <div ref={imageContainerRef} style={styles.imageContainer}>
                {/* Images will be added here dynamically */}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.h2}>Rich Text Editor (Jodit) - CSP Test</h2>
              <p style={styles.p}>
                This rich text editor may trigger CSP violations when trying to load external
                resources or execute inline scripts:
              </p>
              <div style={styles.editorContainer}>
                <JoditEditor
                  value={editorContent}
                  onChange={(content) => {
                    setEditorContent(content);
                    logMessage('Editor content changed');
                  }}
                  config={{
                    readonly: false,
                    height: 300,
                    toolbarAdaptive: false,
                    buttons: [
                      'bold',
                      'italic',
                      'underline',
                      '|',
                      'fontsize',
                      'brush',
                      '|',
                      'ul',
                      'ol',
                      '|',
                      'link',
                      'image',
                      '|',
                      'align',
                      '|',
                      'undo',
                      'redo',
                      '|',
                      'hr',
                      'table',
                      '|',
                      'source', // Source code view button
                      '|',
                      'csp-security', // Custom security button
                      '|',
                      'fullsize',
                    ],
                    controls: {
                      'csp-security': {
                        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="transition: color 0.2s ease;">
                          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM19 11C19 15.52 16.02 19.69 12 20.93C7.98 19.69 5 15.52 5 11V6.3L12 3.19L19 6.3V11ZM7 10L12 15L17 10L15.59 8.59L12 12.17L8.41 8.59L7 10Z" fill="currentColor"/>
                        </svg>`,
                        tooltip: 'CSP Violations Monitor',
                        exec: (editor: unknown) => {
                          const joditEditor = editor as {
                            selection: { insertHTML: (html: string) => void };
                            create: { div: (className: string) => HTMLDivElement };
                            toolbar: { container: HTMLElement };
                          };

                          const violationCount = cspViolationService.getViolationCount();
                          const currentViolations = cspViolationService.getViolations();

                          // Create violations panel
                          const panel = joditEditor.create.div('csp-violations-panel');
                          panel.style.cssText = `
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            border: 2px solid #EB0000;
                            border-radius: 8px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                            z-index: 100000;
                            width: 500px;
                            max-height: 600px;
                            overflow: hidden;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                          `;

                          // Header
                          const header = joditEditor.create.div('header');
                          header.style.cssText = `
                            background: #EB0000;
                            color: white;
                            padding: 16px;
                            font-weight: bold;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                          `;
                          header.innerHTML = `
                            <span>🛡️ CSP Violations (${violationCount})</span>
                            <span style="cursor: pointer; font-size: 20px; line-height: 1;">×</span>
                          `;

                          // Close button functionality
                          const closeBtn = header.querySelector('span:last-child') as HTMLElement;
                          closeBtn.addEventListener('click', () => panel.remove());

                          // Status section
                          const status = joditEditor.create.div('status');
                          status.style.cssText = `
                            padding: 16px;
                            background: #f8f9fa;
                            border-bottom: 1px solid #eee;
                            font-size: 14px;
                          `;
                          const isActive = cspViolationService.isActive();
                          status.innerHTML = `
                            <div style="margin-bottom: 8px;">
                              <strong>Status:</strong> 
                              <span style="color: ${isActive ? '#28a745' : '#6c757d'};">
                                ${isActive ? '🟢 Monitoring Active' : '🔴 Monitoring Inactive'}
                              </span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                              <button id="toggle-monitoring" style="
                                background: ${isActive ? '#dc3545' : '#28a745'};
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                              ">
                                ${isActive ? 'Stop Monitor' : 'Start Monitor'}
                              </button>
                              ${
                                violationCount > 0
                                  ? `
                                <button id="clear-violations" style="
                                  background: #6c757d;
                                  color: white;
                                  border: none;
                                  padding: 4px 8px;
                                  border-radius: 4px;
                                  cursor: pointer;
                                  font-size: 12px;
                                ">
                                  Clear All
                                </button>
                              `
                                  : ''
                              }
                            </div>
                          `;

                          // Violations list
                          const violationsList = joditEditor.create.div('violations-list');
                          violationsList.style.cssText = `
                            max-height: 400px;
                            overflow-y: auto;
                            padding: 16px;
                          `;

                          if (violationCount === 0) {
                            violationsList.innerHTML = `
                              <div style="text-align: center; color: #6c757d; padding: 40px;">
                                <div style="font-size: 48px;">🛡️</div>
                                <div style="margin-top: 8px;">No CSP violations detected</div>
                              </div>
                            `;
                          } else {
                            const violationsHtml = currentViolations
                              .slice(-10)
                              .reverse()
                              .map((violation) => {
                                const time = new Date(violation.timestamp).toLocaleTimeString();
                                const truncatedURI =
                                  violation.blockedURI.length > 50
                                    ? violation.blockedURI.substring(0, 50) + '...'
                                    : violation.blockedURI;

                                return `
                                <div style="
                                  border: 1px solid #dee2e6;
                                  border-radius: 4px;
                                  margin-bottom: 8px;
                                  padding: 12px;
                                  background: #fff;
                                ">
                                  <div style="
                                    font-weight: bold;
                                    color: #EB0000;
                                    margin-bottom: 4px;
                                    font-size: 14px;
                                  ">
                                    ${violation.violatedDirective} Violation
                                  </div>
                                  <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">
                                    ${time}
                                  </div>
                                  <div style="font-size: 12px; word-break: break-all;">
                                    <strong>Blocked:</strong> ${truncatedURI}
                                  </div>
                                  <div style="font-size: 12px; margin-top: 4px;">
                                    <strong>Disposition:</strong> ${violation.disposition}
                                  </div>
                                </div>
                              `;
                              })
                              .join('');
                            violationsList.innerHTML = violationsHtml;
                          }

                          // Assemble panel
                          panel.appendChild(header);
                          panel.appendChild(status);
                          panel.appendChild(violationsList);

                          // Add event listeners
                          const toggleBtn = status.querySelector(
                            '#toggle-monitoring',
                          ) as HTMLElement;
                          const clearBtn = status.querySelector('#clear-violations') as HTMLElement;

                          if (toggleBtn) {
                            toggleBtn.addEventListener('click', () => {
                              if (cspViolationService.isActive()) {
                                cspViolationService.stopListening();
                                logMessage('CSP monitoring stopped');
                              } else {
                                cspViolationService.startListening();
                                logMessage('CSP monitoring started');
                              }
                              panel.remove();
                            });
                          }

                          if (clearBtn) {
                            clearBtn.addEventListener('click', () => {
                              cspViolationService.clearViolations();
                              setViolations([]);
                              logMessage('All CSP violations cleared');
                              panel.remove();
                            });
                          }

                          // Add to document
                          document.body.appendChild(panel);

                          // Remove when clicking outside
                          const removePanel = (e: Event) => {
                            if (!panel.contains(e.target as Node)) {
                              panel.remove();
                              document.removeEventListener('click', removePanel);
                            }
                          };
                          setTimeout(() => {
                            document.addEventListener('click', removePanel);
                          }, 0);
                        },
                      },
                    },
                    events: {
                      afterInit: () => {
                        // Add red badge to CSP security button and style the icon
                        let lastViolationCount = -1; // Track last violation count to prevent unnecessary updates

                        const updateCSPButton = () => {
                          // Get current violation count from the service
                          const violationCount = cspViolationService.getViolationCount();

                          // Only update if the violation count has changed
                          if (violationCount === lastViolationCount) {
                            return; // No change, skip update
                          }

                          lastViolationCount = violationCount;
                          console.log(
                            '🔄 CSP Button state changed. Violation count:',
                            violationCount,
                          );

                          // Try multiple selectors to find the CSP button
                          let cspButton = document.querySelector(
                            '[data-tooltip="CSP Violations Monitor"]',
                          ) as HTMLElement;

                          // Fallback selectors if the tooltip selector doesn't work
                          if (!cspButton) {
                            // Try to find by the custom control name
                            cspButton = document.querySelector(
                              '[data-ref="csp-security"]',
                            ) as HTMLElement;
                          }

                          if (!cspButton) {
                            // Try to find the button containing our custom SVG
                            for (const button of Array.from(
                              document.querySelectorAll('.jodit-toolbar-button'),
                            )) {
                              const svg = button.querySelector(
                                'svg path[d*="M12 1L3 5V11C3 16.55"]',
                              );
                              if (svg) {
                                cspButton = button as HTMLElement;
                                break;
                              }
                            }
                          }

                          if (cspButton) {
                            const svgIcon = cspButton.querySelector('svg') as unknown as SVGElement;

                            // Remove existing badge
                            const existingBadge = cspButton.querySelector('.csp-badge');
                            if (existingBadge) {
                              existingBadge.remove();
                            }

                            // Style the icon based on violation status
                            if (svgIcon) {
                              const pathElement = svgIcon.querySelector(
                                'path',
                              ) as unknown as SVGPathElement;

                              if (violationCount > 0) {
                                // Red color for violations - try multiple approaches
                                svgIcon.style.color = '#EB0000';
                                svgIcon.style.fill = '#EB0000';
                                svgIcon.setAttribute('fill', '#EB0000');
                                svgIcon.setAttribute('color', '#EB0000');

                                if (pathElement) {
                                  pathElement.style.fill = '#EB0000';
                                  pathElement.setAttribute('fill', '#EB0000');
                                  pathElement.style.color = '#EB0000';
                                }

                                // Also set the button color and add inline styles
                                cspButton.style.color = '#EB0000';
                                cspButton.style.setProperty('color', '#EB0000', 'important');

                                // Add a class for CSS styling
                                cspButton.classList.add('csp-violations-active');

                                // Force style on all child elements
                                const allElements = Array.from(cspButton.querySelectorAll('*'));
                                allElements.forEach((el) => {
                                  (el as HTMLElement).style.color = '#EB0000';
                                  (el as HTMLElement).style.fill = '#EB0000';
                                });
                              } else {
                                // Default color when no violations
                                svgIcon.style.color = '';
                                svgIcon.style.fill = '';
                                svgIcon.removeAttribute('fill');
                                svgIcon.removeAttribute('color');

                                if (pathElement) {
                                  pathElement.style.fill = '';
                                  pathElement.style.color = '';
                                  pathElement.setAttribute('fill', 'currentColor');
                                }

                                // Reset button color
                                cspButton.style.color = '';
                                cspButton.style.removeProperty('color');

                                // Remove the class
                                cspButton.classList.remove('csp-violations-active');

                                // Reset all child elements
                                const allElements = Array.from(cspButton.querySelectorAll('*'));
                                allElements.forEach((el) => {
                                  (el as HTMLElement).style.color = '';
                                  (el as HTMLElement).style.fill = '';
                                });
                              }
                            }
                          }
                        };

                        // Initial update with a longer delay to ensure Jodit is fully rendered
                        setTimeout(updateCSPButton, 200);

                        // Store update function globally for access from violation handler
                        (window as { updateCSPButton?: () => void }).updateCSPButton =
                          updateCSPButton;

                        // Add CSS styles for CSP button
                        const style = document.createElement('style');
                        style.textContent = `
                          .jodit-toolbar-button.csp-violations-active,
                          .jodit-toolbar-button.csp-violations-active svg,
                          .jodit-toolbar-button.csp-violations-active svg path {
                            color: #EB0000 !important;
                            fill: #EB0000 !important;
                          }
                          
                          /* More aggressive CSS targeting */
                          button[data-tooltip="CSP Violations Monitor"] svg,
                          button[data-tooltip="CSP Violations Monitor"] svg path {
                            transition: color 0.2s ease, fill 0.2s ease;
                          }
                          
                          button[data-tooltip="CSP Violations Monitor"].csp-violations-active svg,
                          button[data-tooltip="CSP Violations Monitor"].csp-violations-active svg path {
                            color: #EB0000 !important;
                            fill: #EB0000 !important;
                          }

                          /* Nuclear option - force red on any CSP button with violations */
                          .csp-violations-active * {
                            color: #EB0000 !important;
                            fill: #EB0000 !important;
                            stroke: #EB0000 !important;
                          }

                          /* Target by path content (our security icon) */
                          svg path[d*="M12 1L3 5V11C3 16.55"] {
                            fill: currentColor !important;
                          }

                          /* When parent has violations, make it red */
                          .csp-violations-active svg path[d*="M12 1L3 5V11C3 16.55"] {
                            fill: #EB0000 !important;
                            color: #EB0000 !important;
                          }
                        `;
                        document.head.appendChild(style);

                        // Store update function globally for access from violation handler
                        (window as { updateCSPButton?: () => void }).updateCSPButton =
                          updateCSPButton;
                      },
                      beforeSetContent: () => {
                        cspViolationService.pauseHandling();
                        logMessage('Jodit: Setting content');
                      },
                      afterSetContent: () => {
                        logMessage('Jodit: Content set');
                        // Resume handling after a short delay
                        setTimeout(() => cspViolationService.resumeHandling(), 100);
                      },
                      beforeCommand: (command: string) => {
                        // Pause handling for image operations which are most likely to cause loops
                        if (command === 'image' || command === 'insertImage') {
                          cspViolationService.pauseHandling();
                          logMessage(`Jodit: Executing ${command} (CSP monitoring paused)`);
                        } else {
                          logMessage(`Jodit: Executing command: ${command}`);
                        }
                      },
                      afterCommand: (command: string) => {
                        // Resume handling after image operations
                        if (command === 'image' || command === 'insertImage') {
                          setTimeout(() => {
                            cspViolationService.resumeHandling();
                            logMessage(`Jodit: Finished ${command} (CSP monitoring resumed)`);
                          }, 200);
                        }
                      },
                    },
                  }}
                />
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

        {/* Right Column - CSP Violations */}
        <div style={styles.rightColumn}>
          <div style={styles.violationsPanel}>
            <h2 style={styles.h2}>CSP Violations ({violations.length})</h2>
            <p style={styles.p}>Real-time CSP violations detected on this page:</p>
            <div style={styles.violationContainer}>
              {violations.length === 0 ? (
                <div style={styles.noViolations}>No CSP violations detected yet.</div>
              ) : (
                violations.map((violation, index) => (
                  <div key={`violation-${violation.timestamp}-${index}`} style={styles.violation}>
                    <div style={styles.violationHeader}>
                      <strong>Violation #{index + 1}</strong>
                      <span style={styles.violationTime}>
                        {new Date(violation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={styles.violationDetails}>
                      <div>
                        <strong>Directive:</strong> {violation.violatedDirective}
                      </div>
                      <div>
                        <strong>Blocked URI:</strong> {violation.blockedURI}
                      </div>
                      <div>
                        <strong>Document:</strong> {violation.documentURI}
                      </div>
                      <div>
                        <strong>Disposition:</strong> {violation.disposition}
                      </div>
                      {violation.sample && (
                        <div>
                          <strong>Sample:</strong> <code>{violation.sample}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                cspViolationService.clearViolations();
                setViolations([]);
                logMessage('Cleared all CSP violations');
              }}
              style={styles.clearButton}
              disabled={violations.length === 0}
            >
              Clear Violations
            </button>
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
  mainTitle: {
    color: '#2c3e50',
    textAlign: 'center' as const,
    marginBottom: '30px',
    borderBottom: '3px solid #3498db',
    paddingBottom: '15px',
    fontSize: '2.5rem',
    fontWeight: 'bold' as const,
  },
  twoColumnLayout: {
    display: 'flex',
    gap: '20px',
    maxWidth: '1600px',
    margin: '0 auto',
    alignItems: 'flex-start',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  leftColumn: {
    flex: '1',
    minWidth: '0',
    '@media (max-width: 768px)': {
      flex: 'none',
    },
  },
  rightColumn: {
    flex: '0 0 400px',
    position: 'sticky' as const,
    top: '20px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    '@media (max-width: 768px)': {
      flex: 'none',
      position: 'static',
      maxHeight: 'none',
      width: '100%',
    },
  },
  violationsPanel: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    border: '2px solid #ff6b6b',
  },
  container: {
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
  editorContainer: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  violationContainer: {
    maxHeight: '60vh',
    overflowY: 'auto' as const,
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '10px',
    backgroundColor: '#fafafa',
  },
  violation: {
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '10px',
    fontSize: '14px',
  },
  violationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    color: '#c62828',
    fontWeight: 'bold' as const,
  },
  violationTime: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 'normal' as const,
  },
  violationDetails: {
    lineHeight: '1.4',
  },
  noViolations: {
    textAlign: 'center' as const,
    color: '#666',
    fontStyle: 'italic' as const,
    padding: '20px',
  },
  clearButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
};
