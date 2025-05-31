import { useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "./useUser";
import {
    wsService,
    MessageType,
    type ChatMessage,
    type TypingIndicator,
} from "@/lib/websocket";
import Cookies from "js-cookie";
import { toast } from "sonner";

export interface UseWebSocketOptions {
    autoConnect?: boolean;
    onMessage?: (message: ChatMessage) => void;
    onTyping?: (typing: TypingIndicator) => void;
    onUserStatusChange?: (statusChange: any) => void;
    onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { user, isAuthenticated } = useUser();
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const { autoConnect = false } = options; // Changed default to false

    // Use refs to avoid recreating handlers on every render
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const connect = useCallback(async () => {
        if (!isAuthenticated || !user) {
            console.log("Cannot connect: user not authenticated");
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            console.log("Cannot connect: no token available");
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            await wsService.connect(token, user.user_id);
            setIsConnected(true);
            console.log("WebSocket connected successfully");
        } catch (error) {
            console.error("Failed to connect WebSocket:", error);
            setConnectionError("Failed to connect to chat server");
            toast.error("Failed to connect to chat server");
        } finally {
            setIsConnecting(false);
        }
    }, [isAuthenticated, user]);

    const disconnect = useCallback(() => {
        wsService.disconnect();
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(null);
    }, []);

    const sendMessage = useCallback(
        (recipientId: string, content: string) => {
            if (!isConnected) {
                toast.error("Not connected to chat server");
                return;
            }
            wsService.sendMessage(recipientId, content);
        },
        [isConnected]
    );

    const sendTypingIndicator = useCallback(
        (recipientId: string, isTyping: boolean) => {
            if (!isConnected) return;
            wsService.sendTypingIndicator(recipientId, isTyping);
        },
        [isConnected]
    );

    const updateStatus = useCallback(
        (status: "online" | "offline" | "away" | "do_not_disturb") => {
            if (!isConnected) return;
            wsService.updateStatus(status);
        },
        [isConnected]
    );

    // Set up event handlers
    useEffect(() => {
        console.log("🔧 Setting up WebSocket event handlers");

        const handleMessage = (message: ChatMessage) => {
            console.log("📨 useWebSocket received chat message:", message);
            optionsRef.current.onMessage?.(message);
        };

        const handleTyping = (typing: TypingIndicator) => {
            console.log("⌨️ useWebSocket received typing indicator:", typing);
            optionsRef.current.onTyping?.(typing);
        };

        const handleUserStatusChange = (statusChange: any) => {
            console.log(
                "🟢 useWebSocket received status change:",
                statusChange
            );
            optionsRef.current.onUserStatusChange?.(statusChange);
        };

        const handleError = (error: any) => {
            console.error("❌ WebSocket error:", error);
            optionsRef.current.onError?.(error);
            toast.error("Chat connection error");
        };

        const handleConnectionAck = () => {
            console.log("✅ WebSocket connection acknowledged");
        };

        // Register event handlers
        wsService.on(MessageType.CHAT_MESSAGE, handleMessage);
        wsService.on(MessageType.USER_TYPING, handleTyping);
        wsService.on(MessageType.USER_STOPPED_TYPING, handleTyping);
        wsService.on(MessageType.USER_STATUS_CHANGE, handleUserStatusChange);
        wsService.on(MessageType.ERROR, handleError);
        wsService.on(MessageType.CONNECTION_ACK, handleConnectionAck);

        console.log("✅ WebSocket event handlers registered");

        return () => {
            console.log("🧹 Cleaning up WebSocket event handlers");
            // Cleanup event handlers
            wsService.off(MessageType.CHAT_MESSAGE, handleMessage);
            wsService.off(MessageType.USER_TYPING, handleTyping);
            wsService.off(MessageType.USER_STOPPED_TYPING, handleTyping);
            wsService.off(
                MessageType.USER_STATUS_CHANGE,
                handleUserStatusChange
            );
            wsService.off(MessageType.ERROR, handleError);
            wsService.off(MessageType.CONNECTION_ACK, handleConnectionAck);
        };
    }, []);

    // Only auto-connect if explicitly requested
    useEffect(() => {
        if (
            autoConnect &&
            isAuthenticated &&
            user &&
            !isConnected &&
            !isConnecting
        ) {
            connect();
        }
    }, [
        autoConnect,
        isAuthenticated,
        user,
        isConnected,
        isConnecting,
        connect,
    ]);

    // Disconnect when user logs out
    useEffect(() => {
        if (!isAuthenticated && isConnected) {
            disconnect();
        }
    }, [isAuthenticated, isConnected, disconnect]);

    // Update connection status based on WebSocket service
    useEffect(() => {
        if (!isConnected) return;

        const checkConnection = () => {
            const wsConnected = wsService.isConnected();
            if (!wsConnected && isConnected) {
                setIsConnected(false);
            }
        };

        const interval = setInterval(checkConnection, 5000); // Check every 5 seconds instead of 1
        return () => clearInterval(interval);
    }, [isConnected]);

    return {
        isConnected,
        isConnecting,
        connectionError,
        connect,
        disconnect,
        sendMessage,
        sendTypingIndicator,
        updateStatus,
    };
}
