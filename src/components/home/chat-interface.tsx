import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Gift,
    Loader2,
    Paperclip,
    Plus,
    Send,
    Smile,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useGetThreadMessages } from "@/hooks/useMessages";
import { useUser } from "@/hooks/useUser";
import type { PublicUser } from "@/api/friends";
import type { Message } from "@/api/direct-messages";

interface ChatInterfaceProps {
    threadId: string;
    friend: PublicUser;
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

export function ChatInterface({
    friend,
    threadId,
    onBack,
}: ChatInterfaceProps) {
    const { user } = useUser();
    const [page, setPage] = useState<number>(1);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const {
        data: prevMessages,
        isLoading,
        isFetching,
        refetch,
    } = useGetThreadMessages(threadId, page);

    const [newMessage, setNewMessage] = useState("");
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [isConnected, setIsConnected] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    if (prevMessages && !isLoadingMore) {
        if (page === 1) {
            if (
                allMessages.length === 0 ||
                JSON.stringify(allMessages) !==
                    JSON.stringify(prevMessages.messages)
            ) {
                setAllMessages(prevMessages.messages);
                setHasMore(prevMessages.has_more);
            }
        } else {
            const newMessages = prevMessages.messages;
            const existingIds = new Set(allMessages.map((m) => m.message_id));
            const uniqueNewMessages = newMessages.filter(
                (m) => !existingIds.has(m.message_id)
            );

            if (uniqueNewMessages.length > 0) {
                setAllMessages((prev) => [...uniqueNewMessages, ...prev]);
                setHasMore(prevMessages.has_more);
            }
        }
    }

    const prevThreadId = useRef(threadId);
    if (prevThreadId.current !== threadId) {
        prevThreadId.current = threadId;
        setPage(1);
        setAllMessages([]);
        setHasMore(true);
        setIsLoadingMore(false);
    }

    const handleLoadMoreMessages = useCallback(async () => {
        if (!hasMore || isLoading || isFetching) return;

        setIsLoadingMore(true);

        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        try {
            setPage((prev) => prev + 1);
            await refetch();
        } finally {
            setIsLoadingMore(false);

            setTimeout(() => {
                if (container) {
                    const newScrollHeight = container.scrollHeight;
                    const scrollDiff = newScrollHeight - previousScrollHeight;
                    container.scrollTop = container.scrollTop + scrollDiff;
                }
            }, 50);
        }
    }, [hasMore, isLoadingMore, isFetching, refetch]);

    const loadingMoreTriggerRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node || !hasMore || isLoadingMore || isFetching) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;
                    if (entry.isIntersecting) {
                        handleLoadMoreMessages();
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: "100px 0px 0px 0px",
                }
            );

            observer.observe(node);

            return () => observer.disconnect();
        },
        [hasMore, isLoadingMore, isFetching, handleLoadMoreMessages]
    );

    const currentPrompt = useState(() => {
        let index = 0;
        setInterval(() => {
            setCurrentPromptIndex((index + 1) % typingPrompts.length);
            index = (index + 1) % typingPrompts.length;
        }, 3000);
        return typingPrompts[0];
    })[0];

    if (isLoading && page === 1) {
        return <div>Loading</div>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
    };

    const handleSendMessage = () => {
        // TODO: Implement send message logic
        console.log("Sending message:", newMessage);
        setNewMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (newMessage.trim() && isConnected) {
                handleSendMessage();
            }
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

    const reversedMessages = [...allMessages].reverse();

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
                            {friend.status}
                        </p>
                    </div>
                </div>
            </header>

            <div
                ref={messagesContainerRef}
                className="custom-scrollbar flex-1 overflow-y-auto p-4 flex flex-col-reverse"
            >
                <div className="flex flex-col-reverse gap-1">
                    {allMessages.length === 0 && !newMessage.trim() && (
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

                    {reversedMessages.map((message, index) => {
                        const originalIndex = allMessages.length - 1 - index;
                        const isCurrentUser =
                            message.sender_id === user?.user_id;
                        const isFirstInGroup =
                            originalIndex === 0 ||
                            allMessages[originalIndex - 1].sender_id !==
                                message.sender_id ||
                            new Date(message.created_at).getTime() -
                                new Date(
                                    allMessages[originalIndex - 1].created_at
                                ).getTime() >
                                300000; // 5 minutes

                        return (
                            <motion.div
                                key={message.message_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-start gap-3 w-full max-w-2xl">
                                    {isFirstInGroup && (
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage
                                                src={
                                                    isCurrentUser
                                                        ? user?.avatar_url ||
                                                          "/placeholder.svg"
                                                        : friend.avatar_url ||
                                                          "/placeholder.svg"
                                                }
                                                alt={
                                                    isCurrentUser
                                                        ? "You"
                                                        : getDisplayName(friend)
                                                }
                                            />
                                            <AvatarFallback>
                                                {isCurrentUser
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
                                        {/* Username and timestamp */}
                                        {isFirstInGroup && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-medium">
                                                    {isCurrentUser
                                                        ? "You"
                                                        : getDisplayName(
                                                              friend
                                                          )}
                                                </span>
                                                <span>
                                                    {formatTimestamp(
                                                        message.created_at
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {/* Message text with proper color */}
                                        <div className="text-sm text-foreground">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {hasMore && allMessages.length > 0 && (
                        <div
                            ref={loadingMoreTriggerRef}
                            className="h-1 w-full"
                            aria-hidden="true"
                        />
                    )}
                    {(isLoadingMore || (isFetching && page > 1)) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center py-4"
                        >
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading more messages...
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
