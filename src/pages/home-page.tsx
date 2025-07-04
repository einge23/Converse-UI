import { ChannelSidebar } from "@/components/home/channel-sidebar";
import { ChatInterface } from "@/components/home/chat-interface";
import { FriendsList } from "@/components/home/friends-list";
import { ServerSidebar } from "@/components/home/server-sidebar";
import { IncomingCall } from "@/components/home/incoming-call";
import { useFriends } from "@/hooks/useFriendships";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WebRTCOfferData } from "@/lib/websocket";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

export default function HomePage() {
    const [incomingOffer, setIncomingOffer] = useState<WebRTCOfferData | null>(
        null
    );

    const {
        connect,
        connectionError,
        isConnected,
        isConnecting,
        disconnect,
        sendWebRTCAnswer,
        sendWebRTCHangup,
    } = useWebSocket({
        onWebRTCOffer: (offer) => setIncomingOffer(offer),
    });
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

    const handleAccept = useCallback(
        async (offer: WebRTCOfferData) => {
            // Navigate both users to a unique call room using session_id
            navigate(`/app/call/${offer.webrtc.session_id}`);
            // Send WebRTC answer (dummy SDP for now, replace with real SDP in actual implementation)
            await sendWebRTCAnswer(
                offer.sender_id,
                offer.webrtc.session_id,
                offer.webrtc.sdp // In real use, replace with local SDP answer
            );
            setIncomingOffer(null);
        },
        [navigate, sendWebRTCAnswer]
    );

    const handleDecline = useCallback(
        (offer: WebRTCOfferData) => {
            sendWebRTCHangup(offer.sender_id, offer.webrtc.session_id, "declined");
            setIncomingOffer(null);
        },
        [sendWebRTCHangup]
    );

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
            {/* Incoming call popup */}
            {incomingOffer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded shadow-lg p-6">
                        <IncomingCall
                            offer={incomingOffer}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    </div>
                </div>
            )}
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
