import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useRegister } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";

type PasswordStrength = {
    score: number;
    message: string;
    requirements: {
        length: boolean;
        uppercase: boolean;
        number: boolean;
        special: boolean;
    };
};

type ValidationState = {
    email: {
        isValid: boolean;
        message: string;
    };
    username: {
        isValid: boolean;
        message: string;
    };
};

export function SignupForm() {
    const { mutate: register, isPending } = useRegister();
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
    });
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        message: "",
        requirements: {
            length: false,
            uppercase: false,
            number: false,
            special: false,
        },
    });
    const [validation, setValidation] = useState<ValidationState>({
        email: {
            isValid: true,
            message: "",
        },
        username: {
            isValid: true,
            message: "",
        },
    });

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: emailRegex.test(email)
                ? ""
                : "Please enter a valid email address",
        };
    };

    const validateUsername = (username: string) => {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        const isValid = usernameRegex.test(username);
        let message = "";

        if (!isValid) {
            message =
                "Username can only contain letters, numbers, underscores, and hyphens";
        } else if (username.length < 3) {
            message = "Username must be at least 3 characters long";
        } else if (username.length > 20) {
            message = "Username must be less than 20 characters";
        }

        return {
            isValid: isValid && username.length >= 3 && username.length <= 20,
            message,
        };
    };

    const checkPasswordStrength = (password: string): PasswordStrength => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        };

        const score = Object.values(requirements).filter(Boolean).length;
        let message = "";

        switch (score) {
            case 0:
                message = "Very weak";
                break;
            case 1:
                message = "Weak";
                break;
            case 2:
                message = "Fair";
                break;
            case 3:
                message = "Good";
                break;
            case 4:
                message = "Strong";
                break;
            default:
                message = "";
        }

        return { score, message, requirements };
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));

        if (id === "password") {
            setPasswordStrength(checkPasswordStrength(value));
        } else if (id === "email") {
            setValidation((prev) => ({
                ...prev,
                email: validateEmail(value),
            }));
        } else if (id === "username") {
            setValidation((prev) => ({
                ...prev,
                username: validateUsername(value),
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            validation.email.isValid &&
            validation.username.isValid &&
            passwordStrength.score >= 3
        ) {
            register(formData);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-primary/50",
                        !validation.email.isValid &&
                            formData.email &&
                            "border-red-500"
                    )}
                />
                {!validation.email.isValid && formData.email && (
                    <p className="text-xs text-red-500">
                        {validation.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    placeholder="johndoe"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-primary/50",
                        !validation.username.isValid &&
                            formData.username &&
                            "border-red-500"
                    )}
                />
                {!validation.username.isValid && formData.username && (
                    <p className="text-xs text-red-500">
                        {validation.username.message}
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    Username must be 3-20 characters and can only contain
                    letters, numbers, underscores, and hyphens
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
                {formData.password && (
                    <div className="space-y-2">
                        <Progress
                            value={passwordStrength.score * 25}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Password strength: {passwordStrength.message}
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li
                                className={cn(
                                    passwordStrength.requirements.length &&
                                        "text-green-500"
                                )}
                            >
                                • At least 8 characters long
                            </li>
                            <li
                                className={cn(
                                    passwordStrength.requirements.uppercase &&
                                        "text-green-500"
                                )}
                            >
                                • Contains uppercase letter
                            </li>
                            <li
                                className={cn(
                                    passwordStrength.requirements.number &&
                                        "text-green-500"
                                )}
                            >
                                • Contains number
                            </li>
                            <li
                                className={cn(
                                    passwordStrength.requirements.special &&
                                        "text-green-500"
                                )}
                            >
                                • Contains special character
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                    </a>
                </Label>
            </div>

            <GradientButton
                type="submit"
                className="w-full"
                disabled={
                    isPending ||
                    passwordStrength.score < 3 ||
                    !validation.email.isValid ||
                    !validation.username.isValid
                }
            >
                {isPending ? "Creating account..." : "Create account"}
            </GradientButton>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    type="button"
                    className="transition-all duration-200 hover:bg-primary/5"
                >
                    Google
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    className="transition-all duration-200 hover:bg-primary/5"
                >
                    GitHub
                </Button>
            </div>
        </motion.form>
    );
}
