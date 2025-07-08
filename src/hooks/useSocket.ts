import { useSocket } from "@/contexts/socketContext";
import { useEffect, type DependencyList, useCallback } from "react";

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
