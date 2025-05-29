import Cookies from "js-cookie";
import { apiBase, authApiBase } from "./api-base";
import { z } from "zod";

type LoginWithEmail = {
    email: string;
    username?: never;
    password: string;
};

type LoginWithUsername = {
    email?: never;
    username: string;
    password: string;
};

export type LoginRequest = LoginWithEmail | LoginWithUsername;

export type LoginResponse = {
    token: string;
    expires_at: string;
    session_id: string;
};

export type LoginResult = {
    success: boolean;
    status: number;
    message?: string;
    details?: string;
    requiresReauth?: boolean;
};

export const login = async (
    credentials: LoginRequest
): Promise<LoginResult> => {
    try {
        const response = await apiBase().post(
            "/api/v1/auth/login",
            credentials
        );
        if (response.status === 200) {
            Cookies.set("token", response.data.token);
            Cookies.set("sessionId", response.data.session_id);
            return {
                success: true,
                status: 200,
            };
        }
        return {
            success: false,
            status: response.status,
            message: response.data?.message || "Login failed",
            details: response.data?.details,
        };
    } catch (error: any) {
        console.error("Login error:", error);
        const status = error.response?.status || 500;
        const message =
            error.response?.data?.message || "An unexpected error occurred";
        const details = error.response?.data?.details;

        // Handle device-related errors
        if (status === 401 && message === "Invalid device") {
            // Clear any existing auth data
            Cookies.remove("token");
            Cookies.remove("sessionId");
            return {
                success: false,
                status,
                message,
                details,
                requiresReauth: true,
            };
        }

        return {
            success: false,
            status,
            message,
            details,
        };
    }
};

export type LogoutResult = {
    success: boolean;
    status: number;
    message?: string;
    details?: string;
    requiresReauth?: boolean;
};

export const logout = async (): Promise<LogoutResult> => {
    try {
        const sessionId = Cookies.get("sessionId");
        const token = Cookies.get("token");
        const deviceId = Cookies.get("deviceId");

        // If we don't have either token or sessionId, consider it already logged out
        if (!sessionId || !token) {
            // Clear any remaining cookies just in case
            Cookies.remove("token");
            Cookies.remove("sessionId");
            return {
                success: true,
                status: 200,
                message: "Already logged out",
            };
        }

        try {
            const response = await authApiBase().post(
                "/api/v1/auth/logout",
                null,
                {
                    headers: {
                        "X-Session-ID": sessionId,
                        "X-Device-ID": deviceId,
                    },
                }
            );

            // Clear cookies regardless of response status
            Cookies.remove("token");
            Cookies.remove("sessionId");

            if (response.status === 200) {
                return {
                    success: true,
                    status: 200,
                };
            }

            return {
                success: false,
                status: response.status,
                message: response.data?.message || "Logout failed",
                details: response.data?.details,
            };
        } catch (error: any) {
            // Clear cookies even if the request fails
            Cookies.remove("token");
            Cookies.remove("sessionId");

            const status = error.response?.status || 500;
            const message =
                error.response?.data?.message || "An unexpected error occurred";
            const details = error.response?.data?.details;

            // If we get a 401, consider it a successful logout since the session is invalid anyway
            if (status === 401) {
                return {
                    success: true,
                    status: 200,
                    message: "Session expired, logged out successfully",
                };
            }

            return {
                success: false,
                status,
                message,
                details,
            };
        }
    } catch (error: any) {
        console.error("Logout error:", error);
        // Ensure cookies are cleared even if something unexpected happens
        Cookies.remove("token");
        Cookies.remove("sessionId");

        return {
            success: false,
            status: 500,
            message: "An unexpected error occurred during logout",
            details: error.message,
        };
    }
};

export const registerSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, underscores, and hyphens"
        ),
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export type RegisterResult = {
    success: boolean;
    status: number;
    message?: string;
};

export const register = async (
    data: RegisterRequest
): Promise<RegisterResult> => {
    try {
        console.log(
            "Making registration request to:",
            `${authApiBase()}/api/v1/auth/register`
        );
        const response = await authApiBase().post(
            "/api/v1/auth/register",
            data
        );
        console.log("Registration response:", response);

        if (response.status === 201) {
            return {
                success: true,
                status: 201,
                message: "Registration successful",
            };
        }

        return {
            success: false,
            status: response.status,
            message: response.data?.message || "Registration failed",
        };
    } catch (error: any) {
        console.error("Registration error:", error);
        return {
            success: false,
            status: error.response?.status || 500,
            message:
                error.response?.data?.message || "An unexpected error occurred",
        };
    }
};

export type User = {
    user_id: string;
    username: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    status: "online" | "offline" | "away" | "do_not_disturb";
    last_active_at: string | null;
    created_at: string;
    updated_at: string;
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await authApiBase().get("/api/v1/me");

        if (response.status === 200) {
            return response.data;
        }

        return null;
    } catch (error: any) {
        console.error("Failed to fetch current user:", error);
        return null;
    }
};
