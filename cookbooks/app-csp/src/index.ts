import { configureModules, type AppRenderFn } from '@equinor/fusion-framework-app';

// Import the static assets
import htmlTemplate from './templates/app.html?raw';
import cssStyles from './styles/app.css?raw';
import appScript from './scripts/app.js?raw';

// Type definitions
interface FusionModules {
  auth?: {
    defaultAccount?: unknown;
    hasValidAccessToken?: boolean;
  };
}

interface CSPTestAppConstructor {
  new (modules: FusionModules | null): unknown;
}

interface WindowWithCSPTestApp extends Window {
  CSPTestApp?: CSPTestAppConstructor;
}

/**
 * This callback is executed during the configuration phase of the application.
 * It allows for custom configuration logic to be applied based on the environment.
 *
 * @param configurator - The configurator instance that provides methods to configure the application.
 * @param env - The environment object that contains details about the render environment.
 */
const init = configureModules((configurator, env) => {
  console.log('configuring application', env);

  /**
   * Registers a callback to be called once the application configuration has been created.
   * This allows for inspection or modification of the configuration before the application is initialized.
   *
   * @param config - The created application configuration object.
   */
  configurator.onConfigured((config) => {
    console.log('application config created', config);
  });

  /**
   * Registers a callback to be called once the application modules have been initialized.
   * This is useful for running any post-initialization logic or to access the initialized modules.
   *
   * @param instance - The instance object containing all initialized modules.
   */
  configurator.onInitialized((instance) => {
    console.log('application config initialized', instance);
  });
});

/**
 * Loads and injects CSS styles into the document head
 */
function loadStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.textContent = cssStyles;
  styleElement.id = 'app-csp-styles';
  document.head.appendChild(styleElement);
}

/**
 * Loads and executes the application JavaScript
 */
function loadScript(modules: FusionModules | null): void {
  try {
    // Create a script element and inject our JavaScript
    const scriptElement = document.createElement('script');
    scriptElement.textContent = appScript;
    scriptElement.id = 'app-csp-script';
    document.head.appendChild(scriptElement);

    // Initialize the CSP Test App if the class is available
    const windowWithApp = window as WindowWithCSPTestApp;
    if (windowWithApp.CSPTestApp) {
      new windowWithApp.CSPTestApp(modules);
    }
  } catch (error) {
    console.error('Failed to load application script:', error);
  }
}

/**
 * Initializes and renders the application within a given HTML element.
 *
 * @param el - The HTML element where the application will be rendered.
 * @param args - Initialization arguments for the application modules.
 */
export const renderApp: AppRenderFn = (el, args) => {
  // Load CSS styles first
  loadStyles();

  // Create the main application container
  const appContainer = document.createElement('div');
  appContainer.innerHTML = htmlTemplate;
  appContainer.id = 'fusion-csp-app';

  // Clear the target element and append our app
  el.innerHTML = '';
  el.appendChild(appContainer);

  // Initialize the Fusion modules
  init(args)
    .then((modules) => {
      console.log('Fusion modules initialized successfully');

      // Load and execute the application script with access to modules
      loadScript(modules as FusionModules);

      // Update auth display if available
      const authDetailsElement = document.getElementById('auth-details');
      if (authDetailsElement && modules?.auth) {
        try {
          const authInfo = {
            defaultAccount: modules.auth.defaultAccount,
            isAuthenticated: !!modules.auth.defaultAccount,
            timestamp: new Date().toISOString(),
          };
          authDetailsElement.textContent = JSON.stringify(authInfo, null, 2);
        } catch (error) {
          authDetailsElement.textContent = `Error displaying auth info: ${error}`;
        }
      }
    })
    .catch((error) => {
      console.error('Failed to initialize Fusion modules:', error);

      // Display error in the auth section
      const authDetailsElement = document.getElementById('auth-details');
      if (authDetailsElement) {
        authDetailsElement.textContent = `Initialization Error: ${JSON.stringify(error, null, 2)}`;
      }

      // Still load the script for CSP testing even if auth fails
      loadScript(null);
    });
};
