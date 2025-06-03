import type React from "react";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gift, Paperclip, Plus, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";
import { useFriends } from "@/hooks/useFriendships";

interface ChatInterfaceProps {
    friendId: string;
    onBack: () => void;
}

const typingPrompts = [
    "Say hello! 👋",
    "Ask about their day",
    "Share something interesting",
    "Start a conversation",
    "Send a friendly message",
    "Break the ice with a joke",
    "Ask how they're doing",
    "Share what you're up to",
];

export function ChatInterface({ friendId, onBack }: ChatInterfaceProps) {
    const { user } = useUser();
    const { data: friends = [] } = useFriends();
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showTypingPrompts, setShowTypingPrompts] = useState(true);
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        getConversation,
        sendMessage,
        startTyping,
        stopTyping,
        setCurrentUserId,
        setActiveThreadId,
        isConnected,
    } = useChat(); // Auto-connects when used

    // Find the friend and determine thread ID
    const friend = friends.find(
        (f) => f.user_id === friendId || f.dm_thread_id === friendId
    );

    const threadId = friend?.dm_thread_id || "";
    const conversation = getConversation(threadId);
    const messages = conversation?.messages || [];
    const isOtherUserTyping = (conversation?.typingUsers?.size ?? 0) > 0;

    // Set current user ID when available
    useEffect(() => {
        if (user?.user_id) {
            setCurrentUserId(user.user_id);
        }
    }, [user?.user_id, setCurrentUserId]);

    // Set active thread ID and cleanup
    useEffect(() => {
        setActiveThreadId(threadId);
        return () => setActiveThreadId(null);
    }, [threadId, setActiveThreadId]);

    // Cycle through typing prompts when no messages exist
    useEffect(() => {
        if (messages.length === 0 && showTypingPrompts) {
            const interval = setInterval(() => {
                setCurrentPromptIndex(
                    (prev) => (prev + 1) % typingPrompts.length
                );
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [messages.length, showTypingPrompts]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !isConnected || !threadId) return;

        sendMessage(threadId, newMessage.trim());
        setNewMessage("");
        setShowTypingPrompts(false);

        if (isTyping) {
            stopTyping(threadId);
            setIsTyping(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        setShowTypingPrompts(false);

        if (!isTyping && e.target.value.trim() && threadId) {
            setIsTyping(true);
            startTyping(threadId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        if (e.target.value.trim() && threadId) {
            typingTimeoutRef.current = setTimeout(() => {
                if (isTyping) {
                    setIsTyping(false);
                    stopTyping(threadId);
                }
            }, 1000);
        } else if (isTyping && threadId) {
            // Stop typing immediately if input is empty
            setIsTyping(false);
            stopTyping(threadId);
        }
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
            </header>{" "}
            {/* Messages container with bottom-up flow */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-4 flex flex-col-reverse">
                <div className="flex flex-col-reverse gap-1">
                    {/* Typing indicator at bottom */}
                    {isOtherUserTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center text-sm text-muted-foreground py-2"
                        >
                            {getDisplayName(friend)} is typing...
                        </motion.div>
                    )}

                    {/* Show typing prompts when no messages and empty input */}
                    {messages.length === 0 &&
                        showTypingPrompts &&
                        !newMessage.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center text-center py-8 space-y-4"
                            >
                                <div className="text-6xl">
                                    {friend.avatar_url ? "" : "👋"}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        Start a conversation with{" "}
                                        {getDisplayName(friend)}
                                    </h3>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={currentPromptIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-sm text-muted-foreground"
                                        >
                                            {typingPrompts[currentPromptIndex]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                    {/* Messages in reverse order */}
                    {[...messages].reverse().map((message, index) => {
                        const originalIndex = messages.length - 1 - index;
                        const isFirstInGroup =
                            originalIndex === 0 ||
                            messages[originalIndex - 1].senderId !==
                                message.senderId ||
                            new Date(message.timestamp).getTime() -
                                new Date(
                                    messages[originalIndex - 1].timestamp
                                ).getTime() >
                                300000; // 5 minutes

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className="" /* Changed: Removed "flex flex-col gap-1" */
                            >
                                {/* Message content with avatar, username, and timestamp */}
                                <div className="flex items-start gap-3 w-full max-w-2xl">
                                    {isFirstInGroup && (
                                        <Avatar className="h-8 w-8 shrink-0">
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
                                                        : getDisplayName(friend)
                                                }
                                            />
                                            <AvatarFallback>
                                                {message.isCurrentUser
                                                    ? user?.display_name?.charAt(
                                                          0
                                                      ) || "Y"
                                                    : getAvatarFallback(friend)}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    {/* Column for username/timestamp and message content */}
                                    <div
                                        className={cn(
                                            "flex flex-col",
                                            !isFirstInGroup && "ml-11"
                                        )}
                                    >
                                        {" "}
                                        {/* Add margin if avatar is not shown */}
                                        {/* Username and timestamp */}
                                        {isFirstInGroup && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {" "}
                                                {/* Removed ml-11 */}
                                                <span className="font-medium">
                                                    {message.isCurrentUser
                                                        ? "You"
                                                        : getDisplayName(
                                                              friend
                                                          )}
                                                </span>
                                                <span>
                                                    {formatTimestamp(
                                                        message.timestamp
                                                    )}
                                                </span>
                                            </div>
                                        )}{" "}
                                        {/* Message text with proper color */}
                                        <div className="text-sm text-foreground">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
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
                                    : `Message ${getDisplayName(friend)}...`
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
