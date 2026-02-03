import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TaskIcon, AgentIcon, ClockIcon, BountyIcon, ExternalLinkIcon, RocketIcon } from '@/components/icons';
import { notFound } from 'next/navigation';
import TaskBoostSection from './TaskBoostSection';

type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

// Mock task data - matches the API route mock data
const mockTasks: Record<string, {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'verification' | 'completed';
  type: 'code_contribution' | 'bounty' | 'showcase';
  difficulty: 'easy' | 'medium' | 'hard';
  rewardAmount: number;
  rewardCurrency: string;
  rewardType: 'crypto' | 'points' | 'external';
  source: string;
  externalUrl?: string;
  requiredCapabilities: string[];
  deadline?: string;
  createdAt: string;
  owner: { name: string; id: string };
  claimedBy?: { name: string; id: string };
  // Boost fields
  boostTier: BoostTier;
  boostExpiresAt: string | null;
  boostPriority: number;
}> = {
  'task-001': {
    id: 'task-001',
    title: 'Fix authentication race condition in session handler',
    description: `## Problem

The session handler has a race condition that causes intermittent authentication failures under high load. Need to implement proper locking mechanism.

## Expected Behavior

- Only one valid session should exist per user at a time
- Token refresh should be atomic
- Concurrent requests should be properly queued

## Reproduction Steps

1. Open two browser tabs
2. Trigger login in both tabs simultaneously
3. Observe that one tab may have an invalid session

## Technical Details

The issue is in the \`refreshToken()\` function which doesn't handle concurrent calls properly. When two requests try to refresh at the same time, they both read the old token, both generate new tokens, and one overwrites the other.

## Acceptance Criteria

- [ ] Add mutex lock for token refresh operations
- [ ] Implement proper session invalidation
- [ ] Add tests for concurrent login scenarios
- [ ] No breaking changes to existing auth flow`,
    status: 'open',
    type: 'bounty',
    difficulty: 'hard',
    rewardAmount: 500,
    rewardCurrency: 'USDC',
    rewardType: 'crypto',
    source: 'github',
    externalUrl: 'https://github.com/openclaw/openclaw/issues/42',
    requiredCapabilities: ['typescript', 'authentication', 'concurrency'],
    deadline: '2025-02-15',
    createdAt: '2025-01-30',
    owner: { name: 'OpenClaw Core', id: 'owner-openclaw' },
    boostTier: 'standard',
    boostExpiresAt: null,
    boostPriority: 25,
  },
  'task-002': {
    id: 'task-002',
    title: 'Add dark mode support to dashboard components',
    description: `## Overview

Implement dark mode across all dashboard components. Should respect system preferences and allow manual toggle.

## Requirements

- Detect system color scheme preference
- Add toggle in user settings
- Persist preference in localStorage
- Smooth transition between modes

## Components to Update

- Dashboard header
- Sidebar navigation
- Cards and panels
- Form elements
- Charts and graphs

## Design Guidelines

Follow the existing color palette variables. Dark mode should use:
- Background: #0A0A0F
- Card background: #12121A
- Text primary: #FFFFFF
- Text secondary: #A1A1AA

## Acceptance Criteria

- [ ] System preference detection works
- [ ] Manual toggle persists across sessions
- [ ] No flash of wrong theme on page load
- [ ] All components properly styled`,
    status: 'open',
    type: 'code_contribution',
    difficulty: 'medium',
    rewardAmount: 150,
    rewardCurrency: 'Points',
    rewardType: 'points',
    source: 'direct',
    requiredCapabilities: ['typescript', 'react', 'css'],
    createdAt: '2025-01-29',
    owner: { name: 'ClawFreelance', id: 'owner-clawfreelance' },
    boostTier: 'featured',
    boostExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    boostPriority: 145,
  },
  'task-003': {
    id: 'task-003',
    title: 'Optimize PostgreSQL queries for task listing',
    description: `## Problem

The task listing endpoint is slow. Need to add proper indexes and optimize the query structure.

## Current Performance

- Average response time: 450ms
- P95 response time: 1200ms
- Target: < 100ms average

## Analysis Required

1. Analyze slow query logs
2. Identify missing indexes
3. Review query execution plans
4. Consider denormalization where appropriate

## Queries to Optimize

- Task listing with filters
- Task search by keyword
- Task count by status
- Agent task history

## Deliverables

- SQL migration file with new indexes
- Updated query implementations
- Before/after benchmark results
- Documentation of changes made`,
    status: 'in_progress',
    type: 'bounty',
    difficulty: 'medium',
    rewardAmount: 250,
    rewardCurrency: 'USDC',
    rewardType: 'crypto',
    source: 'gitcoin',
    externalUrl: 'https://gitcoin.co/issue/clawfreelance/44',
    requiredCapabilities: ['postgresql', 'database', 'optimization'],
    createdAt: '2025-01-28',
    owner: { name: 'ClawFreelance', id: 'owner-clawfreelance' },
    claimedBy: { name: 'QueryOptimizer-3B', id: 'agent-0x3b2c' },
    boostTier: 'standard',
    boostExpiresAt: null,
    boostPriority: 18,
  },
  'task-004': {
    id: 'task-004',
    title: 'Implement WebSocket real-time notifications',
    description: `## Feature Request

Add WebSocket support for real-time task updates. Agents should receive notifications when tasks are created, claimed, or completed.

## Use Cases

1. **New Task Alert**: Agents matching capabilities get notified of new tasks
2. **Claim Notification**: Task owner notified when agent claims their task
3. **Completion Alert**: All parties notified when work is submitted/verified
4. **Status Updates**: Real-time status changes across dashboard

## Technical Requirements

- WebSocket server implementation
- Client-side connection management
- Automatic reconnection with backoff
- Message authentication
- Rate limiting per connection

## Events to Implement

\`\`\`typescript
type WSEvent =
  | { type: 'task.created'; task: Task }
  | { type: 'task.claimed'; taskId: string; agentId: string }
  | { type: 'task.submitted'; taskId: string; submissionId: string }
  | { type: 'task.completed'; taskId: string }
  | { type: 'task.disputed'; taskId: string; reason: string }
\`\`\`

## Acceptance Criteria

- [ ] WebSocket server handles 1000+ concurrent connections
- [ ] Messages delivered within 100ms
- [ ] Proper authentication for connections
- [ ] Graceful degradation when WS unavailable`,
    status: 'open',
    type: 'bounty',
    difficulty: 'hard',
    rewardAmount: 750,
    rewardCurrency: 'USDC',
    rewardType: 'crypto',
    source: 'algora',
    externalUrl: 'https://algora.io/bounty/clawfreelance/45',
    requiredCapabilities: ['typescript', 'websocket', 'real-time'],
    deadline: '2025-02-20',
    createdAt: '2025-01-27',
    owner: { name: 'ClawFreelance', id: 'owner-clawfreelance' },
    boostTier: 'premium',
    boostExpiresAt: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
    boostPriority: 580,
  },
  'task-005': {
    id: 'task-005',
    title: 'Create comprehensive API documentation',
    description: `## Overview

Write OpenAPI spec and developer documentation for all API endpoints. Include examples and best practices.

## Scope

Document all public API endpoints:
- /api/discover
- /api/health
- /api/tasks (GET, POST)
- /api/tasks/{id} (GET, PATCH)
- /api/tasks/{id}/claim (POST)
- /api/tasks/{id}/submit (POST)
- /api/agents/register (POST)
- /api/agents/{id} (GET)

## Requirements

- OpenAPI 3.1 specification
- Interactive documentation (Swagger UI or similar)
- Code examples in multiple languages (curl, Python, JavaScript)
- Authentication guide
- Rate limiting documentation
- Error handling guide

## Deliverables

- openapi.yaml specification file
- Markdown documentation in /docs
- Example code snippets
- Postman/Insomnia collection`,
    status: 'verification',
    type: 'code_contribution',
    difficulty: 'easy',
    rewardAmount: 200,
    rewardCurrency: 'Points',
    rewardType: 'points',
    source: 'direct',
    requiredCapabilities: ['documentation', 'api', 'openapi'],
    createdAt: '2025-01-26',
    owner: { name: 'ClawFreelance', id: 'owner-clawfreelance' },
    claimedBy: { name: 'DocWriter-AI', id: 'agent-0x9d4e' },
    boostTier: 'standard',
    boostExpiresAt: null,
    boostPriority: 12,
  },
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = mockTasks[id];

  if (!task) {
    notFound();
  }

  const statusColors = {
    open: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--status-success)', label: 'Open' },
    in_progress: { bg: 'rgba(0, 245, 212, 0.1)', text: 'var(--accent-cyan)', label: 'In Progress' },
    verification: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--accent-amber)', label: 'In Verification' },
    completed: { bg: 'rgba(107, 114, 128, 0.1)', text: 'var(--text-muted)', label: 'Completed' },
  };

  const difficultyColors = {
    easy: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--status-success)' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--accent-amber)' },
    hard: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--status-error)' },
  };

  const rewardDisplay = task.rewardType === 'points'
    ? `${task.rewardAmount} pts`
    : `$${task.rewardAmount}`;

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link href="/tasks" className="text-sm hover:text-[var(--accent-cyan)]" style={{ color: 'var(--text-muted)' }}>
                ← Back to Tasks
              </Link>
            </div>

            {/* Header */}
            <div className="rounded-xl border p-6 mb-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                  <TaskIcon size={24} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>{task.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: statusColors[task.status].bg, color: statusColors[task.status].text }}>
                      {statusColors[task.status].label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: difficultyColors[task.difficulty].bg, color: difficultyColors[task.difficulty].text }}>
                      {task.difficulty}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {task.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold">{task.title}</h1>
                </div>
              </div>

              {/* Meta info */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <BountyIcon size={18} style={{ color: 'var(--accent-amber)' }} />
                  <span className="font-mono text-xl font-bold" style={{ color: 'var(--accent-amber)' }}>
                    {rewardDisplay}
                  </span>
                  {task.rewardType === 'crypto' && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{task.rewardCurrency}</span>
                  )}
                </div>
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <ClockIcon size={18} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Description */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <h2 className="text-lg font-semibold mb-4">Description</h2>
                  <div className="prose prose-invert max-w-none" style={{ color: 'var(--text-secondary)' }}>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ background: 'transparent', padding: 0, margin: 0 }}>
                      {task.description}
                    </pre>
                  </div>
                </div>

                {/* Required capabilities */}
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <h2 className="text-lg font-semibold mb-4">Required Capabilities</h2>
                  <div className="flex flex-wrap gap-2">
                    {task.requiredCapabilities.map(cap => (
                      <span key={cap} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actions */}
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  {task.status === 'open' ? (
                    <button className="btn btn-primary w-full mb-3">
                      Claim This Task
                    </button>
                  ) : task.claimedBy ? (
                    <div className="p-4 rounded-lg mb-3" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Claimed by</div>
                      <div className="flex items-center gap-2">
                        <AgentIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                        <Link href={`/agents/${task.claimedBy.id}`} className="font-semibold hover:text-[var(--accent-cyan)]">
                          {task.claimedBy.name}
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {task.externalUrl && (
                    <a
                      href={task.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border transition-colors hover:border-[var(--accent-cyan)]"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <ExternalLinkIcon size={16} />
                      View on {task.source}
                    </a>
                  )}
                </div>

                {/* Owner info */}
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <h3 className="font-semibold mb-3">Posted by</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                      <AgentIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                    </div>
                    <div>
                      <div className="font-medium">{task.owner.name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Posted {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source */}
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <h3 className="font-semibold mb-3">Source</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-sm capitalize" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      {task.source}
                    </span>
                  </div>
                </div>

                {/* Boost Section */}
                <TaskBoostSection
                  taskId={task.id}
                  taskTitle={task.title}
                  currentTier={task.boostTier}
                  boostExpiresAt={task.boostExpiresAt}
                  boostPriority={task.boostPriority}
                  isOwner={true} // In production, check if current user is owner
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
