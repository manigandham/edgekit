import {
  PageView,
  AudienceDefinition,
  CachedAudienceMetaData,
  MatchedAudience,
} from '../../types';
import { viewStore, matchedAudienceStore } from '../../src/store';

export const clearStore = (): void => {
  localStorage.clear();
  //We need to reload from local storage because its only done on construction
  viewStore._load();
  matchedAudienceStore._load();
};

export const setUpLocalStorage = (pageViews: PageView[]): void => {
  localStorage.clear();
  localStorage.setItem('edkt_page_views', JSON.stringify(pageViews));
  //We need to reload from local storage because its only done on construction
  viewStore._load();
  matchedAudienceStore._load();
};

export const getPageViews = (): PageView[] =>
  JSON.parse(localStorage.getItem('edkt_page_views') || '[]');

export const getMatchedAudiences = (): MatchedAudience[] =>
  JSON.parse(localStorage.getItem('edkt_matched_audiences') || '[]');

export const getCachedAudiences = (): AudienceDefinition[] =>
  JSON.parse(localStorage.getItem('edkt_cached_audiences') || '[]');

export const getCachedAudiencesMetaData = (): CachedAudienceMetaData =>
  JSON.parse(localStorage.getItem('edkt_cached_audience_meta_data') || '{}');
