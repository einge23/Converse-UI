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
        onSuccess: (result) => {
            if (result.success) {
                // Clear cache and navigate - UserProvider will handle the rest
                queryClient.clear();
                navigate("/home");
                toast.success("Login successful");
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
            // Clear cache and navigate regardless of result
            queryClient.clear();
            navigate("/login");
            toast.success(result.message || "Logout successful");
        },
        onError: (error: any) => {
            // Even on error, clear cache and navigate
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
        mutationFn: (data: RegisterRequest) => register(data),
        onSuccess: (result) => {
            if (result.success) {
                if (result.token && result.session_id) {
                    // Auto-login: clear cache and navigate - UserProvider will fetch fresh data
                    queryClient.clear();
                    navigate("/home");
                    toast.success("Registration successful");
                } else {
                    // Manual login required
                    navigate("/login");
                    toast.success("Registration successful. Please login.");
                }
            } else {
                toast.error(result.message || "Registration failed");
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Registration failed");
        },
    });
};
