import { viewStore } from '../src/store';
import { edkt } from '../src';
import { getPageViews } from './helpers/localStorageSetup';

describe('feature cleaning behaviour', () => {
  const vendorIds = [873];
  const omitGdprConsent = true;

  const oldFeatures = {
    keywords: {
      version: 1,
      value: ['Haskell Curry', 'death', 'combinatory logic'],
    },
  };

  const newFeatures = {
    keywords: {
      version: 1,
      value: ['virus', 'politics', 'ai'],
    },
  };

  beforeAll(() => {
    viewStore._load();
  });

  afterAll(() => {
    localStorage.clear();
  });

  it('should delete old pageView entries', async () => {

    // Stub Date object
    jest.spyOn(global.Date, 'now')
    .mockImplementationOnce(
      () => new Date('1982-09-01T09:00:00.333Z').valueOf()
    )

    // runs fist time in 1982
    await edkt.run({
      pageFeatures: oldFeatures,
      audienceDefinitions: [],
      omitGdprConsent,
      vendorIds,
    });

    expect(getPageViews()).toHaveLength(1)

    // time has passed...

    // run second time with current timestamp
    await edkt.run({
      pageFeatures: newFeatures,
      audienceDefinitions: [],
      omitGdprConsent,
      vendorIds,
    });

    expect(getPageViews()).toHaveLength(2)

    // the module is loaded again
    viewStore._trim()

    const edktPageViews = getPageViews();

    expect(edktPageViews).toEqual([
      {
        features: newFeatures,
        ts: edktPageViews[0].ts,
      },
    ]);
  });
});
