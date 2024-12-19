import {
  Generated,
  Kysely,
  Migration,
  MigrationProvider,
  Migrator,
} from 'kysely';
import {ZoteroDialect, ZoteroDialectConfig} from '../../src';

export const DB_PATH = PathUtils.join(Zotero.DataDirectory.dir, 'test.sqlite');

export interface Database {
  table_a: TableA;
  table_b: TableB;
}

interface TableA {
  id: Generated<number>;
  value_a: string;
}

interface TableB {
  id: Generated<number>;
  value_b: Generated<number>;
}

const migration: Migration = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  up: async (db: Kysely<any>): Promise<void> => {
    await db.schema
      .createTable('table_a')
      .addColumn('id', 'integer', col => col.primaryKey())
      .addColumn('value_a', 'text')
      .execute();

    await db.schema
      .createTable('table_b')
      .addColumn('id', 'integer', col => col.primaryKey())
      .addColumn('value_a', 'text')
      .execute();
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  down: async (db: Kysely<any>): Promise<void> => {
    await db.schema.dropTable('table_a');
    await db.schema.dropTable('table_b');
  },
};
export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return {
      '001': migration,
    };
  },
};
export const config: ZoteroDialectConfig = {
  db_name: 'test',
};

export async function createDB(): Promise<Kysely<Database>> {
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
  return db;
}
