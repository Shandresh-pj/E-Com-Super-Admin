export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
}

export class NormalizedApiError extends Error {
  statusCode: number;
  errorType: 'NetworkError' | 'AuthenticationError' | 'AuthorizationError' | 'ValidationError' | 'ServerError' | 'UnknownError';
  rawResponse?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: 'NetworkError' | 'AuthenticationError' | 'AuthorizationError' | 'ValidationError' | 'ServerError' | 'UnknownError' = 'UnknownError',
    rawResponse?: any
  ) {
    super(message);
    this.name = 'NormalizedApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.rawResponse = rawResponse;
  }
}

export function normalizeApiResponse<T = any>(rawResponseBody: any): ApiResponse<T> {
  if (!rawResponseBody) {
    return { success: false, message: 'Empty response payload' };
  }

  // Handle standard { success: true/false, data: ..., message: ... }
  if (typeof rawResponseBody === 'object' && 'success' in rawResponseBody) {
    return {
      success: Boolean(rawResponseBody.success),
      message: rawResponseBody.message || rawResponseBody.error,
      data: rawResponseBody.data !== undefined ? rawResponseBody.data : rawResponseBody,
      total: rawResponseBody.total || rawResponseBody.count,
      page: rawResponseBody.page,
      limit: rawResponseBody.limit,
    };
  }

  // Handle direct array or object payload
  return {
    success: true,
    data: rawResponseBody,
  };
}

export function normalizeApiError(axiosError: any): NormalizedApiError {
  if (!axiosError) {
    return new NormalizedApiError('An unknown error occurred', 500, 'UnknownError');
  }

  if (axiosError.response) {
    const status = axiosError.response.status;
    const body = axiosError.response.data;

    let message = body?.message || body?.error || axiosError.message || `Request failed with status ${status}`;
    if (typeof body === 'string') {
      message = body.slice(0, 150);
    }

    if (status === 401) {
      return new NormalizedApiError(message, status, 'AuthenticationError', body);
    }
    if (status === 403) {
      return new NormalizedApiError(message, status, 'AuthorizationError', body);
    }
    if (status === 400 || status === 422) {
      return new NormalizedApiError(message, status, 'ValidationError', body);
    }
    if (status >= 500) {
      return new NormalizedApiError(message, status, 'ServerError', body);
    }

    return new NormalizedApiError(message, status, 'UnknownError', body);
  }

  if (axiosError.code === 'ECONNABORTED' || axiosError.message?.toLowerCase().includes('timeout')) {
    return new NormalizedApiError('Connection timed out. The server may be waking up, please try again in a few seconds.', 408, 'NetworkError');
  }

  if (axiosError.request) {
    return new NormalizedApiError('Network connection failed. Please check your internet connection or server availability.', 0, 'NetworkError');
  }

  return new NormalizedApiError(axiosError.message || 'An unexpected error occurred', 500, 'UnknownError');
}
