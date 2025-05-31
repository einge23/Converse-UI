import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, MessageCircle, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    useFriendRequests,
    useAcceptFriendRequest,
    useDeclineFriendRequest,
    useCreateFriendRequest,
    useFriends,
} from "@/hooks/useFriendships";
import { useUser } from "@/hooks/useUser";
import { useChat } from "@/hooks/useChat";
import { type FriendRequestWithUser } from "@/api/friends";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface FriendsListProps {}

export function FriendsList({}: FriendsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("online");
    const [friendUsername, setFriendUsername] = useState("");
    const { user } = useUser();
    const navigate = useNavigate();

    const friends = useFriends().data || [];
    const friendRequests = useFriendRequests().data || [];
    const acceptFriendRequest = useAcceptFriendRequest();
    const declineFriendRequest = useDeclineFriendRequest();
    const createFriendRequest = useCreateFriendRequest();

    // Debug logging
    console.log("Friends data:", friends);
    console.log("Number of friends:", friends.length);
    if (friends.length > 0) {
        console.log("First friend object:", friends[0]);
        console.log("First friend display_name:", friends[0]?.display_name);
    }

    const {
        conversations,
        getTotalUnreadCount,
        setCurrentUserId,
        isConnected,
    } = useChat({
        autoConnect: false, // Don't auto-connect
        onNewMessage: (message, conversationId) => {
            // Show notification for new messages
            const friend = friends.find((f) => f.user_id === conversationId);
            if (friend && !message.isCurrentUser) {
                toast.info(`New message from ${getDisplayName(friend)}`, {
                    description:
                        message.content.length > 50
                            ? message.content.substring(0, 50) + "..."
                            : message.content,
                });
            }
        },
    });

    // Set current user ID when component mounts
    useEffect(() => {
        if (user?.user_id) {
            setCurrentUserId(user.user_id);
        }
    }, [user?.user_id, setCurrentUserId]);

    // Filter friend requests to show only pending ones where current user is recipient
    const pendingFriendRequests = friendRequests.filter(
        (request: FriendRequestWithUser) =>
            request.status === "pending" &&
            request.recipient_id === user?.user_id
    );

    const filteredFriends = friends.filter((friend) => {
        const matchesSearch =
            friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            friend.display_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        const matchesTab =
            activeTab === "all" ||
            (activeTab === "online" && friend.status === "online") ||
            (activeTab === "pending" && false); // Regular friends don't show in pending

        return matchesSearch && matchesTab;
    });

    // Filter pending requests by search query using actual user data
    const filteredPendingRequests = pendingFriendRequests.filter(
        (request: FriendRequestWithUser) => {
            const searchableText =
                `${request.requester.username} ${request.requester.display_name}`.toLowerCase();
            return searchableText.includes(searchQuery.toLowerCase());
        }
    );

    const handleAcceptRequest = (requestId: number) => {
        acceptFriendRequest.mutate(requestId);
    };

    const handleDeclineRequest = (requestId: number) => {
        declineFriendRequest.mutate(requestId);
    };

    const handleSendFriendRequest = () => {
        if (!friendUsername.trim()) return;

        createFriendRequest.mutate({ username: friendUsername.trim() });
        setFriendUsername("");
    };

    const handleSelectFriend = (friendId: string) => {
        // Navigate to DM using the friend's dm_thread_id or user_id
        const friend = friends.find((f) => f.user_id === friendId);
        const dmId = friend?.dm_thread_id || friendId;
        navigate(`/app/friends/${dmId}`);
    };

    // Get unread count for a specific friend
    const getUnreadCount = (friendId: string) => {
        const conversation = conversations.find(
            (c) => c.participantId === friendId
        );
        return conversation?.unreadCount || 0;
    };

    // Get last message for a friend
    const getLastMessage = (friendId: string) => {
        const conversation = conversations.find(
            (c) => c.participantId === friendId
        );
        return conversation?.lastMessage;
    };

    // Format last message timestamp
    const formatLastMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

        if (diffInMinutes < 1) {
            return "now";
        } else if (diffInMinutes < 60) {
            return `${Math.floor(diffInMinutes)}m`;
        } else if (diffInMinutes < 1440) {
            // 24 hours
            return `${Math.floor(diffInMinutes / 60)}h`;
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        }
    };

    // Determine what to show based on active tab
    const showPendingRequests = activeTab === "pending";
    const showAddFriend = activeTab === "add";
    const itemCount = showPendingRequests
        ? filteredPendingRequests.length
        : filteredFriends.length;

    // Helper function to get status indicator color
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

    // Helper function to get display name, fallback to username if display_name is empty
    const getDisplayName = (friend: any) => {
        return friend.display_name?.trim() || friend.username;
    };

    // Helper function to get avatar fallback
    const getAvatarFallback = (friend: any) => {
        const name = getDisplayName(friend);
        return name.charAt(0).toUpperCase();
    };

    const totalUnreadCount = getTotalUnreadCount();

    return (
        <div className="flex h-full flex-col">
            <header className="flex h-12 items-center border-b px-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <h1 className="font-semibold">Friends</h1>
                    {totalUnreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {totalUnreadCount}
                        </div>
                    )}
                    {!isConnected && (
                        <div className="text-xs text-amber-500">Offline</div>
                    )}
                </div>
                <Tabs
                    defaultValue="online"
                    className="ml-4"
                    onValueChange={setActiveTab}
                >
                    <TabsList>
                        <TabsTrigger value="online">Online</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending" className="relative">
                            Pending
                            {pendingFriendRequests.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {pendingFriendRequests.length}
                                </div>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="add">Add Friend</TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            {!showAddFriend && (
                <div className="border-b p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search friends"
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                {showAddFriend ? (
                    // Add Friend Form with fade-in animation
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <h2 className="text-lg font-semibold mb-2">
                                Add Friend
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Enter a username to send a friend request
                            </p>
                        </motion.div>

                        <motion.div
                            className="space-y-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter username"
                                    value={friendUsername}
                                    onChange={(e) =>
                                        setFriendUsername(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSendFriendRequest();
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendFriendRequest}
                                    disabled={
                                        !friendUsername.trim() ||
                                        createFriendRequest.isPending
                                    }
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                    {createFriendRequest.isPending
                                        ? "Sending..."
                                        : "Send Request"}
                                </Button>
                            </div>

                            <motion.div
                                className="text-xs text-muted-foreground"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <p>
                                    • You can send friend requests using their
                                    exact username
                                </p>
                                <p>
                                    • Friend requests are pending until the
                                    other user accepts
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                ) : (
                    // Existing friends/pending lists
                    <>
                        <h2 className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
                            {activeTab === "online"
                                ? "Online"
                                : activeTab === "pending"
                                ? "Pending Friend Requests"
                                : "All Friends"}{" "}
                            — {itemCount}
                        </h2>

                        <div className="space-y-2">
                            {itemCount > 0 ? (
                                showPendingRequests ? (
                                    // Render pending friend requests with actual user data
                                    filteredPendingRequests.map(
                                        (
                                            request: FriendRequestWithUser,
                                            index
                                        ) => (
                                            <motion.div
                                                key={request.friend_request_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    delay: index * 0.05,
                                                }}
                                            >
                                                <div className="group flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted">
                                                    <div className="relative">
                                                        <Avatar>
                                                            <AvatarImage
                                                                src={
                                                                    request
                                                                        .requester
                                                                        .avatar_url ||
                                                                    "/placeholder.svg"
                                                                }
                                                                alt={
                                                                    request
                                                                        .requester
                                                                        .display_name
                                                                }
                                                            />
                                                            <AvatarFallback>
                                                                {request.requester.display_name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div
                                                            className={cn(
                                                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                                                                getStatusColor(
                                                                    request
                                                                        .requester
                                                                        .status
                                                                )
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-medium">
                                                            {
                                                                request
                                                                    .requester
                                                                    .display_name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            @
                                                            {
                                                                request
                                                                    .requester
                                                                    .username
                                                            }{" "}
                                                            • Incoming friend
                                                            request
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                                            onClick={() =>
                                                                handleAcceptRequest(
                                                                    request.friend_request_id
                                                                )
                                                            }
                                                            disabled={
                                                                acceptFriendRequest.isPending
                                                            }
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                            onClick={() =>
                                                                handleDeclineRequest(
                                                                    request.friend_request_id
                                                                )
                                                            }
                                                            disabled={
                                                                declineFriendRequest.isPending
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    )
                                ) : (
                                    // Render regular friends with message info
                                    filteredFriends.map((friend, index) => {
                                        const unreadCount = getUnreadCount(
                                            friend.user_id
                                        );
                                        const lastMessage = getLastMessage(
                                            friend.user_id
                                        );

                                        return (
                                            <motion.div
                                                key={friend.user_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    delay: index * 0.05,
                                                }}
                                            >
                                                <button
                                                    className="group flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted"
                                                    onClick={() =>
                                                        handleSelectFriend(
                                                            friend.user_id
                                                        )
                                                    }
                                                >
                                                    <div className="relative">
                                                        <Avatar>
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
                                                                {getAvatarFallback(
                                                                    friend
                                                                )}
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
                                                    <div className="flex-1 text-left min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p
                                                                className={cn(
                                                                    "font-medium truncate",
                                                                    unreadCount >
                                                                        0 &&
                                                                        "text-foreground"
                                                                )}
                                                            >
                                                                {getDisplayName(
                                                                    friend
                                                                )}
                                                            </p>
                                                            {lastMessage && (
                                                                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                                                    {formatLastMessageTime(
                                                                        lastMessage.timestamp
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p
                                                                className={cn(
                                                                    "text-xs text-muted-foreground truncate",
                                                                    lastMessage
                                                                        ? "max-w-[150px]"
                                                                        : ""
                                                                )}
                                                            >
                                                                {lastMessage ? (
                                                                    <span>
                                                                        {lastMessage.isCurrentUser
                                                                            ? "You: "
                                                                            : ""}
                                                                        {
                                                                            lastMessage.content
                                                                        }
                                                                    </span>
                                                                ) : friend.status ===
                                                                  "offline" ? (
                                                                    `Last online ${friend.last_active_at}`
                                                                ) : (
                                                                    `${friend.status
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}${friend.status.slice(
                                                                        1
                                                                    )}`
                                                                )}
                                                            </p>
                                                            {unreadCount >
                                                                0 && (
                                                                <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-2 shrink-0">
                                                                    {
                                                                        unreadCount
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </button>
                                            </motion.div>
                                        );
                                    })
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="mb-4 rounded-full bg-muted p-4">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="mb-1 text-lg font-semibold">
                                        {showPendingRequests
                                            ? "No pending requests"
                                            : "No friends found"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {searchQuery
                                            ? `No results found for "${searchQuery}"`
                                            : showPendingRequests
                                            ? "You don't have any pending friend requests"
                                            : "Add some friends to get started"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
