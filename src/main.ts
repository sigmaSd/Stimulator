#!/usr/bin/env -S  deno run --allow-read=./src/locales --allow-ffi --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi
import {
  Adw1_ as Adw_,
  Callback,
  Gdk4_ as Gdk_,
  Gio2_ as Gio_,
  GLib2_ as GLib_,
  Gtk4_ as Gtk_,
  kw,
  NamedArgument,
  python,
} from "deno-gtk-py";
import { APP_ID, APP_NAME, UI_LABELS, VERSION } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";

const gi = python.import("gi");
gi.require_version("Gtk", "4.0");
gi.require_version("Adw", "1");
export const Gtk: Gtk_.Gtk = python.import("gi.repository.Gtk");
export const Adw: Adw_.Adw = python.import("gi.repository.Adw");
export const Gio: Gio_.Gio = python.import("gi.repository.Gio");
export const Gdk: Gdk_.Gdk = python.import("gi.repository.Gdk");
export const GLib: GLib_.GLib = python.import("gi.repository.GLib");

type Flags = "logout" | "switch" | "suspend" | "idle";

class PreferencesMenu {
  #preferencesWin: Adw_.PreferencesWindow;
  constructor(mainWindow: MainWindow) {
    const builder = Gtk.Builder();
    builder.add_from_file(
      new URL(import.meta.resolve("./ui/preferences.ui")).pathname,
    );
    this.#preferencesWin = builder.get_object(
      "preferencesWin",
    ) as Adw_.PreferencesWindow;
    this.#preferencesWin.set_hide_on_close(true);
    this.#preferencesWin.set_transient_for(mainWindow.win);
    this.#preferencesWin.set_modal(true);

    const themeRow = builder.get_object(
      "themeRow",
    ) as Adw_.ComboRow;
    themeRow.set_title(UI_LABELS.Theme);
    themeRow.set_model(
      Gtk.StringList.new([
        UI_LABELS.ThemeSystem,
        UI_LABELS.ThemeLight,
        UI_LABELS.ThemeDark,
      ]),
    );
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    themeRow.set_selected(1);
    themeRow.set_selected(mainWindow.state["theme"] as number);
    themeRow.connect(
      "notify::selected",
      python.callback(() => {
        const themeNumber = themeRow.get_selected().valueOf();
        //deno-fmt-ignore
        Adw.StyleManager.get_default().set_color_scheme(
            themeNumber === 0 ? Adw.ColorScheme.DEFAULT
          : themeNumber === 1 ? Adw.ColorScheme.FORCE_LIGHT
          : Adw.ColorScheme.FORCE_DARK,
        );
        mainWindow.updateState({ "theme": themeNumber });
      }),
    );

    const confirmExitSwitchRow = builder.get_object(
      "confirmExitSwitchRow",
    ) as Adw_.SwitchRow;
    confirmExitSwitchRow.set_title(UI_LABELS.EnableExistConfirmation);
    confirmExitSwitchRow.set_subtitle(
      UI_LABELS.EnableExistConfirmationSubTitle,
    );
    confirmExitSwitchRow.set_active(
      mainWindow.state["confirmExitMenu"] as boolean,
    );

    const indicatorRow = builder.get_object(
      "indicatorRow",
    ) as Adw_.SwitchRow;
    indicatorRow.set_title(UI_LABELS.EnableTrayIcon);
    indicatorRow.set_active(
      mainWindow.state["indicatorRow"] as boolean,
    );

    const syncConfirmAndIndicatorRowsState = () => {
      if (
        confirmExitSwitchRow.is_sensitive().valueOf()
      ) {
        indicatorRow.set_sensitive(
          !confirmExitSwitchRow.get_active().valueOf(),
        );
      }
      if (indicatorRow.is_sensitive().valueOf()) {
        confirmExitSwitchRow.set_sensitive(
          !indicatorRow.get_active().valueOf(),
        );
      }
    };

    syncConfirmAndIndicatorRowsState();
    confirmExitSwitchRow.connect(
      "notify::active",
      python.callback(() => {
        syncConfirmAndIndicatorRowsState();
        mainWindow.updateState({
          "confirmExitMenu": confirmExitSwitchRow.get_active().valueOf(),
        });
      }),
    );
    indicatorRow.connect(
      "notify::active",
      python.callback(() => {
        syncConfirmAndIndicatorRowsState();
        const newState = indicatorRow.get_active().valueOf();
        mainWindow.updateState({
          "indicatorRow": newState,
        });
        if (newState) {
          if (mainWindow.indicator === undefined) {
            mainWindow.indicator = new Indicator(mainWindow);
          }
          if (mainWindow.state["suspend"]) {
            mainWindow.indicator.activate();
          } else {
            mainWindow.indicator.deactivate();
          }
        } else {
          mainWindow.indicator?.hide();
        }
      }),
    );
  }

  present() {
    this.#preferencesWin.set_visible(true);
  }
}

export class MainWindow {
  #app: Adw_.Application;
  #win: Gtk_.ApplicationWindow;
  #mainIcon: Gtk_.Image;
  #suspendRow: Adw_.SwitchRow;
  #idleRow: Adw_.SwitchRow;
  #preferencesMenu: PreferencesMenu;
  #indicator?: Indicator;
  #screenSaverProxy;

  get app() {
    return this.#app;
  }
  get win() {
    return this.#win;
  }
  get suspendRow() {
    return this.#suspendRow;
  }
  get state() {
    return this.#state;
  }
  get indicator() {
    return this.#indicator;
  }
  set indicator(value) {
    this.#indicator = value;
  }

  #state: {
    [key in Flags | "confirmExitMenu" | "theme" | "indicatorRow"]:
      | boolean
      | "active_disabled"
      | number;
  } = {
    "logout": false,
    "switch": false,
    "suspend": false,
    "idle": false,
    "confirmExitMenu": true,
    "theme": 0, /*System Theme*/
    "indicatorRow": false,
  };
  #cookies: { [key in Flags | "screenSaverCookie"]?: number } = {};
  constructor(app: Adw_.Application) {
    const savedState = localStorage.getItem("state");
    // NOTE: If we update the state with new apis, the spreading will make sure that users who have old versions will get default values
    if (savedState) this.#state = { ...this.#state, ...JSON.parse(savedState) };
    // deno-fmt-ignore
    const currentTheme =
        this.#state["theme"] === 0 ? Adw.ColorScheme.DEFAULT
      : this.#state["theme"] === 1 ? Adw.ColorScheme.FORCE_LIGHT
      : Adw.ColorScheme.FORCE_DARK;
    Adw.StyleManager.get_default().set_color_scheme(currentTheme);

    if (this.state["indicatorRow"]) {
      this.#indicator = new Indicator(this);
    }

    // NOTE: This is used for kde (and other DEs that behave the same, since its still using a freedesktop standard)
    // gtk Application idle inhibit doens't stop the screen from dimming in kde
    // kde require to use this dbus api instead
    this.#screenSaverProxy = Gio.DBusProxy.new_for_bus_sync(
      Gio.BusType.SESSION,
      Gio.DBusProxyFlags.NONE,
      undefined,
      "org.freedesktop.ScreenSaver",
      "/org/freedesktop/ScreenSaver",
      "org.freedesktop.ScreenSaver",
    );

    const builder = Gtk.Builder();
    builder.add_from_file(
      new URL(import.meta.resolve("./ui/stimulator.ui")).pathname,
    );
    this.#win = builder.get_object("mainWindow");
    this.#win.set_title(APP_NAME);
    this.#win.connect("close-request", python.callback(this.#onCloseRequest));
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

    this.#preferencesMenu = new PreferencesMenu(this);

    this.#app = app;
    this.#win.set_application(this.#app);

    const header = Gtk.HeaderBar();
    this.#win.set_titlebar(header);
    // menu
    const menu = Gio.Menu.new();
    const popover = Gtk.PopoverMenu();
    popover.set_menu_model(menu);
    const hamburger = Gtk.MenuButton();
    hamburger.set_primary(true);
    hamburger.set_popover(popover);
    hamburger.set_icon_name("open-menu-symbolic");
    header.pack_start(hamburger);

    this.#createAction(
      "preferences",
      python.callback(this.#showPreferences),
      ["<primary>comma"],
    );
    menu.append(UI_LABELS.Preferences, "app.preferences");
    this.#createAction("shortcuts", this.#showShortcuts, ["<primary>question"]);
    menu.append(UI_LABELS.KeyboardShortcuts, "app.shortcuts");
    this.#createAction("about", this.#showAbout);
    menu.append(UI_LABELS.About, "app.about");
    this.#createAction(
      "quit",
      python.callback(() => {
        if (!this.#onCloseRequest()) this.#app.quit();
      }),
      ["<primary>q"],
    );
    this.#createAction(
      "close",
      python.callback(() => {
        if (!this.#onCloseRequest()) this.#app.quit();
      }),
      ["<primary>w"],
    );

    // ui modifications needs to be done last
    // this will update the state to the last saved one
    // NOTE: set_active(false) doesn't trigger the button callback because the button starts in inactive state
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

  #showPreferences = () => {
    this.#preferencesMenu.present();
  };

  #onCloseRequest = () => {
    // if we receive close request while the app is in the background, exit
    if (!this.#win.is_visible().valueOf()) {
      this.#indicator?.close();
      return false;
    }
    // if tray icon is active and suspend button is active, go to the background instead of exiting
    if (this.state["indicatorRow"] && this.state["suspend"]) {
      this.#win.set_visible(false);
      this.#indicator?.showShowButton();
      return true;
    }

    // only run this if suspend button is active
    if (!this.#state["suspend"]) {
      this.#indicator?.close();
      return false;
    }
    // if confirm on exit is disabled return
    if (!this.#state["confirmExitMenu"]) {
      this.#indicator?.close();
      return false;
    }

    const dialog = Adw.MessageDialog(
      new NamedArgument("transient_for", this.#app.get_active_window()),
      new NamedArgument("heading", UI_LABELS.ConfirmClose),
      new NamedArgument(
        "body",
        UI_LABELS.ConfirmCloseBody,
      ),
    );

    dialog.add_response("cancel", UI_LABELS.Cancel);
    dialog.add_response("close", UI_LABELS.Close);
    dialog.set_close_response("cancel");
    dialog.set_default_response("cancel");
    dialog.set_response_appearance(
      "close",
      Adw.ResponseAppearance.DESTRUCTIVE,
    );
    dialog.connect(
      "response",
      python.callback((_, __, id) => {
        if (id === "close") {
          this.#indicator?.close();
          this.#app.quit();
        }
      }),
    );

    dialog.set_visible(true);
    return true;
  };

  #createAction = (name: string, callback: Callback, shortcuts?: [string]) => {
    const action = Gio.SimpleAction.new(name);
    action.connect("activate", callback);
    this.#app.add_action(action);
    if (shortcuts) this.#app.set_accels_for_action(`app.${name}`, shortcuts);
  };

  updateState(
    state: {
      [key in Flags | "confirmExitMenu" | "theme" | "indicatorRow"]?:
        | boolean
        | "active_disabled"
        | number;
    },
  ) {
    this.#state = { ...this.#state, ...state };
    localStorage.setItem("state", JSON.stringify(this.#state));
  }

  #toggleSuspend = (yes: boolean) => {
    const idleRowActive = this.#idleRow.get_active().valueOf();
    if (yes) {
      if (this.state.indicatorRow) this.#indicator?.activate();
      this.#suspendRow.set_subtitle(UI_LABELS.Indefinitely);
      this.#mainIcon.set_from_icon_name(
        APP_ID,
      );

      this.#idleRow.set_sensitive(true);
      if (idleRowActive) {
        this.#toggleIdle(true);
      }

      const result = this.#app.inhibit(
        this.#win,
        Gtk.ApplicationInhibitFlags.SUSPEND,
        // NOTE: the reason is needed for flatpak to work
        UI_LABELS.SimulatorActive,
      ).valueOf();

      if (result === 0) {
        this.#platformUnsupportedExit();
      }
      this.#cookies["suspend"] = result;
    } else {
      if (this.state.indicatorRow) this.#indicator?.deactivate();
      this.#suspendRow.set_subtitle(UI_LABELS.SystemDefault);
      this.#mainIcon.set_from_icon_name(
        APP_ID + "-inactive",
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

    this.updateState({ "suspend": yes });
  };

  #toggleIdle = (state: boolean | "active_disabled") => {
    const suspendRowActive = this.#suspendRow.get_active().valueOf();
    if (suspendRowActive && state === true) {
      this.#idleRow.set_subtitle(UI_LABELS.Indefinitely);

      // We try first using org.freedesktop.ScreenSaver.Inhibit
      // If that doesn't work we fallback to Gtk Idle Inhibit method
      // NOTE: kde freezes for 30 seconds if the app requests more then one (1) inhibitor
      // This method workaround this
      this.#cookies["screenSaverCookie"] = this.#screenSaverProxy.Inhibit(
        "(ss)",
        UI_LABELS.AppName,
        UI_LABELS.SimulatorActive,
      );
      if (!this.#cookies["screenSaverCookie"]) {
        this.#cookies["idle"] = this.#app.inhibit(
          this.#win,
          Gtk.ApplicationInhibitFlags.IDLE,
          // NOTE: the reason is needed for flatpak to work
          UI_LABELS.SimulatorActive,
        ).valueOf();
      }
    } else {
      this.#idleRow.set_subtitle(UI_LABELS.SystemDefault);
      const idleCookie = this.#cookies["idle"];
      if (idleCookie) {
        this.#app.uninhibit(idleCookie);
        this.#cookies["idle"] = undefined;
      }

      const screenSaverCookie = this.#cookies["screenSaverCookie"];

      if (screenSaverCookie) {
        this.#screenSaverProxy.UnInhibit("(u)", screenSaverCookie);
        this.#cookies["screenSaverCookie"] = undefined;
      }
    }

    this.updateState({ "idle": state });
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

  #showShortcuts = python.callback(() => {
    const builder = Gtk.Builder();
    builder.add_from_file(
      new URL(import.meta.resolve("./ui/shortcuts.ui")).pathname,
    );
    const shortcutsWin = builder.get_object(
      "shortcutsWin",
    ) as Gtk_.ShortcutsWindow;
    shortcutsWin.set_transient_for(this.#win);
    shortcutsWin.set_modal(true);
    const shortcutsGroup = builder.get_object(
      "shortcutsGroup",
    ) as Gtk_.ShortcutsGroup;
    shortcutsGroup.props.title = UI_LABELS.General;
    const preferencesShortcut = builder.get_object(
      "preferencesShortcut",
    ) as Gtk_.ShortcutsShortcut;
    preferencesShortcut.props.title = UI_LABELS.Preferences;
    const keyboardShortcutShortcut = builder.get_object(
      "keyboardShortcutShortcut",
    ) as Gtk_.ShortcutsShortcut;
    keyboardShortcutShortcut.props.title = UI_LABELS.KeyboardShortcuts;
    const mainMenuShortcut = builder.get_object(
      "mainMenuShortcut",
    ) as Gtk_.ShortcutsShortcut;
    mainMenuShortcut.props.title = UI_LABELS.MainMenu;
    const quitShortcut = builder.get_object(
      "quitShortcut",
    ) as Gtk_.ShortcutsShortcut;
    quitShortcut.props.title = UI_LABELS.Quit;

    shortcutsWin.present();
  });

  #platformUnsupportedExit() {
    const dialog = Adw.MessageDialog(
      new NamedArgument("transient_for", this.#app.get_active_window()),
      new NamedArgument("heading", UI_LABELS.UnsupportedSystem),
      new NamedArgument(
        "body",
        UI_LABELS.UnsupportedSystemBody,
      ),
    );

    dialog.add_response("close", UI_LABELS.Close);
    dialog.set_close_response("close");
    dialog.set_default_response("close");
    dialog.set_response_appearance(
      "close",
      Adw.ResponseAppearance.DESTRUCTIVE,
    );
    dialog.connect(
      "response",
      python.callback((_, __, id) => {
        // make sure to turn off the buttons
        this.updateState({ "suspend": false, "idle": false });
        if (id === "close") this.#app.quit();
      }),
    );

    dialog.set_visible(true);
    return true;
  }
}

class App extends Adw.Application {
  #win?: MainWindow;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.#onActivate);
  }
  #onActivate = python.callback((_kwarg, app: Adw_.Application) => {
    // NOTE: there could be already an active window
    // if the app is restored after being hidden on exit
    if (!this.#win) this.#win = new MainWindow(app);

    this.#win.present();
    this.#win.indicator?.hideShowButton();
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
