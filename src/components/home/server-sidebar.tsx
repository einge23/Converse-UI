import { motion } from "framer-motion";
import { LogOut, Plus, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/useAuth";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const servers = [
    {
        id: "friends",
        name: "Friends",
        icon: <Users className="h-5 w-5" />,
        active: true,
    },
    { id: "server1", name: "Gaming Hub", initial: "G" },
    { id: "server2", name: "Design Team", initial: "D" },
    { id: "server3", name: "Book Club", initial: "B" },
    { id: "server4", name: "Music Lounge", initial: "M" },
];

interface ServerSidebarProps {
    selectedServer?: string;
    onServerSelect?: (serverId: string) => void;
}

export function ServerSidebar({
    selectedServer = "friends",
    onServerSelect,
}: ServerSidebarProps) {
    const logoutMutation = useLogout();

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const handleServerClick = (serverId: string) => {
        onServerSelect?.(serverId);
    };

    return (
        <div className="flex h-full w-[72px] flex-col items-center gap-2 bg-muted py-3">
            <TooltipProvider delayDuration={100}>
                {servers.map((server, index) => (
                    <motion.div
                        key={server.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="relative"
                    >
                        {selectedServer === server.id && (
                            <div className="absolute -left-2 top-1/2 h-2 w-1 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleServerClick(server.id)}
                                    className={cn(
                                        "group flex h-12 w-12 items-center justify-center rounded-full transition-all hover:rounded-2xl",
                                        selectedServer === server.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                    )}
                                >
                                    {server.icon || (
                                        <span className="text-base font-semibold">
                                            {server.initial}
                                        </span>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {server.name}
                            </TooltipContent>
                        </Tooltip>

                        {index === 0 && (
                            <Separator className="my-2 h-[2px] w-8 rounded-full bg-muted-foreground/20" />
                        )}
                    </motion.div>
                ))}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground transition-all hover:rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-500">
                            <Plus className="h-5 w-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add a Server</TooltipContent>
                </Tooltip>

                <div className="mt-auto">
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-muted-foreground transition-all hover:rounded-2xl hover:bg-primary/10 hover:text-primary">
                                        <Settings className="h-5 w-5" />
                                    </button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                User Settings
                            </TooltipContent>
                        </Tooltip>

                        <PopoverContent side="right" className="w-48 p-2">
                            <div className="flex flex-col gap-1">
                                <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </button>
                                <Separator className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    disabled={logoutMutation.isPending}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {logoutMutation.isPending
                                        ? "Logging out..."
                                        : "Logout"}
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TooltipProvider>
        </div>
    );
}
