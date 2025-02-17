import type { Callback, GLib2_, Gtk4_ } from "../mod.ts";

export interface Gio {
  Notification: { new: (title: string) => Notification };
  DBusProxyFlags: {
    NONE: DBusProxyFlags.NONE;
  };
  BusType: { SESSION: BusType.SESSION };
  DBusProxy: DBusProxy;
  SubprocessFlags: {
    STDIN_PIPE: SubprocessFlags.STDIN_PIPE;
    STDOUT_PIPE: SubprocessFlags.STDOUT_PIPE;
  };
  Subprocess: Subprocess;
  Menu: Menu;
  SimpleAction: SimpleAction;
  ListStore: ListStore;
  File: File;
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
  append(f: Gtk4_.FileFilter): void;
}

// deno-lint-ignore no-empty-interface
export interface ListModel {
}

export interface File {
  new_for_uri(uri: string): File;
  get_path(): { valueOf: () => string };
  load_contents(): [{ valueOf: () => boolean }, any];
}

export interface Subprocess {
  new: (argv: string[], flags: SubprocessFlags) => Subprocess;
  get_stdin_pipe(): OutputStream;
  get_stdout_pipe(): InputStream;
}

export interface SubprocessFlags {
  __or__: (other: SubprocessFlags) => SubprocessFlags;
}
// deno-lint-ignore no-namespace
export namespace SubprocessFlags {
  // deno-lint-ignore no-empty-interface
  export interface STDIN_PIPE extends SubprocessFlags {
  }
  // deno-lint-ignore no-empty-interface
  export interface STDOUT_PIPE extends SubprocessFlags {
  }
}

export interface OutputStream {
  write_all_async(buffer: number[], io_priority: number): void;
}
export interface InputStream {
  read_bytes_async(
    count: number,
    ioPriority: number,
    cancellable: undefined,
    callback: Callback,
  ): void;
  read_bytes_finish(asyncResult: AsyncResult): GLib2_.Bytes;
}

// deno-lint-ignore no-empty-interface
export interface AsyncResult {}

export interface DBusProxy {
  new_for_bus_sync(
    bus_type: BusType,
    flags: DBusProxyFlags,
    // deno-lint-ignore no-explicit-any
    info: any,
    name: string,
    object_path: string,
    interface_name: string,
  ): DBusProxy;
  Inhibit(
    type: string,
    name: string,
    reason: string,
  ): { valueOf: () => number | undefined };
  UnInhibit(type: string, cookie: number): void;
}

export enum BusType {
  SESSION = 2,
}
export enum DBusProxyFlags {
  NONE = 0,
}

export interface Notification {
  set_body(body: string): void;
}
