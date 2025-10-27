# Business AI Platform Architecture

## Overview
This document outlines the multi-agent architecture for the comprehensive business AI platform built on Cloudflare's infrastructure.

## Core Principles

1. **Agent-Based Architecture**: Each capability is encapsulated in a specialized Durable Object agent
2. **Stateful Conversations**: All agents maintain conversation context via Durable Objects
3. **Modular & Extensible**: Easy to add new agents and capabilities
4. **Multi-Tenancy**: Isolated data per business with shared infrastructure
5. **Real-Time Communication**: WebSocket-based for instant updates

## Agent Types

### 1. ConversationAgent
**Purpose**: General-purpose conversational AI with context memory

**Capabilities**:
- Multi-turn conversations with full context
- Sentiment analysis
- Multi-language support
- Intent detection and routing
- Context-aware responses
- Conversation history management

**Durable Object**: `ConversationAgent`
**Binding**: `CONVERSATION_AGENT`

### 2. DocumentProcessorAgent
**Purpose**: Intelligent document analysis and processing

**Capabilities**:
- PDF/Word/Excel parsing
- OCR for images and scanned documents
- Data extraction (invoices, receipts, contracts)
- Document summarization
- Form filling automation
- Legal document analysis

**Durable Object**: `DocumentProcessorAgent`
**Binding**: `DOCUMENT_PROCESSOR`

### 3. MarketingAgent
**Purpose**: Marketing content generation and optimization

**Capabilities**:
- Content generation (blogs, social posts, ads)
- SEO optimization
- Email campaigns
- Ad copy variants
- Competitor analysis
- Brand voice consistency

**Durable Object**: `MarketingAgent`
**Binding**: `MARKETING_AGENT`

### 4. CustomerServiceAgent
**Purpose**: Automated customer support

**Capabilities**:
- Multi-channel chatbot (web, SMS, WhatsApp)
- Ticket classification and routing
- FAQ generation and answers
- Sentiment tracking
- Escalation management
- Knowledge base integration (RAG)

**Durable Object**: `CustomerServiceAgent`
**Binding**: `CUSTOMER_SERVICE_AGENT`

### 5. DataAnalysisAgent
**Purpose**: Business intelligence and analytics

**Capabilities**:
- CSV/Excel analysis
- Predictive analytics
- Financial forecasting
- Trend analysis
- SQL query generation
- Visualization recommendations

**Durable Object**: `DataAnalysisAgent`
**Binding**: `DATA_ANALYSIS_AGENT`

### 6. WorkflowAgent
**Purpose**: Multi-step automation orchestration

**Capabilities**:
- Visual workflow execution
- Trigger/action coordination
- Conditional logic
- Error handling and retries
- Scheduled tasks
- Integration coordination

**Durable Object**: `WorkflowAgent`
**Binding**: `WORKFLOW_AGENT`

### 7. CodeGeneratorAgent (Existing - Enhanced)
**Purpose**: Full-stack application generation

**Capabilities** (existing + new):
- Web applications (React, Vue, Svelte)
- Mobile apps (React Native, Flutter)
- Backend APIs (Node, Python, Go)
- Database schemas
- Chrome extensions
- Automation scripts

**Durable Object**: `CodeGeneratorAgent` (existing)
**Binding**: `CodeGenObject` (existing)

## Data Architecture

### Database Schema Extensions

#### Conversations Table
```sql
conversations
- id (PK)
- user_id (FK → users)
- business_id (FK → businesses)
- agent_type (enum: conversation, document, marketing, etc.)
- agent_instance_id (Durable Object ID)
- title
- context_summary
- metadata (JSON)
- created_at
- updated_at
- archived_at
```

#### Messages Table
```sql
messages
- id (PK)
- conversation_id (FK → conversations)
- role (enum: user, assistant, system)
- content (text)
- metadata (JSON: attachments, tokens, model used)
- created_at
```

#### Businesses Table (for B2B multi-tenancy)
```sql
businesses
- id (PK)
- owner_user_id (FK → users)
- name
- industry (enum: hvac, legal, medical, restaurant, retail, etc.)
- plan_tier (enum: free, starter, professional, enterprise)
- settings (JSON: branding, integrations, features)
- billing_status
- created_at
- updated_at
```

#### Business Members Table
```sql
business_members
- id (PK)
- business_id (FK → businesses)
- user_id (FK → users)
- role (enum: owner, admin, member)
- permissions (JSON)
- invited_at
- joined_at
```

#### Documents Table
```sql
documents
- id (PK)
- user_id (FK → users)
- business_id (FK → businesses)
- name
- file_type (pdf, docx, xlsx, etc.)
- file_size
- r2_key (R2 storage path)
- processing_status (enum: pending, processing, completed, failed)
- extracted_data (JSON)
- vectorized (boolean)
- created_at
- processed_at
```

#### Workflows Table
```sql
workflows
- id (PK)
- business_id (FK → businesses)
- created_by_user_id (FK → users)
- name
- description
- trigger_type (enum: webhook, schedule, manual)
- trigger_config (JSON)
- steps (JSON: array of actions)
- is_active
- last_run_at
- created_at
- updated_at
```

#### Workflow Runs Table
```sql
workflow_runs
- id (PK)
- workflow_id (FK → workflows)
- status (enum: running, completed, failed)
- trigger_data (JSON)
- execution_log (JSON)
- started_at
- completed_at
- error_message
```

#### Integrations Table
```sql
integrations
- id (PK)
- business_id (FK → businesses)
- provider (enum: quickbooks, stripe, google_calendar, etc.)
- credentials_secret_id (FK → userSecrets)
- config (JSON)
- is_active
- last_sync_at
- created_at
```

#### Usage Tracking Table
```sql
usage_tracking
- id (PK)
- business_id (FK → businesses)
- user_id (FK → users)
- resource_type (enum: messages, documents, workflows, api_calls)
- resource_id
- tokens_used
- cost (for billing)
- metadata (JSON)
- created_at
```

#### Subscription Plans Table
```sql
subscription_plans
- id (PK)
- business_id (FK → businesses)
- plan_tier (enum: free, starter, professional, enterprise)
- billing_cycle (enum: monthly, annual)
- price_cents
- quota_messages
- quota_documents
- quota_workflows
- features (JSON: enabled feature flags)
- starts_at
- ends_at
- canceled_at
```

#### Knowledge Base Table (for RAG)
```sql
knowledge_base_entries
- id (PK)
- business_id (FK → businesses)
- source_document_id (FK → documents)
- content_chunk (text)
- embedding_id (Vectorize reference)
- metadata (JSON: page, section, etc.)
- created_at
```

## Storage Architecture

### R2 Buckets
1. **DOCUMENTS_BUCKET**: User uploaded documents (PDFs, images, etc.)
2. **GENERATED_CONTENT_BUCKET**: AI-generated content (reports, images)
3. **TEMPLATES_BUCKET**: (existing) Application templates

### KV Namespaces
1. **VibecoderStore** (existing): Code generation cache
2. **SessionStore**: Active conversation sessions
3. **RateLimitStore**: Usage quotas and rate limiting
4. **IntegrationCache**: Third-party API response cache

### Vectorize Index
- **business_knowledge**: RAG embeddings for business documents and knowledge bases

## API Routes

### Conversation APIs
```
POST   /api/conversations                    - Create new conversation
GET    /api/conversations                    - List conversations
GET    /api/conversations/:id               - Get conversation details
DELETE /api/conversations/:id               - Delete conversation
POST   /api/conversations/:id/messages      - Send message
GET    /api/conversations/:id/messages      - Get message history
WS     /api/conversations/:id/ws           - WebSocket for real-time chat
```

### Document APIs
```
POST   /api/documents/upload                - Upload document
GET    /api/documents                       - List documents
GET    /api/documents/:id                   - Get document details
DELETE /api/documents/:id                   - Delete document
POST   /api/documents/:id/process          - Process document
GET    /api/documents/:id/download         - Download original
POST   /api/documents/:id/extract          - Extract specific data
```

### Business/Organization APIs
```
POST   /api/businesses                      - Create business
GET    /api/businesses/:id                  - Get business details
PATCH  /api/businesses/:id                  - Update business
GET    /api/businesses/:id/members         - List members
POST   /api/businesses/:id/members         - Invite member
DELETE /api/businesses/:id/members/:userId - Remove member
GET    /api/businesses/:id/usage           - Usage statistics
```

### Workflow APIs
```
POST   /api/workflows                       - Create workflow
GET    /api/workflows                       - List workflows
GET    /api/workflows/:id                   - Get workflow details
PATCH  /api/workflows/:id                   - Update workflow
DELETE /api/workflows/:id                   - Delete workflow
POST   /api/workflows/:id/run              - Trigger workflow
GET    /api/workflows/:id/runs             - Get run history
GET    /api/workflows/runs/:runId          - Get run details
```

### Integration APIs
```
GET    /api/integrations                    - List available integrations
POST   /api/integrations/connect           - Connect integration
GET    /api/integrations/:provider         - Get integration status
DELETE /api/integrations/:provider         - Disconnect integration
POST   /api/integrations/:provider/sync    - Manual sync
```

### Agent APIs
```
POST   /api/agents/conversation            - Start conversation agent
POST   /api/agents/document-processor      - Start document processor
POST   /api/agents/marketing               - Start marketing agent
POST   /api/agents/customer-service        - Start customer service agent
POST   /api/agents/data-analysis           - Start data analysis agent
GET    /api/agents/available               - List available agents
```

### Subscription APIs
```
GET    /api/subscription                    - Current subscription
POST   /api/subscription/upgrade           - Upgrade plan
POST   /api/subscription/cancel            - Cancel subscription
GET    /api/subscription/usage             - Current usage vs quotas
GET    /api/subscription/invoices          - Billing history
```

## Agent Communication Protocol

### WebSocket Message Format
```typescript
interface AgentMessage {
  type: 'user_message' | 'agent_response' | 'status_update' | 'error';
  messageId: string;
  conversationId: string;
  agentType: string;
  payload: {
    content?: string;
    metadata?: Record<string, unknown>;
    thinking?: string; // For showing AI reasoning
    citations?: Array<{
      source: string;
      content: string;
      confidence: number;
    }>;
  };
  timestamp: string;
}
```

### Agent Orchestration
```
User Request
     ↓
API Gateway (Workers)
     ↓
AgentOrchestrator
     ↓
[Intent Detection] → Route to appropriate agent
     ↓
┌────────────────────────────────────────┐
│  Specialized Agent (Durable Object)    │
│  1. Load conversation context          │
│  2. Retrieve relevant knowledge (RAG)  │
│  3. Process with AI model              │
│  4. Stream response via WebSocket      │
│  5. Update conversation state          │
│  6. Track usage                        │
└────────────────────────────────────────┘
     ↓
Response to user
```

## Integration Framework

### OAuth Flow for Third-Party Services
1. User initiates connection from dashboard
2. OAuth state stored in D1 with PKCE
3. Redirect to provider authorization
4. Callback receives code
5. Exchange for tokens
6. Encrypt and store in `userSecrets`
7. Store integration config in `integrations`

### Webhook Management
```
External Service → Webhook Endpoint → Verify signature →
Route to business → Trigger workflow or notify agent
```

### Integration Adapters
Each integration has an adapter class:
```typescript
interface IntegrationAdapter {
  authenticate(credentials: EncryptedSecret): Promise<void>;
  syncData(config: IntegrationConfig): Promise<SyncResult>;
  performAction(action: string, params: unknown): Promise<unknown>;
  handleWebhook(payload: unknown): Promise<void>;
}
```

## RAG (Retrieval Augmented Generation)

### Document Processing Pipeline
```
Upload Document
     ↓
Store in R2
     ↓
Extract text (PDF parser, OCR)
     ↓
Chunk into semantic segments (512-1024 tokens)
     ↓
Generate embeddings (Workers AI @cf/baai/bge-base-en-v1.5)
     ↓
Store in Vectorize
     ↓
Index in knowledge_base_entries table
```

### Query Pipeline
```
User Question
     ↓
Generate embedding
     ↓
Vector similarity search (Vectorize)
     ↓
Retrieve top K relevant chunks
     ↓
Construct context-enhanced prompt
     ↓
Send to AI model
     ↓
Response with citations
```

## Security & Multi-Tenancy

### Data Isolation
- All queries filtered by `business_id` or `user_id`
- Row-level security via Drizzle ORM filters
- Durable Object IDs include business namespace

### Rate Limiting
- Per-business quotas based on plan tier
- Durable Object for distributed rate limiting
- Graceful degradation when limits reached

### Encryption
- Secrets encrypted at rest (AES-256)
- TLS for all external communication
- Signed webhooks for integrations

## Monitoring & Analytics

### Metrics to Track
- Messages per agent type
- Token usage and costs
- Response latency (p50, p95, p99)
- Error rates by agent
- Integration sync status
- Workflow success/failure rates
- User engagement (DAU, MAU)
- Revenue metrics (MRR, churn)

### Logging
- Structured logs with trace IDs
- Agent decision logs (for debugging)
- Usage logs for billing
- Audit logs for compliance

## Deployment Strategy

### Gradual Rollout
1. Deploy foundation (database, base agents)
2. Enable ConversationAgent for beta users
3. Add DocumentProcessor
4. Add remaining agents incrementally
5. Enable integrations one by one
6. Launch publicly

### Feature Flags
Use `systemSettings` table for feature flags:
- `feature.conversation_agent.enabled`
- `feature.document_processor.enabled`
- `feature.workflows.enabled`
- `feature.integrations.quickbooks.enabled`

## Future Enhancements

### Phase 2
- Voice AI (speech-to-text, text-to-speech)
- Phone call automation (Twilio integration)
- Advanced analytics dashboard
- Mobile apps (iOS, Android)

### Phase 3
- AI model fine-tuning on business data
- Custom agent builder (no-code)
- Multi-agent collaboration
- API marketplace for third-party agents

### Phase 4
- On-premise deployment option
- Advanced compliance (HIPAA, SOC2)
- White-label reseller program
- Enterprise SSO (SAML, OIDC)

## Technology Stack

**Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI
**Backend**: Cloudflare Workers, Hono.js, TypeScript
**Stateful Logic**: Durable Objects
**Database**: D1 (SQLite)
**Storage**: R2 (object storage)
**Vector Search**: Vectorize
**AI Models**: Anthropic Claude, OpenAI, Google AI (via Workers AI)
**Real-time**: WebSockets via Durable Objects
**Caching**: KV Store
**ORM**: Drizzle ORM

## Performance Targets

- **Message Response Time**: < 2s (excluding model inference)
- **Document Processing**: < 30s for typical PDFs
- **Workflow Execution**: < 5s for simple workflows
- **API Latency**: < 100ms for non-AI endpoints
- **WebSocket Latency**: < 50ms for status updates
- **Uptime**: 99.9% SLA for Enterprise tier
