import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
import { createLogger } from '../../../logger';
import { getDrizzleDb } from '../../../database/client';
import { conversations, messages } from '../../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ConversationListResponse, ConversationDetailResponse, MessageListResponse } from './types';
import { generateId } from '../../../utils/idGenerator';

const logger = createLogger('ConversationController');

/**
 * Conversation Controller for Business AI Platform
 * Handles conversation management and WebSocket upgrade for real-time chat
 */
export class ConversationController extends BaseController {
    static logger = logger;

    /**
     * Create a new conversation
     * POST /api/conversations
     */
    static async createConversation(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<ConversationDetailResponse>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const bodyResult = await ConversationController.parseJsonBody<{
                title?: string;
                initialMessage?: string;
                systemPrompt?: string;
                businessId?: string;
                metadata?: Record<string, unknown>;
            }>(request);

            if (!bodyResult.success) {
                return bodyResult.response as ControllerResponse<ApiResponse<ConversationDetailResponse>>;
            }

            const { title, initialMessage, systemPrompt, businessId, metadata } = bodyResult.data!;

            const conversationId = generateId('conv');
            const durableObjectId = env.CONVERSATION_AGENT.idFromName(conversationId);
            const stub = env.CONVERSATION_AGENT.get(durableObjectId);

            const response = await stub.fetch(`https://conversation-agent/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    businessId,
                    title: title || 'New Conversation',
                    initialMessage,
                    systemPrompt,
                    metadata,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initialize conversation');
            }

            const state = await response.json();

            const responseData: ConversationDetailResponse = {
                id: conversationId,
                agentInstanceId: durableObjectId.toString(),
                title: state.title,
                messageCount: state.messageHistory?.length || 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                contextSummary: state.contextSummary,
            };

            return ConversationController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error creating conversation:', error);
            return ConversationController.createErrorResponse('Failed to create conversation', 500);
        }
    }

    /**
     * List user's conversations
     * GET /api/conversations
     */
    static async listConversations(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<ConversationListResponse>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const archived = url.searchParams.get('archived') === 'true';
            const businessId = url.searchParams.get('businessId');
            const offset = (page - 1) * limit;

            const db = getDrizzleDb(env.DB);

            let query = db
                .select()
                .from(conversations)
                .where(
                    and(
                        eq(conversations.userId, user.id),
                        eq(conversations.isArchived, archived),
                        businessId ? eq(conversations.businessId, businessId) : undefined
                    )
                )
                .orderBy(desc(conversations.updatedAt))
                .limit(limit)
                .offset(offset);

            const conversationList = await query;

            const conversationIds = conversationList.map((c) => c.id);
            const messageCounts = await db
                .select({
                    conversationId: messages.conversationId,
                    count: db.fn.count(messages.id),
                })
                .from(messages)
                .where(db.or(...conversationIds.map((id) => eq(messages.conversationId, id))))
                .groupBy(messages.conversationId);

            const messageCountMap = new Map(
                messageCounts.map((mc) => [mc.conversationId, Number(mc.count)])
            );

            const responseData: ConversationListResponse = {
                conversations: conversationList.map((conv) => ({
                    id: conv.id,
                    title: conv.title,
                    agentType: conv.agentType,
                    messageCount: messageCountMap.get(conv.id) || 0,
                    createdAt: conv.createdAt?.toISOString() || '',
                    updatedAt: conv.updatedAt?.toISOString() || '',
                    contextSummary: conv.contextSummary,
                })),
                pagination: {
                    page,
                    limit,
                    offset,
                    hasMore: conversationList.length === limit,
                },
            };

            return ConversationController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error listing conversations:', error);
            return ConversationController.createErrorResponse('Failed to list conversations', 500);
        }
    }

    /**
     * Get conversation details
     * GET /api/conversations/:id
     */
    static async getConversation(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<ConversationDetailResponse>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const conversationId = context.params?.id;
            if (!conversationId) {
                return ConversationController.createErrorResponse('Conversation ID required', 400);
            }

            const db = getDrizzleDb(env.DB);
            const conversation = await db
                .select()
                .from(conversations)
                .where(
                    and(
                        eq(conversations.id, conversationId),
                        eq(conversations.userId, user.id)
                    )
                )
                .limit(1);

            if (conversation.length === 0) {
                return ConversationController.createErrorResponse('Conversation not found', 404);
            }

            const conv = conversation[0];
            const messageCount = await db
                .select({ count: db.fn.count(messages.id) })
                .from(messages)
                .where(eq(messages.conversationId, conv.id));

            const responseData: ConversationDetailResponse = {
                id: conv.id,
                agentInstanceId: conv.agentInstanceId,
                title: conv.title,
                messageCount: Number(messageCount[0]?.count || 0),
                createdAt: conv.createdAt?.toISOString() || '',
                updatedAt: conv.updatedAt?.toISOString() || '',
                contextSummary: conv.contextSummary,
            };

            return ConversationController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error getting conversation:', error);
            return ConversationController.createErrorResponse('Failed to get conversation', 500);
        }
    }

    /**
     * Delete/archive conversation
     * DELETE /api/conversations/:id
     */
    static async deleteConversation(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<{ success: boolean }>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const conversationId = context.params?.id;
            if (!conversationId) {
                return ConversationController.createErrorResponse('Conversation ID required', 400);
            }

            const durableObjectId = env.CONVERSATION_AGENT.idFromName(conversationId);
            const stub = env.CONVERSATION_AGENT.get(durableObjectId);

            await stub.fetch(`https://conversation-agent/archive`, {
                method: 'POST',
            });

            return ConversationController.createSuccessResponse({ success: true });
        } catch (error) {
            this.logger.error('Error deleting conversation:', error);
            return ConversationController.createErrorResponse('Failed to delete conversation', 500);
        }
    }

    /**
     * Send message to conversation
     * POST /api/conversations/:id/messages
     */
    static async sendMessage(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<{ messageId: string }>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const conversationId = context.params?.id;
            if (!conversationId) {
                return ConversationController.createErrorResponse('Conversation ID required', 400);
            }

            const bodyResult = await ConversationController.parseJsonBody<{
                content: string;
            }>(request);

            if (!bodyResult.success) {
                return bodyResult.response as ControllerResponse<ApiResponse<{ messageId: string }>>;
            }

            const { content } = bodyResult.data!;

            const durableObjectId = env.CONVERSATION_AGENT.idFromName(conversationId);
            const stub = env.CONVERSATION_AGENT.get(durableObjectId);

            const response = await stub.fetch(`https://conversation-agent/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();

            return ConversationController.createSuccessResponse({ messageId: result.messageId });
        } catch (error) {
            this.logger.error('Error sending message:', error);
            return ConversationController.createErrorResponse('Failed to send message', 500);
        }
    }

    /**
     * Get conversation message history
     * GET /api/conversations/:id/messages
     */
    static async getMessages(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<MessageListResponse>>> {
        try {
            const user = context.user;
            if (!user) {
                return ConversationController.createErrorResponse('Authentication required', 401);
            }

            const conversationId = context.params?.id;
            if (!conversationId) {
                return ConversationController.createErrorResponse('Conversation ID required', 400);
            }

            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const before = url.searchParams.get('before');

            const db = getDrizzleDb(env.DB);

            let query = db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conversationId))
                .orderBy(desc(messages.createdAt))
                .limit(limit);

            if (before) {
                query = query.where(
                    and(
                        eq(messages.conversationId, conversationId),
                        db.lt(messages.createdAt, new Date(before))
                    )
                );
            }

            const messageList = await query;

            const responseData: MessageListResponse = {
                messages: messageList.reverse().map((msg) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    createdAt: msg.createdAt?.toISOString() || '',
                    metadata: msg.metadata as Record<string, unknown>,
                })),
            };

            return ConversationController.createSuccessResponse(responseData);
        } catch (error) {
            this.logger.error('Error getting messages:', error);
            return ConversationController.createErrorResponse('Failed to get messages', 500);
        }
    }

    /**
     * Upgrade to WebSocket for real-time conversation
     * GET /api/conversations/:id/ws
     */
    static async handleWebSocket(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext
    ): Promise<Response> {
        try {
            const user = context.user;
            if (!user) {
                return new Response('Authentication required', { status: 401 });
            }

            const conversationId = context.params?.id;
            if (!conversationId) {
                return new Response('Conversation ID required', { status: 400 });
            }

            const upgradeHeader = request.headers.get('Upgrade');
            if (upgradeHeader !== 'websocket') {
                return new Response('Expected websocket', { status: 426 });
            }

            const durableObjectId = env.CONVERSATION_AGENT.idFromName(conversationId);
            const stub = env.CONVERSATION_AGENT.get(durableObjectId);

            return stub.fetch(request);
        } catch (error) {
            logger.error('Error handling WebSocket:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
}
