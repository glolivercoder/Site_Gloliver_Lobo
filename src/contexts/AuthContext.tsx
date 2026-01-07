import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { pb } from "../lib/pocketbase";
import { RecordModel } from "pocketbase";

interface AuthContextType {
    user: RecordModel | null;
    isAdmin: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithFacebook: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<RecordModel | null>(pb.authStore.model);
    const [isLoading, setIsLoading] = useState(false); // Initial load is instant for authStore

    // Configured Admin Email
    const ADMIN_EMAIL = "gloliverlobo@gmail.com";

    useEffect(() => {
        // Sync state on change
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const isAdmin =
        user?.email === ADMIN_EMAIL ||
        user?.role === "admin" ||
        user?.username === "admin";

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            await pb.collection("users").authWithOAuth2({ provider: "google" });
        } catch (error) {
            console.error("Google login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithFacebook = async () => {
        setIsLoading(true);
        try {
            await pb.collection("users").authWithOAuth2({ provider: "facebook" });
        } catch (error) {
            console.error("Facebook login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin,
                isLoading,
                loginWithGoogle,
                loginWithFacebook,
                logout,
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
