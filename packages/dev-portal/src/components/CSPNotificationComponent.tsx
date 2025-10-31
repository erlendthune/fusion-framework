import React, { useState, useMemo } from 'react';
import { Button, Icon, Popover, Typography, List } from '@equinor/eds-core-react';
import { security, clear } from '@equinor/eds-icons';
import { useCSPViolations } from '../hooks/useCSPViolations';
import type { CSPViolation } from '../services/csp-violation.service';

Icon.add({ security, clear });

/**
 * Component for displaying CSP violation notifications in the header
 */
export function CSPNotificationComponent() {
  const { violations, violationCount, isActive, toggleListening, clearViolations } =
    useCSPViolations();

  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  // Memoize the displayed violations to prevent unnecessary re-renders
  const displayedViolations = useMemo(() => {
    return violations.slice(-10).reverse();
  }, [violations]);

  // Memoize button color to prevent style recalculations
  const buttonColor = useMemo(() => {
    if (violationCount > 0) {
      return '#EB0000'; // Red for violations
    }
    if (isActive) {
      return '#007079'; // Teal for active monitoring
    }
    return '#6F6F6F'; // Gray for inactive
  }, [violationCount, isActive]);

  // Format violation for display with URL truncation
  const formatViolation = (violation: CSPViolation) => {
    const time = new Date(violation.timestamp).toLocaleTimeString();
    // Truncate long URLs to prevent layout shifts
    const truncatedURI =
      violation.blockedURI.length > 60
        ? `${violation.blockedURI.substring(0, 60)}...`
        : violation.blockedURI;

    return {
      primary: `${violation.violatedDirective} violation`,
      secondary: `${truncatedURI} at ${time}`,
      details: violation,
    };
  };

  // Get button variant based on violations
  const getButtonVariant = () => {
    return 'ghost_icon' as const;
  };

  const handleToggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearViolations();
  };

  const handleToggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleListening();
  };

  return (
    <>
      <Button
        ref={anchorRef}
        variant={getButtonVariant()}
        onClick={handleToggleOpen}
        style={{
          position: 'relative',
          color: buttonColor,
        }}
        title={`CSP Monitor ${isActive ? 'Active' : 'Inactive'} - ${violationCount} violations`}
      >
        <Icon name="security" />
        {violationCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#EB0000',
              color: 'white',
              borderRadius: '50%',
              width: 16,
              height: 16,
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {violationCount > 99 ? '99+' : violationCount}
          </span>
        )}
      </Button>

      <Popover
        open={isOpen}
        anchorEl={anchorRef.current}
        onClose={() => setIsOpen(false)}
        placement="bottom-end"
        style={{ maxWidth: 500, maxHeight: 400 }}
      >
        <div style={{ padding: 16 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Typography variant="h6">CSP Violations ({violationCount})</Typography>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost_icon"
                onClick={handleToggleListening}
                title={isActive ? 'Stop monitoring' : 'Start monitoring'}
                color={isActive ? 'primary' : 'secondary'}
              >
                <Icon name="security" />
              </Button>
              {violationCount > 0 && (
                <Button variant="ghost_icon" onClick={handleClearAll} title="Clear all violations">
                  <Icon name="clear" />
                </Button>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <Typography variant="body_short" color={isActive ? 'primary' : 'secondary'}>
              Status: {isActive ? 'Monitoring Active' : 'Monitoring Inactive'}
            </Typography>
          </div>

          {/* Violations List */}
          {violationCount === 0 ? (
            <Typography variant="body_short" color="secondary">
              {isActive
                ? 'No violations detected. CSP monitoring is active.'
                : 'CSP monitoring is inactive. Click the info button to start monitoring.'}
            </Typography>
          ) : (
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              <List>
                {displayedViolations.map((violation, index) => {
                  const formatted = formatViolation(violation);
                  // Create a stable key that doesn't include special characters
                  const stableKey = `violation-${violation.timestamp}-${index}`;
                  return (
                    <List.Item key={stableKey}>
                      <div style={{ width: '100%', minHeight: '60px' }}>
                        <Typography
                          variant="body_short"
                          style={{
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                        >
                          {formatted.primary}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="secondary"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            display: 'block',
                          }}
                        >
                          {formatted.secondary}
                        </Typography>
                        {violation.sample && (
                          <Typography
                            variant="caption"
                            style={{
                              display: 'block',
                              fontFamily: 'monospace',
                              backgroundColor: '#f7f7f7',
                              padding: '2px 4px',
                              borderRadius: 2,
                              marginTop: 4,
                            }}
                          >
                            {violation.sample.length > 50
                              ? `${violation.sample.substring(0, 50)}...`
                              : violation.sample}
                          </Typography>
                        )}
                      </div>
                    </List.Item>
                  );
                })}
              </List>
              {violations.length > 10 && (
                <Typography
                  variant="caption"
                  color="secondary"
                  style={{ textAlign: 'center', display: 'block', marginTop: 8 }}
                >
                  Showing last 10 of {violationCount} violations
                </Typography>
              )}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
}
