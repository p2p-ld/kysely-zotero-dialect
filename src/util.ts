// Ported from kysely

import {
  AliasNode,
  ColumnNode,
  IdentifierNode,
  ReferenceNode,
  SelectQueryNode,
} from 'kysely';

export function freeze<T>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

// Infer names of columns from the query
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
export function unpackRowProxy<R>(
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
