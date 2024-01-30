import { python } from "./src/python.ts";
export * from "./src/python.ts";

import * as Gtk4_ from "./src/gtk4.ts";
import * as Adw1_ from "./src/adw1.ts";
import * as Gdk4_ from "./src/gdk4.ts";
import * as Gio2_ from "./src/gio2.ts";
import * as GLib2_ from "./src/glib2.ts";

export { Adw1_, Gdk4_, Gio2_, GLib2_, Gtk4_ };
export * as GObject2_ from "./src/gobject2.ts";

const gi = python.import("gi");
gi.require_version("Gtk", "4.0");
gi.require_version("Adw", "1");
export const Gtk4: Gtk4_.Gtk = python.import("gi.repository.Gtk");
export const Adw1: Adw1_.Adw = python.import("gi.repository.Adw");
export const Gdk4: Gdk4_.Gdk = python.import("gi.repository.Gdk");
export const Gio2: Gio2_.Gio = python.import("gi.repository.Gio");
export const GLib2: GLib2_.GLib = python.import("gi.repository.GLib");
