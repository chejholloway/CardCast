/**
 * @fileoverview Centralized logging for security-related events.
 * This module provides functions to log security events, which can be extended
 * to send data to a telemetry service or a dedicated security log endpoint.
 */

type SecurityEvent = {
  type:
    | 'auth_failure'
    | 'csp_violation'
    | 'unauthorized_access'
    | 'storage_error'
    | 'other_security_event';
  details?: Record<string, any>;
  timestamp: string;
};

/**
 * Logs a security event to the console.
 * In a production environment, this could send data to a telemetry service.
 * @param eventType The type of security event.
 * @param details Optional details related to the event.
 */
export const logSecurityEvent = (
  eventType: SecurityEvent['type'],
  details?: Record<string, any>
) => {
  const event: SecurityEvent = {
    type: eventType,
    details: details,
    timestamp: new Date().toISOString(),
  };
  // For now, log to console. In a real scenario, this would be sent to a backend.
  console.warn(`🛡️ Security Event: ${eventType}`, event);
};
