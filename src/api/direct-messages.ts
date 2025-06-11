import { authApiBase } from "./api-base";

export type GetThreadMessagesRequest = {
    thread_id: string;
    params?: {
        page?: number;
        page_size?: number;
    };
};

export type GetThreadMessagesResponse = {
    messages: Message[];
    current_page: number;
    page_size: number;
    has_more: boolean;
};

export type Message = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    sender_id: string;
    content_type: string;
    content: string;
    metadata?: object;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export async function getThreadMessages(
    request: GetThreadMessagesRequest
): Promise<GetThreadMessagesResponse> {
    const page = Math.max(1, request.params?.page ?? 1);
    const page_size = Math.min(
        100,
        Math.max(1, request.params?.page_size ?? 20)
    );

    const response = await authApiBase().get(
        `/api/v1/messages/threads/${request.thread_id}`,
        {
            params: {
                page,
                page_size,
            },
        }
    );

    if (response.status === 200) {
        return response.data;
    } else {
        console.error(
            "Failed to get thread messages:",
            response.status,
            response.data
        );
        throw new Error(`Failed to get thread messages: ${response.status}`);
    }
}
