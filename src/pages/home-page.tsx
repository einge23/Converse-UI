import { ChannelSidebar } from "@/components/home/channel-sidebar";
import { ChatInterface } from "@/components/home/chat-interface";
import { FriendsList } from "@/components/home/friends-list";
import { ServerSidebar } from "@/components/home/server-sidebar";
import { useFriends } from "@/hooks/useFriendships";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

export default function HomePage() {
    const { connect, connectionError, isConnected, isConnecting, disconnect } =
        useWebSocket();
    const { serverId, channelId, dmThreadId } = useParams();
    const navigate = useNavigate();
    const { data: friends = [] } = useFriends();

    const friend = dmThreadId
        ? friends.find((f) => f.dm_thread_id === dmThreadId)
        : undefined;

    const selectedServer = serverId || "friends";
    const selectedFriend = dmThreadId || null;

    const handleServerSelect = (newServerId: string) => {
        if (newServerId === "friends") {
            navigate("/app/friends");
        } else {
            navigate(`/app/${newServerId}`);
        }
    };

    const handleSelectFriend = (friendId: string | null) => {
        if (friendId === null) {
            navigate("/app/friends");
        } else {
            // Find the friend and use their dm_thread_id
            const selectedFriend = friends.find((f) => f.user_id === friendId);
            const threadId = selectedFriend?.dm_thread_id || friendId;
            navigate(`/app/friends/${threadId}`);
        }
    };

    useEffect(() => {
        if (!isConnected && !isConnecting) {
            connect();
        }
    }, [connect, isConnected, isConnecting]);

    useEffect(() => {
        if (connectionError) {
            toast.error("Error connecting to chats");
            console.error("WebSocket connection error:", connectionError);
        }
    }, [connectionError]);

    useEffect(() => {
        return () => {
            if (isConnected) {
                disconnect();
            }
        };
    }, [disconnect, isConnected]);

    // Default redirect - if no route specified, go to friends
    useEffect(() => {
        if (!serverId && !dmThreadId && window.location.pathname === "/app") {
            navigate("/app/friends", { replace: true });
        }
    }, [serverId, dmThreadId, navigate]);

    return (
        <div className="flex h-screen overflow-hidden">
            <ServerSidebar
                selectedServer={selectedServer}
                onServerSelect={handleServerSelect}
            />
            <ChannelSidebar
                selectedServer={selectedServer}
                selectedChannel={channelId}
                onSelectFriend={handleSelectFriend}
            />
            <main className="flex flex-1 flex-col overflow-hidden">
                {selectedFriend && dmThreadId && friend ? (
                    <ChatInterface
                        threadId={dmThreadId}
                        friend={friend}
                        onBack={() => handleSelectFriend(null)}
                    />
                ) : (
                    <FriendsList />
                )}
            </main>
        </div>
    );
}
