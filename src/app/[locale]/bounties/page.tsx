'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BountyIcon, FilterIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

type Bounty = {
  id: string;
  title: string;
  description: string;
  type: 'code_contribution' | 'bounty' | 'showcase';
  status: string;
  rewardType: 'crypto' | 'points' | 'external';
  rewardAmount: number;
  rewardCurrency?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  externalUrl?: string;
  deadline?: string;
  createdAt: string;
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const ITEMS_PER_PAGE = 20;

// Fisher-Yates shuffle for randomizing bounties
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function BountiesPage() {
  const { t } = useTranslation();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [allBounties, setAllBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: ITEMS_PER_PAGE,
    offset: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    source: '',
  });

  const typeConfig: Record<string, { label: string; color: string }> = {
    code_contribution: { label: t('tasks.filters.contribution'), color: 'var(--accent-cyan)' },
    bounty: { label: t('tasks.filters.bounty'), color: 'var(--accent-amber)' },
    showcase: { label: t('tasks.filters.showcase'), color: 'var(--status-success)' },
  };

  const fetchBounties = async () => {
    setLoading(true);
    try {
      // Fetch all bounties by paginating through API (max 100 per request)
      const allFetchedBounties: Bounty[] = [];
      let offset = 0;
      const limit = 100; // API max is 100
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams();
        params.set('minReward', '1');
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        params.set('status', 'open');
        if (filters.type) params.set('type', filters.type);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        if (filters.source) params.set('source', filters.source);

        const response = await fetch(`/api/v1/tasks?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          console.error('API error:', data);
          break;
        }

        const tasks = (data.tasks || []) as Bounty[];
        allFetchedBounties.push(...tasks);

        hasMore = data.pagination?.hasMore ?? false;
        offset += limit;

        // Safety limit to prevent infinite loops
        if (offset > 2000) break;
      }

      // Filter to only external rewards and shuffle
      const externalBounties = allFetchedBounties.filter(
        (t) => t.rewardType === 'external' || t.rewardAmount > 0
      );
      const shuffled = shuffleArray(externalBounties);
      setAllBounties(shuffled);

      // Set first page
      const firstPage = shuffled.slice(0, ITEMS_PER_PAGE);
      setBounties(firstPage);
      setPagination({
        total: shuffled.length,
        limit: ITEMS_PER_PAGE,
        offset: 0,
        hasMore: shuffled.length > ITEMS_PER_PAGE,
      });
    } catch (error) {
      console.error('Failed to fetch bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBounties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.difficulty, filters.source]);

  const handlePageChange = (newOffset: number) => {
    const pageBounties = allBounties.slice(newOffset, newOffset + ITEMS_PER_PAGE);
    setBounties(pageBounties);
    setPagination({
      ...pagination,
      offset: newOffset,
      hasMore: newOffset + ITEMS_PER_PAGE < allBounties.length,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = Math.floor(pagination.offset / ITEMS_PER_PAGE) + 1;
  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);

  const totalValue = allBounties
    .filter((b) => b.status === 'open')
    .reduce((acc, b) => acc + (b.rewardAmount || 0), 0);

  const openCount = allBounties.filter((b) => b.status === 'open').length;

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <BountyIcon
                    size={36}
                    className="inline mr-3"
                    style={{ color: 'var(--accent-amber)' }}
                  />
                  {t('bounties.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{t('bounties.description')}</p>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {openCount} {t('bounties.totalOpen')}
                </div>
                <div
                  className="font-mono text-3xl font-bold"
                  style={{ color: 'var(--accent-amber)' }}
                >
                  ${totalValue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div
              className="rounded-xl border p-4 mb-8"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-3 flex-wrap">
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

                  <select
                    value={filters.source}
                    onChange={(e) => setFilters((prev) => ({ ...prev, source: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-[var(--bg-tertiary)] focus:outline-none"
                    style={{ borderColor: 'var(--border-medium)' }}
                  >
                    <option value="">All Sources</option>
                    <option value="github">GitHub</option>
                    <option value="gitcoin">Gitcoin</option>
                    <option value="algora">Algora</option>
                    <option value="immunefi">Immunefi</option>
                    <option value="bugcrowd">Bugcrowd</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bounties Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-2 border-[var(--accent-amber)] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('tasks.loadingTasks')}
                </p>
              </div>
            ) : bounties.length === 0 ? (
              <div
                className="text-center py-16 rounded-xl border"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <FilterIcon
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <h3 className="text-lg font-medium mb-2">No bounties available</h3>
                <p style={{ color: 'var(--text-muted)' }}>Check back soon for new opportunities</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bounties.map((bounty) => (
                  <Link
                    key={bounty.id}
                    href={bounty.externalUrl || `/tasks/${bounty.id}`}
                    target={bounty.externalUrl ? '_blank' : undefined}
                    rel={bounty.externalUrl ? 'noopener noreferrer' : undefined}
                    className="block rounded-xl border p-6 card-hover overflow-hidden"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span
                            className="font-mono text-sm truncate max-w-[120px]"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            {bounty.id.slice(0, 8)}...
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${bounty.status === 'open' ? 'bg-[var(--status-success)]/10 text-[var(--status-success)]' : 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'}`}
                          >
                            {bounty.status === 'open' ? t('tasks.open') : t('tasks.inProgress')}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: `${typeConfig[bounty.type]?.color || 'var(--bg-tertiary)'}15`,
                              color: typeConfig[bounty.type]?.color || 'var(--text-muted)',
                            }}
                          >
                            {typeConfig[bounty.type]?.label || bounty.type.replace('_', ' ')}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded capitalize"
                            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                          >
                            {bounty.source}
                          </span>
                          {bounty.difficulty && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                bounty.difficulty === 'easy'
                                  ? 'bg-green-500/10 text-green-400'
                                  : bounty.difficulty === 'hard'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-yellow-500/10 text-yellow-400'
                              }`}
                            >
                              {bounty.difficulty}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{bounty.title}</h3>
                        {bounty.deadline && (
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {t('bounties.deadlineLabel')}{' '}
                            {new Date(bounty.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className="font-mono text-2xl font-bold"
                          style={{ color: 'var(--accent-amber)' }}
                        >
                          ${bounty.rewardAmount?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {bounty.rewardCurrency || 'USD'}
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
