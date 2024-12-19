# CHANGELOG

## 0.2.*

### 0.2.0 - ATTACH no more!

No more ATTACH-ing: we can now create independent sqlite databases, so prepending the db name is no longer required
and there is no risk of fouling up the zotero db by accident!

Each DB connection now has an independent mutex, so multiple DBs can be use asynchronously 
and plugins should not interfere with one another.

We also have a basic set of tests thanks to the excellent `zotero-plugin-scaffold` :)

## 0.1.*

### 0.1.1 - 24-12-17

- bugfix: correct type narrowing for void | object[] type when unpacking
- bugfix: kysely as a peerDependency rather than direct dependency

### 0.1.0 - 24-12-04

Initial version with basic query functionality :)

First npm package so we'll see how this goes...
