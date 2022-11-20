import Model, { DateView, DirectoryNode, DirectoryView, Node, NodeType, PseudoDirectoryNode, PseudoNode, ReservedID, TagView, ViewType } from './model';

export interface Depth {
  depth: number;
}

export type NestedNodeArray = (((Node | PseudoNode) & Depth) | NestedNodeArray)[];

export function createTree(model: Model, parentID: string | undefined, depth = 0): NestedNodeArray {
  const node = model.getNode(parentID) as (DirectoryNode | PseudoDirectoryNode) & Depth;
  node.depth = depth;
  const children: NestedNodeArray = [];

  for (const child of model.getChildNodes(parentID)) {
    if (child.type == NodeType.Directory) {
      children.push(createTree(model, child.id, depth + 1));
    }
  }

  return [node, children];
}