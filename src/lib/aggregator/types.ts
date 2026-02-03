/**
 * Types for the bounty aggregator system
 *
 * This module defines the common types used across all bounty sources
 * (GitHub, Gitcoin, Algora, etc.) to normalize external bounties
 * into ClawFreelance tasks.
 */

import type {
  difficultyEnum,
  rewardTypeEnum,
  taskSourceEnum,
  taskTypeEnum,
  verificationMethodEnum,
} from '@/db/schema';

// Infer enum types from Drizzle schema
export type TaskType = (typeof taskTypeEnum.enumValues)[number];
export type TaskSource = (typeof taskSourceEnum.enumValues)[number];
export type Difficulty = (typeof difficultyEnum.enumValues)[number];
export type RewardType = (typeof rewardTypeEnum.enumValues)[number];
export type VerificationMethod = (typeof verificationMethodEnum.enumValues)[number];

/**
 * Raw bounty data from external sources before normalization
 */
export interface RawBounty {
  source: TaskSource;
  externalId: string;
  externalUrl: string;
  title: string;
  description: string;
  ownerExternalId: string;
  ownerName?: string;
  rewardAmount?: number;
  rewardCurrency?: string;
  labels?: string[];
  createdAt: Date;
  updatedAt?: Date;
  deadline?: Date;
  raw: unknown; // Original API response for debugging
}

/**
 * Normalized task ready for database insertion
 */
export interface NormalizedTask {
  title: string;
  description: string;
  type: TaskType;
  source: TaskSource;
  externalUrl: string;
  ownerExternalId: string;
  rewardType: RewardType;
  rewardAmount: number;
  rewardCurrency?: string;
  visibility: 'public';
  isMilestoneBased: false;
  status: 'open';
  verificationMethod: VerificationMethod;
  difficulty: Difficulty;
  requirements: string[];
  deadline?: Date;
}

/**
 * Configuration for a bounty source
 */
export interface SourceConfig {
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  filters?: {
    minReward?: number;
    maxReward?: number;
    labels?: string[];
    excludeLabels?: string[];
  };
}

/**
 * GitHub-specific configuration
 */
export interface GitHubSourceConfig extends SourceConfig {
  /** GitHub personal access token for higher rate limits */
  token?: string;
  /** Repositories to fetch bounties from */
  repositories: string[];
  /** Labels that indicate a bounty (e.g., 'bounty', 'help wanted') */
  bountyLabels: string[];
}

/**
 * Gitcoin-specific configuration
 */
export interface GitcoinSourceConfig extends SourceConfig {
  /** Gitcoin API key */
  apiKey?: string;
  /** Networks to include (e.g., 'mainnet', 'polygon') */
  networks?: string[];
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  source: TaskSource;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  externalId: string;
  message: string;
  code?: string;
}

/**
 * Interface that all bounty source fetchers must implement
 */
export interface BountySource {
  readonly name: TaskSource;
  fetch(): Promise<RawBounty[]>;
  normalize(raw: RawBounty): NormalizedTask;
}
