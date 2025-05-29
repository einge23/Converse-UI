import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    createFriendRequest,
    getUserFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    type CreateFriendRequest,
    type FriendRequestWithUser,
    getFriends,
} from "../api/friends";
import { useUser } from "./useUser";

export const useCreateFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateFriendRequest) =>
            createFriendRequest(request),
        onSuccess: (success) => {
            if (success) {
                toast.success("Friend request sent successfully");
                // Invalidate friend requests query to refresh the list
                queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
            } else {
                toast.error("Failed to send friend request");
            }
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message || "Failed to send friend request"
            );
        },
    });
};

export const useFriendRequests = () => {
    const { isAuthenticated } = useUser();

    return useQuery({
        queryKey: ["friendRequests"],
        queryFn: getUserFriendRequests,
        enabled: isAuthenticated, // Only fetch when user is authenticated
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 30, // Refetch every 30 seconds
    });
};

export const useFriends = () => {
    const { isAuthenticated } = useUser();

    return useQuery({
        queryKey: ["friends"],
        queryFn: getFriends,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 30,
    });
};

export const useAcceptFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendRequestId: number) =>
            acceptFriendRequest(friendRequestId),
        onSuccess: (success) => {
            if (success) {
                toast.success("Friend request accepted");
                queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
                queryClient.invalidateQueries({ queryKey: ["friends"] });
            } else {
                toast.error("Failed to accept friend request");
            }
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                    "Failed to accept friend request"
            );
        },
    });
};

export const useDeclineFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (friendRequestId: number) =>
            declineFriendRequest(friendRequestId),
        onSuccess: (success) => {
            if (success) {
                toast.success("Friend request declined");
                // Invalidate friend requests query to refresh the list
                queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
            } else {
                toast.error("Failed to decline friend request");
            }
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                    "Failed to decline friend request"
            );
        },
    });
};

// Hook to get pending friend requests (filtered from all requests)
export const usePendingFriendRequests = () => {
    const { data: friendRequests = [], ...rest } = useFriendRequests();

    const pendingRequests = friendRequests.filter(
        (request: FriendRequestWithUser) => request.status === "pending"
    );

    return {
        data: pendingRequests,
        ...rest,
    };
};

// Hook to get sent friend requests (where current user is the requester)
export const useSentFriendRequests = () => {
    const { user } = useUser();
    const { data: friendRequests = [], ...rest } = useFriendRequests();

    const sentRequests = friendRequests.filter(
        (request: FriendRequestWithUser) =>
            request.status === "pending" &&
            request.requester_id === user?.user_id
    );

    return {
        data: sentRequests,
        ...rest,
    };
};

// Hook to get received friend requests (where current user is the recipient)
export const useReceivedFriendRequests = () => {
    const { user } = useUser();
    const { data: friendRequests = [], ...rest } = useFriendRequests();

    const receivedRequests = friendRequests.filter(
        (request: FriendRequestWithUser) =>
            request.status === "pending" &&
            request.recipient_id === user?.user_id
    );

    return {
        data: receivedRequests,
        ...rest,
    };
};
