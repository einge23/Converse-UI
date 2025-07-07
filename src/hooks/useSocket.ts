import { useSocket } from "@/contexts/socketContext";
import { useEffect, type DependencyList } from "react";

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
