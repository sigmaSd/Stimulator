import { python } from "https://deno.land/x/python@0.4.3/mod.ts";
export * from "https://deno.land/x/python@0.4.3/mod.ts";

import * as Gtk_ from "./src/gtk.ts";
import * as Adw_ from "./src/adw.ts";
import * as Gdk_ from "./src/gdk.ts";
import * as Gio_ from "./src/gio.ts";
import * as GLib_ from "./src/glib.ts";
export * as Gtk_ from "./src/gtk.ts";
export * as Adw_ from "./src/adw.ts";
export * as Gdk_ from "./src/gdk.ts";
export * as Gio_ from "./src/gio.ts";
export * as GLib_ from "./src/glib.ts";
export * as GObject_ from "./src/gobject.ts";

const gi = python.import("gi");
gi.require_version("Gtk", "4.0");
gi.require_version("Adw", "1");
export const Gtk: Gtk_.Gtk = python.import("gi.repository.Gtk");
export const Adw: Adw_.Adw = python.import("gi.repository.Adw");
export const Gdk: Gdk_.Gdk = python.import("gi.repository.Gdk");
export const Gio: Gio_.Gio = python.import("gi.repository.Gio");
export const GLib: GLib_.GLib = python.import("gi.repository.GLib");
