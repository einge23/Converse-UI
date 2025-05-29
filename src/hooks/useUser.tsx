import React, { createContext, useContext, useEffect } from "react";
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

export function UserProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const token = Cookies.get("token");

    const {
        data: user,
        isLoading,
        refetch,
        error,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        enabled: !!token, // Only fetch if we have a token
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: any) => {
            // Don't retry on 401 errors (unauthorized)
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
    });

    // Watch for token changes and trigger data fetching
    useEffect(() => {
        if (!token) {
            queryClient.setQueryData(["currentUser"], null);
            queryClient.setQueryData(["friendRequests"], null);
        } else if (token) {
            // When we have a token, ensure user data is fetched
            if (!user && !isLoading) {
                console.log("Token detected, refetching user data...");
                refetch();
            }
            // Also ensure friend requests are fetched when user becomes authenticated
            if (user) {
                queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
            }
        }
    }, [token, queryClient, user, isLoading, refetch]);

    // Handle authentication errors
    useEffect(() => {
        if (error?.response?.status === 401) {
            console.log("Authentication error, clearing tokens...");
            // Clear invalid token and user data
            Cookies.remove("token");
            Cookies.remove("sessionId");
            queryClient.clear();
        }
    }, [error, queryClient]);

    const value: UserContextType = {
        user: user || null,
        isLoading,
        isAuthenticated: !!user && !!token,
        refetchUser: () => refetch(),
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
