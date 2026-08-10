export interface ParsedApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
  isNetworkError: boolean;
}

export class ApiErrorHandler {
  static parse(error: any): ParsedApiError {
    if (!error) {
      return {
        status: 500,
        message: 'An unknown server error occurred.',
        isNetworkError: false,
      };
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        status: 408,
        message: 'Server request timed out. Please check your network connection and retry.',
        isNetworkError: true,
      };
    }

    if (!error.response && error.message === 'Network Error') {
      return {
        status: 0,
        message: 'Unable to connect to server. Please check your internet connection.',
        isNetworkError: true,
      };
    }

    const status = error.response?.status || 500;
    const data = error.response?.data;

    let userMessage = 'An unexpected error occurred. Please try again.';

    switch (status) {
      case 400:
        userMessage = data?.message || data?.error || 'Invalid request parameters submitted.';
        break;
      case 401:
        userMessage = 'Session expired or unauthorized. Please sign in again.';
        break;
      case 403:
        userMessage = "Access denied. You don't have permission to perform this operation.";
        break;
      case 404:
        userMessage = 'The requested resource or endpoint was not found on the server.';
        break;
      case 409:
        userMessage = 'Conflict error. A resource with these details already exists.';
        break;
      case 422:
        userMessage = data?.message || 'Form validation failed. Please inspect input values.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment before retrying.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        userMessage = 'Backend service unavailable. Please retry shortly.';
        break;
      default:
        userMessage = data?.message || data?.error || userMessage;
        break;
    }

    return {
      status,
      message: userMessage,
      code: data?.code,
      details: data?.errors || data?.details,
      isNetworkError: false,
    };
  }
}
