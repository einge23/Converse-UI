import { BrowserRouter, Routes, Route } from "react-router";
import { LandingPage } from "./pages/landing-page";
import SignupPage from "./pages/signup-page";
import LoginPage from "./pages/login-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import HomePage from "./pages/home-page";
import { UserProvider } from "./hooks/useUser";
import VideoPlayTest from "./pages/video-play-test";

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
                        <Route path="/app" element={<HomePage />} />
                        <Route path="/app/friends" element={<HomePage />} />
                        <Route
                            path="/app/friends/:dmThreadId"
                            element={<HomePage />}
                        />
                        <Route path="/app/:serverId" element={<HomePage />} />
                        <Route
                            path="/app/:serverId/:channelId"
                            element={<HomePage />}
                        />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/video-test" element={<VideoPlayTest />} />
                    </Routes>
                    <Toaster />
                </BrowserRouter>
            </UserProvider>
        </QueryClientProvider>
    );
}

export default App;
