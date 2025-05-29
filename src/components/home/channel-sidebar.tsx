import { useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronDown,
    Hash,
    MessageCircle,
    Plus,
    Settings,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/useUser";

const channels = [
    { id: "general", name: "general", type: "text", unread: true },
    { id: "welcome", name: "welcome", type: "text" },
    { id: "announcements", name: "announcements", type: "text" },
    { id: "voice-general", name: "General", type: "voice" },
    { id: "voice-gaming", name: "Gaming", type: "voice" },
];

const directMessages = [
    {
        id: "user1",
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "online",
    },
    {
        id: "user2",
        name: "Sam Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "idle",
    },
    {
        id: "user3",
        name: "Taylor Moore",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "dnd",
    },
    {
        id: "user4",
        name: "Jordan Lee",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
    },
];

export function ChannelSidebar() {
    const { user } = useUser();
    const [openCategories, setOpenCategories] = useState({
        channels: true,
        directMessages: true,
    });

    return (
        <div className="flex h-full w-60 flex-col bg-card">
            <div className="flex h-12 items-center border-b px-4">
                <h2 className="font-semibold">Friends</h2>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
                <div className="mb-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <Users className="h-4 w-4" />
                        <span>Friends</span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span>Nitro</span>
                    </Button>
                </div>

                <Separator className="my-2" />

                <Collapsible
                    open={openCategories.channels}
                    onOpenChange={(open) =>
                        setOpenCategories({ ...openCategories, channels: open })
                    }
                >
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground">
                        <span>Text Channels</span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform",
                                openCategories.channels
                                    ? "rotate-0"
                                    : "-rotate-90"
                            )}
                        />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-[2px] pt-1">
                        {channels
                            .filter((c) => c.type === "text")
                            .map((channel, index) => (
                                <motion.div
                                    key={channel.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{
                                        duration: 0.2,
                                        delay: index * 0.03,
                                    }}
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground",
                                            channel.unread &&
                                                "font-semibold text-foreground"
                                        )}
                                    >
                                        <Hash className="h-4 w-4" />
                                        <span>{channel.name}</span>
                                        {channel.unread && (
                                            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </Button>
                                </motion.div>
                            ))}
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-emerald-500"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Channel</span>
                        </Button>
                    </CollapsibleContent>
                </Collapsible>

                <Collapsible
                    open={openCategories.directMessages}
                    onOpenChange={(open) =>
                        setOpenCategories({
                            ...openCategories,
                            directMessages: open,
                        })
                    }
                    className="mt-2"
                >
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground">
                        <span>Direct Messages</span>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform",
                                openCategories.directMessages
                                    ? "rotate-0"
                                    : "-rotate-90"
                            )}
                        />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-[2px] pt-1">
                        {directMessages.map((dm, index) => (
                            <motion.div
                                key={dm.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{
                                    duration: 0.2,
                                    delay: index * 0.03,
                                }}
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
                                >
                                    <div className="relative">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage
                                                src={
                                                    dm.avatar ||
                                                    "/placeholder.svg"
                                                }
                                                alt={dm.name}
                                            />
                                            <AvatarFallback>
                                                {dm.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            className={cn(
                                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                                                dm.status === "online" &&
                                                    "bg-emerald-500",
                                                dm.status === "idle" &&
                                                    "bg-amber-500",
                                                dm.status === "dnd" &&
                                                    "bg-red-500",
                                                dm.status === "offline" &&
                                                    "bg-muted"
                                            )}
                                        />
                                    </div>
                                    <span>{dm.name}</span>
                                </Button>
                            </motion.div>
                        ))}
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-emerald-500"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Friend</span>
                        </Button>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t bg-muted/50 p-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage
                        src="/placeholder.svg?height=32&width=32"
                        alt="Your Avatar"
                    />
                    <AvatarFallback>
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">
                        {user?.username || "Loading..."}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        #{user?.user_id?.slice(-4) || "0000"}
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
