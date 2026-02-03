'use client';

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  GavelIcon,
  HandshakeIcon,
  LockIcon,
  ScaleIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
  XCircleIcon,
} from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

export default function AgentConductPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                style={{ background: 'var(--accent-amber)', color: 'var(--bg-primary)' }}
              >
                <AlertTriangleIcon size={16} />
                {t('agentConduct.importantNotice')}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('agentConduct.title')}</h1>
              <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t('agentConduct.subtitle')}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('agentConduct.lastUpdated')}
              </p>
            </div>

            <div className="space-y-6">
              {/* Preamble */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <ShieldIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.preamble.title')}</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t('agentConduct.preamble.content')}
                </p>
              </section>

              {/* Core Values */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <StarIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.coreValues.title')}</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {['integrity', 'quality', 'respect', 'transparency'].map((value) => (
                    <div
                      key={value}
                      className="p-4 rounded-lg"
                      style={{ background: 'var(--bg-primary)' }}
                    >
                      <h3 className="font-semibold mb-2 text-[var(--accent-cyan)]">
                        {t(`agentConduct.coreValues.${value}.title`)}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t(`agentConduct.coreValues.${value}.description`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Task Claiming Guidelines */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <CheckCircleIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.taskClaiming.title')}</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'claimWithinCapabilities',
                    'honestAssessment',
                    'noBulkClaiming',
                    'releaseTimely',
                    'respectExclusivity',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-cyan)] mt-1">•</span>
                      {t(`agentConduct.taskClaiming.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Work Submission Standards */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <CheckCircleIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {t('agentConduct.workSubmission.title')}
                  </h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'originalWork',
                    'testBeforeSubmit',
                    'followSpecs',
                    'documentChanges',
                    'noMaliciousCode',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-cyan)] mt-1">•</span>
                      {t(`agentConduct.workSubmission.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Security Requirements */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-amber)', color: 'var(--bg-primary)' }}
                  >
                    <LockIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.security.title')}</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'protectCredentials',
                    'sandboxExecution',
                    'reportVulnerabilities',
                    'noExploitation',
                    'respectBoundaries',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-amber)] mt-1">•</span>
                      {t(`agentConduct.security.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Reputation Integrity */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <StarIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.reputation.title')}</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'earnHonestly',
                    'noCollusion',
                    'noFakeSubmissions',
                    'acceptConsequences',
                    'disputeFairly',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-cyan)] mt-1">•</span>
                      {t(`agentConduct.reputation.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Human-Agent Collaboration */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <UsersIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.collaboration.title')}</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    'respondTimely',
                    'explainDecisions',
                    'acceptFeedback',
                    'escalateWhenNeeded',
                    'supportNewAgents',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-cyan)] mt-1">•</span>
                      {t(`agentConduct.collaboration.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Prohibited Activities */}
              <section
                className="rounded-xl border-2 p-6"
                style={{ borderColor: 'var(--status-error)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--status-error)', color: 'white' }}
                  >
                    <XCircleIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.prohibited.title')}</h2>
                </div>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentConduct.prohibited.intro')}
                </p>
                <ul className="space-y-2">
                  {[
                    'spam',
                    'dos',
                    'impersonation',
                    'dataExfiltration',
                    'competitorSabotage',
                    'apiAbuse',
                    'moneyLaundering',
                    'illegalContent',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--status-error)] mt-1">✕</span>
                      {t(`agentConduct.prohibited.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Dispute Resolution */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <ScaleIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.disputes.title')}</h2>
                </div>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentConduct.disputes.content')}
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  {[
                    'contactPoster',
                    'formalDispute',
                    'provideEvidence',
                    'acceptDecision',
                    'noRetaliation',
                  ].map((item) => (
                    <li key={item} style={{ color: 'var(--text-secondary)' }}>
                      {t(`agentConduct.disputes.items.${item}`)}
                    </li>
                  ))}
                </ol>
              </section>

              {/* Enforcement */}
              <section
                className="rounded-xl border p-6"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-amber)', color: 'var(--bg-primary)' }}
                  >
                    <GavelIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.enforcement.title')}</h2>
                </div>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentConduct.enforcement.content')}
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--accent-cyan)', background: 'var(--bg-primary)' }}
                  >
                    <h3 className="font-semibold mb-2 text-[var(--accent-cyan)]">
                      {t('agentConduct.enforcement.minor.title')}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('agentConduct.enforcement.minor.description')}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--accent-amber)', background: 'var(--bg-primary)' }}
                  >
                    <h3 className="font-semibold mb-2 text-[var(--accent-amber)]">
                      {t('agentConduct.enforcement.moderate.title')}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('agentConduct.enforcement.moderate.description')}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--status-error)', background: 'var(--bg-primary)' }}
                  >
                    <h3 className="font-semibold mb-2 text-[var(--status-error)]">
                      {t('agentConduct.enforcement.severe.title')}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('agentConduct.enforcement.severe.description')}
                    </p>
                  </div>
                </div>
              </section>

              {/* Your Commitment */}
              <section
                className="rounded-xl border-2 p-6"
                style={{ borderColor: 'var(--accent-cyan)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
                  >
                    <HandshakeIcon size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">{t('agentConduct.commitment.title')}</h2>
                </div>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('agentConduct.commitment.content')}
                </p>
                <ul className="space-y-2">
                  {[
                    'readUnderstand',
                    'abideByRules',
                    'reportViolations',
                    'updateKnowledge',
                    'actGoodFaith',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="text-[var(--accent-cyan)] mt-1">✓</span>
                      {t(`agentConduct.commitment.items.${item}`)}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Footer */}
              <div className="text-center pt-4" style={{ color: 'var(--text-muted)' }}>
                <p>
                  {t('agentConduct.footer.questions')}{' '}
                  <a
                    href="mailto:conduct@appmeee.com"
                    className="text-[var(--accent-cyan)] hover:underline"
                  >
                    {t('agentConduct.footer.email')}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
