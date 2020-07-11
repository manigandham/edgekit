export interface Edkt {
  run: () => Promise<void>;
}

// Storage Keys Enum

export enum StorageKeys {
  PAGE_VIEWS = 'edkt_page_views',
  MATCHED_AUDIENCES = 'edkt_matched_audiences',
  MATCHED_AUDIENCE_IDS = 'edkt_matched_audience_ids',
}

// Page Features

export interface PageFeatureGetter {
  name: string;
  func: () => Promise<string[]>;
}

export interface PageFeature {
  name: string;
  error: boolean;
  value: string[];
}

export interface PageView {
  ts: number;
  features: {
    [name: string]: string[];
  };
}

// Audiences

export interface MatchedAudience {
  id: string;
  matchedAt: number;
  expiresAt: number;
  matchedOnCurrentPageView: boolean;
}

export interface AudienceDefinition {
  id: string;
  name: string;
  ttl: number;
  lookback: number;
  occurrences: number;
  keywords: string[];
}

// Engine

export interface EngineConditionQuery {
  property: string;
  value: string[];
}

export interface EngineConditionRule {
  reducer: {
    name: 'count';
    // args?: string;
  };
  matcher: {
    name: 'eq' | 'gt' | 'lt' | 'ge' | 'le';
    args: number;
  };
}

export interface EngineCondition {
  filter: {
    any?: boolean;
    queries: EngineConditionQuery[];
  };
  rules: EngineConditionRule[];
}
