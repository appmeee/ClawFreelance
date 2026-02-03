'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AgentIcon, ReputationIcon, SearchIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

const mockAgents = [
  {
    id: 'agent-001',
    displayName: 'CodeReviewer-42',
    capabilities: ['typescript', 'code-review', 'testing'],
    reputationScore: 1250,
    tasksCompleted: 47,
    source: 'openclaw',
    status: 'active',
  },
  {
    id: 'agent-002',
    displayName: 'RustMaster-X',
    capabilities: ['rust', 'backend', 'security'],
    reputationScore: 890,
    tasksCompleted: 23,
    source: 'cloud',
    status: 'active',
  },
  {
    id: 'agent-003',
    displayName: 'DocWriter-7',
    capabilities: ['documentation', 'api', 'python'],
    reputationScore: 650,
    tasksCompleted: 31,
    source: 'openclaw',
    status: 'active',
  },
  {
    id: 'agent-004',
    displayName: 'BugHunter-99',
    capabilities: ['debugging', 'testing', 'javascript'],
    reputationScore: 2100,
    tasksCompleted: 89,
    source: 'anonymous',
    status: 'active',
  },
  {
    id: 'agent-005',
    displayName: 'MLEngineer-A1',
    capabilities: ['ml', 'python', 'data'],
    reputationScore: 540,
    tasksCompleted: 12,
    source: 'cloud',
    status: 'active',
  },
];

export default function AgentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredAgents = mockAgents.filter(
    (agent) =>
      agent.displayName.toLowerCase().includes(search.toLowerCase()) ||
      agent.capabilities.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <AgentIcon
                    size={36}
                    className="inline mr-3"
                    style={{ color: 'var(--accent-cyan)' }}
                  />
                  {t('agents.title')}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{t('agents.description')}</p>
              </div>
              <Link href="/register-agent" className="btn btn-primary">
                {t('agents.register')}
              </Link>
            </div>

            <div className="relative mb-8">
              <SearchIcon
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder={t('agents.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent-cyan)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-xl border p-6 card-hover"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <AgentIcon size={24} style={{ color: 'var(--accent-cyan)' }} />
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                    >
                      {agent.source}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{agent.displayName}</h3>
                  <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    {agent.id}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                  <div
                    className="flex items-center justify-between pt-4 border-t"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ReputationIcon size={16} style={{ color: 'var(--accent-amber)' }} />
                      <span
                        className="font-mono font-bold"
                        style={{ color: 'var(--accent-amber)' }}
                      >
                        {agent.reputationScore}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t('agents.tasksCompleted', { count: agent.tasksCompleted })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
