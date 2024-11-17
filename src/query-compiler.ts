import {SqliteQueryCompiler, FromNode} from 'kysely';

export class ZoteroQueryCompiler extends SqliteQueryCompiler {
  /*
   * TODO: Append the database name to every `from` query
   */
  protected override visitFrom(node: FromNode) {
    // this.append('from ');
    // this.compileList(node.froms);
    super.visitFrom(node);
  }

  // protected override compileList(
  //   nodes: ReadonlyArray<OperationNode>,
  //   separator = ', ',
  // ): void {
  //   const lastIndex = nodes.length - 1;
  //
  //   for (let i = 0; i <= lastIndex; i++) {
  //     this.visitNode(nodes[i]);
  //
  //     if (i < lastIndex) {
  //       this.append(separator);
  //     }
  //   }
  // }
}
