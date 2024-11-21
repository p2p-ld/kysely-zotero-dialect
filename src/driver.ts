import {CompiledQuery, DatabaseConnection, Driver} from 'kysely';
import {ZoteroDialectConfig} from './config';
import {ZoteroDatabaseConnection} from './connection';
import {freeze} from './util';

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

export class ZoteroSqliteDriver implements Driver {
  static readonly connectionMutex = new ConnectionMutex();

  readonly config: ZoteroDialectConfig;
  readonly abs_path: string;

  connection?: ZoteroDatabaseConnection;

  constructor(config: ZoteroDialectConfig) {
    this.config = freeze({...config});
    this.abs_path = PathUtils.join(
      Zotero.DataDirectory.dir,
      this.config.db_path,
    );
  }

  async init(): Promise<void> {
    // FIXME: Need to check if database already attached here
    // this gets called every transaction, not on instantiation
    await Zotero.DB.queryAsync('ATTACH DATABASE ? AS ?', [
      this.abs_path,
      this.config.db_name,
    ]);

    this.connection = new ZoteroDatabaseConnection();
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await ZoteroSqliteDriver.connectionMutex.lock();
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
    ZoteroSqliteDriver.connectionMutex.unlock();
  }

  async destroy(): Promise<void> {
    // Nothing to be done.
  }
}
