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
  loginWithFacebook: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  isBlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin emails (normalized to lowercase)
const ADMIN_EMAILS = [
  "glolivercoder@gmail.com",
  "gloliverlobo@gmail.com",
  "gloliverx@gmail.com"
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Check if email is in admin list
  const isEmailAdmin = (email: string | undefined | null): boolean => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail);
  };

  const checkUserStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsBlocked(false);
      setDbRole(null);
      setRoleLoaded(true);
      return;
    }

    try {
      // console.log("🔄 Checking user status for:", currentUser.email);

      // Fetch profile to check role and block status
      const { data, error } = await supabase
        .from('profiles')
        .select('is_blocked, role')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        // console.error("❌ Error checking user status:", error.message);
        // If profile doesn't exist, check if email is admin
        if (isEmailAdmin(currentUser.email)) {
          // console.log("✅ Email is in admin list, granting admin role");
          setDbRole('admin');
        } else {
          setDbRole('user');
        }
      } else if (data) {
        setIsBlocked(data.is_blocked || false);
        setDbRole(data.role || 'user');
        // console.log("✅ Profile loaded. Role:", data.role);
      } else {
        // No profile found, fallback to email check
        if (isEmailAdmin(currentUser.email)) {
          setDbRole('admin');
        } else {
          setDbRole('user');
        }
      }
    } catch (err) {
      // console.error("❌ Unexpected error in checkUserStatus:", err);
      // Fallback to email check
      if (isEmailAdmin(currentUser.email)) {
        setDbRole('admin');
      } else {
        setDbRole('user');
      }
    } finally {
      setRoleLoaded(true);
    }
  };

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // console.log("🔓 Initial session:", session?.user?.email || "none");
      setUser(session?.user ?? null);
      checkUserStatus(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("� AUTH STATE CHANGE:", event, session?.user?.email);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setDbRole(null);
        setRoleLoaded(true);
        setIsLoading(false);
      } else if (session?.user) {
        setUser(session.user);
        setRoleLoaded(false); // Reset so we wait for new role
        checkUserStatus(session.user);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setRoleLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Compute isAdmin - prioritize email check for immediate response
  const userEmail = user?.email?.toLowerCase().trim() || "";
  const userRole = user?.app_metadata?.role;
  const isEmailListed = isEmailAdmin(userEmail);

  // isAdmin is true if:
  // 1. Email is in admin list (fastest check)
  // 2. app_metadata.role is 'admin'
  // 3. profiles.role is 'admin' (once loaded)
  const isAdmin = user
    ? (isEmailListed || userRole === 'admin' || dbRole === 'admin')
    : false;

  // Debug logging
  if (user && roleLoaded) {
    console.log("=".repeat(50));
    console.log("🔍 AUTH DEBUG - FINAL ADMIN STATUS");
    console.log("=".repeat(50));
    console.log("User ID:", user.id);
    console.log("Email:", userEmail);
    console.log("Is Email in Admin List:", isEmailListed);
    console.log("Role (app_metadata):", userRole);
    console.log("Role (database):", dbRole);
    console.log("Role Loaded:", roleLoaded);
    console.log("🎯 FINAL isAdmin:", isAdmin);
    console.log("=".repeat(50));
  }

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setRoleLoaded(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    console.warn("Facebook login not implemented in Supabase Setup yet.");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDbRole(null);
    setRoleLoaded(true);
  };

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setRoleLoaded(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        checkUserStatus(data.user);
      }
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
