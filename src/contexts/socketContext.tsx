import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { getSocket, destroySocket } from "../lib/socket";
import { useUser } from "@/hooks/useUser";
import { Socket } from "socket.io-client";

interface SocketContextValue {
    socket: Socket | null;
    connected: boolean;
    emit: (event: string, payload?: any) => void;
    subscribe: <T>(event: string, handler: (payload: T) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const { user, isAuthenticated } = useUser();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!isAuthenticated || !user?.user_id) {
            if (socket) {
                destroySocket();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const socketInstance = getSocket(user.user_id);

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);

        if (!socketInstance.connected) {
            socketInstance.connect();
        }

        setSocket(socketInstance);

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
        };
    }, [user?.user_id, isAuthenticated]);

    const emit = useCallback(
        (event: string, payload?: any) => {
            if (socket?.connected) {
                socket.emit(event, payload);
            } else {
                console.warn(
                    `Socket not connected; dropping emit for event: ${event}`
                );
            }
        },
        [socket]
    );

    const subscribe = useCallback(
        (event: string, handler: (payload: any) => void) => {
            if (!socket) return () => {};

            socket.on(event, handler);
            return () => socket.off(event, handler);
        },
        [socket]
    ) as <T = any>(event: string, handler: (payload: T) => void) => () => void;

    const value = useMemo(
        () => ({
            socket,
            connected,
            emit,
            subscribe,
        }),
        [socket, connected, emit, subscribe]
    );

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): SocketContextValue {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}
