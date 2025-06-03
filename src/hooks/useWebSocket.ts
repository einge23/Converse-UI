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
    const { autoConnect = false } = options; // Changed default to false    // Use refs to avoid recreating handlers on every render
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const connect = useCallback(async () => {
        if (!isAuthenticated || !user) {
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            await wsService.connect(token, user.user_id);
            setIsConnected(true);
        } catch (error) {
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
        (threadId: string, content: string) => {
            if (!isConnected) {
                toast.error("Not connected to chat server");
                return;
            }
            wsService.sendMessage(threadId, content);
        },
        [isConnected]
    );

    const sendTypingIndicator = useCallback(
        (threadId: string, isTyping: boolean) => {
            if (!isConnected) return;
            wsService.sendTypingIndicator(threadId, isTyping);
        },
        [isConnected]
    ); // Use refs to store stable handler functions
    const handlersRef = useRef<{
        handleMessage?: (message: ChatMessage) => void;
        handleTyping?: (typing: TypingIndicator) => void;
        handleUserStatusChange?: (statusChange: any) => void;
        handleError?: (error: any) => void;
    }>({}); // Create stable handler functions
    if (!handlersRef.current.handleMessage) {
        handlersRef.current.handleMessage = (message: ChatMessage) => {
            optionsRef.current.onMessage?.(message);
        };
    }

    if (!handlersRef.current.handleTyping) {
        handlersRef.current.handleTyping = (typing: TypingIndicator) => {
            optionsRef.current.onTyping?.(typing);
        };
    }

    if (!handlersRef.current.handleUserStatusChange) {
        handlersRef.current.handleUserStatusChange = (statusChange: any) => {
            optionsRef.current.onUserStatusChange?.(statusChange);
        };
    }

    if (!handlersRef.current.handleError) {
        handlersRef.current.handleError = (error: any) => {
            optionsRef.current.onError?.(error);
            toast.error("Chat connection error");
        };
    } // Set up event handlers only once
    useEffect(() => {
        const {
            handleMessage,
            handleTyping,
            handleUserStatusChange,
            handleError,
        } = handlersRef.current;

        if (
            !handleMessage ||
            !handleTyping ||
            !handleUserStatusChange ||
            !handleError
        ) {
            return;
        }

        // Register event handlers with new message types
        wsService.on(MessageType.NEW_MESSAGE, handleMessage);
        wsService.on(MessageType.TYPING, handleTyping);
        wsService.on(MessageType.STOP_TYPING, handleTyping);
        wsService.on(MessageType.USER_JOINED, handleUserStatusChange);
        wsService.on(MessageType.USER_LEFT, handleUserStatusChange);
        wsService.on(MessageType.ERROR, handleError);

        return () => {
            // Cleanup event handlers
            wsService.off(MessageType.NEW_MESSAGE, handleMessage);
            wsService.off(MessageType.TYPING, handleTyping);
            wsService.off(MessageType.STOP_TYPING, handleTyping);
            wsService.off(MessageType.USER_JOINED, handleUserStatusChange);
            wsService.off(MessageType.USER_LEFT, handleUserStatusChange);
            wsService.off(MessageType.ERROR, handleError);
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
    };
}
