import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, type User } from "@/api/auth";
import Cookies from "js-cookie";

type UserContextType = {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refetchUser: () => Promise<any>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to watch for token changes in cookies
function useTokenWatcher() {
    const [token, setToken] = useState<string | undefined>(
        Cookies.get("token")
    );

    useEffect(() => {
        // Poll for token changes every 100ms
        const interval = setInterval(() => {
            const currentToken = Cookies.get("token");
            if (currentToken !== token) {
                setToken(currentToken);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [token]);

    return token;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const token = useTokenWatcher();
    const prevTokenRef = useRef<string | undefined>(token);

    const {
        data: user,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["currentUser", token],
        queryFn: getCurrentUser,
        enabled: !!token,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    // Handle token changes
    useEffect(() => {
        const prevToken = prevTokenRef.current;

        if (prevToken !== token) {
            if (!token) {
                queryClient.clear();
            }
            prevTokenRef.current = token;
        }
    }, [token, queryClient]);

    // Handle authentication errors
    useEffect(() => {
        if (user === null && token) {
            Cookies.remove("token");
            Cookies.remove("sessionId");
        }
    }, [user, token]);

    const value: UserContextType = {
        user: user || null,
        isLoading,
        isAuthenticated: !!user && !!token,
        refetchUser: refetch,
    };

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
