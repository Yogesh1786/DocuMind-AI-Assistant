import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  type RegisterRequest,
  type User,
} from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (data: RegisterRequest) => Promise<void>;

  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("documind_token"),
  );

  const [loading, setLoading] = useState(true);

  // Restore user session when application starts
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("documind_token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(savedToken);

        setToken(savedToken);
        setUser(currentUser);
      } catch {
        localStorage.removeItem("documind_token");

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email: string, password: string) {
    const response = await loginRequest({
      email,
      password,
    });

    localStorage.setItem("documind_token", response.access_token);

    setToken(response.access_token);
    setUser(response.user);
  }

  async function register(data: RegisterRequest) {
    const response = await registerRequest(data);

    localStorage.setItem("documind_token", response.access_token);

    setToken(response.access_token);
    setUser(response.user);
  }

  function logout() {
    localStorage.removeItem("documind_token");

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
