import type { Callback, Gtk_ } from "../mod.ts";

export interface Gio {
  Menu: Menu;
  SimpleAction: SimpleAction;
  ListStore: ListStore;
}
export interface Menu {
  new: () => Menu;
  append(arg0: string, arg1: string): void;
}
export interface SimpleAction {
  // deno-lint-ignore no-explicit-any
  new: (name: string, arg?: any) => SimpleAction;
  connect(signal: "activate", callback: Callback): void;
}

export interface ListStore {
  //FIXME: Gio.ListStore.new(Gtk.FileFilter)
  // takes a type instead of a value
  // deno-lint-ignore no-explicit-any
  new: (filter: any) => ListStore;
  append(f: Gtk_.FileFilter): void;
}
export interface File {
  get_path(): { valueOf: () => string };
}
