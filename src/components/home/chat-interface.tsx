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
import { useSocketEmit, useSocketEvent } from "@/hooks/useSocket";

interface ChatInterfaceProps {
    threadId: string;
    friend: PublicUser;
    onBack: () => void;
}

export type MessagePayload = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    content_type: string;
    content: string;
    metadata?: object;
};

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

    const {
        data: prevMessages,
        isLoading,
        isFetching,
        refetch,
    } = useGetThreadMessages(threadId, page);

    const emit = useSocketEmit();
    const [newMessage, setNewMessage] = useState("");
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [friendIsTyping, setFriendIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const friendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useSocketEvent<Message>(
        "dm:receive",
        (message) => {
            if (message.thread_id === threadId) {
                setRealtimeMessages((prev) => {
                    const existingIds = new Set(
                        [...allMessages, ...prev].map((m) => m.message_id)
                    );
                    if (existingIds.has(message.message_id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            }
        },
        [threadId, allMessages]
    );

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

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            const hasContent = value.trim().length > 0;

            if (hasContent && !isTyping) {
                setIsTyping(true);
                //sendTypingIndicator(threadId, true);
            } else if (!hasContent && isTyping) {
                setIsTyping(false);
                //sendTypingIndicator(threadId, false);
                return;
            }

            // Set timeout to stop typing indicator after 2 seconds of no typing
            if (hasContent) {
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    //sendTypingIndicator(threadId, false);
                }, 2000);
            }
        },
        [isTyping, threadId /*sendTypingIndicator*/]
    );

    const handleSendMessage = () => {
        if (!user || !newMessage.trim()) return;
        const message: MessagePayload = {
            message_id: crypto.randomUUID(),
            content: newMessage.trim(),
            content_type: "text",
            thread_id: threadId,
        };

        emit("dm:send", message);

        if (isTyping) {
            setIsTyping(false);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        setNewMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (newMessage.trim() /*&& isConnected*/) {
                handleSendMessage();
            }
        }
    };

    const formatTimestamp = useCallback((timestamp: string) => {
        const utcTimestamp = timestamp.endsWith("Z")
            ? timestamp
            : timestamp + "Z";
        const date = new Date(utcTimestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        }
    }, []);

    const combinedMessages = useMemo(() => {
        const allMsgs = [...allMessages, ...realtimeMessages];

        // Remove duplicates based on message_id
        const uniqueMessages = allMsgs.filter(
            (message, index, arr) =>
                arr.findIndex((m) => m.message_id === message.message_id) ===
                index
        );

        // Sort by timestamp (ensure consistent UTC parsing)
        return uniqueMessages.sort((a, b) => {
            const timestampA = a.created_at.endsWith("Z")
                ? a.created_at
                : a.created_at + "Z";
            const timestampB = b.created_at.endsWith("Z")
                ? b.created_at
                : b.created_at + "Z";
            const dateA = new Date(timestampA).getTime();
            const dateB = new Date(timestampB).getTime();
            return dateA - dateB;
        });
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
                //sendTypingIndicator(threadId, false);
            }
        };
    }, [threadId, isTyping /*sendTypingIndicator*/]);
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
                        <h2 className="font-semibold text-base">
                            {friend.username}
                        </h2>
                        <p className="text-sm text-muted-foreground">
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
                            className="flex justify-center py-6"
                        >
                            <div className="flex items-center gap-3 text-base text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Loading more messages...
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {friendIsTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-3 pb-2 sm:px-4"
                >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage
                                src={friend.avatar_url || "/placeholder.svg"}
                                alt={displayName}
                            />
                            <AvatarFallback className="text-xs">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">
                            {displayName}
                        </span>
                        <span className="text-sm">is typing</span>
                        <div className="flex gap-1 ml-auto">
                            <div
                                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                            />
                            <div
                                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                            />
                            <div
                                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
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
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                    <div className="relative flex-1">
                        <textarea
                            className="max-h-32 min-h-12 w-full resize-none bg-transparent p-3 text-base focus:outline-none disabled:opacity-50"
                            rows={1}
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Gift className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            className={cn(
                                "h-8 w-8",
                                !newMessage.trim() && "opacity-50"
                            )}
                            disabled={!newMessage.trim()}
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
            <div
                className={cn(
                    "flex items-start gap-4 w-full rounded-lg hover:bg-muted/50 transition-colors duration-200 group",
                    isFirstInGroup ? "px-4 pt-3 pb-1" : "px-4 py-1"
                )}
            >
                {isFirstInGroup && (
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                            src={
                                isCurrentUser
                                    ? user?.avatar_url || "/placeholder.svg"
                                    : friend.avatar_url || "/placeholder.svg"
                            }
                            alt={isCurrentUser ? "You" : displayName}
                        />
                        <AvatarFallback className="text-sm font-medium">
                            {isCurrentUser
                                ? user?.display_name?.charAt(0) || "Y"
                                : avatarFallback}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div
                    className={cn(
                        "flex flex-col flex-1",
                        !isFirstInGroup && "ml-14"
                    )}
                >
                    {isFirstInGroup && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
                            <span className="font-semibold">
                                {isCurrentUser ? "You" : displayName}
                            </span>
                            <span>{timestamp}</span>
                        </div>
                    )}
                    <div className="text-base text-foreground leading-tight">
                        {message.content}
                    </div>
                </div>
            </div>
        );
    }
);

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
                <h3 className="text-xl font-semibold mb-3">
                    Start a conversation with {displayName}
                </h3>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentPromptIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-base text-muted-foreground"
                    >
                        {typingPrompts[currentPromptIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </motion.div>
    )
);
