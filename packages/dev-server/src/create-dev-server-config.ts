import { defineConfig, mergeConfig, type UserConfig } from 'vite';

import reactPlugin from '@vitejs/plugin-react';

import apiServicePlugin, {
  createProxyHandler,
} from '@equinor/fusion-framework-vite-plugin-api-service';

import fusionSpaPlugin from '@equinor/fusion-framework-vite-plugin-spa';
import { ConsoleLogger, LogLevel } from '@equinor/fusion-log';

import { processServices as defaultProcessServices } from './process-services.js';

import type { DevServerOptions, TemplateEnv, TemplateEnvFn } from './types.js';

const createDefaultLogger = (lvl: LogLevel = LogLevel.Info, title = 'dev-server') => {
  const logger = new ConsoleLogger(title);
  logger.level = lvl;
  return logger;
};

/**
 * Creates a development server configuration for a Fusion Framework application.
 *
 * @template TEnv - A type extending `Partial<TemplateEnv>` that represents the environment variables for the template.
 * @param options - The options for configuring the development server.
 * @param options.spa - Optional configuration for the Single Page Application (SPA), including template environment settings.
 * @param options.api - Configuration for the API, including service discovery URL, routes, and service processing logic.
 *
 * @returns A `UserConfig` object that defines the Vite development server configuration.
 *
 * @remarks
 * - The `spa.templateEnv` can either be a function or a partial object of type `TEnv`.
 * - The `api.processServices` defaults to `defaultProcessServices` if not provided.
 * - The server is configured to run on port 3000.
 * - Includes plugins for API service handling and SPA template environment generation.
 * - CORS is disabled to allow backend services to handle OPTIONS requests with proper headers.
 *
 * @example
 * ```typescript
 * const config = createDevServerConfig({
 *   spa: {
 *     templateEnv: { API_URL: 'https://api.example.com' },
 *   },
 *   api: {
 *     serviceDiscoveryUrl: 'https://discovery.example.com',
 *     routes: ['/api'],
 *   },
 * });
 * ```
 */
export const createDevServerConfig = <TEnv extends Partial<TemplateEnv>>(
  options: DevServerOptions<TEnv>,
  overrides?: UserConfig,
): UserConfig => {
  const { spa, api, log } = options;
  const processServices = api.processServices ?? defaultProcessServices;
  const generateTemplateEnv: TemplateEnvFn<TEnv> =
    // ensure that the templateEnv is a function
    typeof spa?.templateEnv === 'function'
      ? spa.templateEnv
      : () => spa?.templateEnv as Partial<TEnv>;

  // setup log instance
  const logger = log?.logger ?? createDefaultLogger(log?.level);

  const apiServiceLogger = logger.createSubLogger('api-service');
  const spaLogger = logger.createSubLogger('spa');

  const baseConfig = defineConfig({
    appType: 'custom',
    define: {
      'process.env': JSON.stringify({
        FUSION_LOG_LEVEL: String(logger.level),
      }),
    },
    server: {
      // Disable Vite's internal CORS handling to allow backend to handle OPTIONS requests properly
      // This ensures that OPTIONS requests are forwarded to the backend with proper headers
      cors: false,
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite needs unsafe-eval for HMR
          "style-src 'self' 'unsafe-inline'", // Allow inline styles
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self' ws: wss: https://login.microsoftonline.com https://*.microsoftonline.com https://discovery.fusion.equinor.com https://*.equinor.com", // WebSocket for HMR + Microsoft auth + Fusion services
          "frame-src 'self' https://login.microsoftonline.com https://*.microsoftonline.com", // Allow Microsoft auth in iframes
          "media-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
    },
    plugins: [
      reactPlugin(),
      apiServicePlugin(
        {
          proxyHandler: createProxyHandler(api.serviceDiscoveryUrl, processServices, {
            logger: apiServiceLogger,
          }),
          routes: api.routes,
        },
        {
          logger: apiServiceLogger,
        },
      ),
      fusionSpaPlugin({ generateTemplateEnv, logger: spaLogger }),
    ],
  });
  return mergeConfig(baseConfig, overrides ?? {});
};

export default createDevServerConfig;
