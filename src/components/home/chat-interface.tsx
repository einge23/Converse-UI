import React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { useWebSocket } from "@/hooks/useWebSocket";

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
    const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const { sendMessage, sendTypingIndicator, isConnected } = useWebSocket({
        onMessage: (message: any) => {
            console.log("WebSocket message received:", message);

            if (message.type === "typing" || message.type === "stop_typing") {
                console.log("Typing message detected:", {
                    type: message.type,
                    sender_id: message.sender_id,
                    user_id: user?.user_id,
                    thread_id: message.thread_id,
                    current_thread_id: threadId,
                    is_different_user: message.sender_id !== user?.user_id,
                    is_same_thread: message.thread_id === threadId,
                });

                if (
                    message.sender_id !== user?.user_id &&
                    message.thread_id === threadId
                ) {
                    const isTyping = message.type === "typing";
                    console.log(`Setting friendIsTyping to ${isTyping}`);
                    setFriendIsTyping(isTyping);

                    if (friendTypingTimeoutRef.current) {
                        clearTimeout(friendTypingTimeoutRef.current);
                    }

                    if (isTyping) {
                        friendTypingTimeoutRef.current = setTimeout(() => {
                            console.log(
                                "Auto-clearing friendIsTyping after 3 seconds"
                            );
                            setFriendIsTyping(false);
                        }, 3000);
                    }
                }
                return;
            }

            if (
                message.thread_id === threadId &&
                message.content &&
                !message.type
            ) {
                if (message.sender_id !== user?.user_id) {
                    console.log(
                        "Clearing typing indicator because user sent a message"
                    );
                    setFriendIsTyping(false);
                    if (friendTypingTimeoutRef.current) {
                        clearTimeout(friendTypingTimeoutRef.current);
                    }
                }

                const newMessage: Message = {
                    message_id: message.id,
                    thread_id: message.thread_id || threadId,
                    sender_id: message.sender_id,
                    content: message.content,
                    created_at: message.timestamp,
                    updated_at: message.timestamp,
                    deleted_at: null,
                    content_type: message.message_type || "text",
                };

                setRealtimeMessages((prev) => {
                    if (
                        prev.some((m) => m.message_id === newMessage.message_id)
                    ) {
                        return prev;
                    }
                    return [...prev, newMessage];
                });
            }
        },
        onTyping: (typing) => {
            console.log("onTyping called:", typing);

            if (
                typing.user_id !== user?.user_id &&
                typing.thread_id === threadId
            ) {
                console.log(
                    `Setting friendIsTyping to ${typing.is_typing} via onTyping`
                );
                setFriendIsTyping(typing.is_typing);

                // Clear existing timeout
                if (friendTypingTimeoutRef.current) {
                    clearTimeout(friendTypingTimeoutRef.current);
                }

                // Auto-clear typing indicator after 3 seconds of no updates
                if (typing.is_typing) {
                    friendTypingTimeoutRef.current = setTimeout(() => {
                        console.log(
                            "Auto-clearing friendIsTyping after 3 seconds via onTyping"
                        );
                        setFriendIsTyping(false);
                    }, 3000);
                }
            }
        },
    });

    const {
        data: prevMessages,
        isLoading,
        isFetching,
        refetch,
    } = useGetThreadMessages(threadId, page);

    const [newMessage, setNewMessage] = useState("");
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [friendIsTyping, setFriendIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const friendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debug log for friendIsTyping state changes
    useEffect(() => {
        console.log("friendIsTyping state changed:", friendIsTyping);
    }, [friendIsTyping]);

    const displayName = useMemo(() => {
        return friend.display_name?.trim() || friend.username;
    }, [friend.display_name, friend.username]);

    const avatarFallback = useMemo(() => {
        return displayName.charAt(0).toUpperCase();
    }, [displayName]);

    useEffect(() => {
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
                const existingIds = new Set(
                    allMessages.map((m) => m.message_id)
                );
                const uniqueNewMessages = newMessages.filter(
                    (m) => !existingIds.has(m.message_id)
                );

                if (uniqueNewMessages.length > 0) {
                    setAllMessages((prev) => [...uniqueNewMessages, ...prev]);
                    setHasMore(prevMessages.has_more);
                }
            }
        }
    }, [prevMessages, isLoadingMore, page, allMessages]);

    const prevThreadId = useRef(threadId);
    useEffect(() => {
        if (prevThreadId.current !== threadId) {
            prevThreadId.current = threadId;
            setPage(1);
            setAllMessages([]);
            setHasMore(true);
            setIsLoadingMore(false);
        }
    }, [threadId]);

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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPromptIndex((prev) => (prev + 1) % typingPrompts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;
            setNewMessage(value);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            const hasContent = value.trim().length > 0;

            // Only update typing state if it actually changed
            if (hasContent && !isTyping) {
                setIsTyping(true);
                sendTypingIndicator(threadId, true);
            } else if (!hasContent && isTyping) {
                setIsTyping(false);
                sendTypingIndicator(threadId, false);
                return;
            }

            // Set timeout to stop typing indicator after 2 seconds of no typing
            if (hasContent) {
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    sendTypingIndicator(threadId, false);
                }, 2000);
            }
        },
        [isTyping, threadId, sendTypingIndicator]
    );

    const handleSendMessage = () => {
        if (!user || !newMessage.trim()) return;

        if (isTyping) {
            setIsTyping(false);
            sendTypingIndicator(threadId, false);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        sendMessage(threadId, newMessage.trim());
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

    const formatTimestamp = useCallback((timestamp: string) => {
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
    }, []);

    const combinedMessages = useMemo(() => {
        return [...allMessages, ...realtimeMessages].sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
        );
    }, [allMessages, realtimeMessages]);

    useEffect(() => {
        setRealtimeMessages([]);
    }, [threadId]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (friendTypingTimeoutRef.current) {
                clearTimeout(friendTypingTimeoutRef.current);
            }
            if (isTyping) {
                sendTypingIndicator(threadId, false);
            }
        };
    }, [threadId, isTyping, sendTypingIndicator]);
    const getDisplayName = (friend: any) => {
        return friend.display_name?.trim() || friend.username;
    };

    // Helper function to get avatar fallback
    const getAvatarFallback = (friend: any) => {
        const name = getDisplayName(friend);
        return name.charAt(0).toUpperCase();
    };

    const messageElements = useMemo(() => {
        const reversedMessages = [...combinedMessages].reverse();

        return reversedMessages.map((message, index) => {
            const originalIndex = combinedMessages.length - 1 - index;
            const isCurrentUser = message.sender_id === user?.user_id;
            const isFirstInGroup =
                originalIndex === 0 ||
                combinedMessages[originalIndex - 1].sender_id !==
                    message.sender_id ||
                new Date(message.created_at).getTime() -
                    new Date(
                        combinedMessages[originalIndex - 1].created_at
                    ).getTime() >
                    300000;

            return (
                <MessageComponent
                    key={message.message_id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    isFirstInGroup={isFirstInGroup}
                    user={user}
                    friend={friend}
                    displayName={displayName}
                    avatarFallback={avatarFallback}
                    formatTimestamp={formatTimestamp}
                />
            );
        });
    }, [
        combinedMessages,
        user,
        friend,
        displayName,
        avatarFallback,
        formatTimestamp,
    ]);

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
                    {combinedMessages.length === 0 && !newMessage.trim() && (
                        <EmptyStateComponent
                            friend={friend}
                            displayName={displayName}
                            currentPromptIndex={currentPromptIndex}
                            typingPrompts={typingPrompts}
                        />
                    )}
                    {messageElements}
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

            {/* Typing indicator above the input */}
            {friendIsTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-3 pb-2 sm:px-4"
                >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                            <AvatarImage
                                src={friend.avatar_url || "/placeholder.svg"}
                                alt={displayName}
                            />
                            <AvatarFallback className="text-xs">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs sm:text-sm truncate">
                            {displayName}
                        </span>
                        <span className="text-xs sm:text-sm">is typing</span>
                        <div className="flex gap-0.5 sm:gap-1 ml-auto">
                            <div
                                className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <div
                                className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                            />
                            <div
                                className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

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
                                    : `Message ${displayName}...`
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

// Memoized MessageComponent to prevent unnecessary re-renders
const MessageComponent = React.memo(
    ({
        message,
        isCurrentUser,
        isFirstInGroup,
        user,
        friend,
        displayName,
        avatarFallback,
        formatTimestamp,
    }: {
        message: Message;
        isCurrentUser: boolean;
        isFirstInGroup: boolean;
        user: any;
        friend: PublicUser;
        displayName: string;
        avatarFallback: string;
        formatTimestamp: (timestamp: string) => string;
    }) => {
        const timestamp = formatTimestamp(message.created_at);

        return (
            <div className="flex items-start gap-3 w-full max-w-2xl">
                {isFirstInGroup && (
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage
                            src={
                                isCurrentUser
                                    ? user?.avatar_url || "/placeholder.svg"
                                    : friend.avatar_url || "/placeholder.svg"
                            }
                            alt={isCurrentUser ? "You" : displayName}
                        />
                        <AvatarFallback>
                            {isCurrentUser
                                ? user?.display_name?.charAt(0) || "Y"
                                : avatarFallback}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div
                    className={cn("flex flex-col", !isFirstInGroup && "ml-11")}
                >
                    {isFirstInGroup && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                                {isCurrentUser ? "You" : displayName}
                            </span>
                            <span>{timestamp}</span>
                        </div>
                    )}
                    <div className="text-sm text-foreground">
                        {message.content}
                    </div>
                </div>
            </div>
        );
    }
);

// Memoized EmptyStateComponent
const EmptyStateComponent = React.memo(
    ({
        friend,
        displayName,
        currentPromptIndex,
        typingPrompts,
    }: {
        friend: PublicUser;
        displayName: string;
        currentPromptIndex: number;
        typingPrompts: string[];
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-8 space-y-4"
        >
            <div className="text-6xl">{friend.avatar_url ? "" : "👋"}</div>
            <div>
                <h3 className="text-lg font-semibold mb-2">
                    Start a conversation with {displayName}
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
    )
);
