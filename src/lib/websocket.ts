export const MessageType = {
    NEW_MESSAGE: "new_message",
    TYPING: "typing",
    STOP_TYPING: "stop_typing",
    USER_JOINED: "user_joined",
    USER_LEFT: "user_left",
    ERROR: "error",
    WEBRTC_OFFER: "webrtc_offer",
    WEBRTC_ANSWER: "webrtc_answer",
    WEBRTC_ICE: "webrtc_ice",
    WEBRTC_HANGUP: "webrtc_hangup",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface WSMessage {
    type: MessageType;
    data: any;
    timestamp: string;
    id?: string;
}

export interface WebRTCMessageData {
    target_user_id: string;
    session_id: string;
    sdp?: RTCSessionDescriptionInit;
    ice_candidate?: RTCIceCandidateInit;
    reason?: string;
}

export interface WebRTCOfferData {
    type: "webrtc_offer";
    sender_id: string;
    webrtc: {
        target_user_id: string;
        session_id: string;
        sdp: RTCSessionDescriptionInit;
    };
}

export interface WebRTCAnswerData {
    type: "webrtc_answer";
    sender_id: string;
    webrtc: {
        target_user_id: string;
        session_id: string;
        sdp: RTCSessionDescriptionInit;
    };
}

export interface WebRTCICEData {
    type: "webrtc_ice";
    sender_id: string;
    webrtc: {
        target_user_id: string;
        session_id: string;
        ice_candidate: RTCIceCandidateInit;
    };
}

export interface WebRTCHangupData {
    type: "webrtc_hangup";
    sender_id: string;
    webrtc: {
        target_user_id: string;
        session_id: string;
        reason?: string;
    };
}

export type WebRTCSignalingMessage =
    | WebRTCOfferData
    | WebRTCAnswerData
    | WebRTCICEData
    | WebRTCHangupData;

// Updated to match backend structure
export interface IncomingMessage {
    type: string;
    room_id?: string;
    thread_id?: string;
    content: string;
    content_type?: string;
    webrtc?: WebRTCMessageData;
}

export interface OutgoingMessage {
    type: string;
    message_id?: string;
    room_id?: string;
    thread_id?: string;
    sender_id: string;
    content: string;
    content_type: string;
    created_at: string;
    error?: string;
    webrtc?: WebRTCMessageData;
}

// Legacy interface for backward compatibility
export interface ChatMessage {
    id: string;
    sender_id: string;
    recipient_id?: string; // For backward compatibility
    thread_id?: string;
    content: string;
    timestamp: string;
    message_type: "text" | "image" | "file";
}

export interface TypingIndicator {
    user_id: string;
    thread_id?: string;
    is_typing: boolean;
}

export interface UserStatusChange {
    user_id: string;
    status: "online" | "offline" | "away" | "do_not_disturb";
}

export type WSEventHandler = (data: any) => void;

export class WebSocketService {
    private ws: WebSocket | null = null;
    private url: string;
    private token: string | null = null;
    private userId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 1000; // Start with 1 second
    private eventHandlers = new Map<MessageType, Set<WSEventHandler>>();
    private isConnecting = false;
    private pingInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Use different URLs based on environment
        const wsProtocol =
            window.location.protocol === "https:" ? "wss:" : "ws:";
        const apiUrl = import.meta.env.VITE_API_BASE_URL;

        if (apiUrl) {
            // Extract the host from the API URL and create WebSocket URL
            const url = new URL(apiUrl);
            this.url = `${wsProtocol}//${url.host}/api/v1/ws`;
        } else {
            // Fallback for development
            this.url = `${wsProtocol}//localhost:8080/api/v1/ws`;
        }
    }

    connect(token: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (
                this.isConnecting ||
                (this.ws && this.ws.readyState === WebSocket.OPEN)
            ) {
                resolve();
                return;
            }

            this.isConnecting = true;
            this.token = token;
            this.userId = userId;

            try {
                // Include token as query parameter for WebSocket auth
                const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
                this.ws = new WebSocket(wsUrl);

                // Set up event handlers
                this.ws.onopen = () => {
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.reconnectInterval = 1000;
                    this.startPing();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WSMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error(
                            "Failed to parse WebSocket message:",
                            error
                        );
                    }
                };

                this.ws.onclose = (event) => {
                    this.isConnecting = false;
                    this.stopPing();

                    // Only attempt reconnection if it wasn't a clean close
                    if (event.code !== 1000 && this.token && this.userId) {
                        this.handleReconnection();
                    }
                };

                this.ws.onerror = (error) => {
                    this.isConnecting = false;
                    reject(error);
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    disconnect(): void {
        this.stopPing();
        this.token = null;
        this.userId = null;

        if (this.ws) {
            this.ws.close(1000, "Client disconnect");
            this.ws = null;
        }

        this.eventHandlers.clear();
    }

    private handleReconnection(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            30000
        );

        setTimeout(() => {
            if (this.token && this.userId) {
                this.connect(this.token, this.userId).catch(() => {
                    // Silent retry - errors will be handled by the connect method
                });
            }
        }, delay);
    }

    private startPing(): void {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(
                    JSON.stringify({
                        type: "ping",
                        timestamp: new Date().toISOString(),
                    })
                );
            }
        }, 30000); // Ping every 30 seconds
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    sendWebRTCOffer(
        targetUserId: string,
        sessionId: string,
        sdp: RTCSessionDescriptionInit
    ): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: MessageType.WEBRTC_OFFER,
            content: "",
            webrtc: {
                target_user_id: targetUserId,
                session_id: sessionId,
                sdp: sdp,
            },
        };

        this.ws.send(JSON.stringify(message));
    }

    sendWebRTCAnswer(
        targetUserId: string,
        sessionId: string,
        sdp: RTCSessionDescriptionInit
    ): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: MessageType.WEBRTC_ANSWER,
            content: "",
            webrtc: {
                target_user_id: targetUserId,
                session_id: sessionId,
                sdp: sdp,
            },
        };

        this.ws.send(JSON.stringify(message));
    }

    sendWebRTCICE(
        targetUserId: string,
        sessionId: string,
        iceCandidate: RTCIceCandidateInit
    ): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: MessageType.WEBRTC_ICE,
            content: "",
            webrtc: {
                target_user_id: targetUserId,
                session_id: sessionId,
                ice_candidate: iceCandidate,
            },
        };

        this.ws.send(JSON.stringify(message));
    }

    sendWebRTCHangup(
        targetUserId: string,
        sessionId: string,
        reason?: string
    ): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: MessageType.WEBRTC_HANGUP,
            content: "",
            webrtc: {
                target_user_id: targetUserId,
                session_id: sessionId,
                reason: reason || "",
            },
        };

        this.ws.send(JSON.stringify(message));
    }

    sendMessage(threadId: string, content: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: MessageType.NEW_MESSAGE,
            thread_id: threadId,
            content,
            content_type: "text",
        };

        this.ws.send(JSON.stringify(message));
    }

    sendTypingIndicator(threadId: string, isTyping: boolean): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: IncomingMessage = {
            type: isTyping ? "typing" : "stop_typing",
            thread_id: threadId,
            content: "", // Content required by backend but not used for typing
        };

        this.ws.send(JSON.stringify(message));
    }
    private handleMessage(message: any): void {
        console.log("Received WebSocket message:", message);

        // Handle direct backend messages (not wrapped in WSMessage format)
        if (message.type === "new_message") {
            // Ensure we have a proper message_id from the server
            if (!message.message_id) {
                return;
            }

            const chatMessage: ChatMessage = {
                id: message.message_id,
                sender_id: message.sender_id,
                thread_id: message.thread_id,
                content: message.content,
                timestamp: message.created_at || new Date().toISOString(),
                message_type: message.content_type || "text",
            };
            const handlers = this.eventHandlers.get(MessageType.NEW_MESSAGE);
            if (handlers) {
                handlers.forEach((handler) => handler(chatMessage));
            }
        } else if (
            message.type === "typing" ||
            message.type === "stop_typing"
        ) {
            const typingData: TypingIndicator = {
                user_id: message.sender_id,
                thread_id: message.thread_id,
                is_typing: message.type === "typing",
            };

            const typingHandlers = this.eventHandlers.get(MessageType.TYPING);
            const stopTypingHandlers = this.eventHandlers.get(
                MessageType.STOP_TYPING
            );

            if (typingHandlers) {
                typingHandlers.forEach((handler) => handler(typingData));
            }
            if (stopTypingHandlers) {
                stopTypingHandlers.forEach((handler) => handler(typingData));
            }
        } else if (
            message.type === "webrtc_offer" ||
            message.type === "webrtc_answer" ||
            message.type === "webrtc_ice" ||
            message.type === "webrtc_hangup"
        ) {
            const handlers = this.eventHandlers.get(
                message.type as MessageType
            );
            if (handlers) {
                handlers.forEach((handler) => handler(message));
            }
        } else if (message.type === "error") {
            const handlers = this.eventHandlers.get(MessageType.ERROR);
            if (handlers) {
                handlers.forEach((handler) =>
                    handler({ error: message.error })
                );
            }
        } else {
            if (message.type && message.data) {
                const handlers = this.eventHandlers.get(message.type);
                if (handlers) {
                    handlers.forEach((handler) => handler(message.data));
                }
            }
        }
    }

    on(type: MessageType, handler: WSEventHandler): void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, new Set());
        }
        const handlers = this.eventHandlers.get(type)!;
        handlers.add(handler);
    }

    off(type: MessageType, handler: WSEventHandler): void {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Create a singleton instance
export const wsService = new WebSocketService();
