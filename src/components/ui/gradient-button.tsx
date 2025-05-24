import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface GradientButtonProps
    extends React.ComponentProps<"button">,
        VariantProps<typeof buttonVariants> {
    gradient?: "primary" | "secondary" | "accent";
}

const gradientStyles = {
    primary:
        "from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90",
    secondary:
        "from-secondary to-secondary-accent hover:from-secondary/90 hover:to-secondary-accent/90",
    accent: "from-accent to-accent-secondary hover:from-accent/90 hover:to-accent-secondary/90",
};

export function GradientButton({
    className,
    gradient = "primary",
    variant = "default",
    ...props
}: GradientButtonProps) {
    return (
        <Button
            className={cn(
                "bg-gradient-to-r transition-all duration-200",
                gradientStyles[gradient],
                className
            )}
            variant={variant}
            {...props}
        />
    );
}
