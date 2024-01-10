#!/usr/bin/env -S  deno run --allow-read=locales --allow-ffi --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi main.ts
import {
  Adw,
  Adw_,
  Gio,
  GLib,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.2.5/mod.ts";
import { t } from "./i18n.ts";

const VERSION = "0.4.3";

interface Flags {
  "logout"?: number;
  "switch"?: number;
  "suspend"?: number;
  "idle"?: number;
}

class MainWindow {
  #app: Adw_.Application;
  #win: Gtk_.ApplicationWindow;
  #logoutRow: Adw_.SwitchRow;
  #switchRow: Adw_.SwitchRow;
  #suspendRow: Adw_.SwitchRow;
  #idleRow: Adw_.SwitchRow;

  #cookies: Flags = {};
  constructor(app: Adw_.Application) {
    const builder = Gtk.Builder();
    builder.add_from_file(
      new URL(import.meta.resolve("./ui/nosleep.ui")).pathname,
    );
    this.#win = builder.get_object("mainWindow");
    this.#logoutRow = builder.get_object("logoutRow");
    this.#logoutRow.connect(
      "notify::active",
      python.callback(() => this.#toggle(this.#logoutRow, "logout")),
    );
    this.#switchRow = builder.get_object("switchRow");
    this.#switchRow.connect(
      "notify::active",
      python.callback(() => this.#toggle(this.#switchRow, "switch")),
    );
    this.#suspendRow = builder.get_object("suspendRow");
    this.#suspendRow.connect(
      "notify::active",
      python.callback(() => this.#toggle(this.#suspendRow, "suspend")),
    );
    this.#idleRow = builder.get_object("idleRow");
    this.#idleRow.connect(
      "notify::active",
      python.callback(() => this.#toggle(this.#idleRow, "idle")),
    );

    this.#app = app;
    this.#win.set_application(this.#app);

    const header = Gtk.HeaderBar();
    this.#win.set_titlebar(header);
    // menu
    const menu = Gio.Menu.new();
    const popover = Gtk.PopoverMenu();
    popover.set_menu_model(menu);
    const hamburger = Gtk.MenuButton();
    hamburger.set_popover(popover);
    hamburger.set_icon_name("open-menu-symbolic");
    header.pack_start(hamburger);

    // about menu
    {
      const action = Gio.SimpleAction.new("about");
      action.connect("activate", this.#showAbout);
      this.#win.add_action(action);
      menu.append(t("About"), "win.about");
    }
  }

  present() {
    this.#win.present();
  }

  #toggle = (
    row: Adw_.SwitchRow,
    type: keyof Flags,
  ) => {
    const cookie = this.#cookies[type];
    if (row.get_active().valueOf()) {
      // If there is an already active inhibitor for this type disable it
      if (cookie !== undefined) {
        this.#app.uninhibit(cookie);
        this.#cookies[type] = undefined;
      }

      let flag = undefined;
      switch (type) {
        case "logout":
          flag = Gtk.ApplicationInhibitFlags.LOGOUT;
          break;
        case "switch":
          flag = Gtk.ApplicationInhibitFlags.SWITCH;
          break;
        case "suspend":
          flag = Gtk.ApplicationInhibitFlags.SUSPEND;
          break;
        case "idle":
          flag = Gtk.ApplicationInhibitFlags.IDLE;
          break;
        default:
          throw new Error("unexpcted type:", type);
      }

      // NOTE(only for idle flag): works but for some reason it issues a warning the first time its called about invalid flags
      this.#cookies[type] = this.#app.inhibit(this.#win, flag);
    } else {
      // Nothing to uninhibit just return
      if (cookie === undefined) return;
      this.#app.uninhibit(cookie);
      this.#cookies[type] = undefined;
    }
  };

  #showAbout = python.callback(() => {
    const dialog = Adw.AboutWindow(
      new NamedArgument("transient_for", this.#app.get_active_window()),
    );
    dialog.set_application_name("No Sleep");
    dialog.set_version(VERSION);
    dialog.set_developer_name("Bedis Nbiba");
    dialog.set_license_type(Gtk.License.MIT_X11);
    dialog.set_comments(t("Stop the desktop environment from sleeping"));
    dialog.set_website("https://github.com/sigmaSd/nosleep");
    dialog.set_issue_url(
      "https://github.com/sigmaSd/nosleep/issues",
    );
    dialog.set_application_icon("io.github.sigmasd.nosleep");

    dialog.set_visible(true);
  });
}

class App extends Adw.Application {
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.#onActivate);
  }
  #onActivate = python.callback((_kwarg, app: Adw_.Application) => {
    const win = new MainWindow(app);
    win.present();
  });
}

if (import.meta.main) {
  const app = new App(kw`application_id=${"io.github.sigmasd.nosleep"}`);
  const signal = python.import("signal");
  GLib.unix_signal_add(
    GLib.PRIORITY_HIGH,
    signal.SIGINT,
    python.callback(() => {
      app.quit();
    }),
  );
  app.run(Deno.args);
}
