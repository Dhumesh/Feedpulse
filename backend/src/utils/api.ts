export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
};

export const createResponse = <T>(
  success: boolean,
  data: T | null,
  message: string,
  error: string | null = null
): ApiResponse<T> => ({
  success,
  data,
  error,
  message
});
