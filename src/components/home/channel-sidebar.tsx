import { useState } from "react";
import { motion } from "framer-motion";
import {
    ChevronDown,
    Hash,
    Plus,
    Settings,
    Users,
    Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUser } from "@/hooks/useUser";
import { useFriends } from "@/hooks/useFriendships";
import { useNavigate } from "react-router";

const channels = [
    { id: "general", name: "general", type: "text", unread: true },
    { id: "welcome", name: "welcome", type: "text" },
    { id: "announcements", name: "announcements", type: "text" },
    { id: "voice-general", name: "General", type: "voice" },
    { id: "voice-gaming", name: "Gaming", type: "voice" },
];

interface ChannelSidebarProps {
    selectedServer?: string;
    selectedChannel?: string;
    onSelectFriend?: (friendId: string | null) => void;
}

export function ChannelSidebar({
    selectedServer = "friends",
    selectedChannel,
    onSelectFriend,
}: ChannelSidebarProps) {
    const { user } = useUser();
    const { data: friends = [] } = useFriends();
    const navigate = useNavigate();
    const [openCategories, setOpenCategories] = useState({
        channels: true,
        voiceChannels: true,
        directMessages: true,
    });

    const isShowingFriends = selectedServer === "friends";

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case "online":
                return "bg-emerald-500";
            case "away":
                return "bg-amber-500";
            case "do_not_disturb":
                return "bg-red-500";
            case "offline":
            default:
                return "bg-muted";
        }
    };

    // Helper function to get display name
    const getDisplayName = (friend: any) => {
        return friend.display_name || friend.username;
    };

    // Handle channel selection for servers
    const handleChannelSelect = (channelId: string) => {
        if (selectedServer !== "friends") {
            navigate(`/app/${selectedServer}/${channelId}`);
        }
    };

    // Handle friend selection - use dm_thread_id if available, fallback to user_id
    const handleFriendSelect = (friend: any) => {
        const dmId = friend.dm_thread_id || friend.user_id;
        onSelectFriend?.(dmId);
    };

    return (
        <div className="flex h-full w-60 flex-col bg-card">
            <div className="flex h-12 items-center border-b px-4">
                <h2 className="font-semibold">
                    {isShowingFriends ? "Friends" : "Gaming Hub"}
                </h2>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
                {isShowingFriends ? (
                    // Friends View - Direct Messages
                    <>
                        <div className="mb-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => onSelectFriend?.(null)}
                            >
                                <Users className="h-4 w-4" />
                                <span>Friends</span>
                            </Button>
                        </div>

                        <Collapsible
                            open={openCategories.directMessages}
                            onOpenChange={(open) =>
                                setOpenCategories({
                                    ...openCategories,
                                    directMessages: open,
                                })
                            }
                        >
                            <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground">
                                <span>Direct Messages — {friends.length}</span>
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
                                {friends.map((friend, index) => (
                                    <motion.div
                                        key={friend.user_id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.03,
                                        }}
                                    >
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-3 px-2 py-3 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            onClick={() =>
                                                handleFriendSelect(friend)
                                            }
                                        >
                                            <div className="relative">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage
                                                        src={
                                                            friend.avatar_url ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={getDisplayName(
                                                            friend
                                                        )}
                                                    />
                                                    <AvatarFallback>
                                                        {getDisplayName(friend)
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                                                        getStatusColor(
                                                            friend.status
                                                        )
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-medium">
                                                    {getDisplayName(friend)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {friend.status === "online"
                                                        ? "Online"
                                                        : friend.status ===
                                                          "away"
                                                        ? "Away"
                                                        : friend.status ===
                                                          "do_not_disturb"
                                                        ? "Do Not Disturb"
                                                        : "Offline"}
                                                </div>
                                            </div>
                                        </Button>
                                    </motion.div>
                                ))}
                                {friends.length === 0 && (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <div className="text-center">
                                            <div className="text-sm">
                                                No friends yet
                                            </div>
                                            <div className="text-xs">
                                                Add some friends to start
                                                chatting
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </>
                ) : (
                    // Server Channels View
                    <>
                        <Collapsible
                            open={openCategories.channels}
                            onOpenChange={(open) =>
                                setOpenCategories({
                                    ...openCategories,
                                    channels: open,
                                })
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
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            transition={{
                                                duration: 0.2,
                                                delay: index * 0.03,
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground",
                                                    selectedChannel ===
                                                        channel.id &&
                                                        "bg-muted/50 text-foreground",
                                                    channel.unread &&
                                                        "font-semibold text-foreground"
                                                )}
                                                onClick={() =>
                                                    handleChannelSelect(
                                                        channel.id
                                                    )
                                                }
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
                            open={openCategories.voiceChannels}
                            onOpenChange={(open) =>
                                setOpenCategories({
                                    ...openCategories,
                                    voiceChannels: open,
                                })
                            }
                            className="mt-2"
                        >
                            <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground">
                                <span>Voice Channels</span>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 transition-transform",
                                        openCategories.voiceChannels
                                            ? "rotate-0"
                                            : "-rotate-90"
                                    )}
                                />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-[2px] pt-1">
                                {channels
                                    .filter((c) => c.type === "voice")
                                    .map((channel, index) => (
                                        <motion.div
                                            key={channel.id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            transition={{
                                                duration: 0.2,
                                                delay: index * 0.03,
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start gap-2 px-2 text-muted-foreground hover:text-foreground",
                                                    selectedChannel ===
                                                        channel.id &&
                                                        "bg-muted/50 text-foreground"
                                                )}
                                                onClick={() =>
                                                    handleChannelSelect(
                                                        channel.id
                                                    )
                                                }
                                            >
                                                <Volume2 className="h-4 w-4" />
                                                <span>{channel.name}</span>
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
                    </>
                )}
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
