import { getThreadMessages } from "@/api/direct-messages";
import { useQuery } from "@tanstack/react-query";

export const useGetThreadMessages = (
    thread_id: string,
    page: number = 1,
    page_size: number = 20
) => {
    return useQuery({
        queryKey: ["thread-messages", thread_id, page, page_size],
        queryFn: () =>
            getThreadMessages({
                thread_id,
                params: {
                    page,
                    page_size,
                },
            }),
        enabled: !!thread_id,
        staleTime: 30000,
        gcTime: 5 * 60 * 1000,
    });
};
