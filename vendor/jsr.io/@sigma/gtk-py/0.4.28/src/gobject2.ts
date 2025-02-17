import type { Callback } from "../mod.ts";

export interface Object {
  connect(signal: string, callback: Callback): void;
  TYPE_NONE: GType;
}

export enum GType {
}
