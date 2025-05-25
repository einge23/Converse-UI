import { useMutation } from "@tanstack/react-query";
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
    return useMutation({
        mutationFn: (credentials: LoginRequest) => login(credentials),
        onSuccess: (result) => {
            if (result.success) {
                navigate("/home");
                toast.success(result.message || "Login successful");
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
    return useMutation({
        mutationFn: () => logout(),
        onSuccess: (result) => {
            if (result.success) {
                navigate("/login");
                toast.success(result.message || "Logout successful");
            } else {
                toast.error(result.message || "Logout failed");
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Logout failed");
        },
    });
};

export const useRegister = () => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: (data: RegisterRequest) => {
            console.log("Attempting registration with data:", data);
            return register(data);
        },
        onSuccess: (result) => {
            console.log("Registration successful:", result);
            if (result.success) {
                navigate("/home");
                toast.success("Registration successful");
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
