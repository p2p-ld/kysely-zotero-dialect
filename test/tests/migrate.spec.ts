import {Kysely, Migrator} from 'kysely';
import {ZoteroDialect} from '../../src';
import {assert} from 'chai';
import {config, Database, DB_PATH, migrationProvider} from '../fixtures/db';

describe('Migrate', () => {
  it('creates and migrates the db', async () => {
    const db = new Kysely<Database>({
      dialect: new ZoteroDialect(config),
    });
    const migrator = new Migrator({
      db,
      provider: migrationProvider,
    });
    const {error} = await migrator.migrateToLatest();
    if (error) {
      throw error;
    }

    assert.isOk(await IOUtils.exists(DB_PATH));
    // can't dump db schema at the moment, we'll test for correctness in query tests
  });
});
