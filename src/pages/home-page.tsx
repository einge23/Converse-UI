import { ChannelSidebar } from "@/components/home/channel-sidebar";
import { ChatInterface } from "@/components/home/chat-interface";
import { FriendsList } from "@/components/home/friends-list";
import { ServerSidebar } from "@/components/home/server-sidebar";
import { useState } from "react";

export default function HomePage() {
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

    return (
        <div className="flex h-screen overflow-hidden">
            <ServerSidebar />
            <ChannelSidebar />
            <main className="flex flex-1 flex-col overflow-hidden">
                {selectedFriend ? (
                    <ChatInterface
                        friendId={selectedFriend}
                        onBack={() => setSelectedFriend(null)}
                    />
                ) : (
                    <FriendsList onSelectFriend={setSelectedFriend} />
                )}
            </main>
        </div>
    );
}
