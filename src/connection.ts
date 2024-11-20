import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  SelectQueryNode,
} from 'kysely';

export class ZoteroDatabaseConnection implements DatabaseConnection {
  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const {sql, parameters, query} = compiledQuery;

    if (SelectQueryNode.is(query)) {
      return {
        rows: (await Zotero.DB.queryAsync(sql, parameters)) as O[],
      };
    } else {
      await Zotero.DB.queryAsync(sql, parameters);
      const statement = 'SELECT last_insert_rowid() AS lastInsertRowID';
      const lastInsertRowID = await Zotero.DB.queryAsync(statement, []);

      return {
        insertId:
          lastInsertRowID && 'lastInsertRowID' in lastInsertRowID
            ? // eslint-disable-next-line n/no-unsupported-features/es-builtins
              BigInt(lastInsertRowID!.lastInsertRowID as number)
            : undefined,
        rows: [],
      };
    }
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery,
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    // This could be done with the `onRow` callback, but not implementing for now
    // https://devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Sqlite.jsm.html
    throw new Error(
      'ZoteroSqliteDriver does not support streaming queries yet',
    );
  }
}
