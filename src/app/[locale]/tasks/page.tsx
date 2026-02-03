'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchIcon, FilterIcon, TaskIcon, RocketIcon, CrownIcon } from '@/components/icons';
import { BoostBadge, QueuePositionBadge } from '@/components/boost';

type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

type BoostInfo = {
  tier: BoostTier;
  tierName: string;
  badge: string;
  color: string;
  highlighted: boolean;
  isActive: boolean;
  expiresAt: string | null;
  remainingHours: number;
};

type QueuePosition = {
  position: number;
  total: number;
  percentile: number;
};

type Task = {
  id: string;
  title: string;
  description: string;
  type: 'code_contribution' | 'bounty' | 'showcase';
  status: string;
  rewardType: 'crypto' | 'points' | 'external';
  rewardAmount: number;
  rewardCurrency?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: string[];
  source: string;
  createdAt: string;
  claimedBy?: string;
  boost?: BoostInfo;
  queuePosition?: QueuePosition;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--status-success)' },
  claimed: { label: 'Claimed', color: 'var(--accent-amber)' },
  in_progress: { label: 'In Progress', color: 'var(--accent-cyan)' },
  verification: { label: 'Verifying', color: 'var(--status-pending)' },
  completed: { label: 'Completed', color: 'var(--text-muted)' },
};

const difficultyConfig: Record<string, { label: string; dots: number }> = {
  easy: { label: 'Easy', dots: 1 },
  medium: { label: 'Medium', dots: 2 },
  hard: { label: 'Hard', dots: 3 },
};

// Task Card Component
function TaskCard({ task, isPremium = false }: { task: Task; isPremium?: boolean }) {
  const isBoostActive = task.boost?.isActive && task.boost.tier !== 'standard';
  const highlighted = isBoostActive && task.boost?.highlighted;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`block rounded-xl border p-6 card-hover transition-all ${
        highlighted ? 'ring-2 ring-opacity-50' : ''
      }`}
      style={{
        borderColor: highlighted
          ? task.boost?.color || 'var(--border-subtle)'
          : 'var(--border-subtle)',
        background: highlighted
          ? `linear-gradient(135deg, var(--bg-card) 0%, ${task.boost?.color}08 100%)`
          : 'var(--bg-card)',
        ...(highlighted && { boxShadow: `0 0 20px ${task.boost?.color}20` }),
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="font-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>
              {task.id}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${statusConfig[task.status]?.color || 'var(--text-muted)'}15`,
                color: statusConfig[task.status]?.color || 'var(--text-muted)',
              }}
            >
              {statusConfig[task.status]?.label || task.status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              {task.type.replace('_', ' ')}
            </span>
            {/* Boost Badge */}
            {isBoostActive && task.boost && (
              <BoostBadge
                tier={task.boost.tier}
                isActive={task.boost.isActive}
                remainingHours={task.boost.remainingHours}
                showTime={false}
                size="sm"
              />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
          <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
            {task.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {task.requirements.slice(0, 4).map(req => (
              <span key={req} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {req}
              </span>
            ))}
            {task.requirements.length > 4 && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                +{task.requirements.length - 4} more
              </span>
            )}
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end gap-4">
          <div className="text-right">
            <div className="font-mono text-xl font-bold" style={{ color: task.rewardType === 'crypto' ? 'var(--accent-amber)' : 'var(--status-success)' }}>
              {task.rewardType === 'crypto' ? `$${task.rewardAmount}` : `${task.rewardAmount} pts`}
            </div>
            {task.rewardCurrency && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.rewardCurrency}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map(dot => (
                  <div
                    key={dot}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: dot <= difficultyConfig[task.difficulty]?.dots ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {difficultyConfig[task.difficulty]?.label}
              </span>
            </div>
            {/* Queue Position */}
            {task.queuePosition && (
              <QueuePositionBadge
                position={task.queuePosition.position}
                total={task.queuePosition.total}
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topPlacementTasks, setTopPlacementTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    difficulty: '',
    search: '',
    sortBy: 'priority',
    boostedOnly: false,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.type) params.set('type', filters.type);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.boostedOnly) params.set('boostedOnly', 'true');

        const response = await fetch(`/api/tasks?${params.toString()}`);
        const data = await response.json();
        setTasks(data.tasks || []);
        setTopPlacementTasks(data.topPlacement || []);
      } catch {
        console.error('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filters.status, filters.type, filters.difficulty, filters.sortBy, filters.boostedOnly]);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    task.description.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <TaskIcon size={36} className="inline mr-3" style={{ color: 'var(--accent-cyan)' }} />
                  Tasks
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Browse and claim available work
                </p>
              </div>
              <Link href="/post-task" className="btn btn-primary">
                Post Task
              </Link>
            </div>

            {/* Filters */}
            <div className="rounded-xl border p-4 mb-8" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)]"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="claimed">Claimed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="verification">Verification</option>
                  </select>

                  <select
                    value={filters.type}
                    onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">All Types</option>
                    <option value="bounty">Bounty</option>
                    <option value="code_contribution">Contribution</option>
                    <option value="showcase">Showcase</option>
                  </select>

                  <select
                    value={filters.difficulty}
                    onChange={e => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">All Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    value={filters.sortBy}
                    onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="priority">Priority</option>
                    <option value="created_at">Newest</option>
                    <option value="reward_amount">Reward</option>
                    <option value="deadline">Deadline</option>
                  </select>

                  {/* Boosted only toggle */}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, boostedOnly: !prev.boostedOnly }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      filters.boostedOnly ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]/10' : ''
                    }`}
                    style={{ borderColor: filters.boostedOnly ? 'var(--accent-amber)' : 'var(--border-medium)' }}
                  >
                    <RocketIcon size={16} style={{ color: filters.boostedOnly ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: filters.boostedOnly ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                      Boosted
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tasks Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20">
                <FilterIcon size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No tasks found matching your filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Premium Tasks - Top Placement */}
                {topPlacementTasks.length > 0 && !filters.boostedOnly && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <CrownIcon size={20} style={{ color: 'var(--status-success)' }} />
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--status-success)' }}>
                        Premium Tasks
                      </h2>
                    </div>
                    <div className="grid gap-4">
                      {topPlacementTasks.map(task => (
                        <TaskCard key={task.id} task={task} isPremium />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Tasks */}
                <div className="grid gap-4">
                  {filteredTasks
                    .filter(task => !topPlacementTasks.some(t => t.id === task.id) || filters.boostedOnly)
                    .map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
