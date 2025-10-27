export interface ConversationListItem {
    id: string;
    title: string;
    agentType: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    contextSummary?: string | null;
}

export interface ConversationListResponse {
    conversations: ConversationListItem[];
    pagination: {
        page: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface ConversationDetailResponse {
    id: string;
    agentInstanceId: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
    contextSummary?: string | null;
}

export interface MessageItem {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}

export interface MessageListResponse {
    messages: MessageItem[];
}
