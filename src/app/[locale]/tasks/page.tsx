'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { FilterIcon, SearchIcon, TaskIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

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
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const ITEMS_PER_PAGE = 20;

export default function TasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: ITEMS_PER_PAGE,
    offset: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    difficulty: '',
    search: '',
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: t('tasks.open'), color: 'var(--status-success)' },
    claimed: { label: t('tasks.claimed'), color: 'var(--accent-amber)' },
    in_progress: { label: t('tasks.inProgress'), color: 'var(--accent-cyan)' },
    verification: { label: t('tasks.verifying'), color: 'var(--status-pending)' },
    completed: { label: t('tasks.completed'), color: 'var(--text-muted)' },
  };

  const difficultyConfig: Record<string, { label: string; dots: number }> = {
    easy: { label: t('tasks.easy'), dots: 1 },
    medium: { label: t('tasks.medium'), dots: 2 },
    hard: { label: t('tasks.hard'), dots: 3 },
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    code_contribution: { label: t('tasks.filters.contribution'), color: 'var(--accent-cyan)' },
    bounty: { label: t('tasks.filters.bounty'), color: 'var(--accent-amber)' },
    showcase: { label: t('tasks.filters.showcase'), color: 'var(--status-success)' },
  };

  const fetchTasks = async (offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('offset', String(offset));
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);

      const response = await fetch(`/api/v1/tasks?${params.toString()}`);
      const data = await response.json();
      setTasks(data.tasks || []);
      setPagination(
        data.pagination || { total: 0, limit: ITEMS_PER_PAGE, offset: 0, hasMore: false }
      );
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.difficulty]);

  const handlePageChange = (newOffset: number) => {
    fetchTasks(newOffset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = Math.floor(pagination.offset / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);

  const filteredTasks = tasks.filter(
    (task) =>
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
                  <TaskIcon
                    size={36}
                    className="inline mr-3"
                    style={{ color: 'var(--accent-cyan)' }}
                  />
                  {t('tasks.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{t('tasks.description')}</p>
              </div>
              <Link href="/post-task" className="btn btn-primary">
                {t('tasks.postTask')}
              </Link>
            </div>

            {/* Filters */}
            <div
              className="rounded-xl border p-4 mb-8"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <SearchIcon
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder={t('tasks.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)]"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="flex gap-3">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">{t('tasks.filters.allStatus')}</option>
                    <option value="open">{t('tasks.open')}</option>
                    <option value="claimed">{t('tasks.claimed')}</option>
                    <option value="in_progress">{t('tasks.inProgress')}</option>
                    <option value="verification">{t('tasks.filters.verification')}</option>
                  </select>

                  <select
                    value={filters.type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">{t('tasks.filters.allTypes')}</option>
                    <option value="bounty">{t('tasks.filters.bounty')}</option>
                    <option value="code_contribution">{t('tasks.filters.contribution')}</option>
                    <option value="showcase">{t('tasks.filters.showcase')}</option>
                  </select>

                  <select
                    value={filters.difficulty}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
                    }
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">{t('tasks.filters.allDifficulty')}</option>
                    <option value="easy">{t('tasks.easy')}</option>
                    <option value="medium">{t('tasks.medium')}</option>
                    <option value="hard">{t('tasks.hard')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tasks Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('tasks.loadingTasks')}
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-20">
                <FilterIcon
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <p style={{ color: 'var(--text-secondary)' }}>{t('tasks.noTasksFound')}</p>
              </div>
            ) : (
              <div className="grid gap-4 overflow-hidden">
                {filteredTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block rounded-xl border p-6 card-hover overflow-hidden"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className="font-mono text-sm truncate max-w-[120px]"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            {task.id}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{
                              background: `${statusConfig[task.status]?.color || 'var(--text-muted)'}15`,
                              color: statusConfig[task.status]?.color || 'var(--text-muted)',
                            }}
                          >
                            {statusConfig[task.status]?.label || task.status}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                          >
                            {task.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 break-words">{task.title}</h3>
                        <p
                          className="text-sm line-clamp-2 mb-3 break-all"
                          style={{ color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}
                        >
                          {task.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.requirements.slice(0, 4).map((req) => (
                            <span
                              key={req}
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {req}
                            </span>
                          ))}
                          {task.requirements.length > 4 && (
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {t('common.more', { count: task.requirements.length - 4 })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div
                            className="font-mono text-sm font-medium px-2 py-1 rounded"
                            style={{
                              background: `${typeConfig[task.type]?.color || 'var(--bg-tertiary)'}15`,
                              color: typeConfig[task.type]?.color || 'var(--text-secondary)',
                            }}
                          >
                            {typeConfig[task.type]?.label || task.type.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((dot) => (
                              <div
                                key={dot}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background:
                                    dot <= difficultyConfig[task.difficulty]?.dots
                                      ? 'var(--accent-cyan)'
                                      : 'var(--bg-tertiary)',
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {difficultyConfig[task.difficulty]?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.total > ITEMS_PER_PAGE && (
              <div
                className="flex items-center justify-between mt-8 pt-6 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('common.showing', {
                    from: pagination.offset + 1,
                    to: Math.min(pagination.offset + pagination.limit, pagination.total),
                    total: pagination.total,
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.offset - ITEMS_PER_PAGE)}
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: 'var(--border-medium)',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    {t('common.previous')}
                  </button>
                  <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.offset + ITEMS_PER_PAGE)}
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: 'var(--border-medium)',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    {t('common.next')}
                  </button>
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
