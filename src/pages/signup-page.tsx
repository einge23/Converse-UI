import { SignupForm } from "../components/auth/signup-form";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router";
export default function SignupPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/90 p-4">
            <div className="absolute left-4 top-4 flex items-center gap-2 md:left-8 md:top-8">
                <MessageCircle className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Converse</span>
            </div>

            <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Create an account</h1>
                    <p className="text-muted-foreground">
                        Enter your details to get started
                    </p>
                </div>
                <SignupForm />
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                        Already have an account?{" "}
                    </span>
                    <Link
                        to="/login"
                        className="font-medium text-primary hover:underline"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
