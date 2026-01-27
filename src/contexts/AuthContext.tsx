import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>; // Kept for interface compatibility
  loginWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  isBlocked: boolean; // Added compatible field
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  // Configured Admin Email
  const ADMIN_EMAIL = "glolivercoder@gmail.com";

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkUserStatus(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkUserStatus(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // inside AuthProvider
  const [dbRole, setDbRole] = useState<string | null>(null);

  // ... useEffect ...

  const checkUserStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsBlocked(false);
      setDbRole(null);
      return;
    }

    // Fetch profile to check role and block status
    const { data } = await supabase
      .from('profiles')
      .select('is_blocked, role')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      setIsBlocked(data.is_blocked || false);
      setDbRole(data.role || 'user');
    } else {
      setIsBlocked(false);
      setDbRole('user');
    }
  };

  // Admin check: Matches Email OR has Admin Role in DB
  const isAdmin = (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || (dbRole === 'admin');

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin // Redirect back to site
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    } finally {
      // Redirect happens, so loading might stay true until reload
    }
  };

  const loginWithFacebook = async () => {
    // Not configured in Supabase yet? Keeping stub.
    console.warn("Facebook login not implemented in Supabase Setup yet.");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        loginWithGoogle,
        loginWithFacebook,
        loginWithEmail,
        logout,
        isBlocked
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
