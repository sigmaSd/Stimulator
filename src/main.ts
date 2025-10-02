#!/usr/bin/env -S  deno run --allow-read=./src/locales --allow-ffi --allow-env=DENO_PYTHON_PATH --unstable-ffi
import {
  type Adw1_ as Adw_,
  type Callback,
  type Gdk4_ as Gdk_,
  type Gio2_ as Gio_,
  type GLib2_ as GLib_,
  type Gtk4_ as Gtk_,
  kw,
  NamedArgument,
  python,
} from "deno-gtk-py";

import { APP_ID, APP_NAME, UI_LABELS, VERSION } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import { PreferencesMenu, type Theme } from "./pref-win.ts";
import type { Behavior } from "./pref-win.ts";

const gi = python.import("gi");
gi.require_version("Gtk", "4.0");
gi.require_version("Adw", "1");
export const Gtk: Gtk_.Gtk = python.import("gi.repository.Gtk");
export const Adw: Adw_.Adw = python.import("gi.repository.Adw");
export const Gio: Gio_.Gio = python.import("gi.repository.Gio");
export const Gdk: Gdk_.Gdk = python.import("gi.repository.Gdk");
export const GLib: GLib_.GLib = python.import("gi.repository.GLib");

type Flags = "logout" | "switch" | "suspend" | "idle";
export type TimerDuration =
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "Never";

interface State {
  logout: boolean;
  switch: boolean;
  suspend: boolean;
  idle: boolean | "active_disabled";
  themeV2: Theme;
  exitBehaviorV2: Behavior;
  suspendTimer: TimerDuration;
  idleTimer: TimerDuration;
  version: number;
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
  #suspendTimerId?: number;
  #idleTimerId?: number;
  #suspendRemainingMinutes?: number;
  #idleRemainingMinutes?: number;

  get state() {
    return this.#state;
  }
  get indicator() {
    return this.#indicator;
  }
  set indicator(value) {
    this.#indicator = value;
  }

  #state: State = {
    logout: false,
    switch: false,
    suspend: false,
    idle: false,
    themeV2: "System Theme",
    exitBehaviorV2: "Ask Confirmation",
    suspendTimer: "Never",
    idleTimer: "Never",
    version: 1,
  };
  #cookies: { [key in Flags | "screenSaverCookie"]?: number } = {};

  constructor(app: Adw_.Application) {
    const savedState = localStorage.getItem("state");
    if (savedState) {
      const parsedSavedState = JSON.parse(savedState);
      // NOTE: Protects from breaking the app with new apis, reset if the internal state representation have changed
      if (parsedSavedState.version === this.#state.version) {
        this.#state = { ...this.#state, ...parsedSavedState };
      }
      // else we will save the default state
    }
    // deno-fmt-ignore
    const currentTheme =
        this.#state.themeV2 === "System Theme" ? Adw.ColorScheme.DEFAULT
      : this.#state.themeV2 === "Light"  ? Adw.ColorScheme.FORCE_LIGHT
      : Adw.ColorScheme.FORCE_DARK;
    Adw.StyleManager.get_default().set_color_scheme(currentTheme);

    if (this.#state.exitBehaviorV2 === "Run in Background") {
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
    builder.add_from_string(
      Deno.readTextFileSync(
        new URL(import.meta.resolve("./ui/stimulator.ui")).pathname,
      ),
    );
    this.#win = builder.get_object("mainWindow");
    this.#win.set_title(APP_NAME);
    this.#win.connect("close-request", python.callback(this.#onCloseRequest));
    this.#mainIcon = builder.get_object("mainIcon");
    this.#suspendRow = builder.get_object("suspendRow");
    this.#suspendRow.set_title(UI_LABELS["Disable Automatic Suspending"]);
    this.#suspendRow.set_subtitle(UI_LABELS["Current state: System default"]);
    this.#suspendRow.connect(
      "notify::active",
      python.callback(() =>
        this.#toggleSuspend(this.#suspendRow.get_active().valueOf())
      ),
    );
    this.#idleRow = builder.get_object("idleRow");
    this.#idleRow.set_title(UI_LABELS["Disable Screen Blanking and Locking"]);
    this.#idleRow.set_subtitle(UI_LABELS["Current state: System default"]);
    this.#idleRow.connect(
      "notify::active",
      // NOTE: works but for some reason it issues a warning the first time its called about invalid flags
      python.callback(() =>
        this.#toggleIdle(this.#idleRow.get_active().valueOf())
      ),
    );

    this.#preferencesMenu = new PreferencesMenu(this);
    this.#preferencesMenu.set_transient_for(this.#win);

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
    hamburger.set_tooltip_text(UI_LABELS["Main Menu"]);
    header.pack_start(hamburger);

    this.#createAction(
      "preferences",
      python.callback(this.#showPreferences),
      ["<primary>comma"],
    );
    menu.append(UI_LABELS.Preferences, "app.preferences");
    this.#createAction("shortcuts", this.#showShortcuts, ["<primary>question"]);
    menu.append(UI_LABELS["Keyboard Shortcuts"], "app.shortcuts");
    this.#createAction("about", this.#showAbout);
    menu.append(UI_LABELS["About Stimulator"], "app.about");
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
    if (this.#state.idle === "active_disabled") {
      this.#idleRow.set_active(true);
    } else {
      this.#idleRow.set_active(this.#state.idle);
    }
    if (!this.#state.idle) this.#toggleIdle(false);

    this.#suspendRow.set_active(this.#state.suspend);
    if (!this.#state.suspend) this.#toggleSuspend(false);
  }

  present() {
    this.#win.present();
  }

  updateState(state: Partial<State>) {
    this.#state = { ...this.#state, ...state };
    localStorage.setItem("state", JSON.stringify(this.#state));

    // If timer duration changed while active, restart the timer
    if (
      state.suspendTimer !== undefined &&
      this.#suspendRow.get_active().valueOf()
    ) {
      this.#restartSuspendTimer();
    }
    if (state.idleTimer !== undefined && this.#idleRow.get_active().valueOf()) {
      this.#restartIdleTimer();
    }
  }

  quit() {
    this.#app.quit();
  }

  #showPreferences = () => {
    this.#preferencesMenu.present();
  };

  #onCloseRequest = () => {
    // if we receive close request while the app is in the background, exit
    if (!this.#win.is_visible().valueOf()) {
      this.#indicator?.close();
      // withdraw any active notification
      this.#app.withdraw_notification(APP_ID);
      return false;
    }
    // if tray icon is active and suspend button is active, go to the background instead of exiting
    if (
      this.#state.exitBehaviorV2 === "Run in Background" &&
      this.#state.suspend
    ) {
      this.#win.set_visible(false);
      this.#indicator?.showShowButton();
      // inform user via notification
      const notification = Gio.Notification.new(UI_LABELS.Stimulator);
      notification.set_body(
        UI_LABELS["Stimulator is running in the backround"],
      );
      this.#app.send_notification(APP_ID, notification);
      return true;
    }

    // only run this if suspend button is active
    if (!this.#state.suspend) {
      this.#indicator?.close();
      return false;
    }
    // if confirm on exit is disabled return
    if (
      this.#state.exitBehaviorV2 !==
        "Ask Confirmation"
    ) {
      this.#indicator?.close();
      return false;
    }

    const dialog = Adw.MessageDialog(
      new NamedArgument("transient_for", this.#app.get_active_window()),
      new NamedArgument("heading", UI_LABELS["Close Stimulator?"]),
      new NamedArgument(
        "body",
        UI_LABELS["Stimulator is active, do you want to close it?"],
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

  #toggleSuspend = (yes: boolean) => {
    const idleRowActive = this.#idleRow.get_active().valueOf();
    if (yes) {
      if (this.#state.exitBehaviorV2 === "Run in Background") {
        this.#indicator?.activate();
      }

      // Clear any existing timer
      if (this.#suspendTimerId) {
        GLib.source_remove(this.#suspendTimerId);
        this.#suspendTimerId = undefined;
      }

      // Set up timer if duration is not "Never"
      if (this.#state.suspendTimer !== "Never") {
        const totalMinutes = parseInt(this.#state.suspendTimer);
        this.#suspendRemainingMinutes = totalMinutes;
        this.#updateSuspendSubtitle();

        // Update every minute
        this.#suspendTimerId = GLib.timeout_add_seconds(
          60,
          python.callback(() => {
            if (this.#suspendRemainingMinutes !== undefined) {
              this.#suspendRemainingMinutes--;
              if (this.#suspendRemainingMinutes <= 0) {
                this.#suspendRow.set_active(false);
                return false;
              }
              this.#updateSuspendSubtitle();
            }
            return true;
          }),
        ).valueOf();
      } else {
        this.#suspendRow.set_subtitle(UI_LABELS["Current state: Indefinitely"]);
      }

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
        UI_LABELS["Stimulator is active"],
      ).valueOf();

      if (result === 0) {
        this.#platformUnsupportedExit();
      }
      this.#cookies.suspend = result;
    } else {
      if (this.#state.exitBehaviorV2 === "Run in Background") {
        this.#indicator?.deactivate();
      }

      // Clear timer
      if (this.#suspendTimerId) {
        GLib.source_remove(this.#suspendTimerId);
        this.#suspendTimerId = undefined;
        this.#suspendRemainingMinutes = undefined;
      }

      this.#suspendRow.set_subtitle(UI_LABELS["Current state: System default"]);
      this.#mainIcon.set_from_icon_name(
        `${APP_ID}-inactive`,
      );

      const suspendCookie = this.#cookies.suspend;
      if (suspendCookie) {
        this.#app.uninhibit(suspendCookie);
        this.#cookies.suspend = undefined;
      }

      // if suspend is desactivated, disallow setting idle
      this.#idleRow.set_sensitive(false);

      // if we unihibit suspend we also uninhibit idle
      // if it was active make it active_disabled
      if (idleRowActive) {
        this.#toggleIdle("active_disabled");
      }
    }

    this.updateState({ suspend: yes });
  };

  #updateSuspendSubtitle = () => {
    if (this.#suspendRemainingMinutes !== undefined) {
      const totalMins = this.#suspendRemainingMinutes;
      let timeText: string;

      if (totalMins >= 60) {
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (mins === 0) {
          timeText = hours === 1
            ? `1 ${UI_LABELS["hour"]}`
            : `${hours} ${UI_LABELS["hours"]}`;
        } else {
          const hourText = hours === 1
            ? `1 ${UI_LABELS["hour"]}`
            : `${hours} ${UI_LABELS["hours"]}`;
          const minText = `${mins} ${UI_LABELS["minutes"]}`;
          timeText = `${hourText} ${minText}`;
        }
      } else {
        timeText = `${totalMins} ${UI_LABELS["minutes"]}`;
      }

      this.#suspendRow.set_subtitle(
        `${UI_LABELS["Current state"]}: ${timeText}`,
      );
    }
  };

  #restartSuspendTimer = () => {
    // Clear existing timer
    if (this.#suspendTimerId) {
      GLib.source_remove(this.#suspendTimerId);
      this.#suspendTimerId = undefined;
    }

    // Set up new timer if duration is not "Never"
    if (this.#state.suspendTimer !== "Never") {
      const totalMinutes = parseInt(this.#state.suspendTimer);
      this.#suspendRemainingMinutes = totalMinutes;
      this.#updateSuspendSubtitle();

      // Update every minute
      this.#suspendTimerId = GLib.timeout_add_seconds(
        60,
        python.callback(() => {
          if (this.#suspendRemainingMinutes !== undefined) {
            this.#suspendRemainingMinutes--;
            if (this.#suspendRemainingMinutes <= 0) {
              this.#suspendRow.set_active(false);
              return false;
            }
            this.#updateSuspendSubtitle();
          }
          return true;
        }),
      ).valueOf();
    } else {
      this.#suspendRow.set_subtitle(UI_LABELS["Current state: Indefinitely"]);
    }
  };

  #toggleIdle = (state: boolean | "active_disabled") => {
    const suspendRowActive = this.#suspendRow.get_active().valueOf();
    if (suspendRowActive && state === true) {
      // Clear any existing timer
      if (this.#idleTimerId) {
        GLib.source_remove(this.#idleTimerId);
        this.#idleTimerId = undefined;
      }

      // Set up timer if duration is not "Never"
      if (this.#state.idleTimer !== "Never") {
        const totalMinutes = parseInt(this.#state.idleTimer);
        this.#idleRemainingMinutes = totalMinutes;
        this.#updateIdleSubtitle();

        // Update every minute
        this.#idleTimerId = GLib.timeout_add_seconds(
          60,
          python.callback(() => {
            if (this.#idleRemainingMinutes !== undefined) {
              this.#idleRemainingMinutes--;
              if (this.#idleRemainingMinutes <= 0) {
                this.#idleRow.set_active(false);
                return false;
              }
              this.#updateIdleSubtitle();
            }
            return true;
          }),
        ).valueOf();
      } else {
        this.#idleRow.set_subtitle(UI_LABELS["Current state: Indefinitely"]);
      }

      // We try first using org.freedesktop.ScreenSaver.Inhibit
      // If that doesn't work we fallback to Gtk Idle Inhibit method
      // NOTE: kde freezes for 30 seconds if the app requests more then one (1) inhibitor
      // This method workaround this
      this.#cookies.screenSaverCookie = this.#screenSaverProxy.Inhibit(
        "(ss)",
        UI_LABELS.Stimulator,
        UI_LABELS["Stimulator is active"],
      )?.valueOf();
      if (!this.#cookies.screenSaverCookie) {
        this.#cookies.idle = this.#app.inhibit(
          this.#win,
          Gtk.ApplicationInhibitFlags.IDLE,
          // NOTE: the reason is needed for flatpak to work
          UI_LABELS["Stimulator is active"],
        ).valueOf();
      }
    } else {
      // Clear timer
      if (this.#idleTimerId) {
        GLib.source_remove(this.#idleTimerId);
        this.#idleTimerId = undefined;
        this.#idleRemainingMinutes = undefined;
      }

      this.#idleRow.set_subtitle(UI_LABELS["Current state: System default"]);
      const idleCookie = this.#cookies.idle;
      if (idleCookie) {
        this.#app.uninhibit(idleCookie);
        this.#cookies.idle = undefined;
      }

      const screenSaverCookie = this.#cookies.screenSaverCookie;

      if (screenSaverCookie) {
        this.#screenSaverProxy.UnInhibit("(u)", screenSaverCookie);
        this.#cookies.screenSaverCookie = undefined;
      }
    }

    this.updateState({ idle: state });
  };

  #updateIdleSubtitle = () => {
    if (this.#idleRemainingMinutes !== undefined) {
      const totalMins = this.#idleRemainingMinutes;
      let timeText: string;

      if (totalMins >= 60) {
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (mins === 0) {
          timeText = hours === 1
            ? `1 ${UI_LABELS["hour"]}`
            : `${hours} ${UI_LABELS["hours"]}`;
        } else {
          const hourText = hours === 1
            ? `1 ${UI_LABELS["hour"]}`
            : `${hours} ${UI_LABELS["hours"]}`;
          const minText = `${mins} ${UI_LABELS["minutes"]}`;
          timeText = `${hourText} ${minText}`;
        }
      } else {
        timeText = `${totalMins} ${UI_LABELS["minutes"]}`;
      }

      this.#idleRow.set_subtitle(`${UI_LABELS["Current state"]}: ${timeText}`);
    }
  };

  #restartIdleTimer = () => {
    // Clear existing timer
    if (this.#idleTimerId) {
      GLib.source_remove(this.#idleTimerId);
      this.#idleTimerId = undefined;
    }

    // Set up new timer if duration is not "Never"
    if (this.#state.idleTimer !== "Never") {
      const totalMinutes = parseInt(this.#state.idleTimer);
      this.#idleRemainingMinutes = totalMinutes;
      this.#updateIdleSubtitle();

      // Update every minute
      this.#idleTimerId = GLib.timeout_add_seconds(
        60,
        python.callback(() => {
          if (this.#idleRemainingMinutes !== undefined) {
            this.#idleRemainingMinutes--;
            if (this.#idleRemainingMinutes <= 0) {
              this.#idleRow.set_active(false);
              return false;
            }
            this.#updateIdleSubtitle();
          }
          return true;
        }),
      ).valueOf();
    } else {
      this.#idleRow.set_subtitle(UI_LABELS["Current state: Indefinitely"]);
    }
  };

  #showAbout = python.callback(() => {
    const dialog = Adw.AboutWindow(
      new NamedArgument("transient_for", this.#app.get_active_window()),
    );
    dialog.set_application_name(APP_NAME);
    dialog.set_version(VERSION);
    dialog.set_developer_name("Bedis Nbiba");
    dialog.set_developers(["Bedis Nbiba <bedisnbiba@gmail.com>"]);
    dialog.set_designers(["Meybo Nõmme <meybo@meybo.ee>"]);
    dialog.set_translator_credits(UI_LABELS["translator-credits"]);
    dialog.set_license_type(Gtk.License.MIT_X11);
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
    keyboardShortcutShortcut.props.title = UI_LABELS["Keyboard Shortcuts"];
    const mainMenuShortcut = builder.get_object(
      "mainMenuShortcut",
    ) as Gtk_.ShortcutsShortcut;
    mainMenuShortcut.props.title = UI_LABELS["Open Menu"];
    const quitShortcut = builder.get_object(
      "quitShortcut",
    ) as Gtk_.ShortcutsShortcut;
    quitShortcut.props.title = UI_LABELS.Quit;

    shortcutsWin.present();
  });

  #platformUnsupportedExit() {
    const dialog = Adw.MessageDialog(
      new NamedArgument("transient_for", this.#app.get_active_window()),
      new NamedArgument("heading", UI_LABELS["Unsupported System"]),
      new NamedArgument(
        "body",
        UI_LABELS[
          "Your desktop environment doesn't support Stimulator, click close to quit"
        ],
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
        this.updateState({ suspend: false, idle: false });
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
    // withdraw any active notification
    this.withdraw_notification(APP_ID);
  });
}

if (import.meta.main) {
  const css_provider = Gtk.CssProvider();
  css_provider.load_from_data(
    Deno.readTextFileSync(
      new URL(import.meta.resolve("./main.css")).pathname,
    ),
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
