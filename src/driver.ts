import {CompiledQuery, DatabaseConnection, Driver} from 'kysely';
import {ZoteroDialectConfig} from './config';
import {ZoteroDatabaseConnection} from './connection';
import {freeze} from './util';

export class ZoteroSqliteDriver implements Driver {
  readonly connectionMutex = new ConnectionMutex();

  readonly config: ZoteroDialectConfig;
  readonly abs_path: string;

  db?: typeof Zotero.DB;
  connection?: ZoteroDatabaseConnection;

  constructor(config: ZoteroDialectConfig) {
    this.config = freeze({...config});
    this.abs_path = PathUtils.join(
      Zotero.DataDirectory.dir,
      `${this.config.db_name}.sqlite`,
    );
  }

  async init(): Promise<void> {
    this.db = new Zotero.DBConnection(this.config.db_name);

    this.connection = new ZoteroDatabaseConnection(this.db!);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.connectionMutex.lock();
    return this.connection!;
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
    this.connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    if (!(typeof this.db === 'undefined')) {
      await this.db.closeDatabase(false);
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
