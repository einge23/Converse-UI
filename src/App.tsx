import { BrowserRouter, Routes, Route } from "react-router";
import { LandingPage } from "./pages/landing-page";
import SignupPage from "./pages/signup-page";
import LoginPage from "./pages/login-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import HomePage from "./pages/home-page";
import { UserProvider } from "./hooks/useUser";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/home" element={<HomePage />} />
                    </Routes>
                    <Toaster />
                </BrowserRouter>
            </UserProvider>
        </QueryClientProvider>
    );
}

export default App;
