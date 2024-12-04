import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  SelectQueryNode,
} from 'kysely';
import {unpackRowProxy} from './util';

export class ZoteroDatabaseConnection implements DatabaseConnection {
  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const {sql, parameters, query} = compiledQuery;

    if (SelectQueryNode.is(query)) {
      const proxyRows = await Zotero.DB.queryAsync(sql, parameters);
      try {
        return {
          rows: unpackRowProxy<O>(proxyRows, query),
        };
      } catch (error) {
        Zotero.log(
          'Could not get row names, returning Zotero Proxy object, which can directly access attributes but otherwise does not have the rest of the Object methods',
        );
        return {
          rows: proxyRows as O[],
        };
      }
    } else {
      await Zotero.DB.queryAsync(sql, parameters);
      // const statement = 'SELECT last_insert_rowid() AS lastInsertRowID';
      // const lastInsertRowID = await Zotero.DB.queryAsync(statement, []);

      return {
        // insertId:
        //   lastInsertRowID && 'lastInsertRowID' in lastInsertRowID
        //     ? // eslint-disable-next-line n/no-unsupported-features/es-builtins
        //       BigInt(lastInsertRowID!.lastInsertRowID as number)
        //     : undefined,
        rows: [],
      };
    }
  }

  async *streamQuery<R>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compiledQuery: CompiledQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _chunkSize: number,
  ): AsyncIterableIterator<QueryResult<R>> {
    // This could be done with the `onRow` callback, but not implementing for now
    // https://devdoc.net/web/developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Sqlite.jsm.html
    yield {
      rows: [],
    };
    throw new Error(
      'ZoteroSqliteDriver does not support streaming queries yet',
    );
  }
}
