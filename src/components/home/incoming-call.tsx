import type { WebRTCOfferData } from "@/lib/websocket";
import { Button } from "../ui/button";

interface IncomingCallProps {
    offer: WebRTCOfferData;
    onAccept: (offer: WebRTCOfferData) => void;
    onDecline: (offer: WebRTCOfferData) => void;
}

export function IncomingCall({
    offer,
    onAccept,
    onDecline,
}: IncomingCallProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-bold">Incoming Call</p>
                <p>From {offer.sender_id}</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => onAccept(offer)}>Accept</Button>
                <Button variant="destructive" onClick={() => onDecline(offer)}>
                    Decline
                </Button>
            </div>
        </div>
    );
}
