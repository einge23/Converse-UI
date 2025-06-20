// import { GradientButton } from "@/components/ui/gradient-button";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";

import type { PublicUser } from "@/api/friends";
import { useFriends } from "@/hooks/useFriendships";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useRef, useState } from "react";

// export default function VideoPlayTest() {
//     const videoRef = useRef<HTMLVideoElement>(null);
//     const audioRef = useRef<HTMLAudioElement>(null);

//     const playVideoFromCamera = async () => {
//         try {
//             const constraints = { video: true, audio: true };
//             const stream = await navigator.mediaDevices.getUserMedia(
//                 constraints
//             );

//             const audioTracks = stream.getAudioTracks();

//             if (videoRef.current) {
//                 videoRef.current.srcObject = stream;
//                 await videoRef.current.play();
//             }

//             if (audioRef.current && audioTracks.length > 0) {
//                 const audioStream = new MediaStream(audioTracks);
//                 audioRef.current.srcObject = audioStream;
//                 await audioRef.current.play();
//             }
//         } catch (error) {
//             console.error("Camera error:", error);
//             toast.error("Error opening video");
//         }
//     };

//     return (
//         <div>
//             <GradientButton
//                 className="flex flex-col justify-center"
//                 onClick={playVideoFromCamera}
//             >
//                 Play Video From Camera
//             </GradientButton>
//             <video
//                 ref={videoRef}
//                 id="localVideo"
//                 autoPlay
//                 playsInline
//                 muted
//                 className="w-[400px] h-[300px] -scale-x-100"
//             />
//             <audio ref={audioRef} autoPlay />
//         </div>
//     );
// }

export default function VideoPlayTest() {
    const { data: friends } = useFriends();
    const [selectedFriend, setSelectedFriend] = useState<PublicUser | null>(
        null
    );
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [localPeer, setLocalPeer] = useState<RTCPeerConnection | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const sessionId = useRef(crypto.randomUUID());

    const initializePeerConnection = (targetId: string) => {
        const peer = new RTCPeerConnection();

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                sendWebRTCICE(targetId, sessionId.current, event.candidate);
            }
        };

        peer.ontrack = (event) => {
            if (!remoteStream) {
                const stream = new MediaStream();
                setRemoteStream(stream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            }
            remoteStream?.addTrack(event.track);
        };
        return peer;
    };

    const { isConnected, sendWebRTCOffer, sendWebRTCAnswer, sendWebRTCICE } =
        useWebSocket({
            onWebRTCOffer: async (data) => {
                const peer = initializePeerConnection(data.sender_id);

                if (data.webrtc.sdp) {
                    await peer.setRemoteDescription(
                        new RTCSessionDescription(data.webrtc.sdp)
                    );
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);

                    sendWebRTCAnswer(data.sender_id, sessionId.current, answer);
                }

                setLocalPeer(peer);
            },
            onWebRTCAnswer: async (data) => {
                if (localPeer && data.webrtc.sdp) {
                    await localPeer.setRemoteDescription(
                        new RTCSessionDescription(data.webrtc.sdp)
                    );
                }
            },
            onWebRTCICE: async (data) => {
                if (localPeer && data.webrtc?.ice_candidate) {
                    await localPeer.addIceCandidate(
                        new RTCIceCandidate(data.webrtc.ice_candidate)
                    );
                }
            },
        });

    const startConnection = async () => {
        if (!isConnected) {
            console.error("websocket is not connected");
            return;
        }
        if (!selectedFriend) {
            alert("Please select a friend to call.");
            return;
        }

        const peer = initializePeerConnection(selectedFriend.user_id);
        setLocalPeer(peer);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        sendWebRTCOffer(selectedFriend.user_id, sessionId.current, offer);
    };

    const handleFriendSelect = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const friendId = event.target.value;
        const friendToCall =
            friends?.find((f) => f.user_id === friendId) || null;
        setSelectedFriend(friendToCall);
    };

    return (
        <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
                <select
                    onChange={handleFriendSelect}
                    value={selectedFriend?.user_id || ""}
                    className="p-2 border rounded"
                >
                    <option value="" disabled>
                        Select a friend to call
                    </option>
                    {friends?.map((friend) => (
                        <option key={friend.user_id} value={friend.user_id}>
                            {friend.username}
                        </option>
                    ))}
                </select>
                <button
                    onClick={startConnection}
                    disabled={!selectedFriend || !isConnected}
                    className="px-4 py-2 text-white bg-blue-500 rounded disabled:bg-gray-400"
                >
                    Start Call
                </button>
            </div>
            <div className="flex gap-4">
                <div>
                    <h3>Local Video</h3>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-[400px] h-[300px] bg-black"
                    />
                </div>
                <div>
                    <h3>Remote Video</h3>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-[400px] h-[300px] bg-black"
                    />
                </div>
            </div>
        </div>
    );
}
