# kysely-zotero-dialect

![NPM Version](https://img.shields.io/npm/v/kysely-zotero-dialect)

Use kysely within a zotero plugin.

This is a very thin wrapper around Zotero's query methods that allows
you to use kysely as a query generator within Zotero, despite the XPCOM
plugin environment not supporting any of the node-dependent SQL drivers.

This allows you to make reasonably maintainable sidecar databases with migrations
and type-safe schemas and queries without needing to patch into the zotero database
or invent your own data storage system.

## Approach

We create a new sqlite database in Zotero's data directory using the name of the database,
such that a `db_name: foo` will create `{DATA_DIR}/foo.sqlite`.
All queries are then independent of Zotero's main database,
but can still use the packaged XUL/XPCOM sqlite driver.

## Installation

ya know how to do this part, but for your copy pasting:

```shell
npm add kysely-zotero-dialect
# or
yarn add kysely-zotero-dialect
```

## Usage

Say we have...

- A plugin: `demo`
- A database table: `demo_table`
- A sqlite database `{zotero_data_dir}/demo.sqlite`

### Declare Models

Declare typescript models as you normally would with kysely:

`src/schema.ts`
```ts
import { Generated, Insertable, Selectable, Updateable } from "kysely";
export interface Database {
  demo_table: demoTable;
}

export interface demoTable {
  id: Generated<number>;
  cool_value: string;
}

export type Demo = Selectable<demoTable>;
export type NewDemo = Insertable<demoTable>;
export type DemoUpdate = Updateable<demoTable>;
```

### Write Migrations

Assuming you are starting a new project,
the easiest way to initialize a database is to use kysely migrations
(and you should probably add migrations into your plugin's bootstrap method anyway).

Since someone using our plugin will not have the repository,
and most typescript plugins are compiled into a single file (at least currently)
we should provide migrations programmatically in the plugin package
rather than use migration that depends on the file structure of the migrations.

`src/migrations/001_test.ts`
```ts
import type { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("demo_table")
    .addColumn("id", "integer", (col) => col.primaryKey())
    .addColumn("cool_value", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("a_table").execute();
}
```

`src/migrations/index.ts`
```ts
import * as m001 from "./001_test";
// so in the future you can do...
// import * as m002 from "./002_add_doi";

import { Migration, MigrationProvider } from "kysely";

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
export const migrations: Record<string, Migration> = {
  "001": m001,
  // "002": m002,
};
```

### Initializing a Database

A database is configured with a `ZoteroDialectConfig` like:

```ts
export interface ZoteroDialectConfig {
  db_name: string;
}
```

such that a database is created in `{zotero_data_directory}/{db_name}`, like `~/Zotero/demo.sqlite`

`src/db.ts`
```ts
import { Kysely } from "kysely";
import { ZoteroDialect } from "kysely-zotero-dialect";

import { Database } from "./schema";
import { migrationProvider } from "./migrations/index";

export const initDB = async (): Promise<Kysely<Database>> => {
  return new Kysely<Database>({
    dialect: new ZoteroDialect({
      db_name: "demo",
    })
  });
};

export const migrateDB = async (db: Kysely<Database>) => {
  const migrator = new Migrator({
    db,
    provider: migrationProvider,
  });
  let { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export const createDB = async (): Promise<Kysely<Database>> => {
  let db = initDB();
  migrateDB(db);
  return db
}
```

### Integrating with bootstrap plugins

You'll probably want to migrate the database to create/update it when installing,
and initialize it on startup!

`src/bootstrap.ts`
```ts
import { createDB, initDB } from './db'

export async function install(): Promise<void> {
  // ...
  createDB();
  // ...
}

export async function startup({id, version, resourceURI, rootURI = resourceURI.spec}){
  // ...
  // actually probably have this in your DemoPlugin.init() method
  // and not literally here, but for the sake of illustrating timing...
  let Demo = new DemoPlugin();
  Demo.db = initDB();
  Zotero.Demo = Demo;
  // ...
}
```

### Create/Read Data

Now you're just using kysely normally!

```ts
async function insert(db: Kysely<Database>) {
  db
    .insertInto("a_table")
    .values({cool_value: "hey"})
    .returningAll()
    .executeTakeFirstOrThrow();
}

async function select(db: Kysely<Database>) {
  return await db
    .selectFrom("a_table")
    .where("cool_value", "=", "hey")
    .select(['id', 'cool_value'])
    .execute();
}
```

## Zotero Schema Models

Zotero schema models are included in the `models` module and can be used like this

```ts
import { models } from "kysely-zotero-dialect";

const zotero_db = new Kysely<models.DB>({
  dialect: new ZoteroDialect({db_name: 'zotero'}),
});
```

which allows you to make type-safe queries directly to the Zotero database tables,
however this is *not recommended* since using the zotero database directly
is substantially more complicated and error-prone than using the Zotero API.

These models are *not* guaranteed to be up to date, though they do include
a `MODEL_VERSIONS` const that should allow you to check if they are if you
want to use them or PR an update to them.

## Caveats

### Return Object Types

Amazingly, the Mozilla XUL Sqlite3 driver's [`mozIStorageRow`](https://devdoc.net/web/developer.mozilla.org/en-US/docs/MozIStorageRow.html)
object can't [return the names of selected columns](https://bugzilla.mozilla.org/show_bug.cgi?id=1326565),
and Zotero [wraps them in a proxy object](https://github.com/zotero/zotero/blob/8317f7783783a672b2b30a9b041a611ded98aa61/chrome/content/zotero/xpcom/db.js#L644-L670)
rather than properly handling the query. 

We attempt to rescue this by introspecting the query, but as a result we are unable to infer
columns from a `selectAll()` (aka `SELECT * FROM table`) query. When a `selectAll()` query is used,
we return the zotero proxy object, which can select columns if they are known in advance,
but otherwise does not have any other `Object` methods aside from `get`.

## Development

### Development Status

This software is in **PERPETUAL ALPHA**:

We do not guarantee any functionality,
nor do we claim to be particularly good at writing javascript.
Hell, we don't even know how to test the code because it all runs
within Zotero.

PRs are welcome to fix whatever you want,
and you are welcome to open any issues as a place of discussion,
but unless it's very obvious to us how to fix something,
an issue without a PR will likely be left open.


### Generating Models

Use the `generate-models` script :)

Before you do, you should update Zotero and create a [fresh profile](https://www.zotero.org/support/kb/multiple_profiles):

```shell
/location/of/zotero -P
```

and then pass the location of the created database to the script

```shell
yarn run generate-models --db /location/of/zotero.sqlite
```

or call it with python directly from the repo root

```shell
python scripts/generate_models.py --db /location/of/zotero.sqlite
```
