/**
 * Simple logger interface for CSP violation service
 */
interface Logger {
  debug(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/**
 * Represents a CSP violation event with relevant details
 */
export interface CSPViolation {
  /** The resource that violated the policy */
  violatedDirective: string;
  /** The policy that was violated */
  originalPolicy: string;
  /** The URI of the resource that violated the policy */
  blockedURI: string;
  /** The document URI where the violation occurred */
  documentURI: string;
  /** The line number where the violation occurred */
  lineNumber: number;
  /** The column number where the violation occurred */
  columnNumber: number;
  /** Timestamp when the violation occurred */
  timestamp: number;
  /** Source file where the violation occurred */
  sourceFile: string;
  /** Sample of the source that caused the violation */
  sample: string;
  /** The disposition of the policy (enforce or report) */
  disposition: string;
}

/**
 * Handler function type for CSP violations
 */
export type CSPViolationHandler = (violation: CSPViolation) => void;

/**
 * Service for handling Content Security Policy violations
 * Provides a singleton pattern for managing CSP violation detection
 */
class CSPViolationService {
  private static instance: CSPViolationService | null = null;
  private handlers: Set<CSPViolationHandler> = new Set();
  private violations: CSPViolation[] = [];
  private isListening = false;
  private logger?: Logger;

  // Add protection against recursive violations
  private isHandlingViolation = false;
  private lastViolationTime = 0;
  private violationThrottle = 100; // ms between handling violations

  private constructor() {}

  /**
   * Get the singleton instance of the CSP violation service
   */
  public static getInstance(): CSPViolationService {
    if (!CSPViolationService.instance) {
      CSPViolationService.instance = new CSPViolationService();
    }
    return CSPViolationService.instance;
  }

  /**
   * Set the logger for the service
   */
  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  /**
   * Start listening for CSP violations
   */
  public startListening(): void {
    if (this.isListening) {
      return;
    }

    this.logger?.debug('Starting CSP violation detection');

    document.addEventListener('securitypolicyviolation', this.handleViolation);
    this.isListening = true;
  }

  /**
   * Stop listening for CSP violations
   */
  public stopListening(): void {
    if (!this.isListening) {
      return;
    }

    this.logger?.debug('Stopping CSP violation detection');

    document.removeEventListener('securitypolicyviolation', this.handleViolation);
    this.isListening = false;
  }

  /**
   * Handle CSP violation events
   */
  private handleViolation = (event: SecurityPolicyViolationEvent): void => {
    const now = Date.now();

    // Throttle violations to prevent recursive loops
    if (this.isHandlingViolation || now - this.lastViolationTime < this.violationThrottle) {
      return;
    }

    this.isHandlingViolation = true;
    this.lastViolationTime = now;

    try {
      const violation: CSPViolation = {
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        timestamp: now,
        sourceFile: event.sourceFile || '',
        sample: event.sample || '',
        disposition: event.disposition,
      };

      // Use a more conservative logging approach to avoid triggering more violations
      if (this.logger && typeof this.logger.warn === 'function') {
        // Defer logging to avoid immediate recursion
        setTimeout(() => {
          this.logger?.warn('CSP Violation detected:', violation);
        }, 0);
      }

      // Store the violation
      this.violations.push(violation);

      // Update CSP button if the update function is available
      const updateButton = (window as { updateCSPButton?: () => void }).updateCSPButton;
      if (updateButton && typeof updateButton === 'function') {
        setTimeout(() => {
          try {
            updateButton();
          } catch (error) {
            console.error('Error updating CSP button:', error);
          }
        }, 50);
      }

      // Notify all handlers with error protection
      this.handlers.forEach((handler) => {
        try {
          // Defer handler execution to prevent immediate recursion
          setTimeout(() => {
            handler(violation);
          }, 0);
        } catch (error) {
          // Avoid logging errors that might cause more violations
          console.error('Error in CSP violation handler:', error);
        }
      });
    } finally {
      // Reset the handling flag after a short delay
      setTimeout(() => {
        this.isHandlingViolation = false;
      }, this.violationThrottle);
    }
  };

  /**
   * Add a handler for CSP violations
   */
  public addHandler(handler: CSPViolationHandler): () => void {
    this.handlers.add(handler);

    // Return a cleanup function
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Get all recorded violations
   */
  public getViolations(): readonly CSPViolation[] {
    return [...this.violations];
  }

  /**
   * Clear all recorded violations
   */
  public clearViolations(): void {
    this.violations = [];
    this.logger?.debug('Cleared all CSP violations');

    // Update CSP button when violations are cleared
    const updateButton = (window as { updateCSPButton?: () => void }).updateCSPButton;
    if (updateButton && typeof updateButton === 'function') {
      setTimeout(() => {
        try {
          updateButton();
        } catch (error) {
          console.error('Error updating CSP button:', error);
        }
      }, 50);
    }
  }

  /**
   * Get the count of violations
   */
  public getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Check if the service is currently listening
   */
  public isActive(): boolean {
    return this.isListening;
  }

  /**
   * Temporarily pause violation handling (useful during DOM manipulation)
   */
  public pauseHandling(): void {
    this.isHandlingViolation = true;
  }

  /**
   * Resume violation handling
   */
  public resumeHandling(): void {
    this.isHandlingViolation = false;
  }

  /**
   * Cleanup method to properly dispose of the service
   */
  public dispose(): void {
    this.stopListening();
    this.handlers.clear();
    this.violations = [];
    CSPViolationService.instance = null;
  }
}

// Export the singleton instance
export const cspViolationService = CSPViolationService.getInstance();

// Export the service class for testing
export { CSPViolationService };
