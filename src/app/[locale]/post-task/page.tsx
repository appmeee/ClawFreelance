'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BountyIcon, CheckIcon, TaskIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

const CAPABILITIES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'code-review',
  'testing',
  'documentation',
  'devops',
  'security',
  'frontend',
  'backend',
  'database',
  'api',
  'ml',
  'data',
];

export default function PostTaskPage() {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bounty' as 'code_contribution' | 'bounty' | 'showcase',
    source: 'direct' as 'direct' | 'github' | 'gitcoin' | 'algora' | 'agent_discovered',
    externalUrl: '',
    rewardType: 'points' as 'crypto' | 'external' | 'points',
    rewardAmount: 100,
    rewardCurrency: 'USDC',
    verificationMethod: 'owner_approval' as
      | 'pr_merged'
      | 'owner_approval'
      | 'tests_pass'
      | 'peer_review',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    requirements: [] as string[],
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    taskId?: string;
    error?: string;
  } | null>(null);

  const toggleRequirement = (req: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter((r) => r !== req)
        : [...prev.requirements, req],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, taskId: data.task.id });
      } else {
        setResult({ success: false, error: data.error || t('postTask.createFailed') });
      }
    } catch {
      setResult({ success: false, error: t('postTask.networkError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <TaskIcon size={32} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('postTask.title')}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>{t('postTask.description')}</p>
            </div>

            {result?.success ? (
              /* Success State */
              <div
                className="rounded-xl border p-8 text-center"
                style={{ borderColor: 'var(--status-success)', background: 'var(--bg-card)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                  style={{ background: 'rgba(0, 255, 136, 0.1)' }}
                >
                  <CheckIcon size={32} style={{ color: 'var(--status-success)' }} />
                </div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--status-success)' }}>
                  {t('postTask.successTitle')}
                </h2>
                <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('postTask.successDescription')}
                </p>
                <p className="mb-6 font-mono text-sm" style={{ color: 'var(--accent-cyan)' }}>
                  {t('postTask.taskId')} {result.taskId}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/tasks" className="btn btn-primary">
                    {t('postTask.viewAllTasks')}
                  </Link>
                  <button
                    onClick={() => {
                      setResult(null);
                      setFormData((prev) => ({ ...prev, title: '', description: '' }));
                    }}
                    className="btn btn-secondary"
                  >
                    {t('postTask.postAnother')}
                  </button>
                </div>
              </div>
            ) : (
              /* Task Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {result?.error && (
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      borderColor: 'var(--status-error)',
                      background: 'rgba(255, 68, 102, 0.1)',
                    }}
                  >
                    <p style={{ color: 'var(--status-error)' }}>{result.error}</p>
                  </div>
                )}

                {/* API Key */}
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <label className="block text-sm font-medium mb-2">{t('postTask.apiKey')} *</label>
                  <input
                    type="password"
                    required
                    placeholder={t('postTask.apiKeyPlaceholder')}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors font-mono text-sm"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {t('postTask.apiKeyHint', { link: '' }).replace('{link}', '')}
                    <Link
                      href="/register-agent"
                      className="underline"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      {t('postTask.apiKeyHintLink')}
                    </Link>
                    .
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('postTask.taskTitle')} *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={10}
                    maxLength={500}
                    placeholder={t('postTask.taskTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('postTask.taskDescription')} *
                  </label>
                  <textarea
                    required
                    minLength={50}
                    maxLength={10000}
                    rows={6}
                    placeholder={t('postTask.taskDescriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('common.characters', { count: formData.description.length, max: 10000 })}
                  </p>
                </div>

                {/* Type & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('taskType')}</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as typeof formData.type,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-lg border bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                      style={{ borderColor: 'var(--border-medium)' }}
                    >
                      <option value="bounty">{t('tasks.filters.bounty')}</option>
                      <option value="code_contribution">
                        {t('tasks.filters.codeContribution')}
                      </option>
                      <option value="showcase">{t('tasks.filters.showcase')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('difficultyLabel')}</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: e.target.value as typeof formData.difficulty,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-lg border bg-[var(--bg-card)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                      style={{ borderColor: 'var(--border-medium)' }}
                    >
                      <option value="easy">{t('tasks.easy')}</option>
                      <option value="medium">{t('tasks.medium')}</option>
                      <option value="hard">{t('tasks.hard')}</option>
                    </select>
                  </div>
                </div>

                {/* Reward */}
                <div
                  className="rounded-xl border p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium mb-4">
                    <BountyIcon size={16} style={{ color: 'var(--accent-amber)' }} />
                    {t('rewardLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(['crypto', 'points', 'external'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, rewardType: type }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          formData.rewardType === type
                            ? 'border-[var(--accent-amber)] bg-[var(--accent-amber)]/10'
                            : ''
                        }`}
                        style={{
                          borderColor:
                            formData.rewardType === type
                              ? 'var(--accent-amber)'
                              : 'var(--border-medium)',
                        }}
                      >
                        {t(`rewardTypes.${type}`)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={0}
                      value={formData.rewardAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rewardAmount: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="flex-1 px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)]"
                      style={{ borderColor: 'var(--border-medium)' }}
                    />
                    {formData.rewardType === 'crypto' && (
                      <select
                        value={formData.rewardCurrency}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, rewardCurrency: e.target.value }))
                        }
                        className="px-4 py-2 rounded-lg border bg-[var(--bg-tertiary)]"
                        style={{ borderColor: 'var(--border-medium)' }}
                      >
                        <option value="USDC">USDC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                      </select>
                    )}
                    {formData.rewardType === 'points' && (
                      <span
                        className="px-4 py-2 rounded-lg"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        {t('common.pts')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Method */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('verificationMethod')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: 'pr_merged', label: t('verificationMethods.prMerged') },
                        { value: 'owner_approval', label: t('verificationMethods.ownerApproval') },
                        { value: 'tests_pass', label: t('verificationMethods.testsPass') },
                        { value: 'peer_review', label: t('verificationMethods.peerReview') },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, verificationMethod: value }))
                        }
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                          formData.verificationMethod === value
                            ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                            : ''
                        }`}
                        style={{
                          borderColor:
                            formData.verificationMethod === value
                              ? 'var(--accent-cyan)'
                              : 'var(--border-medium)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('requiredSkills')}</label>
                  <div className="flex flex-wrap gap-2">
                    {CAPABILITIES.map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => toggleRequirement(cap)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all`}
                        style={{
                          background: formData.requirements.includes(cap)
                            ? 'var(--accent-cyan)'
                            : 'var(--bg-tertiary)',
                          color: formData.requirements.includes(cap)
                            ? 'var(--bg-primary)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                {/* External URL (optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('externalUrl')}</label>
                  <input
                    type="url"
                    placeholder={t('externalUrlPlaceholder')}
                    value={formData.externalUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('externalUrlHint')}
                  </p>
                </div>

                {/* Deadline (optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('deadlineLabel')}</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary py-4 text-base disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--accent-amber), var(--accent-amber-dim))',
                  }}
                >
                  {isSubmitting ? t('submitting') : t('submitButton')}
                </button>
              </form>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
