import type { Callback } from "../mod.ts";

export interface GLib {
  PRIORITY_HIGH: number;
  PRIORITY_DEFAULT: number;
  set_application_name(name: string): void;
  unix_signal_add(priority: number, signal: string, callback: Callback): void;
  timeout_add(
    milliseconds: number,
    callback: Callback,
  ): { valueOf: () => number };
  idle_add(callback: Callback): void;
  Bytes: {
    new (data: number[]): Bytes;
  };
}

export interface Bytes {
  get_data(): { decode(encoding: "utf-8"): string };
}
