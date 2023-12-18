import type { Callback } from "../mod.ts";

export interface GLib {
  PRIORITY_HIGH: number;
  unix_signal_add(priority: number, signal: any, callback: Callback): unknown;
  timeout_add(
    milliseconds: number,
    callback: Callback,
  ): { valueOf: () => number };
  set_application_name(name: string): void;
}
