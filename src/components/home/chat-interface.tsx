import type React from "react";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Paperclip, Plus, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChat, type Message } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";
import { useFriends } from "@/hooks/useFriendships";

interface ChatInterfaceProps {
    friendId: string;
    onBack: () => void;
}

export function ChatInterface({ friendId, onBack }: ChatInterfaceProps) {
    const { user } = useUser();
    const { data: friends = [] } = useFriends();
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        getConversation,
        sendMessage,
        startTyping,
        stopTyping,
        setCurrentUserId,
        setActiveConversationId,
        connect,
        isConnected,
    } = useChat({
        autoConnect: false,
    });

    const friend = friends.find(
        (f) => f.user_id === friendId || f.dm_thread_id === friendId
    );

    const conversationId = friend ? friend.user_id : friendId;
    const conversation = getConversation(conversationId);
    const messages = conversation?.messages || [];

    useEffect(() => {
        if (user?.user_id) {
            setCurrentUserId(user.user_id);
        }
    }, [user?.user_id, setCurrentUserId]);

    useEffect(() => {
        setActiveConversationId(conversationId);

        if (!isConnected && user?.user_id) {
            connect();
        }

        return () => setActiveConversationId(null);
    }, [
        conversationId,
        setActiveConversationId,
        connect,
        isConnected,
        user?.user_id,
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !isConnected) return;

        sendMessage(conversationId, newMessage.trim());
        setNewMessage("");

        if (isTyping) {
            stopTyping(conversationId);
            setIsTyping(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);

        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
            startTyping(conversationId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                stopTyping(conversationId);
            }
        }, 1000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        }
    };

    // Get message status indicator
    const getMessageStatusIndicator = (message: Message) => {
        if (!message.isCurrentUser) return null;

        switch (message.status) {
            case "sending":
                return (
                    <span className="text-xs text-muted-foreground ml-1">
                        ⏳
                    </span>
                );
            case "sent":
                return (
                    <span className="text-xs text-muted-foreground ml-1">
                        ✓
                    </span>
                );
            case "delivered":
                return (
                    <span className="text-xs text-muted-foreground ml-1">
                        ✓✓
                    </span>
                );
            case "failed":
                return <span className="text-xs text-red-500 ml-1">❌</span>;
            default:
                return null;
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

    if (!friend) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Friend not found</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <header className="flex h-12 items-center border-b px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="mr-2 md:hidden"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar>
                            <AvatarImage
                                src={friend.avatar_url || "/placeholder.svg"}
                                alt={getDisplayName(friend)}
                            />
                            <AvatarFallback>
                                {getAvatarFallback(friend)}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                friend.status === "online" && "bg-emerald-500",
                                friend.status === "away" && "bg-amber-500",
                                friend.status === "do_not_disturb" &&
                                    "bg-red-500",
                                friend.status === "offline" && "bg-muted"
                            )}
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold">{friend.display_name}</h2>
                        <p className="text-xs text-muted-foreground">
                            {!isConnected ? "Offline" : friend.status}
                        </p>
                    </div>
                </div>
                {!isConnected && (
                    <div className="ml-auto text-xs text-amber-500">
                        Reconnecting...
                    </div>
                )}
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const isFirstInGroup =
                            index === 0 ||
                            messages[index - 1].senderId !== message.senderId ||
                            new Date(message.timestamp).getTime() -
                                new Date(
                                    messages[index - 1].timestamp
                                ).getTime() >
                                300000; // 5 minutes

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex gap-3",
                                    !isFirstInGroup && "mt-1 pl-12"
                                )}
                            >
                                {isFirstInGroup && (
                                    <Avatar className="mt-0.5 h-9 w-9">
                                        <AvatarImage
                                            src={
                                                message.isCurrentUser
                                                    ? user?.avatar_url ||
                                                      "/placeholder.svg"
                                                    : friend.avatar_url ||
                                                      "/placeholder.svg"
                                            }
                                            alt={
                                                message.isCurrentUser
                                                    ? "You"
                                                    : friend.display_name
                                            }
                                        />
                                        <AvatarFallback>
                                            {message.isCurrentUser
                                                ? user?.display_name?.charAt(
                                                      0
                                                  ) || "Y"
                                                : friend.display_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className="max-w-[80%]">
                                    {isFirstInGroup && (
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-medium">
                                                {message.isCurrentUser
                                                    ? "You"
                                                    : friend.display_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimestamp(
                                                    message.timestamp
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 relative",
                                            message.isCurrentUser
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <span>{message.content}</span>
                                        {getMessageStatusIndicator(message)}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Typing indicator */}
                    {conversation?.isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <Avatar className="mt-0.5 h-9 w-9">
                                <AvatarImage
                                    src={
                                        friend.avatar_url || "/placeholder.svg"
                                    }
                                    alt={friend.display_name}
                                />
                                <AvatarFallback>
                                    {friend.display_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg bg-muted px-3 py-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                    <div
                                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                    ></div>
                                    <div
                                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                    ></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            <Separator />

            <div className="p-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        disabled={!isConnected}
                    >
                        <Plus className="h-5 w-5" />
                    </Button>

                    <div className="relative flex-1">
                        <textarea
                            className="max-h-32 min-h-10 w-full resize-none bg-transparent p-2 text-sm focus:outline-none disabled:opacity-50"
                            placeholder={
                                !isConnected
                                    ? "Connecting..."
                                    : `Message ${friend.display_name}...`
                            }
                            rows={1}
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={!isConnected}
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={!isConnected}
                        >
                            <Gift className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={!isConnected}
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={!isConnected}
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            className={cn(
                                "h-8 w-8",
                                (!newMessage.trim() || !isConnected) &&
                                    "opacity-50"
                            )}
                            disabled={!newMessage.trim() || !isConnected}
                            onClick={handleSendMessage}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
