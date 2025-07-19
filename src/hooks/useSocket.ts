import { useSocket } from "@/contexts/socketContext";
import { useEffect, type DependencyList, useCallback } from "react";
import { useUser } from "./useUser";

export function useSocketEvent<T = any>(
    event: string,
    handler: (payload: T) => void,
    deps: DependencyList = []
) {
    const { subscribe } = useSocket();

    useEffect(() => {
        return subscribe<T>(event, handler);
    }, [event, subscribe, ...deps]);
}

export function useSocketEmit() {
    const { emit } = useSocket();
    return emit;
}

export function useDMSubscription(threadIds: string[]) {
    const { emit, subscribe } = useSocket();

    useEffect(() => {
        if (threadIds.length > 0) {
            emit("dm:subscribe", threadIds);
            console.log("Subscribed to DM threads:", threadIds);
        }
    }, [emit, threadIds]);

    const onNewMessage = useCallback(
        (handler: (message: any) => void) => {
            return subscribe("dm:receive", handler);
        },
        [subscribe]
    );

    return { onNewMessage };
}

export type UserStatus = "online" | "away" | "busy" | "offline";

export interface StatusUpdatePayload {
    userId: string;
    status: UserStatus;
}

/**
 * A hook to get a function that sets the current user's status.
 * @example const setStatus = useSetStatus();
 * setStatus("busy");
 */
export function useSetStatus() {
    const emit = useSocketEmit();

    return useCallback(
        (status: UserStatus) => {
            emit("status:set", { status });
        },
        [emit]
    );
}

/**
 * A hook to subscribe to status updates for a list of friend IDs.
 * @param friendIds - An array of user IDs to subscribe to.
 * @returns An object with `onStatusUpdate` to register a callback for status changes.
 * @example const { onStatusUpdate } = useStatusSubscription(friendIds);
 * useEffect(() => {
 *   return onStatusUpdate((payload) => {
 *     console.log(`${payload.userId} is now ${payload.status}`);
 *   });
 * }, [onStatusUpdate]);
 */
export function useStatusSubscription(
    friendIds: string[],
    enabled: boolean = true
) {
    const { emit, subscribe } = useSocket();

    useEffect(() => {
        if (enabled && friendIds && friendIds.length > 0) {
            emit("status:subscribe", friendIds);
        }
    }, [emit, friendIds, enabled]);

    const onStatusUpdate = useCallback(
        (handler: (payload: StatusUpdatePayload) => void) => {
            return subscribe("status:update", handler);
        },
        [subscribe]
    );

    return { onStatusUpdate };
}

export function useAutoOnlineStatus() {
    const setStatus = useSetStatus();
    const { user } = useUser();
    const { connected } = useSocket();

    useEffect(() => {
        if (user && connected) {
            setStatus("online");
        }
    }, [user, connected, setStatus]);
}
