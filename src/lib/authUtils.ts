const AUTH_KEY = 'stt_auth_status';
const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || 'demo123'; // Fallback for development

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const setAuthenticated = (status: boolean): void => {
  if (typeof window === 'undefined') return;
  if (status) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const validateAccessCode = (code: string): boolean => {
  return code === ACCESS_CODE;
};