import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    login,
    logout,
    register,
    type LoginRequest,
    type RegisterRequest,
} from "../api/auth";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export const useLogin = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: LoginRequest) => login(credentials),
        onSuccess: async (result) => {
            if (result.success) {
                // Clear any existing stale data first
                queryClient.clear();

                // Give a small delay to allow the UserProvider to detect the new token
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Navigate first, then let the UserProvider handle data fetching
                navigate("/home");
                toast.success(result.message || "Login successful");

                // Invalidate queries after navigation to trigger fresh data fetch
                queryClient.invalidateQueries({ queryKey: ["currentUser"] });
                queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
            } else {
                toast.error(result.message || "Login failed");
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Login failed");
        },
    });
};

export const useLogout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => logout(),
        onSuccess: (result) => {
            if (result.success) {
                // Clear ALL cached data after logout
                queryClient.clear();
                // Also explicitly remove specific query data
                queryClient.setQueryData(["currentUser"], null);
                queryClient.setQueryData(["friendRequests"], null);
                navigate("/login");
                toast.success(result.message || "Logout successful");
            } else {
                toast.error(result.message || "Logout failed");
            }
        },
        onError: (error: any) => {
            // Even on error, clear the cache in case of network issues
            queryClient.clear();
            navigate("/login");
            toast.error(error.response?.data?.message || "Logout failed");
        },
    });
};

export const useRegister = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RegisterRequest) => {
            console.log("Attempting registration with data:", data);
            return register(data);
        },
        onSuccess: async (result) => {
            console.log("Registration successful:", result);
            if (result.success) {
                // Ensure user data is fetched after successful registration
                try {
                    await queryClient.invalidateQueries({
                        queryKey: ["currentUser"],
                    });
                    await queryClient.refetchQueries({
                        queryKey: ["currentUser"],
                    });
                    navigate("/home");
                    toast.success("Registration successful");
                } catch (error) {
                    console.error(
                        "Failed to fetch user data after registration:",
                        error
                    );
                    toast.error(
                        "Registration successful but failed to load user data. Please refresh the page."
                    );
                }
            } else {
                toast.error(result.message || "Registration failed");
            }
        },
        onError: (error: any) => {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.message || "Registration failed");
        },
    });
};
