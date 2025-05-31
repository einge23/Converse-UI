import { ChannelSidebar } from "@/components/home/channel-sidebar";
import { ChatInterface } from "@/components/home/chat-interface";
import { FriendsList } from "@/components/home/friends-list";
import { ServerSidebar } from "@/components/home/server-sidebar";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";

export default function HomePage() {
    const { serverId, channelId, dmThreadId } = useParams();
    const navigate = useNavigate();

    // Determine current state from URL
    const selectedServer = serverId || "friends";
    const selectedFriend = dmThreadId || null;

    // Handle server selection from sidebar
    const handleServerSelect = (newServerId: string) => {
        if (newServerId === "friends") {
            navigate("/app/friends");
        } else {
            navigate(`/app/${newServerId}`);
        }
    };

    // Handle friend selection for DM
    const handleSelectFriend = (friendId: string | null) => {
        if (friendId === null) {
            // Navigate back to friends list
            navigate("/app/friends");
        } else {
            // Navigate to DM with friend using their dm_thread_id
            // For now, we'll use the friendId as dmThreadId - this should be updated
            // to use the actual dm_thread_id from the friend object
            navigate(`/app/friends/${friendId}`);
        }
    };

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
                {selectedFriend ? (
                    <ChatInterface
                        friendId={selectedFriend}
                        onBack={() => handleSelectFriend(null)}
                    />
                ) : (
                    <FriendsList />
                )}
            </main>
        </div>
    );
}
