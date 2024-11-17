import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  SelectQueryNode,
  SqliteDatabase,
} from 'kysely';

export class ZoteroDatabaseConnection implements DatabaseConnection {
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
