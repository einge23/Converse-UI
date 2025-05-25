import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useLogin } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function LoginForm() {
    const { mutate: login, isPending } = useLogin();
    const [formData, setFormData] = useState({
        identifier: "",
        password: "",
    });

    const isEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const loginData = isEmail(formData.identifier)
            ? { email: formData.identifier, password: formData.password }
            : { username: formData.identifier, password: formData.password };
        login(loginData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
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
                <Label htmlFor="identifier">Email or Username</Label>
                <Input
                    id="identifier"
                    type="text"
                    placeholder="name@example.com or username"
                    required
                    value={formData.identifier}
                    onChange={handleChange}
                    className={cn(
                        "transition-all duration-200 focus:ring-2 focus:ring-primary/50",
                        formData.identifier &&
                            !isEmail(formData.identifier) &&
                            "lowercase"
                    )}
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                        href="#"
                        className="text-xs text-primary hover:underline"
                    >
                        Forgot password?
                    </a>
                </div>
                <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                </Label>
            </div>
            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90"
                disabled={isPending}
            >
                {isPending ? "Signing in..." : "Sign in"}
            </Button>

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
