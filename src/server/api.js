import Debug from 'debug';
import _ from 'lodash';
import KindredApi from 'kindred-api';

const debug = Debug('league-tooltips:api');

class Api {
  constructor(apiKey, region, { cache = { TTL: 60 * 60 * 12 }, prod = false }) {
    debug('Initializing API');

    this.api = new KindredApi.Kindred({
      key: apiKey,
      defaultRegion: region,
      debug: !prod,
      showKey: true,
      showHeaders: false,
      limits: prod ? KindredApi.LIMITS.PROD : KindredApi.LIMITS.DEV,
      spread: false,
      retryOptions: {
        auto: true,
        numberOfRetriesBeforeBreak: 3,
      },
      timeout: 5000,
      cache: cache.redis
        ? new KindredApi.RedisCache({
          host: cache.redis.host || 'localhost',
          port: cache.redis.port || 6379,
          keyPrefix: cache.redis.prefix || 'league-tooltips_',
        })
        : new KindredApi.InMemoryCache(),
      cacheTTL: {
        STATIC: cache.TTL,
      },
    });

    debug('Initialized API');
  }

  getSources() {
    return {
      champion: async (id, locale) => {
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['tags', 'stats', 'image', 'passive', 'spells', 'info'],
            locale,
          },
        };
        const data = await this.api.Static.champion(config);
        return data;
      },
      item: async (id, locale) => {
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['tags', 'image', 'gold'],
            locale,
          },
        };
        const data = await this.api.Static.item(config);
        return data;
      },
      summonerspell: async (id, locale) => {
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['image', 'rangeBurn', 'cooldownBurn', 'modes'],
            locale,
          },
        };
        const data = await this.api.Static.spell(config);
        return data;
      },
      rune: async (id, locale) => {
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['tags', 'image'],
            locale,
          },
        };
        const data = await this.api.Static.rune(config);
        return data;
      },
      mastery: async (id, locale) => {
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['ranks', 'image', 'masteryTree'],
            locale,
          },
        };
        const data = await this.api.Static.mastery(config);
        return data;
      },
      championspell: async (spellId, locale) => {
        const spells = ['Q', 'W', 'E', 'R'];
        const id = spellId.split('.')[0];
        const key = spellId.split('.')[1];
        const spellIndex = _.indexOf(spells, key);
        if (spellIndex === -1) {
          throw new Error('Invalid spell key');
        }
        const config = {
          id: parseInt(id, 10),
          options: {
            tags: ['tags', 'stats', 'image', 'passive', 'spells', 'info'],
            locale,
          },
        };
        const data = await this.api.Static.champion(config);
        return data.spells[spellIndex];
      },
    };
  }

  async getPatchVersion() {
    debug('Api.getPatchVersion() call');
    const patches = await this.api.Static.versions();
    const patchVersion = _.first(patches);
    debug('Patch version', patchVersion);
    return patchVersion;
  }

  async getLocale(locale) {
    debug('Api.getLocales() call');
    const locales = await this.api.Static.getLanguageStrings({ locale });
    const localeData = locales.data;
    return localeData;
  }

  /**
   * Gets the datas to render according to the given data type.
   * Data types only have these values :
   * 'champion', 'item', 'summonerspell', 'rune', 'mastery' and 'championspell'.
   * @param {string} dataType Defines the informations to retrieve andto render.
   * @param {string} id String defining an unique data item.
   * e.g.: "103" for a champion, "103.Q" for a champion spell ...
   * @param {string} locale Defines what language strings will be queried.
   */
  async getData(dataType, id, locale = 'en_US') {
    debug('Api.getData() call', dataType, id, locale);

    const dataSources = this.getSources();
    if (!{}.hasOwnProperty.call(dataSources, dataType)) {
      throw new Error(`unknown data type : ${dataType}`);
    }

    const dataQuery = dataSources[dataType];
    const data = await dataQuery(id, locale);

    return {
      dataType,
      id,
      data,
    };
  }
}

export default Api;
