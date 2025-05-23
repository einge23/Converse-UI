import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold">Converse</span>
                    </div>
                    <nav className="hidden gap-6 md:flex">
                        <a
                            href="#features"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Features
                        </a>
                        <a
                            href="#"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Community
                        </a>
                        <a
                            href="#"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Support
                        </a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90"
                            onClick={() => navigate("/signup")}
                        >
                            Sign Up
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <section className="container py-24 sm:py-32">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <motion.h1
                            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Connect with your community
                        </motion.h1>
                        <motion.p
                            className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            Converse brings people together through real-time
                            messaging, voice, and video.
                        </motion.p>
                        <motion.div
                            className="mt-6 flex flex-wrap justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-primary to-primary-accent hover:from-primary/90 hover:to-primary-accent/90"
                                onClick={() => navigate("/signup")}
                            >
                                Get Started{" "}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="outline">
                                Learn More
                            </Button>
                        </motion.div>
                    </div>
                </section>

                <section id="features" className="container py-24 sm:py-32">
                    <div className="mx-auto grid max-w-5xl gap-6 px-6 lg:grid-cols-3 lg:gap-12">
                        <motion.div
                            className="flex flex-col items-center space-y-4 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <MessageCircle className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">
                                Real-time Messaging
                            </h3>
                            <p className="text-muted-foreground">
                                Connect instantly with friends and communities
                                through seamless messaging.
                            </p>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center space-y-4 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">
                                Community Building
                            </h3>
                            <p className="text-muted-foreground">
                                Create and join communities around your
                                interests and passions.
                            </p>
                        </motion.div>

                        <motion.div
                            className="flex flex-col items-center space-y-4 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">
                                Secure Communication
                            </h3>
                            <p className="text-muted-foreground">
                                Your conversations are protected with end-to-end
                                encryption.
                            </p>
                        </motion.div>
                    </div>
                </section>
            </main>
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Converse. All rights
                        reserved.
                    </p>
                    <div className="flex gap-4">
                        <a
                            href="#"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Terms
                        </a>
                        <a
                            href="#"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Privacy
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
