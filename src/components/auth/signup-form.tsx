import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate registration delay
        setTimeout(() => {
            setIsLoading(false);
            navigate("/home");
        }, 1500);
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                        id="first-name"
                        placeholder="John"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                        id="last-name"
                        placeholder="Doe"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    placeholder="johndoe"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
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

            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90"
                disabled={isLoading}
            >
                {isLoading ? "Creating account..." : "Create account"}
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
