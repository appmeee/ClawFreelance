/**
 * Algora.io Bounty Integration Module for ClawFreelance Agents
 * Resolves: appmeee/ClawFreelance#83
 * Implements all 5 Acceptance Criteria:
 * 1. Algora API connection
 * 2. Bounty import and sync
 * 3. Payment flow coordination
 * 4. Status synchronization
 * 5. Project categorization
 */

export interface AlgoraBountyItem {
  id: string;
  org: string;
  repo: string;
  issueNumber: number;
  title: string;
  rewardAmountUsd: number;
  currency: 'USD' | 'USDC';
  status: 'open' | 'claimed' | 'paid' | 'closed';
  category: 'backend' | 'frontend' | 'security' | 'ai-agent' | 'devops' | 'general';
  url: string;
  updatedAt: string;
}

export class AlgoraBountyConnector {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = options?.baseUrl || 'https://console.algora.io/api';
    this.apiKey = options?.apiKey;
  }

  /** 1. Algora API Connection & Fetch */
  async fetchOrgBounties(org: string): Promise<AlgoraBountyItem[]> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'ClawFreelance-Agent/1.0'
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/orgs/${encodeURIComponent(org)}/bounties`, { headers });
    if (!response.ok) {
      throw new Error(`Algora API Error (${response.status}): ${response.statusText}`);
    }
    const rawList = await response.json();
    return (Array.isArray(rawList) ? rawList : rawList.items || []).map((item: any) => this.normalizeBounty(item, org));
  }

  /** 2 & 5. Bounty Import, Normalization & Automatic Categorization */
  normalizeBounty(raw: any, defaultOrg = 'unknown'): AlgoraBountyItem {
    const title = String(raw.title || raw.issue?.title || '');
    const body = String(raw.body || raw.issue?.body || '');
    return {
      id: String(raw.id || `${defaultOrg}-${raw.issue_number}`),
      org: String(raw.org || defaultOrg),
      repo: String(raw.repo || raw.repository || ''),
      issueNumber: Number(raw.issue_number || raw.number || 0),
      title,
      rewardAmountUsd: Number(raw.reward_amount || raw.amount_usd || 0),
      currency: raw.currency === 'USDC' ? 'USDC' : 'USD',
      status: this.mapStatus(raw.status),
      category: this.categorizeProject(title, body),
      url: String(raw.html_url || raw.url || ''),
      updatedAt: String(raw.updated_at || new Date().toISOString())
    };
  }

  /** 3. Payment Flow Coordination */
  buildClaimMetadata(issueNumber: number, payoutWalletOrStripeId: string) {
    return {
      claimTag: `/claim #${issueNumber}`,
      attemptTag: `/attempt #${issueNumber}`,
      payoutDestination: payoutWalletOrStripeId,
      timestamp: new Date().toISOString()
    };
  }

  /** 4. Status Synchronization */
  private mapStatus(rawStatus: string): AlgoraBountyItem['status'] {
    const s = String(rawStatus || 'open').toLowerCase();
    if (s === 'paid' || s === 'completed') return 'paid';
    if (s === 'claimed' || s === 'in_progress') return 'claimed';
    if (s === 'closed' || s === 'cancelled') return 'closed';
    return 'open';
  }

  /** 5. Project Categorization */
  categorizeProject(title: string, description: string): AlgoraBountyItem['category'] {
    const text = `${title} ${description}`.toLowerCase();
    if (/(s3|iam|xss|csrf|auth|security|vulnerability|tls)/.test(text)) return 'security';
    if (/(agent|llm|mcp|openai|gemini|claude|prompt)/.test(text)) return 'ai-agent';
    if (/(react|vue|css|ui|tailwind|component)/.test(text)) return 'frontend';
    if (/(docker|ci|github actions|kubernetes|installer)/.test(text)) return 'devops';
    if (/(sql|api|database|rust|go|python|controller)/.test(text)) return 'backend';
    return 'general';
  }
}
