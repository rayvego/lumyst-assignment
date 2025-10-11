declare module "elkjs/lib/elk.bundled.js" {
  import type { ElkConstructor } from "elkjs";
  const ELK: ElkConstructor;
  export default ELK;
}

declare module "elkjs/lib/elk-api" {
  export interface ElkExtendedEdge {
    id: string;
    sources: string[];
    targets: string[];
  }

  export interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: ElkNode[];
    edges?: ElkExtendedEdge[];
    layoutOptions?: Record<string, string>;
  }
}
