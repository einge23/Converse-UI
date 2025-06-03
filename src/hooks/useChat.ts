import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "./useWebSocket";
import { type ChatMessage, type TypingIndicator } from "@/lib/websocket";

export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
    status: "delivered"; // Simplified - only show messages confirmed by server
}

export interface Conversation {
    threadId: string;
    messages: Message[];
    lastMessage?: Message;
    unreadCount: number;
    typingUsers: Set<string>; // Track multiple users typing
}

export interface UseChatOptions {
    onNewMessage?: (message: Message, threadId: string) => void;
    onTypingChange?: (
        threadId: string,
        isTyping: boolean,
        userIds: string[]
    ) => void;
}

export function useChat(options: UseChatOptions = {}) {
    const [conversations, setConversations] = useState<
        Map<string, Conversation>
    >(new Map());
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

    // Use refs for values that don't need to trigger re-renders
    const currentUserIdRef = useRef<string | null>(null);
    const typingTimeoutsRef = useRef<Map<string, Map<string, NodeJS.Timeout>>>(
        new Map()
    );

    // Track processed messages to prevent double-processing
    const processedMessagesRef = useRef<Set<string>>(new Set());

    const getCurrentUserId = useCallback(() => currentUserIdRef.current, []);
    const handleIncomingMessage = useCallback(
        (chatMessage: ChatMessage) => {
            // Idempotent processing - check if we've already processed this message
            const messageKey = `${chatMessage.id}-${chatMessage.timestamp}`;
            if (processedMessagesRef.current.has(messageKey)) {
                return;
            }

            // Mark as processed immediately to prevent race conditions
            processedMessagesRef.current.add(messageKey);

            const threadId = chatMessage.thread_id;
            if (!threadId) {
                return;
            }

            const currentUserId = getCurrentUserId();
            const isCurrentUser = chatMessage.sender_id === currentUserId;
            setConversations((prev) => {
                const newConversations = new Map(prev);

                // Get or create conversation
                let conversation = newConversations.get(threadId);
                if (!conversation) {
                    conversation = {
                        threadId,
                        messages: [],
                        unreadCount: 0,
                        typingUsers: new Set(),
                    };
                } // Check for duplicate messages
                const existingMessageIndex = conversation.messages.findIndex(
                    (msg) => msg.id === chatMessage.id
                );
                if (existingMessageIndex !== -1) {
                    return prev; // No change if duplicate
                }

                // Create message object
                const message: Message = {
                    id: chatMessage.id,
                    senderId: chatMessage.sender_id,
                    content: chatMessage.content,
                    timestamp: chatMessage.timestamp,
                    isCurrentUser,
                    status: "delivered", // All messages from server are delivered
                };

                // Create new conversation object with new messages array to ensure React detects changes
                const updatedConversation = {
                    ...conversation,
                    messages: [...conversation.messages, message],
                    lastMessage: message,
                    unreadCount:
                        !isCurrentUser && activeThreadId !== threadId
                            ? conversation.unreadCount + 1
                            : conversation.unreadCount,
                };

                // Update conversation in map
                newConversations.set(threadId, updatedConversation);

                // Notify callback
                setTimeout(() => {
                    options.onNewMessage?.(message, threadId);
                }, 0);

                return newConversations;
            });
        },
        [getCurrentUserId, activeThreadId, options]
    );

    const handleTypingIndicator = useCallback(
        (typing: TypingIndicator) => {
            const threadId = typing.thread_id;
            const userId = typing.user_id;
            const currentUserId = getCurrentUserId();

            if (!threadId || !userId || userId === currentUserId) {
                return; // Ignore own typing or invalid data
            }

            setConversations((prev) => {
                const newConversations = new Map(prev);

                // Get or create conversation
                let conversation = newConversations.get(threadId);
                if (!conversation) {
                    conversation = {
                        threadId,
                        messages: [],
                        unreadCount: 0,
                        typingUsers: new Set(),
                    };
                }

                // Update typing users
                if (typing.is_typing) {
                    conversation.typingUsers.add(userId);

                    // Set timeout to auto-remove typing indicator
                    const threadTimeouts =
                        typingTimeoutsRef.current.get(threadId) || new Map();
                    const existingTimeout = threadTimeouts.get(userId);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    const timeout = setTimeout(() => {
                        setConversations((current) => {
                            const updated = new Map(current);
                            const conv = updated.get(threadId);
                            if (conv) {
                                conv.typingUsers.delete(userId);
                                updated.set(threadId, conv);
                            }
                            return updated;
                        });

                        const timeouts =
                            typingTimeoutsRef.current.get(threadId);
                        if (timeouts) {
                            timeouts.delete(userId);
                            if (timeouts.size === 0) {
                                typingTimeoutsRef.current.delete(threadId);
                            }
                        }
                    }, 3000);

                    threadTimeouts.set(userId, timeout);
                    typingTimeoutsRef.current.set(threadId, threadTimeouts);
                } else {
                    conversation.typingUsers.delete(userId);

                    // Clear timeout if exists
                    const threadTimeouts =
                        typingTimeoutsRef.current.get(threadId);
                    if (threadTimeouts) {
                        const timeout = threadTimeouts.get(userId);
                        if (timeout) {
                            clearTimeout(timeout);
                            threadTimeouts.delete(userId);
                            if (threadTimeouts.size === 0) {
                                typingTimeoutsRef.current.delete(threadId);
                            }
                        }
                    }
                }

                newConversations.set(threadId, conversation);

                // Notify callback
                setTimeout(() => {
                    options.onTypingChange?.(
                        threadId,
                        conversation.typingUsers.size > 0,
                        Array.from(conversation.typingUsers)
                    );
                }, 0);

                return newConversations;
            });
        },
        [getCurrentUserId, options]
    );

    // WebSocket connection - always auto-connect when hook is used
    const {
        isConnected,
        sendMessage: wsSendMessage,
        sendTypingIndicator,
        connect,
    } = useWebSocket({
        autoConnect: true, // Always connect when useChat is used
        onMessage: handleIncomingMessage,
        onTyping: handleTypingIndicator,
    });

    // Send message - simplified without optimistic updates for now
    const sendMessage = useCallback(
        (threadId: string, content: string) => {
            const currentUserId = getCurrentUserId();

            if (!currentUserId || !isConnected || !content.trim()) {
                return null;
            }

            // Send directly via WebSocket - server will echo back
            wsSendMessage(threadId, content.trim());

            // Return a temporary ID for the caller (though not used for optimistic updates)
            return `sent-${Date.now()}`;
        },
        [getCurrentUserId, isConnected, wsSendMessage]
    );

    // Typing indicators
    const startTyping = useCallback(
        (threadId: string) => {
            if (isConnected) {
                sendTypingIndicator(threadId, true);
            }
        },
        [isConnected, sendTypingIndicator]
    );

    const stopTyping = useCallback(
        (threadId: string) => {
            if (isConnected) {
                sendTypingIndicator(threadId, false);
            }
        },
        [isConnected, sendTypingIndicator]
    );

    // Conversation management
    const getConversation = useCallback(
        (threadId: string): Conversation | undefined => {
            return conversations.get(threadId);
        },
        [conversations]
    );

    const getAllConversations = useCallback((): Conversation[] => {
        return Array.from(conversations.values()).sort((a, b) => {
            const aTime = a.lastMessage
                ? new Date(a.lastMessage.timestamp).getTime()
                : 0;
            const bTime = b.lastMessage
                ? new Date(b.lastMessage.timestamp).getTime()
                : 0;
            return bTime - aTime; // Most recent first
        });
    }, [conversations]);

    const markConversationAsRead = useCallback((threadId: string) => {
        setConversations((prev) => {
            const conversation = prev.get(threadId);
            if (conversation && conversation.unreadCount > 0) {
                const newConversations = new Map(prev);
                const updatedConversation = { ...conversation, unreadCount: 0 };
                newConversations.set(threadId, updatedConversation);
                return newConversations;
            }
            return prev;
        });
    }, []);

    const getTotalUnreadCount = useCallback((): number => {
        return Array.from(conversations.values()).reduce(
            (total, conv) => total + conv.unreadCount,
            0
        );
    }, [conversations]);
    const setCurrentUserId = useCallback((userId: string | null) => {
        currentUserIdRef.current = userId;
    }, []);

    // Auto-mark active conversation as read
    useEffect(() => {
        if (activeThreadId) {
            markConversationAsRead(activeThreadId);
        }
    }, [activeThreadId, markConversationAsRead]);

    // Cleanup typing timeouts on unmount
    useEffect(() => {
        return () => {
            typingTimeoutsRef.current.forEach((threadTimeouts) => {
                threadTimeouts.forEach((timeout) => clearTimeout(timeout));
            });
            typingTimeoutsRef.current.clear();
        };
    }, []);

    return {
        // State
        conversations: getAllConversations(),
        activeThreadId,
        isConnected,

        // Actions
        setActiveThreadId,
        sendMessage,
        startTyping,
        stopTyping,
        markConversationAsRead,
        setCurrentUserId,

        // Getters
        getConversation,
        getTotalUnreadCount,

        // Connection
        connect,
    };
}
