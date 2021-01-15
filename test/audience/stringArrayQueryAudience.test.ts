import { edkt } from '../../src';
import {
  sportInterestAudience,
  sportKeywords,
} from '../helpers/audienceDefinitions';
import {
  getPageViews,
  getMatchedAudiences,
} from '../helpers/localStorageSetup';

describe('Test edkt audience matching', () => {
  const sportPageFeature = {
    keywords: {
      version: 1,
      value: sportKeywords,
    },
  };

  beforeAll(() => {
    // add one initial view
    edkt.run({
      pageFeatures: sportPageFeature,
      audienceDefinitions: [sportInterestAudience],
      omitGdprConsent: true,
    });
  });

  it('First run -> add page view but do not match', async () => {
    await edkt.run({
      pageFeatures: sportPageFeature,
      audienceDefinitions: [sportInterestAudience],
      omitGdprConsent: true,
    });

    expect(getPageViews()).toHaveLength(2);
    expect(getMatchedAudiences()).toHaveLength(0);
  });

  it('Second run -> add another page view & match', async () => {
    await edkt.run({
      pageFeatures: sportPageFeature,
      audienceDefinitions: [sportInterestAudience],
      omitGdprConsent: true,
    });

    expect(getPageViews()).toHaveLength(3);
    expect(getMatchedAudiences()).toHaveLength(1);
  });

  it('Third run -> add another page view & match', async () => {
    await edkt.run({
      pageFeatures: sportPageFeature,
      audienceDefinitions: [sportInterestAudience],
      omitGdprConsent: true,
    });

    expect(getPageViews()).toHaveLength(4);
    expect(getMatchedAudiences()).toHaveLength(1);
  });
});
