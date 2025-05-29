import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Paperclip, Plus, Send, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isCurrentUser: boolean;
}

interface ChatInterfaceProps {
    friendId: string;
    onBack: () => void;
}

// Mock data
const friends = {
    friend1: {
        id: "friend1",
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "online",
    },
    friend2: {
        id: "friend2",
        name: "Sam Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "idle",
    },
    friend3: {
        id: "friend3",
        name: "Taylor Moore",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "dnd",
    },
    friend4: {
        id: "friend4",
        name: "Jordan Lee",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
    },
    friend5: {
        id: "friend5",
        name: "Casey Kim",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "online",
    },
    friend6: {
        id: "friend6",
        name: "Riley Brown",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "online",
    },
    friend7: {
        id: "friend7",
        name: "Quinn Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "idle",
    },
    friend8: {
        id: "friend8",
        name: "Morgan Davis",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
    },
};

const mockMessages: Record<string, Message[]> = {
    friend1: [
        {
            id: "msg1",
            senderId: "friend1",
            content: "Hey there! How's it going?",
            timestamp: "Today at 10:30 AM",
            isCurrentUser: false,
        },
        {
            id: "msg2",
            senderId: "currentUser",
            content:
                "Hi Alex! I'm doing well, thanks for asking. How about you?",
            timestamp: "Today at 10:32 AM",
            isCurrentUser: true,
        },
        {
            id: "msg3",
            senderId: "friend1",
            content:
                "Pretty good! Just working on that project we discussed last week.",
            timestamp: "Today at 10:35 AM",
            isCurrentUser: false,
        },
        {
            id: "msg4",
            senderId: "currentUser",
            content: "Oh nice! How's that coming along?",
            timestamp: "Today at 10:36 AM",
            isCurrentUser: true,
        },
        {
            id: "msg5",
            senderId: "friend1",
            content:
                "Making progress! I think we'll be able to finish it by the end of the week.",
            timestamp: "Today at 10:40 AM",
            isCurrentUser: false,
        },
    ],
    friend2: [
        {
            id: "msg1",
            senderId: "friend2",
            content: "Did you see the game last night?",
            timestamp: "Yesterday at 8:15 PM",
            isCurrentUser: false,
        },
        {
            id: "msg2",
            senderId: "currentUser",
            content:
                "Yeah, it was amazing! That last-minute goal was incredible.",
            timestamp: "Yesterday at 8:20 PM",
            isCurrentUser: true,
        },
    ],
};

export function ChatInterface({ friendId, onBack }: ChatInterfaceProps) {
    const friend = friends[friendId as keyof typeof friends];
    const [messages, setMessages] = useState<Message[]>(
        mockMessages[friendId] || []
    );
    const [newMessage, setNewMessage] = useState("");

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const newMsg: Message = {
            id: `msg${Date.now()}`,
            senderId: "currentUser",
            content: newMessage,
            timestamp: "Just now",
            isCurrentUser: true,
        };

        setMessages([...messages, newMsg]);
        setNewMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-full flex-col">
            <header className="flex h-12 items-center border-b px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="mr-2 md:hidden"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar>
                            <AvatarImage
                                src={friend.avatar || "/placeholder.svg"}
                                alt={friend.name}
                            />
                            <AvatarFallback>
                                {friend.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                friend.status === "online" && "bg-emerald-500",
                                friend.status === "idle" && "bg-amber-500",
                                friend.status === "dnd" && "bg-red-500",
                                friend.status === "offline" && "bg-muted"
                            )}
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold">{friend.name}</h2>
                        <p className="text-xs text-muted-foreground">
                            {friend.status}
                        </p>
                    </div>
                </div>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => {
                        const isFirstInGroup =
                            index === 0 ||
                            messages[index - 1].senderId !== message.senderId;

                        return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex gap-3",
                                    !isFirstInGroup && "mt-1 pl-12"
                                )}
                            >
                                {isFirstInGroup && (
                                    <Avatar className="mt-0.5 h-9 w-9">
                                        <AvatarImage
                                            src={
                                                message.isCurrentUser
                                                    ? "/placeholder.svg"
                                                    : friend.avatar ||
                                                      "/placeholder.svg"
                                            }
                                            alt={
                                                message.isCurrentUser
                                                    ? "You"
                                                    : friend.name
                                            }
                                        />
                                        <AvatarFallback>
                                            {message.isCurrentUser
                                                ? "Y"
                                                : friend.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className="max-w-[80%]">
                                    {isFirstInGroup && (
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="font-medium">
                                                {message.isCurrentUser
                                                    ? "You"
                                                    : friend.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {message.timestamp}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2",
                                            message.isCurrentUser
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <Separator />

            <div className="p-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>

                    <div className="relative flex-1">
                        <textarea
                            className="max-h-32 min-h-10 w-full resize-none bg-transparent p-2 text-sm focus:outline-none"
                            placeholder={`Message ${friend.name}...`}
                            rows={1}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Gift className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            className={cn(
                                "h-8 w-8",
                                !newMessage.trim() && "opacity-50"
                            )}
                            disabled={!newMessage.trim()}
                            onClick={handleSendMessage}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
