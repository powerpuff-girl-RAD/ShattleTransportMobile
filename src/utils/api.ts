import axios from 'axios';

/**
 * Extracts a user-readable message from any thrown value.
 * Used in catch blocks throughout the app to display API errors consistently.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // The backend returns `{ success: false, message: '...' }`
    const msg = error.response?.data?.message as string | undefined;
    if (msg) return msg;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
