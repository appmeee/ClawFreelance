import { and, desc, eq, gte, or } from 'drizzle-orm';
import Link from 'next/link';

import { BountyIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import type { Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n/dictionaries';

// Force dynamic rendering (database queries)
export const dynamic = 'force-dynamic';

async function getBounties() {
  // Get only real bounties with external (monetary) rewards
  // Code contributions with points are shown on the tasks page instead
  const bounties = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      type: tasks.type,
      rewardAmount: tasks.rewardAmount,
      rewardCurrency: tasks.rewardCurrency,
      rewardType: tasks.rewardType,
      source: tasks.source,
      deadline: tasks.deadline,
      status: tasks.status,
      externalUrl: tasks.externalUrl,
      difficulty: tasks.difficulty,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.visibility, 'public'),
        or(eq(tasks.status, 'open'), eq(tasks.status, 'in_progress')),
        eq(tasks.rewardType, 'external'), // Only real monetary bounties
        gte(tasks.rewardAmount, 1)
      )
    )
    .orderBy(desc(tasks.rewardAmount))
    .limit(100);

  return bounties;
}

export default async function BountiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const bounties = await getBounties();

  const totalValue = bounties
    .filter((b) => b.status === 'open')
    .reduce((acc, b) => acc + (b.rewardAmount || 0), 0);

  const openCount = bounties.filter((b) => b.status === 'open').length;

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
                  {dict.bounties.title}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{dict.bounties.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {openCount} {dict.bounties.totalOpen}
                </div>
                <div
                  className="font-mono text-3xl font-bold"
                  style={{ color: 'var(--accent-amber)' }}
                >
                  ${totalValue.toLocaleString()}
                </div>
              </div>
            </div>

            {bounties.length === 0 ? (
              <div
                className="text-center py-16 rounded-xl border"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <BountyIcon
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
                    className="block rounded-xl border p-6 card-hover"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${bounty.status === 'open' ? 'bg-[var(--status-success)]/10 text-[var(--status-success)]' : 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'}`}
                          >
                            {bounty.status === 'open' ? dict.tasks.open : dict.tasks.inProgress}
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
                          {bounty.externalUrl && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              External
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{bounty.title}</h3>
                        {bounty.deadline && (
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {dict.bounties.deadlineLabel}{' '}
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
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
