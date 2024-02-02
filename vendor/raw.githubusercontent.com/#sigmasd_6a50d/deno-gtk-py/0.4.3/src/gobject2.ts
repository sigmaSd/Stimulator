import { Callback } from "../mod.ts";

export interface Object {
  connect(signal: string, callback: Callback): void;
}
