import {SqliteQueryCompiler, CreateIndexNode} from 'kysely';

export class ZoteroQueryCompiler extends SqliteQueryCompiler {
  protected override visitCreateIndex(node: CreateIndexNode): void {
    // Override to correctly place the database name before the index name
    this.append('create ');

    if (node.unique) {
      this.append('unique ');
    }

    this.append('index ');

    if (node.ifNotExists) {
      this.append('if not exists ');
    }

    if (node.table?.table.schema) {
      this.visitNode(node.table.table.schema);
      this.append('.');
      this.visitNode(node.name);
      this.append(' on ');
      this.visitNode(node.table.table.identifier);
    } else if (node.table) {
      this.visitNode(node.name);
      this.append(' on ');
      this.visitNode(node.table);
    } else {
      this.visitNode(node.name);
    }

    if (node.using) {
      this.append(' using ');
      this.visitNode(node.using);
    }

    if (node.columns) {
      this.append(' (');
      this.compileList(node.columns);
      this.append(')');
    }

    if (node.nullsNotDistinct) {
      this.append(' nulls not distinct');
    }

    if (node.where) {
      this.append(' ');
      this.visitNode(node.where);
    }
  }
}
