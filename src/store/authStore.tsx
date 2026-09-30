import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearSession,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  readSession,
  saveSession,
  type AuthUser,
  type RegisterPayload,
} from '@/api/authApi';
import { apiClient } from '@/api/apiClient';


// ─── Context shape ─────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently authenticated user, or null if not signed in. */
  user: AuthUser | null;
  /** True while the initial session is being read from SecureStore. */
  isLoading: boolean;
  /** Signs in with email + password, persists the session, and sets user. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Registers a new passenger account, persists the session, and sets user. */
  signUp: (payload: RegisterPayload) => Promise<void>;
  /** Signs out: calls the backend logout, clears SecureStore, nullifies user. */
  signOut: () => Promise<void>;
}


// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** On mount — restore any persisted session. */
  useEffect(() => {
    (async () => {
      try {
        const session = await readSession();
        if (session) {
          // Re-hydrate the in-memory default header so all subsequent API calls
          // (including logout) include the Bearer token after a page refresh.
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
          setUser(session.user);
        }
      } catch {
        // Corrupted storage — treat as logged out
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);


  const signIn = useCallback(async (email: string, password: string) => {
    const session = await apiLogin({ email, password });
    await saveSession(session);
    setUser(session.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const session = await apiRegister(payload);
    await saveSession(session);
    setUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();   // clears SecureStore internally
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut],
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * Access the current auth state.
 * Must be called inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
