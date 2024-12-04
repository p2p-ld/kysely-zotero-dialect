import {
  CompiledQuery,
  DatabaseConnection,
  QueryResult,
  SelectQueryNode,
  ReferenceNode,
  ColumnNode,
  AliasNode,
  IdentifierNode,
} from 'kysely';

// Adapted from https://github.com/kysely-org/kysely/blob/3c2d268b765909fd97af1bbe34f1de31670afdda/src/util/json-object-args.ts#L11
export function getJsonObjectArgs(node: SelectQueryNode): string[] {
  const args: string[] = [];

  for (const {selection: s} of node.selections ?? []) {
    if (ReferenceNode.is(s) && ColumnNode.is(s.column)) {
      args.push(s.column.column.name);
    } else if (ColumnNode.is(s)) {
      args.push(s.column.name);
    } else if (AliasNode.is(s) && IdentifierNode.is(s.alias)) {
      args.push(s.alias.name);
    } else {
      const err = new Error(
        "'SQLite jsonArrayFrom and jsonObjectFrom functions can only handle explicit selections due to limitations of the json_object function. selectAll() is not allowed in the subquery.',\n",
      );
      Zotero.warn(err);
      throw err;
    }
  }

  return args;
}

// Try to convert a zotero row proxy object into a regular JS object
function unpackRowProxy<R>(
  proxyRows: object[] | undefined,
  query: SelectQueryNode,
) {
  const col_names = getJsonObjectArgs(query);

  const rows =
    proxyRows === undefined
      ? undefined
      : proxyRows.map(row => {
          const row_obj = {};
          col_names.forEach(col_name => {
            row_obj[col_name] = row[col_name];
          });
          return row_obj;
        });
  return rows as R[];
}

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
