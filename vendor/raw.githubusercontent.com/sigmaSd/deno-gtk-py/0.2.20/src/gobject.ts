import { Callback } from "../mod.ts";

export interface GObject {
  connect(signal: string, callback: Callback): void;
}
