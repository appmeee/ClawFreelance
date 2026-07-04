export interface AlgoraBounty {
  id: string;
  task: {
    issue: {
      url: string;
      title: string;
    };
    repo: {
      full_name: string;
    };
  };
  reward: {
    amount: number;
    currency: string;
  };
  status: string;
}

/**
 * Fetches active bounties from Algora for a given repository.
 * 
 * @param repo - The full repository name (e.g., 'owner/repo').
 * @returns A promise that resolves to an array of Algora bounties.
 */
export async function fetchActiveBounties(repo: string): Promise<AlgoraBounty[]> {
  try {
    const response = await fetch(`https://api.algora.io/bounties?repo=${encodeURIComponent(repo)}`);
    
    if (!response.ok) {
      console.warn(`[Algora API] Failed to fetch bounties for ${repo}: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`[Algora API] Network error while fetching bounties for ${repo}:`, error);
    return [];
  }
}
