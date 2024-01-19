#!/usr/bin/env -S  deno run --allow-read=./src/locales --allow-ffi --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi
import {
  Adw,
  Adw_,
  Gdk,
  Gio,
  GLib,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.2.11/mod.ts";
import { systemLocale } from "./i18n.ts";
import { APP_ID, APP_NAME, UI_LABELS, VERSION } from "./consts.ts";

type Flags = "logout" | "switch" | "suspend" | "idle";

class MainWindow {
  #app: Adw_.Application;
  #win: Gtk_.ApplicationWindow;
  #mainIcon: Gtk_.Image;
  #suspendRow: Adw_.SwitchRow;
  #idleRow: Adw_.SwitchRow;

  #state: { [key in Flags]?: boolean | "active_disabled" } = {
    "logout": false,
    "switch": false,
    "suspend": false,
    "idle": false,
  };
  #cookies: { [key in Flags]?: number } = {};
  constructor(app: Adw_.Application) {
    const savedState = localStorage.getItem("state");
    if (savedState) this.#state = JSON.parse(savedState);

    const builder = Gtk.Builder();
    builder.add_from_file(
      new URL(import.meta.resolve("./ui/stimulator.ui")).pathname,
    );
    this.#win = builder.get_object("mainWindow");
    this.#win.set_title(APP_NAME);
    if (systemLocale.startsWith("ar")) {
      this.#win.set_default_size(
        450,
        this.#win.get_default_size().height.valueOf() + 50,
      );
    }
    this.#mainIcon = builder.get_object("mainIcon");
    this.#suspendRow = builder.get_object("suspendRow");
    this.#suspendRow.set_title(UI_LABELS.SuspendTitle);
    this.#suspendRow.set_subtitle(UI_LABELS.SystemDefault);
    this.#suspendRow.connect(
      "notify::active",
      python.callback(() =>
        this.#toggleSuspend(this.#suspendRow.get_active().valueOf())
      ),
    );
    this.#idleRow = builder.get_object("idleRow");
    this.#idleRow.set_title(UI_LABELS.IdleTitle);
    this.#idleRow.set_subtitle(UI_LABELS.SystemDefault);
    this.#idleRow.connect(
      "notify::active",
      // NOTE: works but for some reason it issues a warning the first time its called about invalid flags
      python.callback(() =>
        this.#toggleIdle(this.#idleRow.get_active().valueOf())
      ),
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
      menu.append(UI_LABELS.About, "win.about");
    }

    // ui modifications needs to be done last
    // this will update the state to the last saved one
    // NOTE: set_active(false) doesn't trigger the button callback
    // Adw bug ?
    if (this.#state["idle"] === "active_disabled") {
      this.#idleRow.set_active(true);
    } else {
      this.#idleRow.set_active(this.#state["idle"] as boolean);
    }
    if (!this.#state["idle"]) this.#toggleIdle(false);

    this.#suspendRow.set_active(this.#state["suspend"] as boolean); // we don't disable suspend
    if (!this.#state["suspend"]) this.#toggleSuspend(false);
  }

  present() {
    this.#win.present();
  }

  #updateState(state: { [key in Flags]?: boolean | "active_disabled" }) {
    this.#state = { ...this.#state, ...state };
    localStorage.setItem("state", JSON.stringify(this.#state));
  }

  #toggleSuspend = (yes: boolean) => {
    const idleRowActive = this.#idleRow.get_active().valueOf();
    if (yes) {
      this.#suspendRow.set_subtitle(UI_LABELS.Indefinitely);
      this.#mainIcon.set_from_icon_name(
        APP_ID,
      );

      this.#idleRow.set_sensitive(true);
      if (idleRowActive) {
        this.#toggleIdle(true);
      }

      this.#cookies["suspend"] = this.#app.inhibit(
        this.#win,
        Gtk.ApplicationInhibitFlags.SUSPEND,
        // NOTE: the reason is needed for flatpak to work
        UI_LABELS.SimulatorActive,
      ).valueOf();
    } else {
      this.#suspendRow.set_subtitle(UI_LABELS.SystemDefault);
      this.#mainIcon.set_from_icon_name(
        APP_ID + "_inactive",
      );

      const suspendCookie = this.#cookies["suspend"];
      if (suspendCookie) {
        this.#app.uninhibit(suspendCookie);
        this.#cookies["suspend"] = undefined;
      }

      // if suspend is desactivated, disallow setting idle
      this.#idleRow.set_sensitive(false);

      // if we unihibit suspend we also uninhibit idle
      // if it was active make it active_disabled
      if (idleRowActive) {
        this.#toggleIdle("active_disabled");
      }
    }

    this.#updateState({ "suspend": yes });
  };

  #toggleIdle = (state: boolean | "active_disabled") => {
    const suspendRowActive = this.#suspendRow.get_active().valueOf();
    if (suspendRowActive && state === true) {
      this.#idleRow.set_subtitle(UI_LABELS.Indefinitely);
      this.#cookies["idle"] = this.#app.inhibit(
        this.#win,
        Gtk.ApplicationInhibitFlags.IDLE,
        // NOTE: the reason is needed for flatpak to work
        UI_LABELS.SimulatorActive,
      ).valueOf();
    } else {
      this.#idleRow.set_subtitle(UI_LABELS.SystemDefault);
      const idleCookie = this.#cookies["idle"];
      if (idleCookie) {
        this.#app.uninhibit(idleCookie);
        this.#cookies["idle"] = undefined;
      }
    }

    this.#updateState({ "idle": state });
  };

  #showAbout = python.callback(() => {
    const dialog = Adw.AboutWindow(
      new NamedArgument("transient_for", this.#app.get_active_window()),
    );
    dialog.set_application_name(APP_NAME);
    dialog.set_version(VERSION);
    dialog.set_developer_name("Bedis Nbiba");
    dialog.set_designers(["Meybo Nõmme"]);
    dialog.set_license_type(Gtk.License.MIT_X11);
    dialog.set_comments(UI_LABELS.Comments);
    dialog.set_website("https://github.com/sigmaSd/stimulator");
    dialog.set_issue_url(
      "https://github.com/sigmaSd/stimulator/issues",
    );
    dialog.set_application_icon(APP_ID);

    dialog.set_visible(true);
  });
}

class App extends Adw.Application {
  #win?: MainWindow;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.#onActivate);
  }
  #onActivate = python.callback((_kwarg, app: Adw_.Application) => {
    this.#win = new MainWindow(app);
    this.#win.present();
  });
}

if (import.meta.main) {
  const css_provider = Gtk.CssProvider();
  css_provider.load_from_path(
    new URL(import.meta.resolve("./main.css")).pathname,
  );
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    css_provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );
  const app = new App(kw`application_id=${APP_ID}`);
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
