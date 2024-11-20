import {
  Driver,
  Kysely,
  QueryCompiler,
  Dialect,
  DatabaseIntrospector,
  SqliteIntrospector,
  DialectAdapter,
  SqliteAdapter,
  SqliteQueryCompiler,
} from 'kysely';

import {ZoteroDialectConfig} from './config';
import {ZoteroSqliteDriver} from './driver';
import {freeze} from './util';

/**
 * document
 * me
 * baby
 */
export class ZoteroDialect implements Dialect {
  readonly #config: ZoteroDialectConfig;

  constructor(config: ZoteroDialectConfig) {
    this.#config = freeze({...config});
  }

  createDriver(): Driver {
    return new ZoteroSqliteDriver(this.#config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
