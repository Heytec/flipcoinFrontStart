// src/constants/errorTypes.js

export const ERROR_TYPES = {
    // Game Round Related
    NO_ACTIVE_ROUND: 'NO_ACTIVE_ROUND',
    BETTING_CLOSED: 'BETTING_CLOSED',
    ROUND_NOT_FOUND: 'ROUND_NOT_FOUND',
    ROUND_ALREADY_SETTLED: 'ROUND_ALREADY_SETTLED',
    
    // Betting Related
    INVALID_BET_DATA: 'INVALID_BET_DATA',
    DUPLICATE_BET: 'DUPLICATE_BET',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    BET_NOT_FOUND: 'BET_NOT_FOUND',
    
    // User Related
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_BLOCKED: 'USER_BLOCKED',
    USER_INACTIVE: 'USER_INACTIVE',
    
    // Authentication Related
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    
    // Request Related
    CONCURRENT_REQUEST: 'CONCURRENT_REQUEST',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_REQUEST: 'INVALID_REQUEST',
    
    // System Related
    SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };
  
  export const ERROR_MESSAGES = {
    [ERROR_TYPES.NO_ACTIVE_ROUND]: 'No active round available for betting.',
    [ERROR_TYPES.BETTING_CLOSED]: 'Betting is closed for this round.',
    [ERROR_TYPES.ROUND_NOT_FOUND]: 'The specified round could not be found.',
    [ERROR_TYPES.ROUND_ALREADY_SETTLED]: 'This round has already been settled.',
    
    [ERROR_TYPES.INVALID_BET_DATA]: 'The bet data provided is invalid.',
    [ERROR_TYPES.DUPLICATE_BET]: 'You have already placed a bet for this round.',
    [ERROR_TYPES.INSUFFICIENT_BALANCE]: 'Your balance is insufficient for this bet.',
    [ERROR_TYPES.BET_NOT_FOUND]: 'The specified bet could not be found.',
    
    [ERROR_TYPES.USER_NOT_FOUND]: 'User account not found.',
    [ERROR_TYPES.USER_BLOCKED]: 'This account has been blocked.',
    [ERROR_TYPES.USER_INACTIVE]: 'This account is inactive.',
    
    [ERROR_TYPES.INVALID_CREDENTIALS]: 'Invalid username or password.',
    [ERROR_TYPES.TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
    [ERROR_TYPES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
    
    [ERROR_TYPES.CONCURRENT_REQUEST]: 'Multiple simultaneous requests detected. Please try again.',
    [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment.',
    [ERROR_TYPES.INVALID_REQUEST]: 'Invalid request parameters.',
    
    [ERROR_TYPES.SYSTEM_MAINTENANCE]: 'System is currently under maintenance.',
    [ERROR_TYPES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
    [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred.'
  };
  
  export const getErrorMessage = (errorType, details = null) => {
    const baseMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR];
    
    if (!details) return baseMessage;
  
    // Add specific details to error messages
    switch (errorType) {
      case ERROR_TYPES.INSUFFICIENT_BALANCE:
        return `${baseMessage} You need ${details.deficit} more coins.`;
        
      case ERROR_TYPES.DUPLICATE_BET:
        return `${baseMessage} You bet ${details.existingBet?.amount} on ${details.existingBet?.side}.`;
        
      case ERROR_TYPES.BETTING_CLOSED:
        return `${baseMessage} Round #${details.roundNumber} closed at ${new Date(details.endTime).toLocaleTimeString()}.`;
        
      case ERROR_TYPES.RATE_LIMIT_EXCEEDED:
        return `${baseMessage} Try again in ${details.waitTime} seconds.`;
        
      default:
        return baseMessage;
    }
  };
  
  export const isUserError = (errorType) => {
    return [
      ERROR_TYPES.INVALID_BET_DATA,
      ERROR_TYPES.DUPLICATE_BET,
      ERROR_TYPES.INSUFFICIENT_BALANCE,
      ERROR_TYPES.INVALID_CREDENTIALS,
      ERROR_TYPES.UNAUTHORIZED
    ].includes(errorType);
  };
  
  export const isSystemError = (errorType) => {
    return [
      ERROR_TYPES.SYSTEM_MAINTENANCE,
      ERROR_TYPES.SERVICE_UNAVAILABLE,
      ERROR_TYPES.UNKNOWN_ERROR
    ].includes(errorType);
  };
  
  export const getErrorSeverity = (errorType) => {
    if (isUserError(errorType)) return 'warning';
    if (isSystemError(errorType)) return 'error';
    return 'info';
  };
  
  // Helper function to determine if error should be reported to monitoring service
  export const shouldReportError = (errorType) => {
    return isSystemError(errorType) || errorType === ERROR_TYPES.CONCURRENT_REQUEST;
  };