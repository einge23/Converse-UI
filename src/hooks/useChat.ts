import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "./useWebSocket";
import { type ChatMessage } from "@/lib/websocket";

export interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
    status?: "sending" | "sent" | "delivered" | "failed";
}

export interface Conversation {
    participantId: string;
    messages: Message[];
    lastMessage?: Message;
    unreadCount: number;
    isTyping: boolean;
}

export interface UseChatOptions {
    autoConnect?: boolean;
    onNewMessage?: (message: Message, conversationId: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
    const [conversations, setConversations] = useState<
        Map<string, Conversation>
    >(new Map());
    const [activeConversationId, setActiveConversationId] = useState<
        string | null
    >(null);
    const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const currentUserIdRef = useRef<string | null>(null);

    // Get current user ID from the user context (you'll need to pass this)
    const getCurrentUserId = useCallback(() => {
        // This should be passed from the component or retrieved from useUser hook
        return currentUserIdRef.current;
    }, []);

    const handleIncomingMessage = useCallback(
        (chatMessage: ChatMessage) => {
            const currentUserId = getCurrentUserId();
            console.log("🔥 Incoming message:", {
                chatMessage,
                currentUserId,
                sender_id: chatMessage.sender_id,
                recipient_id: chatMessage.recipient_id,
            });

            if (!currentUserId) {
                console.warn("❌ No current user ID, ignoring message");
                return;
            }

            const isCurrentUser = chatMessage.sender_id === currentUserId;
            const conversationId = isCurrentUser
                ? chatMessage.recipient_id
                : chatMessage.sender_id;

            console.log("📝 Processing message:", {
                isCurrentUser,
                conversationId,
                activeConversationId,
            });

            const message: Message = {
                id: chatMessage.id,
                senderId: chatMessage.sender_id,
                content: chatMessage.content,
                timestamp: chatMessage.timestamp,
                isCurrentUser,
                status: "delivered",
            };

            setConversations((prev) => {
                const newConversations = new Map(prev);
                const conversation = newConversations.get(conversationId) || {
                    participantId: conversationId,
                    messages: [],
                    unreadCount: 0,
                    isTyping: false,
                };

                conversation.messages.push(message);
                conversation.lastMessage = message;

                // Increment unread count only if this conversation is not currently active
                if (conversationId !== activeConversationId && !isCurrentUser) {
                    conversation.unreadCount += 1;
                }

                newConversations.set(conversationId, conversation);
                console.log(
                    "💾 Updated conversations:",
                    Array.from(newConversations.entries())
                );
                return newConversations;
            });

            // Call the callback if provided
            options.onNewMessage?.(message, conversationId);
        },
        [getCurrentUserId, activeConversationId, options]
    );

    const handleTypingIndicator = useCallback((typing: any) => {
        const { user_id, is_typing } = typing;

        setConversations((prev) => {
            const newConversations = new Map(prev);
            const conversation = newConversations.get(user_id);

            if (conversation) {
                conversation.isTyping = is_typing;
                newConversations.set(user_id, conversation);
            }

            return newConversations;
        });

        // Clear typing indicator after a timeout
        if (is_typing) {
            const timeouts = typingTimeoutRef.current;
            const existingTimeout = timeouts.get(user_id);

            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            const newTimeout = setTimeout(() => {
                setConversations((prev) => {
                    const newConversations = new Map(prev);
                    const conversation = newConversations.get(user_id);

                    if (conversation) {
                        conversation.isTyping = false;
                        newConversations.set(user_id, conversation);
                    }

                    return newConversations;
                });
                timeouts.delete(user_id);
            }, 3000); // Clear typing indicator after 3 seconds

            timeouts.set(user_id, newTimeout);
        }
    }, []);

    const { isConnected, sendMessage, sendTypingIndicator, connect } =
        useWebSocket({
            autoConnect: options.autoConnect,
            onMessage: handleIncomingMessage,
            onTyping: handleTypingIndicator,
        });

    const sendChatMessage = useCallback(
        (recipientId: string, content: string) => {
            const currentUserId = getCurrentUserId();
            if (!currentUserId || !isConnected) return null;

            const tempMessage: Message = {
                id: `temp_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                senderId: currentUserId,
                content,
                timestamp: new Date().toISOString(),
                isCurrentUser: true,
                status: "sending",
            };

            // Optimistically add message to conversation
            setConversations((prev) => {
                const newConversations = new Map(prev);
                const conversation = newConversations.get(recipientId) || {
                    participantId: recipientId,
                    messages: [],
                    unreadCount: 0,
                    isTyping: false,
                };

                conversation.messages.push(tempMessage);
                conversation.lastMessage = tempMessage;
                newConversations.set(recipientId, conversation);

                return newConversations;
            });

            // Send via WebSocket
            sendMessage(recipientId, content);

            // Update message status to 'sent' after a short delay (simulate network)
            setTimeout(() => {
                setConversations((prev) => {
                    const newConversations = new Map(prev);
                    const conversation = newConversations.get(recipientId);

                    if (conversation) {
                        const messageIndex = conversation.messages.findIndex(
                            (m) => m.id === tempMessage.id
                        );
                        if (messageIndex !== -1) {
                            conversation.messages[messageIndex].status = "sent";
                            newConversations.set(recipientId, conversation);
                        }
                    }

                    return newConversations;
                });
            }, 500);

            return tempMessage;
        },
        [getCurrentUserId, isConnected, sendMessage]
    );

    const startTyping = useCallback(
        (recipientId: string) => {
            if (isConnected) {
                sendTypingIndicator(recipientId, true);
            }
        },
        [isConnected, sendTypingIndicator]
    );

    const stopTyping = useCallback(
        (recipientId: string) => {
            if (isConnected) {
                sendTypingIndicator(recipientId, false);
            }
        },
        [isConnected, sendTypingIndicator]
    );

    const markConversationAsRead = useCallback((conversationId: string) => {
        setConversations((prev) => {
            const newConversations = new Map(prev);
            const conversation = newConversations.get(conversationId);

            if (conversation && conversation.unreadCount > 0) {
                conversation.unreadCount = 0;
                newConversations.set(conversationId, conversation);
            }

            return newConversations;
        });
    }, []);

    const getConversation = useCallback(
        (participantId: string): Conversation | undefined => {
            return conversations.get(participantId);
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

    const getTotalUnreadCount = useCallback((): number => {
        return Array.from(conversations.values()).reduce(
            (total, conv) => total + conv.unreadCount,
            0
        );
    }, [conversations]);

    // Set current user ID when it changes
    const setCurrentUserId = useCallback((userId: string | null) => {
        currentUserIdRef.current = userId;
    }, []);

    // Mark active conversation as read when it changes
    useEffect(() => {
        if (activeConversationId) {
            markConversationAsRead(activeConversationId);
        }
    }, [activeConversationId, markConversationAsRead]);

    // Clean up typing timeouts on unmount
    useEffect(() => {
        return () => {
            const timeouts = typingTimeoutRef.current;
            timeouts.forEach((timeout) => clearTimeout(timeout));
            timeouts.clear();
        };
    }, []);

    return {
        conversations: getAllConversations(),
        activeConversationId,
        setActiveConversationId,
        sendMessage: sendChatMessage,
        startTyping,
        stopTyping,
        markConversationAsRead,
        getConversation,
        getTotalUnreadCount,
        setCurrentUserId,
        isConnected,
        connect,
    };
}
