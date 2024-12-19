import {
  Driver,
  Kysely,
  QueryCompiler,
  Dialect,
  DatabaseIntrospector,
  SqliteIntrospector,
  DialectAdapter,
  SqliteAdapter,
} from 'kysely';

import {ZoteroDialectConfig} from './config';
import {ZoteroSqliteDriver} from './driver';
import {ZoteroQueryCompiler} from './query-compiler';
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
    return new ZoteroQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
