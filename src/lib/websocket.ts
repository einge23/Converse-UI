export const MessageType = {
    CHAT_MESSAGE: "chat_message",
    USER_TYPING: "user_typing",
    USER_STOPPED_TYPING: "user_stopped_typing",
    USER_STATUS_CHANGE: "user_status_change",
    CONNECTION_ACK: "connection_ack",
    ERROR: "error",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface WSMessage {
    type: MessageType;
    data: any;
    timestamp: string;
    id?: string;
}

export interface ChatMessage {
    id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    timestamp: string;
    message_type: "text" | "image" | "file";
}

export interface TypingIndicator {
    user_id: string;
    username: string;
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
                    console.log("WebSocket connected and authenticated");

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
                    console.log(
                        "WebSocket disconnected:",
                        event.code,
                        event.reason
                    );
                    this.isConnecting = false;
                    this.stopPing();

                    // Only attempt reconnection if it wasn't a clean close
                    if (event.code !== 1000 && this.token && this.userId) {
                        this.handleReconnection();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
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
            console.error("Max reconnection attempts reached");
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            30000
        );

        console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
        );

        setTimeout(() => {
            if (this.token && this.userId) {
                this.connect(this.token, this.userId).catch((error) => {
                    console.error("Reconnection failed:", error);
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

    private handleMessage(message: WSMessage): void {
        console.log("📥 Received WebSocket message:", {
            type: message.type,
            data: message.data,
            timestamp: message.timestamp,
            id: message.id,
        });

        const handlers = this.eventHandlers.get(message.type);
        if (handlers) {
            console.log(
                `🔄 Calling ${handlers.size} handlers for message type: ${message.type}`
            );
            handlers.forEach((handler) => handler(message.data));
        } else {
            console.warn(
                `⚠️ No handlers registered for message type: ${message.type}`
            );
        }
    }

    on(type: MessageType, handler: WSEventHandler): void {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, new Set());
        }
        this.eventHandlers.get(type)!.add(handler);
    }

    off(type: MessageType, handler: WSEventHandler): void {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    sendMessage(recipientId: string, content: string): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("❌ WebSocket not connected - cannot send message");
            return;
        }

        const message: WSMessage = {
            type: MessageType.CHAT_MESSAGE,
            data: {
                recipient_id: recipientId,
                content,
                message_type: "text",
            },
            timestamp: new Date().toISOString(),
            id: this.generateMessageId(),
        };

        console.log("📤 Sending message via WebSocket:", {
            recipientId,
            content,
            messageId: message.id,
            currentUserId: this.userId,
        });

        this.ws.send(JSON.stringify(message));
    }

    sendTypingIndicator(recipientId: string, isTyping: boolean): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: WSMessage = {
            type: isTyping
                ? MessageType.USER_TYPING
                : MessageType.USER_STOPPED_TYPING,
            data: {
                recipient_id: recipientId,
            },
            timestamp: new Date().toISOString(),
        };

        this.ws.send(JSON.stringify(message));
    }

    updateStatus(
        status: "online" | "offline" | "away" | "do_not_disturb"
    ): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message: WSMessage = {
            type: MessageType.USER_STATUS_CHANGE,
            data: { status },
            timestamp: new Date().toISOString(),
        };

        this.ws.send(JSON.stringify(message));
    }

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Create a singleton instance
export const wsService = new WebSocketService();
