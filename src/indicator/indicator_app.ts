// This is a standalone application for the tray
// It have is own imports
import {
  AppIndicator3,
  Gtk3_ as Gtk_,
  NamedArgument,
  python,
} from "deno-gtk-py";
import { MESSAGES } from "./messages.ts";

const gi = python.import("gi");
gi.require_version("Gtk", "3.0");
gi.require_version("AppIndicator3", "0.1");
const Gtk: Gtk_.Gtk = python.import("gi.repository.Gtk");
const GLib = python.import("gi.repository.GLib");
const AppIndicator: AppIndicator3.AppIndicator = python.import(
  "gi.repository.AppIndicator3",
);
const signal = python.import("signal");

// since this app is used with ipc, this is a better name
const sendMsg = console.log;

if (import.meta.main) {
  const indicator = AppIndicator.Indicator.new(
    "io.github.sigmasd.stimulator",
    "io.github.sigmasd.stimulator-tray-inactive",
    AppIndicator.IndicatorCategory.APPLICATION_STATUS,
  );

  indicator.set_attention_icon("io.github.sigmasd.stimulator-tray-active");

  const menu = Gtk.Menu();

  const activateItem = Gtk.MenuItem(new NamedArgument("label", "Activate"));
  const deactivateItem = Gtk.MenuItem(new NamedArgument("label", "Deactivate"));
  activateItem.connect(
    "activate",
    python.callback(() => {
      sendMsg(MESSAGES.Activate);
      indicator.set_status(AppIndicator.IndicatorStatus.ATTENTION);
    }),
  );
  deactivateItem.connect(
    "activate",
    python.callback(() => {
      sendMsg(MESSAGES.Deactivate);
      indicator.set_status(AppIndicator.IndicatorStatus.ACTIVE);
    }),
  );
  GLib.io_add_watch(
    0, /*stdin*/
    GLib.IO_IN,
    python.callback(() => {
      const buf = new Uint8Array(512);
      const n = Deno.stdin.readSync(buf);
      if (!n) throw new Error("recieved an empty message");

      const msg = new TextDecoder().decode(buf.slice(0, n)).trim();
      switch (msg) {
        case MESSAGES.Activate:
          indicator.set_status(AppIndicator.IndicatorStatus.ATTENTION);
          break;
        case MESSAGES.Deactivate:
          indicator.set_status(AppIndicator.IndicatorStatus.ACTIVE);
          break;
        case MESSAGES.Hide:
          indicator.set_status(AppIndicator.IndicatorStatus.PASSIVE);
          break;
        case MESSAGES.Close:
          Gtk.main_quit();
          break;
        default:
          throw new Error(`Unknown message: '${msg}'`);
      }

      return true;
    }),
  );

  activateItem.show();
  deactivateItem.show();
  menu.append(activateItem);
  menu.append(deactivateItem);
  indicator.set_menu(menu);

  signal.signal(signal.SIGINT, python.callback(() => Gtk.main_quit()));
  Gtk.main();
}
