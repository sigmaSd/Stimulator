import type { Callback, Gio2_ as Gio, GLib2_ as GLib } from "../mod.ts";

export interface Gdk {
  Display: Display;
  DragAction: {
    COPY: DragAction;
  };
  KEY_v: {
    valueOf(): number;
  };
  ModifierType: {
    CONTROL_MASK: ModifierType;
  };
  ContentProvider: ContentProvider;
}

export interface Display {
  get_default(): Display;
  get_clipboard(): Clipboard;
}

export interface Texture {
  save_to_png: (filename: string) => void;
}

export enum DragAction {
  COPY = 1,
  MOVE = 2,
  LINK = 4,
  ASK = 8,
}

export interface Clipboard {
  read_text_async: (cancellable: any, callback: Callback) => void;
  read_text_finish: (result: Gio.AsyncResult) => { valueOf: () => string };
  read_async: (
    mimeTypes: string[],
    io_priority: number,
    cancellable: any,
    callback: Callback,
  ) => void;
  read_finish: (result: Gio.AsyncResult) => [any, { valueOf: () => string }];
  read_texture_async: (
    cancellable: any,
    callback: Callback,
  ) => void;
  read_texture_finish: (result: Gio.AsyncResult) => Texture;
  set_content(provider: ContentProvider): boolean;
  //TODO: value is GObject.Value
  set(value: string): void;
}

export interface ContentProvider {
  new_for_bytes(mime_type: string, bytes: GLib.Bytes): ContentProvider;
}

export enum ModifierType {
  CONTROL_MASK = 4,
}
