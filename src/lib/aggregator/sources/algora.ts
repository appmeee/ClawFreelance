import { Source, Bounty } from '../types';

export class AlgoraSource implements Source {
  id = 'algora';
  name = 'Algora';

  async fetchBounties(): Promise<Bounty[]> {
    const response = await fetch('https://api.algora.io/v1/bounties?status=open', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Algora API error: ${response.statusText}`);
    }

    const bounties = await response.json();
    return (bounties || []).map((b: any) => ({
      id: `algora-${b.id}`,
      source: this.id,
      title: b.title,
      description: b.description || b.title,
      reward: { amount: b.amount, currency: b.currency || 'USD' },
      url: b.url,
      repo: b.repo,
      status: 'open',
      categories: ['open-source', 'bounty']
    }));
  }
}
