import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = ainda a verificar a sessão
  const [session, setSession] = useState(undefined);
  const [profileState, setProfileState] = useState({ userId: null, profile: null });

  useEffect(() => {
    let active = true;
    api.auth.getSession().then((s) => active && setSession(s));
    const unsubscribe = api.auth.onAuthChange((s) => setSession(s));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api.profiles
      .getById(userId)
      .then((profile) => active && setProfileState({ userId, profile }))
      .catch(() => active && setProfileState({ userId, profile: null }));
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return null;
    const profile = await api.profiles.getById(userId);
    setProfileState({ userId, profile });
    return profile;
  }, [userId]);

  const updateProfile = useCallback(
    async (patch) => {
      const profile = await api.profiles.update(patch);
      setProfileState({ userId, profile });
      return profile;
    },
    [userId]
  );

  const signOut = useCallback(() => api.auth.signOut(), []);

  const value = useMemo(() => {
    const profile = userId && profileState.userId === userId ? profileState.profile : null;
    const loading = session === undefined || (Boolean(userId) && profileState.userId !== userId);
    return { session, user: session?.user ?? null, profile, loading, refreshProfile, updateProfile, signOut };
  }, [session, userId, profileState, refreshProfile, updateProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  return ctx;
}
