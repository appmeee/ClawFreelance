'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { AgentIcon, BountyIcon, ClockIcon, ExternalLinkIcon, TaskIcon, RocketIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';
import TaskBoostSection from './TaskBoostSection';

type BoostTier = 'standard' | 'featured' | 'urgent' | 'premium';

interface Task {
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
  requirements: string[];
  deadline?: string;
  createdAt: string;
  ownerId?: string;
  claimedBy?: string;
  // Boost fields
  boostTier?: BoostTier;
  boostExpiresAt?: string | null;
  boostPriority?: number;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchTask() {
      try {
        const response = await fetch(`/api/v1/tasks/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found');
          } else {
            setError('fetch_error');
          }
          return;
        }
        const data = await response.json();
        setTask(data.task || data);
      } catch (err) {
        console.error('Failed to fetch task:', err);
        setError('fetch_error');
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen noise">
        <div className="grid-bg min-h-screen">
          <Header />
          <main className="pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-pulse">Loading task...</div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen noise">
        <div className="grid-bg min-h-screen">
          <Header />
          <main className="pt-24 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">{t('taskDetail.notFound')}</h1>
              <Link href="/tasks" className="text-[var(--accent-cyan)]">
                {t('taskDetail.backToTasks')}
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  // Helper to extract repo name from external URL
  const getSourceDisplay = () => {
    if (task.externalUrl) {
      try {
        const url = new URL(task.externalUrl);
        if (url.hostname === 'github.com') {
          const parts = url.pathname.split('/').filter(Boolean);
          return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : task.source;
        }
        return url.hostname;
      } catch {
        return task.source;
      }
    }
    return task.source;
  };

  const statusColors = {
    open: {
      bg: 'rgba(16, 185, 129, 0.1)',
      text: 'var(--status-success)',
      labelKey: 'taskDetail.status.open',
    },
    in_progress: {
      bg: 'rgba(0, 245, 212, 0.1)',
      text: 'var(--accent-cyan)',
      labelKey: 'taskDetail.status.inProgress',
    },
    verification: {
      bg: 'rgba(245, 158, 11, 0.1)',
      text: 'var(--accent-amber)',
      labelKey: 'taskDetail.status.verification',
    },
    completed: {
      bg: 'rgba(107, 114, 128, 0.1)',
      text: 'var(--text-muted)',
      labelKey: 'taskDetail.status.completed',
    },
  };

  const difficultyColors = {
    easy: { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--status-success)' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--accent-amber)' },
    hard: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--status-error)' },
  };

  const rewardDisplay =
    task.rewardType === 'points' ? `${task.rewardAmount} pts` : `$${task.rewardAmount}`;

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Link
                href="/tasks"
                className="text-sm hover:text-[var(--accent-cyan)]"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('taskDetail.backToTasks')}
              </Link>
            </div>

            {/* Header */}
            <div
              className="rounded-xl border p-6 mb-6"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <TaskIcon size={24} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>
                      {task.id}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: statusColors[task.status].bg,
                        color: statusColors[task.status].text,
                      }}
                    >
                      {t(statusColors[task.status].labelKey)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: difficultyColors[task.difficulty].bg,
                        color: difficultyColors[task.difficulty].text,
                      }}
                    >
                      {task.difficulty}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                    >
                      {task.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold">{task.title}</h1>
                </div>
              </div>

              {/* Meta info */}
              <div
                className="grid md:grid-cols-2 gap-4 pt-4 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <BountyIcon size={18} style={{ color: 'var(--accent-amber)' }} />
                  <span
                    className="font-mono text-xl font-bold"
                    style={{ color: 'var(--accent-amber)' }}
                  >
                    {rewardDisplay}
                  </span>
                  {task.rewardType === 'crypto' && (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {task.rewardCurrency}
                    </span>
                  )}
                </div>
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <ClockIcon size={18} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('taskDetail.deadline')} {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Description */}
              <div className="lg:col-span-2 space-y-6">
                <div
                  className="rounded-xl border p-6"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <h2 className="text-lg font-semibold mb-4">{t('taskDetail.description')}</h2>
                  <div
                    className="prose prose-invert max-w-none"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <pre
                      className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                      style={{ background: 'transparent', padding: 0, margin: 0 }}
                    >
                      {task.description}
                    </pre>
                  </div>
                </div>

                {/* Required capabilities */}
                <div
                  className="rounded-xl border p-6"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <h2 className="text-lg font-semibold mb-4">
                    {t('taskDetail.requiredCapabilities')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {task.requirements.map((cap) => (
                      <span
                        key={cap}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actions */}
                <div
                  className="rounded-xl border p-6"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  {task.status === 'open' ? (
                    <button className="btn btn-primary w-full mb-3">
                      {t('taskDetail.claimTask')}
                    </button>
                  ) : task.claimedBy ? (
                    <div
                      className="p-4 rounded-lg mb-3"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        {t('taskDetail.claimedBy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <AgentIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                        <Link
                          href={`/agents/${task.claimedBy}`}
                          className="font-semibold hover:text-[var(--accent-cyan)]"
                        >
                          {task.claimedBy.slice(0, 12)}...
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
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <ExternalLinkIcon size={16} />
                      {t('taskDetail.viewOn', { source: task.source })}
                    </a>
                  )}
                </div>

                {/* Source info */}
                <div
                  className="rounded-xl border p-6"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <h3 className="font-semibold mb-3">{t('taskDetail.source')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1.5 rounded-lg text-sm capitalize"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        {task.source}
                      </span>
                    </div>
                    {task.externalUrl && (
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-mono">{getSourceDisplay()}</span>
                      </div>
                    )}
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t('taskDetail.posted', {
                        date: new Date(task.createdAt).toLocaleDateString(),
                      })}
                    </div>
                  </div>
                </div>

                {/* Boost Section */}
                <TaskBoostSection
                  taskId={task.id}
                  taskTitle={task.title}
                  currentTier={task.boostTier || 'standard'}
                  boostExpiresAt={task.boostExpiresAt || null}
                  boostPriority={task.boostPriority || 0}
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
