"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { loginWithWallet, updateUser as apiUpdateUser } from "../lib/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  updateUsername: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, address } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && address) {
      setLoading(true);
      loginWithWallet(address)
        .then(({ user }) => setUser(user))
        .catch((err) => console.error("[Auth] Login failed:", err))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [connected, address]);

  const updateUsername = useCallback(
    async (username: string) => {
      if (!user) return;
      const updated = await apiUpdateUser(user.address, { username });
      setUser(updated);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}
