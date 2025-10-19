// This is a standalone application for the tray
// It have is own imports
import {
  type AppIndicator3,
  type Gtk3_ as Gtk_,
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
    `${APP_ID}-tray`,
    `${APP_ID}-tray`,
    AppIndicator.IndicatorCategory.APPLICATION_STATUS,
  );
  indicator.set_title(UI_LABELS.Stimulator);

  const menu = Gtk.Menu();

  const showApp = Gtk.MenuItem(
    new NamedArgument("label", UI_LABELS.Show),
  );
  const closeApp = Gtk.MenuItem(
    new NamedArgument("label", UI_LABELS.Close),
  );
  showApp.connect(
    "activate",
    () => {
      sendMsg(MESSAGES.Show);
      menu.remove(menu.get_children()[0]);
    },
  );
  closeApp.connect(
    "activate",
    () => {
      sendMsg(MESSAGES.Close);
      Gtk.main_quit();
    },
  );

  let first_try = true;
  GLib.io_add_watch(
    0, /*stdin*/
    GLib.IO_IN,
    () => {
      const buf = new Uint8Array(512);
      const n = Deno.stdin.readSync(buf);
      if (!n) throw new Error("recieved an empty message");

      const message = new TextDecoder()
        .decode(buf.slice(0, n))
        .trim();
      switch (message) {
        case MESSAGES.Activate:
          indicator.set_status(AppIndicator.IndicatorStatus.ACTIVE);
          // NOTE: if thhe indicator is not connected after being set to active, this means the system doesn't support tray icons, so exit
          if (!indicator.props.connected.valueOf()) {
            // The icon might take some time to be active (happens in kde)
            // Give it one more chance
            if (!first_try) {
              // The user will recive this error in the logs:
              // `(.:11550): Gtk-CRITICAL **: 05:57:05.429: gtk_widget_get_scale_factor: assertion 'GTK_IS_WIDGET (widget)' failed`
              // becuase they don't have tray icon support, its harmless though
              Gtk.main_quit();
            } else {
              first_try = false;
            }
          }
          break;
        case MESSAGES.Deactivate:
          indicator.set_status(AppIndicator.IndicatorStatus.PASSIVE);
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
    },
  );

  menu.append(closeApp);
  menu.show_all();
  indicator.set_menu(menu);

  signal.signal(signal.SIGINT, () => Gtk.main_quit());

  Gtk.main();
}
