import { authApiBase } from "./api-base";

export type CreateFriendRequest = {
    username: string;
};

export type PublicUser = {
    user_id: string;
    username: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    status: "online" | "offline" | "away" | "do_not_disturb";
    last_active_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    dm_thread_id: string | null;
};

export type FriendRequest = {
    friend_request_id: number;
    requester_id: string;
    recipient_id: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
    updated_at: string;
};

export type FriendRequestWithUser = {
    friend_request_id: number;
    requester_id: string;
    recipient_id: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
    updated_at: string;
    requester: PublicUser;
};

export async function createFriendRequest(
    request: CreateFriendRequest
): Promise<boolean> {
    const response = await authApiBase().post(
        "/api/v1/friend-requests/",
        request
    );

    if (response.status === 200 || response.status === 201) {
        return true;
    } else {
        console.error("Failed to create friend request:", response.data);
        return false;
    }
}

export async function getUserFriendRequests(): Promise<
    FriendRequestWithUser[]
> {
    const response = await authApiBase().get("/api/v1/friend-requests/");

    if (response.status === 200) {
        return response.data;
    } else {
        console.error("Failed to fetch friend requests:", response.data);
        return [];
    }
}

export async function declineFriendRequest(
    friendRequestId: number
): Promise<boolean> {
    const response = await authApiBase().post(
        `/api/v1/friend-requests/${friendRequestId}/decline`
    );

    if (response.status === 200) {
        return true;
    } else {
        console.error("Failed to decline friend request:", response.data);
        return false;
    }
}

export async function acceptFriendRequest(
    friendRequestId: number
): Promise<boolean> {
    const response = await authApiBase().put(
        `/api/v1/friend-requests/${friendRequestId}/accept`
    );

    if (response.status === 200) {
        return true;
    } else {
        console.error("Failed to accept friend request:", response.data);
        return false;
    }
}

export async function getFriends(): Promise<PublicUser[]> {
    const response = await authApiBase().get("/api/v1/friends/");

    if (response.status === 200) {
        console.log("Friends API response:", response.data);
        console.log("First friend:", response.data[0]);
        return response.data;
    } else {
        console.error("Failed to get friends:", response.data);
        return [];
    }
}
