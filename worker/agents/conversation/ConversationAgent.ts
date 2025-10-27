import { Agent, Connection } from 'agents';
import { createObjectLogger, StructuredLogger } from '../../logger';
import { InferenceContext, AgentActionKey } from '../inferutils/config.types';
import { AGENT_CONFIG } from '../inferutils/config';
import { ModelConfigService } from '../../database/services/ModelConfigService';
import { generateId } from '../../utils/idGenerator';
import { conversations, messages, NewConversation, NewMessage, usageTracking, NewUsageTracking } from '../../database/schema';
import { getDrizzleDb } from '../../database/client';
import { eq, desc } from 'drizzle-orm';

interface ConversationState {
    conversationId: string;
    userId?: string;
    businessId?: string;
    title: string;
    messageHistory: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: number;
    }>;
    contextSummary?: string;
    metadata: Record<string, unknown>;
}

interface ConversationMessage {
    type: 'user_message' | 'assistant_response' | 'status_update' | 'error' | 'thinking';
    messageId: string;
    conversationId: string;
    payload: {
        content?: string;
        metadata?: Record<string, unknown>;
        thinking?: string;
        sentiment?: string;
        intent?: string;
        language?: string;
    };
    timestamp: string;
}

interface InitArgs {
    userId?: string;
    businessId?: string;
    title?: string;
    initialMessage?: string;
    systemPrompt?: string;
    metadata?: Record<string, unknown>;
}

/**
 * ConversationAgent - General-purpose conversational AI with context memory
 *
 * Capabilities:
 * - Multi-turn conversations with full context
 * - Sentiment analysis
 * - Intent detection and routing
 * - Multi-language support
 * - Context-aware responses
 * - Conversation history management
 */
export class ConversationAgent extends Agent<Env, ConversationState> {
    private connections: Set<Connection> = new Set();
    private dbLogger: StructuredLogger | undefined;
    private modelConfigService: ModelConfigService | undefined;

    private logger(): StructuredLogger {
        if (!this.dbLogger) {
            this.dbLogger = createObjectLogger({
                agentId: this.ctx.id.toString(),
                agentType: 'ConversationAgent',
            });
        }
        return this.dbLogger;
    }

    private async getModelConfigService(): Promise<ModelConfigService> {
        if (!this.modelConfigService) {
            this.modelConfigService = new ModelConfigService(this.env.DB);
        }
        return this.modelConfigService;
    }

    /**
     * Initialize the conversation agent
     */
    async initialize(initArgs: InitArgs): Promise<ConversationState> {
        this.logger().info('Initializing ConversationAgent', {
            userId: initArgs.userId,
            businessId: initArgs.businessId,
        });

        const conversationId = generateId('conv');
        const title = initArgs.title || 'New Conversation';

        const newState: ConversationState = {
            conversationId,
            userId: initArgs.userId,
            businessId: initArgs.businessId,
            title,
            messageHistory: [],
            metadata: initArgs.metadata || {},
        };

        this.state = newState;

        const db = getDrizzleDb(this.env.DB);
        const newConversation: NewConversation = {
            id: conversationId,
            userId: initArgs.userId,
            businessId: initArgs.businessId,
            agentType: 'conversation',
            agentInstanceId: this.ctx.id.toString(),
            title,
            metadata: initArgs.metadata || {},
        };

        await db.insert(conversations).values(newConversation);

        if (initArgs.systemPrompt) {
            await this.addSystemMessage(initArgs.systemPrompt);
        }

        if (initArgs.initialMessage) {
            await this.processMessage(initArgs.initialMessage);
        }

        this.logger().info('ConversationAgent initialized', {
            conversationId,
        });

        return newState;
    }

    /**
     * Add a system message to the conversation
     */
    private async addSystemMessage(content: string): Promise<void> {
        const messageId = generateId('msg');
        const timestamp = Date.now();

        this.state.messageHistory.push({
            id: messageId,
            role: 'system',
            content,
            timestamp,
        });

        const db = getDrizzleDb(this.env.DB);
        const newMessage: NewMessage = {
            id: messageId,
            conversationId: this.state.conversationId,
            role: 'system',
            content,
        };

        await db.insert(messages).values(newMessage);
    }

    /**
     * Process a user message and generate a response
     */
    async processMessage(userMessage: string): Promise<void> {
        const messageId = generateId('msg');
        const timestamp = Date.now();

        const userMsg = {
            id: messageId,
            role: 'user' as const,
            content: userMessage,
            timestamp,
        };

        this.state.messageHistory.push(userMsg);

        const db = getDrizzleDb(this.env.DB);
        const newUserMessage: NewMessage = {
            id: messageId,
            conversationId: this.state.conversationId,
            role: 'user',
            content: userMessage,
        };

        await db.insert(messages).values(newUserMessage);

        this.broadcast({
            type: 'status_update',
            messageId: generateId('status'),
            conversationId: this.state.conversationId,
            payload: {
                content: 'Analyzing your message...',
            },
            timestamp: new Date().toISOString(),
        });

        const intent = await this.detectIntent(userMessage);
        const sentiment = await this.analyzeSentiment(userMessage);
        const language = await this.detectLanguage(userMessage);

        this.broadcast({
            type: 'thinking',
            messageId: generateId('thinking'),
            conversationId: this.state.conversationId,
            payload: {
                thinking: `Detected intent: ${intent}, sentiment: ${sentiment}, language: ${language}`,
                intent,
                sentiment,
                language,
            },
            timestamp: new Date().toISOString(),
        });

        const response = await this.generateResponse(userMessage, {
            intent,
            sentiment,
            language,
        });

        const assistantMessageId = generateId('msg');
        const assistantMsg = {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: response.content,
            timestamp: Date.now(),
        };

        this.state.messageHistory.push(assistantMsg);

        const newAssistantMessage: NewMessage = {
            id: assistantMessageId,
            conversationId: this.state.conversationId,
            role: 'assistant',
            content: response.content,
            tokensUsed: response.tokensUsed,
            modelUsed: response.modelUsed,
            metadata: {
                intent,
                sentiment,
                language,
            },
        };

        await db.insert(messages).values(newAssistantMessage);

        await this.trackUsage(response.tokensUsed || 0, response.costCents || 0);

        this.broadcast({
            type: 'assistant_response',
            messageId: assistantMessageId,
            conversationId: this.state.conversationId,
            payload: {
                content: response.content,
                metadata: {
                    intent,
                    sentiment,
                    language,
                    tokensUsed: response.tokensUsed,
                    modelUsed: response.modelUsed,
                },
            },
            timestamp: new Date().toISOString(),
        });

        await this.updateConversationSummary();
    }

    /**
     * Detect user intent from message
     */
    private async detectIntent(message: string): Promise<string> {
        const intentPrompt = `Analyze this user message and determine the primary intent in 1-2 words.

User message: "${message}"

Return only the intent (e.g., "question", "request", "complaint", "feedback", "greeting", "farewell").`;

        try {
            const modelConfigService = await this.getModelConfigService();
            const config = await modelConfigService.getConfigForAction(
                'intent_detection' as AgentActionKey,
                this.state.userId
            );

            const stream = await this.env.AI.run(config.model, {
                messages: [{ role: 'user', content: intentPrompt }],
                temperature: 0.1,
            });

            let result = '';
            for await (const chunk of stream) {
                if (chunk.response) {
                    result += chunk.response;
                }
            }

            return result.trim().toLowerCase();
        } catch (error) {
            this.logger().error('Intent detection failed', { error });
            return 'unknown';
        }
    }

    /**
     * Analyze sentiment of user message
     */
    private async analyzeSentiment(message: string): Promise<string> {
        const sentimentPrompt = `Analyze the sentiment of this message and respond with one word: "positive", "negative", or "neutral".

Message: "${message}"

Sentiment:`;

        try {
            const modelConfigService = await this.getModelConfigService();
            const config = await modelConfigService.getConfigForAction(
                'sentiment_analysis' as AgentActionKey,
                this.state.userId
            );

            const stream = await this.env.AI.run(config.model, {
                messages: [{ role: 'user', content: sentimentPrompt }],
                temperature: 0.1,
            });

            let result = '';
            for await (const chunk of stream) {
                if (chunk.response) {
                    result += chunk.response;
                }
            }

            return result.trim().toLowerCase();
        } catch (error) {
            this.logger().error('Sentiment analysis failed', { error });
            return 'neutral';
        }
    }

    /**
     * Detect language of user message
     */
    private async detectLanguage(message: string): Promise<string> {
        const languagePrompt = `Detect the language of this message and respond with the ISO 639-1 code (e.g., "en", "es", "fr").

Message: "${message}"

Language code:`;

        try {
            const modelConfigService = await this.getModelConfigService();
            const config = await modelConfigService.getConfigForAction(
                'language_detection' as AgentActionKey,
                this.state.userId
            );

            const stream = await this.env.AI.run(config.model, {
                messages: [{ role: 'user', content: languagePrompt }],
                temperature: 0.1,
            });

            let result = '';
            for await (const chunk of stream) {
                if (chunk.response) {
                    result += chunk.response;
                }
            }

            return result.trim().toLowerCase();
        } catch (error) {
            this.logger().error('Language detection failed', { error });
            return 'en';
        }
    }

    /**
     * Generate AI response to user message
     */
    private async generateResponse(
        userMessage: string,
        context: {
            intent: string;
            sentiment: string;
            language: string;
        }
    ): Promise<{
        content: string;
        tokensUsed?: number;
        modelUsed?: string;
        costCents?: number;
    }> {
        const conversationContext = this.state.messageHistory
            .slice(-10)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n');

        const systemPrompt = `You are a helpful, friendly, and professional AI assistant. You provide clear, accurate, and contextual responses.

Current conversation context:
${conversationContext}

User intent: ${context.intent}
User sentiment: ${context.sentiment}
User language: ${context.language}

Respond in the same language as the user. Be empathetic if sentiment is negative, enthusiastic if positive.`;

        try {
            const modelConfigService = await this.getModelConfigService();
            const config = await modelConfigService.getConfigForAction(
                'conversation_response' as AgentActionKey,
                this.state.userId
            );

            const stream = await this.env.AI.run(config.model, {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 2048,
            });

            let responseContent = '';
            for await (const chunk of stream) {
                if (chunk.response) {
                    responseContent += chunk.response;
                }
            }

            const estimatedTokens = Math.ceil((systemPrompt.length + userMessage.length + responseContent.length) / 4);

            return {
                content: responseContent.trim(),
                tokensUsed: estimatedTokens,
                modelUsed: config.model,
                costCents: Math.ceil(estimatedTokens * 0.001),
            };
        } catch (error) {
            this.logger().error('Response generation failed', { error });
            return {
                content: 'I apologize, but I encountered an error while processing your message. Please try again.',
                tokensUsed: 0,
                modelUsed: 'error',
                costCents: 0,
            };
        }
    }

    /**
     * Update conversation summary for quick context retrieval
     */
    private async updateConversationSummary(): Promise<void> {
        if (this.state.messageHistory.length < 5) {
            return;
        }

        const recentMessages = this.state.messageHistory
            .slice(-20)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n');

        const summaryPrompt = `Summarize this conversation in 2-3 sentences, capturing the main topics and user needs:

${recentMessages}

Summary:`;

        try {
            const modelConfigService = await this.getModelConfigService();
            const config = await modelConfigService.getConfigForAction(
                'summarization' as AgentActionKey,
                this.state.userId
            );

            const stream = await this.env.AI.run(config.model, {
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.3,
            });

            let summary = '';
            for await (const chunk of stream) {
                if (chunk.response) {
                    summary += chunk.response;
                }
            }

            this.state.contextSummary = summary.trim();

            const db = getDrizzleDb(this.env.DB);
            await db
                .update(conversations)
                .set({
                    contextSummary: this.state.contextSummary,
                    updatedAt: new Date(),
                })
                .where(eq(conversations.id, this.state.conversationId));
        } catch (error) {
            this.logger().error('Summary generation failed', { error });
        }
    }

    /**
     * Track usage for billing and quotas
     */
    private async trackUsage(tokensUsed: number, costCents: number): Promise<void> {
        try {
            const db = getDrizzleDb(this.env.DB);
            const usageRecord: NewUsageTracking = {
                id: generateId('usage'),
                businessId: this.state.businessId,
                userId: this.state.userId,
                resourceType: 'message',
                resourceId: this.state.conversationId,
                tokensUsed,
                costCents,
                metadata: {
                    agentType: 'conversation',
                },
            };

            await db.insert(usageTracking).values(usageRecord);
        } catch (error) {
            this.logger().error('Usage tracking failed', { error });
        }
    }

    /**
     * Get conversation history
     */
    async getHistory(limit: number = 50): Promise<ConversationState['messageHistory']> {
        if (this.state.messageHistory.length > 0) {
            return this.state.messageHistory.slice(-limit);
        }

        try {
            const db = getDrizzleDb(this.env.DB);
            const messageRecords = await db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, this.state.conversationId))
                .orderBy(desc(messages.createdAt))
                .limit(limit);

            const history = messageRecords.reverse().map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.createdAt?.getTime() || Date.now(),
            }));

            this.state.messageHistory = history;
            return history;
        } catch (error) {
            this.logger().error('Failed to load history', { error });
            return [];
        }
    }

    /**
     * Archive conversation
     */
    async archive(): Promise<void> {
        try {
            const db = getDrizzleDb(this.env.DB);
            await db
                .update(conversations)
                .set({
                    isArchived: true,
                    archivedAt: new Date(),
                })
                .where(eq(conversations.id, this.state.conversationId));

            this.logger().info('Conversation archived', {
                conversationId: this.state.conversationId,
            });
        } catch (error) {
            this.logger().error('Failed to archive conversation', { error });
            throw error;
        }
    }

    /**
     * WebSocket connection handling
     */
    async webSocketMessage(connection: Connection, message: string): Promise<void> {
        this.connections.add(connection);

        try {
            const data = JSON.parse(message);

            if (data.type === 'user_message') {
                await this.processMessage(data.payload.content);
            } else if (data.type === 'get_history') {
                const history = await this.getHistory(data.payload?.limit || 50);
                connection.send(JSON.stringify({
                    type: 'history',
                    payload: { messages: history },
                }));
            }
        } catch (error) {
            this.logger().error('WebSocket message error', { error });
            connection.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Failed to process message' },
            }));
        }
    }

    async webSocketClose(connection: Connection): Promise<void> {
        this.connections.delete(connection);
        this.logger().info('WebSocket connection closed', {
            activeConnections: this.connections.size,
        });
    }

    async webSocketError(connection: Connection, error: Error): Promise<void> {
        this.logger().error('WebSocket error', { error });
        this.connections.delete(connection);
    }

    /**
     * Broadcast message to all connected clients
     */
    private broadcast(message: ConversationMessage): void {
        const messageStr = JSON.stringify(message);
        for (const connection of this.connections) {
            try {
                connection.send(messageStr);
            } catch (error) {
                this.logger().error('Broadcast failed', { error });
                this.connections.delete(connection);
            }
        }
    }
}
