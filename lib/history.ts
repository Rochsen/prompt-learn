import type { Evaluation } from "@/lib/types";

export type HistoryChainNode = {
  evaluation: Evaluation;
  depth: number;
};

function latestInChain(
  id: string,
  byId: Map<string, Evaluation>,
  childrenMap: Map<string, Evaluation[]>
): number {
  const item = byId.get(id);
  if (!item) {
    return 0;
  }
  const children = childrenMap.get(id) ?? [];
  return children.reduce(
    (max, child) => Math.max(max, latestInChain(child.id, byId, childrenMap)),
    item.createdAt
  );
}

/** 按链内最新一条倒序排列；同一条链从初版到后续迭代依次缩进。 */
export function buildHistoryChains(items: Evaluation[]): HistoryChainNode[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const childrenMap = new Map<string, Evaluation[]>();
  const roots: Evaluation[] = [];

  for (const item of items) {
    const parentId = item.parentId;
    if (parentId === undefined || !byId.has(parentId)) {
      roots.push(item);
      continue;
    }
    const siblings = childrenMap.get(parentId) ?? [];
    siblings.push(item);
    childrenMap.set(parentId, siblings);
  }

  roots.sort(
    (a, b) =>
      latestInChain(b.id, byId, childrenMap) - latestInChain(a.id, byId, childrenMap)
  );

  const nodes: HistoryChainNode[] = [];
  const visit = (item: Evaluation, depth: number) => {
    nodes.push({ evaluation: item, depth });
    const children = [...(childrenMap.get(item.id) ?? [])].sort(
      (a, b) => a.createdAt - b.createdAt
    );
    for (const child of children) {
      visit(child, depth + 1);
    }
  };

  for (const root of roots) {
    visit(root, 0);
  }

  return nodes;
}
