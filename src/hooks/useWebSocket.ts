import { useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "./useUser";
import {
    wsService,
    MessageType,
    type ChatMessage,
    type TypingIndicator,
    type WebRTCOfferData,
    type WebRTCAnswerData,
    type WebRTCHangupData,
    type WebRTCICEData,
} from "@/lib/websocket";
import Cookies from "js-cookie";
import { toast } from "sonner";

export interface UseWebSocketOptions {
    autoConnect?: boolean;
    onMessage?: (message: ChatMessage) => void;
    onTyping?: (typing: TypingIndicator) => void;
    onUserStatusChange?: (statusChange: any) => void;
    onError?: (error: any) => void;
    onWebRTCOffer?: (data: WebRTCOfferData) => void;
    onWebRTCAnswer?: (data: WebRTCAnswerData) => void;
    onWebRTCICE?: (data: WebRTCICEData) => void;
    onWebRTCHangup?: (data: WebRTCHangupData) => void;
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
            console.log("Cannot connect: not authenticated or no user");
            return;
        }

        const token = Cookies.get("token");
        if (!token) {
            console.log("Cannot connect: no token");
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);
        console.log("Attempting to connect to WebSocket...");

        try {
            await wsService.connect(token, user.user_id);
            console.log("WebSocket connected successfully");
            setIsConnected(true);
        } catch (error) {
            console.error("WebSocket connection failed:", error);
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
        handleWebRTCOffer?: (data: WebRTCOfferData) => void;
        handleWebRTCAnswer?: (data: WebRTCAnswerData) => void;
        handleWebRTCICE?: (data: WebRTCICEData) => void;
        handleWebRTCHangup?: (data: WebRTCHangupData) => void;
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

    if (!handlersRef.current.handleWebRTCOffer) {
        handlersRef.current.handleWebRTCOffer = (data: WebRTCOfferData) => {
            optionsRef.current.onWebRTCOffer?.(data);
        };
    }

    if (!handlersRef.current.handleWebRTCAnswer) {
        handlersRef.current.handleWebRTCAnswer = (data: WebRTCAnswerData) => {
            optionsRef.current.onWebRTCAnswer?.(data);
        };
    }

    if (!handlersRef.current.handleWebRTCICE) {
        handlersRef.current.handleWebRTCICE = (data: WebRTCICEData) => {
            optionsRef.current.onWebRTCICE?.(data);
        };
    }

    if (!handlersRef.current.handleWebRTCHangup) {
        handlersRef.current.handleWebRTCHangup = (data: WebRTCHangupData) => {
            optionsRef.current.onWebRTCHangup?.(data);
        };
    }

    const sendWebRTCOffer = useCallback(
        (
            targetUserId: string,
            sessionId: string,
            sdp: RTCSessionDescriptionInit
        ) => {
            if (!isConnected) return;
            wsService.sendWebRTCOffer(targetUserId, sessionId, sdp);
        },
        [isConnected]
    );

    const sendWebRTCAnswer = useCallback(
        (
            targetUserId: string,
            sessionId: string,
            sdp: RTCSessionDescriptionInit
        ) => {
            if (!isConnected) return;
            wsService.sendWebRTCAnswer(targetUserId, sessionId, sdp);
        },
        [isConnected]
    );

    const sendWebRTCICE = useCallback(
        (
            targetUserId: string,
            sessionId: string,
            iceCandidate: RTCIceCandidateInit
        ) => {
            if (!isConnected) return;
            wsService.sendWebRTCICE(targetUserId, sessionId, iceCandidate);
        },
        [isConnected]
    );

    const sendWebRTCHangup = useCallback(
        (targetUserId: string, sessionId: string, reason?: string) => {
            if (!isConnected) return;
            wsService.sendWebRTCHangup(targetUserId, sessionId, reason);
        },
        [isConnected]
    );

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
            handleWebRTCOffer,
            handleWebRTCAnswer,
            handleWebRTCICE,
            handleWebRTCHangup,
        } = handlersRef.current;

        if (
            !handleMessage ||
            !handleTyping ||
            !handleUserStatusChange ||
            !handleError ||
            !handleWebRTCOffer ||
            !handleWebRTCAnswer ||
            !handleWebRTCICE ||
            !handleWebRTCHangup
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
        wsService.on(MessageType.WEBRTC_OFFER, handleWebRTCOffer);
        wsService.on(MessageType.WEBRTC_ANSWER, handleWebRTCAnswer);
        wsService.on(MessageType.WEBRTC_ICE, handleWebRTCICE);
        wsService.on(MessageType.WEBRTC_HANGUP, handleWebRTCHangup);

        return () => {
            // Cleanup event handlers
            wsService.off(MessageType.NEW_MESSAGE, handleMessage);
            wsService.off(MessageType.TYPING, handleTyping);
            wsService.off(MessageType.STOP_TYPING, handleTyping);
            wsService.off(MessageType.USER_JOINED, handleUserStatusChange);
            wsService.off(MessageType.USER_LEFT, handleUserStatusChange);
            wsService.off(MessageType.ERROR, handleError);
            wsService.off(MessageType.WEBRTC_OFFER, handleWebRTCOffer);
            wsService.off(MessageType.WEBRTC_ANSWER, handleWebRTCAnswer);
            wsService.off(MessageType.WEBRTC_ICE, handleWebRTCICE);
            wsService.off(MessageType.WEBRTC_HANGUP, handleWebRTCHangup);
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
    }, [isAuthenticated, isConnected, disconnect]); // Update connection status based on WebSocket service
    useEffect(() => {
        const checkConnection = () => {
            const wsConnected = wsService.isConnected();
            if (wsConnected !== isConnected) {
                setIsConnected(wsConnected);
            }
        };

        // Check immediately and then every 1 second
        checkConnection();
        const interval = setInterval(checkConnection, 1000);
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
        sendWebRTCOffer,
        sendWebRTCAnswer,
        sendWebRTCICE,
        sendWebRTCHangup,
    };
}
