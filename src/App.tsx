import { BrowserRouter, Routes, Route } from "react-router";
import { LandingPage } from "./pages/landing-page";
import SignupPage from "./pages/signup-page";
import LoginPage from "./pages/login-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import HomePage from "./pages/home-page";
import { UserProvider } from "./hooks/useUser";
import { SocketProvider } from "./contexts/socketContext";

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
                        <Route
                            path="/app/*"
                            element={
                                <SocketProvider>
                                    <Routes>
                                        <Route
                                            path="/"
                                            element={<HomePage />}
                                        />
                                        <Route
                                            path="/friends"
                                            element={<HomePage />}
                                        />
                                        <Route
                                            path="/friends/:dmThreadId"
                                            element={<HomePage />}
                                        />
                                        <Route
                                            path="/:serverId"
                                            element={<HomePage />}
                                        />
                                        <Route
                                            path="/:serverId/:channelId"
                                            element={<HomePage />}
                                        />
                                    </Routes>
                                </SocketProvider>
                            }
                        />
                    </Routes>
                    <Toaster />
                </BrowserRouter>
            </UserProvider>
        </QueryClientProvider>
    );
}

export default App;
