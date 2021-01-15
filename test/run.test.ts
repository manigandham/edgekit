import { edkt } from '../src';
import { PageView } from '../types';
import { timeStampInSecs } from '../src/utils';
import { viewStore, matchedAudienceStore } from '../src/store';
import {
  clearStore,
  makePageViews,
  getPageViews,
  getMatchedAudiences,
} from './helpers/localStorageSetup';
import {
  makeAudienceDefinition,
  makeStringArrayQuery,
  makeVectorDistanceQuery,
  makeCosineSimilarityQuery,
} from './helpers/audienceDefinitions';

describe('Edkt run method', () => {
  const setUpLocalStorage = (pageViews: PageView[]) => {
    localStorage.clear();
    localStorage.setItem('edkt_page_views', JSON.stringify(pageViews));
    //We need to reload from local storage because its only done on construction
    viewStore._load();
    matchedAudienceStore._load();
  };

  describe('Test basic edkt run', () => {
    const sportPageFeature = {
      keywords: {
        version: 1,
        value: ['sport'],
      },
    };

    const sportAudience = makeAudienceDefinition({
      id: 'sport_id',
      definition: [makeStringArrayQuery(['sport'])],
    });

    const ONE_SPORTS_PAGE_VIEW = makePageViews(timeStampInSecs(), ['sport'], 1);

    const TWO_SPORTS_PAGE_VIEW = makePageViews(timeStampInSecs(), ['sport'], 2);

    beforeAll(clearStore);

    it('does not match with one sport page view', async () => {
      setUpLocalStorage(ONE_SPORTS_PAGE_VIEW);

      await edkt.run({
        pageFeatures: sportPageFeature,
        audienceDefinitions: [sportAudience],
        omitGdprConsent: true,
      });

      const edktPageViews = getPageViews();
      const latestKeywords =
        edktPageViews[edktPageViews.length - 1].features.keywords;

      expect(edktPageViews).toHaveLength(ONE_SPORTS_PAGE_VIEW.length + 1);
      expect(latestKeywords).toEqual({ version: 1, value: ['sport'] });
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('does match with two sport page view', async () => {
      setUpLocalStorage(TWO_SPORTS_PAGE_VIEW);

      await edkt.run({
        pageFeatures: sportPageFeature,
        audienceDefinitions: [sportAudience],
        omitGdprConsent: true,
      });

      const edktPageViews = getPageViews();
      const latestKeywords =
        edktPageViews[edktPageViews.length - 1].features.keywords;

      // The default audience condition matches on (>=) -- see engine/translate.ts
      expect(edktPageViews.length).toBeGreaterThan(sportAudience.occurrences);
      expect(latestKeywords).toEqual({ version: 1, value: ['sport'] });
      expect(getMatchedAudiences()).toHaveLength(1);
    });

    it('does not match with misconfigured audience filter / page feature', async () => {
      setUpLocalStorage(TWO_SPORTS_PAGE_VIEW);

      const misconfiguredSportAudience = makeAudienceDefinition({
        id: 'sport_id',
        definition: [
          makeCosineSimilarityQuery({
            threshold: 0.8,
            vector: [1, 1, 1],
          }),
        ],
      });

      await edkt.run({
        pageFeatures: sportPageFeature,
        audienceDefinitions: [misconfiguredSportAudience],
        omitGdprConsent: true,
      });

      expect(getMatchedAudiences()).toHaveLength(0);
    });
  });

  describe('Test look back edkt run', () => {
    const lookBackPageFeature = {
      keywords: {
        version: 1,
        value: [''],
      },
    };

    const lookBackAudience = makeAudienceDefinition({
      id: 'look_back_id',
      lookBack: 2,
      definition: [makeStringArrayQuery([''])],
    });

    const LOOK_BACK_PAGE_VIEW = makePageViews(
      timeStampInSecs(),
      [''],
      lookBackAudience.occurrences
    );

    const lookBackInfinityAudience = makeAudienceDefinition({
      id: 'look_back_infinity_id',
      lookBack: 0,
      definition: [makeStringArrayQuery([''])],
    });

    const LOOK_BACK_INFINITY_PAGE_VIEW = makePageViews(
      0,
      [''],
      lookBackInfinityAudience.occurrences
    );

    beforeAll(clearStore);

    it('does match with lookBack set to 0 with two demo page view at any point in the past', async () => {
      setUpLocalStorage(LOOK_BACK_INFINITY_PAGE_VIEW);

      await edkt.run({
        pageFeatures: lookBackPageFeature,
        audienceDefinitions: [lookBackInfinityAudience],
        omitGdprConsent: true,
      });

      const edktMatchedAudiences = edkt.getMatchedAudiences();
      expect(edktMatchedAudiences).toHaveLength(1);
      expect(edktMatchedAudiences[0].id).toEqual('look_back_infinity_id');
    });

    it('does match with lookBack set to 2 with two blank page view within look back period', async () => {
      setUpLocalStorage(LOOK_BACK_PAGE_VIEW);

      await edkt.run({
        pageFeatures: lookBackPageFeature,
        audienceDefinitions: [lookBackAudience],
        omitGdprConsent: true,
      });

      const edktMatchedAudiences = edkt.getMatchedAudiences();
      expect(edktMatchedAudiences).toHaveLength(1);
      expect(edktMatchedAudiences[0].id).toEqual('look_back_id');
    });

    it('does not match with lookBack set to 2 with two blank page view outside look back period', async () => {
      setUpLocalStorage(LOOK_BACK_INFINITY_PAGE_VIEW);

      await edkt.run({
        pageFeatures: lookBackPageFeature,
        audienceDefinitions: [lookBackAudience],
        omitGdprConsent: true,
      });

      const edktMatchedAudiences = edkt.getMatchedAudiences();
      expect(edktMatchedAudiences).toHaveLength(0);
    });
  });

  describe('Topic model run', () => {
    const topicModelPageFeature = {
      topicDist: {
        version: 1,
        value: [0.2, 0.5, 0.1],
      },
    };

    const topicModelAudience = makeAudienceDefinition({
      id: 'topic_model_id',
      lookBack: 2,
      occurrences: 1,
      definition: [
        makeVectorDistanceQuery({
          vector: [0.4, 0.8, 0.3],
          threshold: 0.5,
        }),
      ],
    });

    beforeAll(clearStore);

    it('does not match with one page view', async () => {
      await edkt.run({
        pageFeatures: topicModelPageFeature,
        audienceDefinitions: [topicModelAudience],
        omitGdprConsent: true,
      });

      const edktPageViews = getPageViews();

      expect(edktPageViews).toEqual([
        {
          ts: edktPageViews[0].ts,
          features: topicModelPageFeature,
        },
      ]);
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('does match with two page views', async () => {
      await edkt.run({
        pageFeatures: topicModelPageFeature,
        audienceDefinitions: [topicModelAudience],
        omitGdprConsent: true,
      });

      const edktPageViews = getPageViews();
      const edktMatchedAudiences = getMatchedAudiences();

      expect(edktPageViews).toEqual([
        {
          ts: edktPageViews[0].ts,
          features: topicModelPageFeature,
        },
        {
          ts: edktPageViews[1].ts,
          features: topicModelPageFeature,
        },
      ]);

      // The default audience condition matches on (>=) -- see engine/translate.ts
      expect(edktPageViews.length).toBeGreaterThan(
        topicModelAudience.occurrences
      );
      expect(edktMatchedAudiences).toEqual([
        {
          id: topicModelAudience.id,
          matchedAt: edktMatchedAudiences[0].matchedAt,
          expiresAt: edktMatchedAudiences[0].expiresAt,
          matchedOnCurrentPageView: true,
          matched: true,
        },
      ]);
    });
  });

  describe('Topic model run with additional audience', () => {
    const topicModelAudience = makeAudienceDefinition({
      id: 'iab-608',
      occurrences: 1,
      definition: [
        makeVectorDistanceQuery({
          threshold: 0.5,
          vector: [0.4, 0.8, 0.3],
        }),
      ],
    });

    const keywordsAudience = makeAudienceDefinition({
      id: 'iab-607',
      occurrences: 1,
      definition: [makeStringArrayQuery(['sport', 'Leeds United A.F.C.'])],
    });

    const pageFeatures = {
      topicDist: {
        version: 1,
        value: [0.2, 0.5, 0.1],
      },
      keywords: {
        version: 1,
        value: ['dummy'],
      },
    };

    const run = async () => {
      await edkt.run({
        pageFeatures,
        audienceDefinitions: [topicModelAudience, keywordsAudience],
        omitGdprConsent: true,
      });
    };

    beforeAll(clearStore);

    it('does match with two page views', async () => {
      await run();
      await run();

      const edktPageViews = getPageViews();
      const edktMatchedAudiences = getMatchedAudiences();

      expect(edktPageViews).toEqual([
        {
          ts: edktPageViews[0].ts,
          features: pageFeatures,
        },
        {
          ts: edktPageViews[1].ts,
          features: pageFeatures,
        },
      ]);

      // The default audience condition matches on (>=) -- see engine/translate.ts
      expect(edktPageViews.length).toBeGreaterThan(
        topicModelAudience.occurrences
      );
      expect(edktMatchedAudiences).toEqual([
        {
          id: topicModelAudience.id,
          matchedAt: edktMatchedAudiences[0].matchedAt,
          expiresAt: edktMatchedAudiences[0].expiresAt,
          matchedOnCurrentPageView: true,
          matched: true,
        },
      ]);
    });
  });

  describe('Topic model run version mismatch', () => {
    const topicModelAudience = makeAudienceDefinition({
      id: 'iab-608',
      occurrences: 1,
      definition: [
        {
          ...makeVectorDistanceQuery({
            threshold: 0.5,
            vector: [0.4, 0.8, 0.3],
          }),
          featureVersion: 2,
        },
      ],
    });

    const keywordsAudience = makeAudienceDefinition({
      id: 'iab-607',
      occurrences: 1,
      definition: [
        {
          ...makeStringArrayQuery(['sport', 'Leeds United A.F.C.']),
          featureVersion: 2,
        },
      ],
    });

    const pageFeatures = {
      topicDist: {
        version: 1,
        value: [0.2, 0.5, 0.1],
      },
      keywords: {
        version: 1,
        value: ['dummy'],
      },
    };

    const run = async () => {
      await edkt.run({
        pageFeatures,
        audienceDefinitions: [topicModelAudience, keywordsAudience],
        omitGdprConsent: true,
      });
    };

    beforeAll(clearStore);

    it('does not match with two page views since version is mismatched', async () => {
      await run();
      await run();

      const edktPageViews = getPageViews();
      const edktMatchedAudiences = getMatchedAudiences();

      expect(edktPageViews).toEqual([
        {
          ts: edktPageViews[0].ts,
          features: pageFeatures,
        },
        {
          ts: edktPageViews[1].ts,
          features: pageFeatures,
        },
      ]);

      expect(edktMatchedAudiences).toEqual([]);
    });
  });
});
