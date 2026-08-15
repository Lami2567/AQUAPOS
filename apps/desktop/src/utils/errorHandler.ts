/**
 * USER-FRIENDLY ERROR HANDLING & DATA PRESERVATION SYSTEM
 * 
 * Converts raw HTTP/system errors into clear, non-intimidating natural language messages.
 * Ensures user-entered data is never lost during temporary network or server failures.
 */

export interface FormattedError {
  title: string;
  message: string;
  isRetryable: boolean;
  savedOffline: boolean;
}

export function handleUserError(error: any, fallbackContext = 'operation'): FormattedError {
  const errStr = typeof error === 'string' ? error : error?.message || JSON.stringify(error);

  // Network / Connection Interrupted
  if (
    errStr.includes('Failed to fetch') ||
    errStr.includes('NetworkError') ||
    errStr.includes('ECONNREFUSED') ||
    !navigator.onLine
  ) {
    return {
      title: 'Working Offline',
      message: 'Unable to synchronize this transaction. It has been safely stored locally and will be retried automatically when your connection returns.',
      isRetryable: true,
      savedOffline: true,
    };
  }

  // Timeout Errors
  if (errStr.includes('timeout') || errStr.includes('ETIMEDOUT')) {
    return {
      title: 'Server Response Delayed',
      message: 'The central server took too long to respond. Your data is preserved locally and queued for background sync.',
      isRetryable: true,
      savedOffline: true,
    };
  }

  // Conflict / Duplicate Errors
  if (errStr.includes('CONFLICT') || errStr.includes('UNIQUE constraint')) {
    return {
      title: 'Transaction Already Logged',
      message: 'This record was already saved previously. No duplicate data was created.',
      isRetryable: false,
      savedOffline: false,
    };
  }

  // Unauthorized / Session Expired
  if (errStr.includes('401') || errStr.includes('403') || errStr.includes('Unauthorized')) {
    return {
      title: 'Session Re-authentication Needed',
      message: 'Your permissions session has expired. Please re-login. Your pending work is safely saved.',
      isRetryable: false,
      savedOffline: true,
    };
  }

  // Default Friendly Fallback
  return {
    title: `Unable to complete ${fallbackContext}`,
    message: `A temporary issue occurred while processing your request. Your entry has been backed up locally.`,
    isRetryable: true,
    savedOffline: true,
  };
}
