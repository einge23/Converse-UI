import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL!;

let socketInstance: Socket | null = null;

export function getSocket(userId: string): Socket {
    if (socketInstance) {
        const currentAuth = socketInstance.auth as { userId?: string };
        if (currentAuth?.userId === userId) {
            return socketInstance;
        } else {
            socketInstance.disconnect();
            socketInstance = null;
        }
    }

    const opts = {
        autoConnect: false,
        transports: ["websocket"],
        auth: { userId: userId },
        reconnectionAttempts: 5,
        timeout: 10000,
    };

    socketInstance = io(URL, opts);
    return socketInstance;
}

export function destroySocket(): void {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
}

export { socketInstance };
