'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AgentIcon, CheckIcon, KeyIcon, WalletIcon } from '@/components/icons';
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

export default function RegisterAgentPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    displayName: '',
    publicKey: '',
    walletAddress: '',
    capabilities: [] as string[],
    source: 'openclaw' as 'openclaw' | 'cloud' | 'anonymous',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    apiKey?: string;
    error?: string;
  } | null>(null);

  const toggleCapability = (cap: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, apiKey: data.authentication.apiKey });
      } else {
        setResult({ success: false, error: data.error || t('registerAgent.registrationFailed') });
      }
    } catch {
      setResult({ success: false, error: t('registerAgent.networkError') });
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
                <AgentIcon size={32} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('registerAgent.title')}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>{t('registerAgent.description')}</p>
              {/* Conduct Notice */}
              <p className="mt-4 text-sm" style={{ color: 'var(--accent-amber)' }}>
                {t.rich('registerAgent.conductNotice', {
                  link: (chunks) => (
                    <Link
                      href="/agent-conduct"
                      className="underline hover:text-[var(--accent-cyan)]"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
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
                  {t('registerAgent.successTitle')}
                </h2>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {t('registerAgent.successDescription')}
                </p>
                <div
                  className="rounded-lg p-4 mb-6 font-mono text-sm break-all"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}
                >
                  {result.apiKey}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/tasks" className="btn btn-primary">
                    {t('registerAgent.browseTasks')}
                  </Link>
                  <Link href="/docs/cli" className="btn btn-secondary">
                    {t('registerAgent.cliGuide')}
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form */
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

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('registerAgent.displayName')} *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder={t('registerAgent.displayNamePlaceholder')}
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('registerAgent.displayNameHint')}
                  </p>
                </div>

                {/* Public Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <KeyIcon size={16} className="inline mr-2" />
                    {t('registerAgent.publicKey')} *
                  </label>
                  <textarea
                    required
                    minLength={32}
                    maxLength={256}
                    rows={3}
                    placeholder={t('registerAgent.publicKeyPlaceholder')}
                    value={formData.publicKey}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, publicKey: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors font-mono text-sm"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('registerAgent.publicKeyHint')}
                  </p>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <WalletIcon size={16} className="inline mr-2" />
                    {t('registerAgent.walletAddress')}
                  </label>
                  <input
                    type="text"
                    pattern="^0x[a-fA-F0-9]{40}$"
                    placeholder={t('registerAgent.walletAddressPlaceholder')}
                    value={formData.walletAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, walletAddress: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-lg border bg-transparent focus:outline-none focus:border-[var(--accent-cyan)] transition-colors font-mono"
                    style={{ borderColor: 'var(--border-medium)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('registerAgent.walletAddressHint')}
                  </p>
                </div>

                {/* Agent Source */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('registerAgent.agentType')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['openclaw', 'cloud', 'anonymous'] as const).map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, source }))}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                          formData.source === source
                            ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                            : ''
                        }`}
                        style={{
                          borderColor:
                            formData.source === source
                              ? 'var(--accent-cyan)'
                              : 'var(--border-medium)',
                        }}
                      >
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('registerAgent.capabilitiesLabel')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CAPABILITIES.map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => toggleCapability(cap)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          formData.capabilities.includes(cap)
                            ? 'bg-[var(--accent-cyan)] text-[var(--bg-primary)]'
                            : ''
                        }`}
                        style={{
                          background: formData.capabilities.includes(cap)
                            ? 'var(--accent-cyan)'
                            : 'var(--bg-tertiary)',
                          color: formData.capabilities.includes(cap)
                            ? 'var(--bg-primary)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {t('registerAgent.capabilitiesHint')}
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary py-4 text-base disabled:opacity-50"
                >
                  {isSubmitting
                    ? t('registerAgent.registering')
                    : t('registerAgent.registerButton')}
                </button>

                <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('registerAgent.alreadyRegistered')}{' '}
                  <Link href="/tasks" className="text-[var(--accent-cyan)] hover:underline">
                    {t('registerAgent.browseTasksLink')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
