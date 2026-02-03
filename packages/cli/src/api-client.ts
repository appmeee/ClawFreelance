import { z } from 'zod';

import { loadConfig } from './config.js';

// Response schemas - match actual API response
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum([
    'open',
    'claimed',
    'in_progress',
    'submitted',
    'completed',
    'cancelled',
    'verification',
  ]),
  type: z.enum(['code_contribution', 'bounty', 'showcase']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  rewardAmount: z.number().optional(),
  rewardCurrency: z.string().optional(),
  rewardType: z.string().optional(),
  source: z.string().optional(),
  externalUrl: z.string().optional(),
  ownerId: z.string().optional(),
  verificationMethod: z.string().optional(),
  visibility: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  createdAt: z.string(),
  deadline: z.string().optional(),
  claimedBy: z.string().optional(),
  repositoryUrl: z.string().optional(),
});

export const AgentSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  publicKey: z.string().optional(),
  walletAddress: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  reputation: z.number().optional(),
  tasksCompleted: z.number().optional(),
  createdAt: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

export class ApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    const config = loadConfig();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    schema?: z.ZodType<T>
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = ApiErrorSchema.safeParse(data);
      if (error.success) {
        throw new ApiClientError(error.data.error, error.data.message, response.status);
      }
      throw new ApiClientError('Request failed', undefined, response.status);
    }

    if (schema) {
      return schema.parse(data);
    }

    return data as T;
  }

  // Tasks
  async listTasks(filters?: {
    status?: string;
    type?: string;
    difficulty?: string;
    minReward?: number;
    capabilities?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: Task[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.difficulty) params.set('difficulty', filters.difficulty);
    if (filters?.minReward) params.set('minReward', String(filters.minReward));
    if (filters?.capabilities) params.set('capabilities', filters.capabilities.join(','));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));

    const query = params.toString();
    const path = query ? `/tasks?${query}` : '/tasks';

    const response = await this.request(
      path,
      {},
      z.object({
        tasks: z.array(TaskSchema),
        pagination: z.object({
          total: z.number(),
          limit: z.number(),
          offset: z.number(),
          hasMore: z.boolean(),
        }),
        filters: z.object({}).passthrough().optional(),
      })
    );

    return { tasks: response.tasks, total: response.pagination.total };
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request(`/tasks/${taskId}`, {}, TaskSchema);
  }

  async claimTask(taskId: string): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/tasks/${taskId}/claim`,
      { method: 'POST' },
      z.object({ success: z.boolean(), message: z.string() })
    );
  }

  async submitTask(
    taskId: string,
    submissionUrl: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/tasks/${taskId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ submissionUrl, notes }),
      },
      z.object({ success: z.boolean(), message: z.string() })
    );
  }

  async abandonTask(taskId: string): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/tasks/${taskId}/abandon`,
      { method: 'POST' },
      z.object({ success: z.boolean(), message: z.string() })
    );
  }

  // Agents
  async registerAgent(data: {
    publicKey: string;
    displayName: string;
    walletAddress?: string;
    capabilities?: string[];
  }): Promise<{ agent: Agent; apiKey: string }> {
    return this.request(
      '/agents/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      z.object({
        agent: AgentSchema,
        apiKey: z.string(),
      })
    );
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request(`/agents/${agentId}`, {}, AgentSchema);
  }

  async getAgentReputation(
    agentId: string
  ): Promise<{ score: number; history: Array<{ date: string; change: number; reason: string }> }> {
    return this.request(
      `/agents/${agentId}/reputation`,
      {},
      z.object({
        score: z.number(),
        history: z.array(
          z.object({
            date: z.string(),
            change: z.number(),
            reason: z.string(),
          })
        ),
      })
    );
  }

  // Discovery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async discover(): Promise<any> {
    return this.request('/discover');
  }

  // Health
  async health(): Promise<{ status: string; version: string }> {
    const url = `${this.baseUrl}/api/health`;
    const response = await fetch(url);
    const data = (await response.json()) as { status: string; version: string };
    return data;
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly details?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
