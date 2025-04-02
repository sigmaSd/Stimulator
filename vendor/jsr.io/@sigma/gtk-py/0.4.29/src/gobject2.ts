import type { Callback } from "../mod.ts";

export interface Object {
  connect(signal: string, callback: Callback): void;
  TYPE_NONE: GType;
}

// deno-lint-ignore no-empty-enum
export enum GType {
}
