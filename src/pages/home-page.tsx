import { ChannelSidebar } from "@/components/home/channel-sidebar";
import { ChatInterface } from "@/components/home/chat-interface";
import { FriendsList } from "@/components/home/friends-list";
import { ServerSidebar } from "@/components/home/server-sidebar";
import { useFriends } from "@/hooks/useFriendships";
import { useDMSubscription } from "@/hooks/useSocket";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

export default function HomePage() {
    const { serverId, channelId, dmThreadId } = useParams();
    const navigate = useNavigate();
    const { data: friends = [] } = useFriends();

    const threadIds = friends
        .map((friend) => friend.dm_thread_id)
        .filter((id): id is string => Boolean(id));

    const { onNewMessage } = useDMSubscription(threadIds);

    useEffect(() => {
        const unsubscribe = onNewMessage((message: any) => {
            console.log("New message received:", message);
            if (message.thread_id !== dmThreadId) {
                const messageFriend = friends.find(
                    (f) => f.dm_thread_id === message.thread_id
                );
                const senderName =
                    messageFriend?.display_name ||
                    messageFriend?.username ||
                    "Unknown";
                toast(`New message from ${senderName}`, {
                    description: message.content,
                    action: {
                        label: "View",
                        onClick: () =>
                            navigate(`/app/friends/${message.thread_id}`),
                    },
                });
            }
        });

        return unsubscribe;
    }, [onNewMessage, dmThreadId, friends, navigate]);

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
