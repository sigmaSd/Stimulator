// This is a standalone application for the tray
// It have is own imports
import {
  AppIndicator3,
  Gtk3_ as Gtk_,
  NamedArgument,
  python,
} from "deno-gtk-py";
import { MESSAGES } from "./messages.ts";
import { APP_ID, UI_LABELS } from "../consts.ts";

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
    APP_ID + "-tray",
    APP_ID + "-tray-inactive",
    AppIndicator.IndicatorCategory.APPLICATION_STATUS,
  );

  indicator.set_attention_icon(
    APP_ID + "-tray-active",
  );

  const menu = Gtk.Menu();

  const showApp = Gtk.MenuItem(
    new NamedArgument("label", "Show"),
  );
  const closeApp = Gtk.MenuItem(
    new NamedArgument("label", "Close"),
  );
  showApp.connect(
    "activate",
    python.callback(() => {
      sendMsg(MESSAGES.Show);
      menu.remove(menu.get_children()[0]);
    }),
  );
  closeApp.connect(
    "activate",
    python.callback(() => {
      sendMsg(MESSAGES.Close);
      Gtk.main_quit();
    }),
  );

  GLib.io_add_watch(
    0, /*stdin*/
    GLib.IO_IN,
    python.callback(() => {
      const buf = new Uint8Array(512);
      const n = Deno.stdin.readSync(buf);
      if (!n) throw new Error("recieved an empty message");

      const message = new TextDecoder()
        .decode(buf.slice(0, n))
        .trim();
      switch (message) {
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
        case MESSAGES.showShowButton:
          showApp.show();
          menu.prepend(showApp);
          break;
        case MESSAGES.HideShowButton:
          menu.remove(menu.get_children()[0]);
          break;
        default:
          throw new Error(`Incorrect message: '${message}'`);
      }

      return true;
    }),
  );

  closeApp.show();
  menu.append(closeApp);
  indicator.set_menu(menu);

  signal.signal(signal.SIGINT, python.callback(() => Gtk.main_quit()));
  Gtk.main();
}
