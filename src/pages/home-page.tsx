import { GradientButton } from "@/components/ui/gradient-button";
import { useLogout } from "@/hooks/useAuth";

export default function HomePage() {
    const { mutate: logout } = useLogout();
    return (
        <div>
            <h1>Home</h1>
            <GradientButton onClick={() => logout()}>Logout</GradientButton>
        </div>
    );
}
