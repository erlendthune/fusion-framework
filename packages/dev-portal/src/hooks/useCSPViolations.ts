import { useCallback, useEffect, useState } from 'react';
import { cspViolationService, type CSPViolation } from '../services/csp-violation.service';

/**
 * Hook for managing CSP violations in React components
 * Provides state management and handlers for CSP violation detection
 */
export function useCSPViolations() {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Update violations when new ones are detected
  const handleViolation = useCallback((violation: CSPViolation) => {
    setViolations((prev) => [...prev, violation]);
  }, []);

  // Start listening for violations
  const startListening = useCallback(() => {
    if (!isActive) {
      cspViolationService.startListening();
      setIsActive(true);
      // Load existing violations
      setViolations([...cspViolationService.getViolations()]);
    }
  }, [isActive]);

  // Stop listening for violations
  const stopListening = useCallback(() => {
    if (isActive) {
      cspViolationService.stopListening();
      setIsActive(false);
    }
  }, [isActive]);

  // Clear all violations
  const clearViolations = useCallback(() => {
    cspViolationService.clearViolations();
    setViolations([]);
  }, []);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isActive) {
      stopListening();
    } else {
      startListening();
    }
  }, [isActive, startListening, stopListening]);

  // Effect to manage the violation handler
  useEffect(() => {
    if (isActive) {
      const cleanup = cspViolationService.addHandler(handleViolation);
      return cleanup;
    }
  }, [isActive, handleViolation]);

  // Effect to sync active state with service
  useEffect(() => {
    setIsActive(cspViolationService.isActive());
  }, []);

  return {
    /** All recorded CSP violations */
    violations,
    /** Whether the service is actively listening for violations */
    isActive,
    /** Number of violations detected */
    violationCount: violations.length,
    /** Start listening for CSP violations */
    startListening,
    /** Stop listening for CSP violations */
    stopListening,
    /** Toggle between listening and not listening */
    toggleListening,
    /** Clear all recorded violations */
    clearViolations,
  };
}
