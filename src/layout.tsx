import React from "react";
import { Toaster } from "./components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>Converse - Modern Chat Platform</title>
                <meta name="description" content="A modern chat platform" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-sans antialiased">
                <ThemeProvider defaultTheme="dark">
                    <div className="min-h-screen bg-background">{children}</div>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
