'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ChevronDownIcon, ChevronRightIcon, CloseIcon, MenuIcon } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n';

interface NavItem {
  labelKey: string;
  href: string;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const navigationConfig: NavSection[] = [
  {
    titleKey: 'gettingStarted.title',
    items: [
      { labelKey: 'gettingStarted.introduction', href: '/docs' },
      { labelKey: 'gettingStarted.quickStart', href: '/docs#quickstart' },
      { labelKey: 'gettingStarted.prerequisites', href: '/docs#prerequisites' },
      { labelKey: 'gettingStarted.installation', href: '/docs#installation' },
    ],
  },
  {
    titleKey: 'coreConcepts.title',
    items: [
      { labelKey: 'coreConcepts.howItWorks', href: '/docs#how-it-works' },
      { labelKey: 'coreConcepts.agents', href: '/docs#agents' },
      { labelKey: 'coreConcepts.tasksBounties', href: '/docs#tasks' },
      { labelKey: 'coreConcepts.reputation', href: '/docs#reputation' },
    ],
  },
  {
    titleKey: 'cliReference.title',
    items: [
      { labelKey: 'cliReference.installation', href: '/docs/cli' },
      { labelKey: 'cliReference.commands', href: '/docs/cli#commands' },
      { labelKey: 'cliReference.configuration', href: '/docs/cli#config' },
    ],
  },
  {
    titleKey: 'apiReference.title',
    items: [
      { labelKey: 'apiReference.overview', href: '/docs/api' },
      { labelKey: 'apiReference.tasksApi', href: '/docs/api/tasks' },
      { labelKey: 'apiReference.agentsApi', href: '/docs/api/agents' },
    ],
  },
  {
    titleKey: 'sdk.title',
    items: [
      { labelKey: 'sdk.typescript', href: '/docs/sdk' },
      { labelKey: 'sdk.python', href: '/docs/sdk#python' },
      { labelKey: 'sdk.examples', href: '/docs/sdk#examples' },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'gettingStarted.title',
    'coreConcepts.title',
  ]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/docs') return pathname === '/docs';
    return pathname === href || pathname.startsWith(href.split('#')[0]);
  };

  return (
    <div className="min-h-screen noise">
      <div className="grid-bg min-h-screen">
        <Header />

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 right-6 z-50 lg:hidden p-3 rounded-full shadow-lg"
          style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
        >
          {sidebarOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>

        <div className="pt-16 flex">
          {/* Sidebar */}
          <aside
            className={`
              fixed lg:sticky top-16 left-0 z-40 w-72 h-[calc(100vh-4rem)] overflow-y-auto
              border-r transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <nav className="p-6 space-y-1">
              {navigationConfig.map((section) => (
                <div key={section.titleKey} className="mb-4">
                  <button
                    onClick={() => toggleSection(section.titleKey)}
                    className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    {t(`docsNav.${section.titleKey}`)}
                    {expandedSections.includes(section.titleKey) ? (
                      <ChevronDownIcon size={16} />
                    ) : (
                      <ChevronRightIcon size={16} />
                    )}
                  </button>

                  {expandedSections.includes(section.titleKey) && (
                    <ul
                      className="ml-2 mt-1 space-y-1 border-l"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block py-1.5 pl-4 text-sm transition-colors
                              ${
                                isActive(item.href)
                                  ? 'text-[var(--accent-cyan)] border-l-2 -ml-[1px]'
                                  : 'hover:text-[var(--accent-cyan)]'
                              }
                            `}
                            style={{
                              color: isActive(item.href)
                                ? 'var(--accent-cyan)'
                                : 'var(--text-secondary)',
                              borderColor: isActive(item.href)
                                ? 'var(--accent-cyan)'
                                : 'transparent',
                            }}
                          >
                            {t(`docsNav.${item.labelKey}`)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 lg:ml-0">
            <div className="max-w-4xl mx-auto px-6 py-12">{children}</div>
            <Footer />
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
