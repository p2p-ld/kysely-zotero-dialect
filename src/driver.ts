import {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  QueryResult,
  SelectQueryNode,
  SqliteDatabase,
} from 'kysely';
import {ZoteroDialectConfig} from './config';
import {ZoteroDatabaseConnection} from './connection';
import {freeze} from './util';

export class ZoteroSqliteDriver implements Driver {
  readonly #config: ZoteroDialectConfig;
  readonly #connectionMutex = new ConnectionMutex();

  #db?: SqliteDatabase;
  #connection?: ZoteroDatabaseConnection;

  constructor(config: ZoteroDialectConfig) {
    this.#config = freeze({...config});
  }

  async init(): Promise<void> {
    await Zotero.DB.queryAsync('ATTACH DATABASE ? AS ?', [
      this.#config.db_path,
      this.#config.db_name,
    ]);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.#connectionMutex.lock();
    return this.#connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'));
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    this.#db?.close();
  }
}

class SqliteConnection implements DatabaseConnection {
  readonly #db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.#db = db;
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const {sql, parameters} = compiledQuery;
    const stmt = this.#db.prepare(sql);

    if (stmt.reader) {
      return Promise.resolve({
        rows: stmt.all(parameters) as O[],
      });
    } else {
      const {changes, lastInsertRowid} = stmt.run(parameters);

      const numAffectedRows =
        changes !== undefined && changes !== null ? BigInt(changes) : undefined;

      return Promise.resolve({
        // TODO: remove.
        numUpdatedOrDeletedRows: numAffectedRows,
        numAffectedRows,
        insertId:
          lastInsertRowid !== undefined && lastInsertRowid !== null
            ? BigInt(lastInsertRowid)
            : undefined,
        rows: [],
      });
    }
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    const {sql, parameters, query} = compiledQuery;
    const stmt = this.#db.prepare(sql);
    if (SelectQueryNode.is(query)) {
      const iter = stmt.iterate(parameters) as IterableIterator<R>;
      for (const row of iter) {
        yield {
          rows: [row],
        };
      }
    } else {
      throw new Error(
        'Sqlite driver only supports streaming of select queries',
      );
    }
  }
}

class ConnectionMutex {
  #promise?: Promise<void>;
  #resolve?: () => void;

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise;
    }

    this.#promise = new Promise(resolve => {
      this.#resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.#resolve;

    this.#promise = undefined;
    this.#resolve = undefined;

    resolve?.();
  }
}
