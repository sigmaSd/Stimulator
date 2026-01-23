#!/usr/bin/env -S  deno run --allow-read=./src/locales --allow-ffi --allow-env=DENO_PYTHON_PATH --unstable-ffi

import "@sigmasd/gtk/eventloop";

import {
  Application,
  ApplicationFlags,
  ApplicationInhibitFlags,
  Builder,
  CssProvider,
  Display,
  HeaderBar,
  Image,
  License,
  MenuButton,
  PopoverMenu,
  StringList,
  StyleContext,
  StyleProviderPriority,
  Window,
} from "@sigmasd/gtk/gtk4";

import {
  AboutWindow,
  ColorScheme,
  getSwitchRow,
  MessageDialog,
  ResponseAppearance,
  StyleManager,
  SwitchRow,
} from "@sigmasd/gtk/adw";

import {
  BusType,
  DBusProxy,
  DBusProxyFlags,
  Menu,
  Notification,
  SimpleAction,
} from "@sigmasd/gtk/gio";

import {
  idleAdd,
  Priority,
  sourceRemove,
  timeoutSeconds,
  UnixSignal,
  unixSignalAdd,
} from "@sigmasd/gtk/glib";

import { APP_ID, APP_NAME, UI_LABELS, VERSION } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import { PreferencesMenu, type Theme } from "./pref-win.ts";
import type { Behavior } from "./pref-win.ts";

import stimulatorUi from "./ui/stimulator.ui" with { type: "text" };
import mainCss from "./main.css" with { type: "text" };

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
  #app: Application;
  #win: Window;
  #mainIcon: Image;
  #suspendRow: SwitchRow;
  #idleRow: SwitchRow;
  #preferencesMenu: PreferencesMenu;
  #indicator?: Indicator;
  #screenSaverProxy: DBusProxy | null;
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

  constructor(app: Application) {
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
        this.#state.themeV2 === "System Theme" ? ColorScheme.DEFAULT
      : this.#state.themeV2 === "Light"  ? ColorScheme.FORCE_LIGHT
      : ColorScheme.FORCE_DARK;
    StyleManager.getDefault().setColorScheme(currentTheme);

    if (this.#state.exitBehaviorV2 === "Run in Background") {
      this.#indicator = new Indicator(this);
    }

    // NOTE: This is used for kde (and other DEs that behave the same, since its still using a freedesktop standard)
    // gtk Application idle inhibit doens't stop the screen from dimming in kde
    // kde require to use this dbus api instead
    this.#screenSaverProxy = DBusProxy.newForBusSync(
      BusType.SESSION,
      DBusProxyFlags.NONE,
      null,
      "org.freedesktop.ScreenSaver",
      "/org/freedesktop/ScreenSaver",
      "org.freedesktop.ScreenSaver",
    );

    const builder = new Builder();
    builder.addFromString(stimulatorUi);
    this.#win = builder.getWindow("mainWindow")!;
    this.#win.setTitle(APP_NAME);
    this.#win.onCloseRequest(this.#onCloseRequest);
    // Get the mainIcon from builder
    this.#mainIcon = builder.getImage("mainIcon") ??
      new Image({ iconName: APP_ID });
    this.#suspendRow = getSwitchRow(builder, "suspendRow")!;
    this.#suspendRow.setTitle(UI_LABELS["Disable Automatic Suspending"]);
    this.#suspendRow.setSubtitle(UI_LABELS["Current state: System default"]);
    this.#suspendRow.onActiveChanged(
      (active) => this.#toggleSuspend(active),
    );
    this.#idleRow = getSwitchRow(builder, "idleRow")!;
    this.#idleRow.setTitle(UI_LABELS["Disable Screen Blanking and Locking"]);
    this.#idleRow.setSubtitle(UI_LABELS["Current state: System default"]);
    this.#idleRow.onActiveChanged(
      // NOTE: works but for some reason it issues a warning the first time its called about invalid flags
      (active) => this.#toggleIdle(active),
    );

    this.#preferencesMenu = new PreferencesMenu(this);
    this.#preferencesMenu.setTransientFor(this.#win);

    this.#app = app;
    this.#win.setProperty("application", this.#app);

    const header = new HeaderBar();
    this.#win.setTitlebar(header);
    // menu
    const menu = new Menu();
    const popover = new PopoverMenu(menu);
    const hamburger = new MenuButton();
    hamburger.setProperty("primary", true);
    hamburger.setPopover(popover);
    hamburger.setProperty("icon-name", "open-menu-symbolic");
    hamburger.setTooltipText(UI_LABELS["Main Menu"]);
    header.packStart(hamburger);

    this.#createAction(
      "preferences",
      this.#showPreferences,
      ["<primary>comma"],
    );
    menu.append(UI_LABELS.Preferences, "app.preferences");
    this.#createAction("shortcuts", this.#showShortcuts, ["<primary>question"]);
    menu.append(UI_LABELS["Keyboard Shortcuts"], "app.shortcuts");
    this.#createAction("about", this.#showAbout);
    menu.append(UI_LABELS["About Stimulator"], "app.about");
    this.#createAction(
      "quit",
      () => {
        if (!this.#onCloseRequest()) this.#app.quit();
      },
      ["<primary>q"],
    );
    this.#createAction(
      "close",
      () => {
        if (!this.#onCloseRequest()) this.#app.quit();
      },
      ["<primary>w"],
    );

    // ui modifications needs to be done last
    // this will update the state to the last saved one
    // NOTE: set_active(false) doesn't trigger the button callback because the button starts in inactive state
    if (this.#state.idle === "active_disabled") {
      this.#idleRow.setActive(true);
    } else {
      this.#idleRow.setActive(this.#state.idle as boolean);
    }
    if (!this.#state.idle) this.#toggleIdle(false);

    this.#suspendRow.setActive(this.#state.suspend);
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
      this.#suspendRow.getActive()
    ) {
      this.#restartSuspendTimer();
    }
    if (state.idleTimer !== undefined && this.#idleRow.getActive()) {
      this.#restartIdleTimer();
    }
  }

  quit() {
    this.#app.quit();
  }

  #showPreferences = () => {
    this.#preferencesMenu.present();
  };

  #onCloseRequest = (): boolean => {
    // if we receive close request while the app is in the background, exit
    if (!this.#win.isVisible()) {
      this.#indicator?.close();
      // withdraw any active notification
      this.#app.withdrawNotification(APP_ID);
      return false;
    }
    // if tray icon is active and suspend button is active, go to the background instead of exiting
    if (
      this.#state.exitBehaviorV2 === "Run in Background" &&
      this.#state.suspend
    ) {
      this.#win.setVisible(false);
      this.#indicator?.showShowButton();
      // inform user via notification
      const notification = new Notification(UI_LABELS.Stimulator);
      notification.setBody(
        UI_LABELS["Stimulator is running in the backround"],
      );
      timeoutSeconds(
        1,
        () => {
          this.#app.withdrawNotification(APP_ID);
          return false;
        },
      );
      this.#app.sendNotification(APP_ID, notification);
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

    const activeWindow = this.#app.getActiveWindow();
    const dialog = new MessageDialog(
      activeWindow,
      UI_LABELS["Close Stimulator?"],
      UI_LABELS["Stimulator is active, do you want to close it?"],
    );

    dialog.addResponse("cancel", UI_LABELS.Cancel);
    dialog.addResponse("close", UI_LABELS.Close);
    dialog.setCloseResponse("cancel");
    dialog.setDefaultResponse("cancel");
    dialog.setResponseAppearance(
      "close",
      ResponseAppearance.DESTRUCTIVE,
    );
    dialog.onResponse(
      (id) => {
        if (id === "close") {
          this.#indicator?.close();
          this.#app.quit();
        }
      },
    );

    dialog.setVisible(true);
    return true;
  };

  #createAction = (
    name: string,
    callback: () => void,
    shortcuts?: [string],
  ) => {
    const action = new SimpleAction(name);
    action.connect("activate", callback);
    this.#app.addAction(action);
    if (shortcuts) this.#app.setAccelsForAction(`app.${name}`, shortcuts);
  };

  #toggleSuspend = (yes: boolean) => {
    const idleRowActive = this.#idleRow.getActive();
    if (yes) {
      if (this.#state.exitBehaviorV2 === "Run in Background") {
        this.#indicator?.activate();
      }

      // Clear any existing timer
      if (this.#suspendTimerId) {
        sourceRemove(this.#suspendTimerId);
        this.#suspendTimerId = undefined;
      }

      // Set up timer if duration is not "Never"
      if (this.#state.suspendTimer !== "Never") {
        const totalMinutes = parseInt(this.#state.suspendTimer);
        this.#suspendRemainingMinutes = totalMinutes;
        this.#updateSuspendSubtitle();

        // Update every minute
        this.#suspendTimerId = timeoutSeconds(
          60,
          () => {
            if (this.#suspendRemainingMinutes !== undefined) {
              this.#suspendRemainingMinutes--;
              if (this.#suspendRemainingMinutes <= 0) {
                this.#suspendRow.setActive(false);

                if (!this.#win.isVisible()) {
                  // inform user via notification
                  const notification = new Notification(
                    UI_LABELS.Stimulator,
                  );
                  notification.setBody(
                    UI_LABELS["Automatic suspending reactivated"],
                  );
                  this.#app.sendNotification(APP_ID, notification);
                }

                return false;
              }
              this.#updateSuspendSubtitle();
            }
            return true;
          },
        );
      } else {
        this.#suspendRow.setSubtitle(UI_LABELS["Current state: Indefinitely"]);
      }

      this.#mainIcon.setFromIconName(
        APP_ID,
      );

      this.#idleRow.setSensitive(true);
      if (idleRowActive) {
        this.#toggleIdle(true);
      }

      const result = this.#app.inhibit(
        this.#win,
        ApplicationInhibitFlags.SUSPEND,
        // NOTE: the reason is needed for flatpak to work
        UI_LABELS["Stimulator is active"],
      );

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
        sourceRemove(this.#suspendTimerId);
        this.#suspendTimerId = undefined;
        this.#suspendRemainingMinutes = undefined;
      }

      this.#suspendRow.setSubtitle(UI_LABELS["Current state: System default"]);
      this.#mainIcon.setFromIconName(
        `${APP_ID}-inactive`,
      );

      const suspendCookie = this.#cookies.suspend;
      if (suspendCookie) {
        this.#app.uninhibit(suspendCookie);
        this.#cookies.suspend = undefined;
      }

      // if suspend is desactivated, disallow setting idle
      this.#idleRow.setSensitive(false);

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

      this.#suspendRow.setSubtitle(
        `${UI_LABELS["Current state"]}: ${timeText}`,
      );
    }
  };

  #restartSuspendTimer = () => {
    // Clear existing timer
    if (this.#suspendTimerId) {
      sourceRemove(this.#suspendTimerId);
      this.#suspendTimerId = undefined;
    }

    // Set up new timer if duration is not "Never"
    if (this.#state.suspendTimer !== "Never") {
      const totalMinutes = parseInt(this.#state.suspendTimer);
      this.#suspendRemainingMinutes = totalMinutes;
      this.#updateSuspendSubtitle();

      // Update every minute
      this.#suspendTimerId = timeoutSeconds(
        60,
        () => {
          if (this.#suspendRemainingMinutes !== undefined) {
            this.#suspendRemainingMinutes--;
            if (this.#suspendRemainingMinutes <= 0) {
              this.#suspendRow.setActive(false);

              if (!this.#win.isVisible()) {
                // inform user via notification
                const notification = new Notification(
                  UI_LABELS.Stimulator,
                );
                notification.setBody(
                  UI_LABELS["Automatic idling reactivated"],
                );
                this.#app.sendNotification(APP_ID, notification);
              }

              return false;
            }
            this.#updateSuspendSubtitle();
          }
          return true;
        },
      );
    } else {
      this.#suspendRow.setSubtitle(UI_LABELS["Current state: Indefinitely"]);
    }
  };

  #toggleIdle = (state: boolean | "active_disabled") => {
    const suspendRowActive = this.#suspendRow.getActive();
    if (suspendRowActive && state === true) {
      // Clear any existing timer
      if (this.#idleTimerId) {
        sourceRemove(this.#idleTimerId);
        this.#idleTimerId = undefined;
      }

      // Set up timer if duration is not "Never"
      if (this.#state.idleTimer !== "Never") {
        const totalMinutes = parseInt(this.#state.idleTimer);
        this.#idleRemainingMinutes = totalMinutes;
        this.#updateIdleSubtitle();

        // Update every minute
        this.#idleTimerId = timeoutSeconds(
          60,
          () => {
            if (this.#idleRemainingMinutes !== undefined) {
              this.#idleRemainingMinutes--;
              if (this.#idleRemainingMinutes <= 0) {
                this.#idleRow.setActive(false);
                return false;
              }
              this.#updateIdleSubtitle();
            }
            return true;
          },
        );
      } else {
        this.#idleRow.setSubtitle(UI_LABELS["Current state: Indefinitely"]);
      }

      // We try first using org.freedesktop.ScreenSaver.Inhibit
      // If that doesn't work we fallback to Gtk Idle Inhibit method
      // NOTE: kde freezes for 30 seconds if the app requests more then one (1) inhibitor
      // This method workaround this
      if (this.#screenSaverProxy) {
        this.#cookies.screenSaverCookie =
          this.#screenSaverProxy.callWithStringsGetUint32(
            "Inhibit",
            UI_LABELS.Stimulator,
            UI_LABELS["Stimulator is active"],
          ) ?? undefined;
      }
      if (!this.#cookies.screenSaverCookie) {
        this.#cookies.idle = this.#app.inhibit(
          this.#win,
          ApplicationInhibitFlags.IDLE,
          // NOTE: the reason is needed for flatpak to work
          UI_LABELS["Stimulator is active"],
        );
      }
    } else {
      // Clear timer
      if (this.#idleTimerId) {
        sourceRemove(this.#idleTimerId);
        this.#idleTimerId = undefined;
        this.#idleRemainingMinutes = undefined;
      }

      this.#idleRow.setSubtitle(UI_LABELS["Current state: System default"]);
      const idleCookie = this.#cookies.idle;
      if (idleCookie) {
        this.#app.uninhibit(idleCookie);
        this.#cookies.idle = undefined;
      }

      const screenSaverCookie = this.#cookies.screenSaverCookie;

      if (screenSaverCookie && this.#screenSaverProxy) {
        this.#screenSaverProxy.callWithUint32("UnInhibit", screenSaverCookie);
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

      this.#idleRow.setSubtitle(`${UI_LABELS["Current state"]}: ${timeText}`);
    }
  };

  #restartIdleTimer = () => {
    // Clear existing timer
    if (this.#idleTimerId) {
      sourceRemove(this.#idleTimerId);
      this.#idleTimerId = undefined;
    }

    // Set up new timer if duration is not "Never"
    if (this.#state.idleTimer !== "Never") {
      const totalMinutes = parseInt(this.#state.idleTimer);
      this.#idleRemainingMinutes = totalMinutes;
      this.#updateIdleSubtitle();

      // Update every minute
      this.#idleTimerId = timeoutSeconds(
        60,
        () => {
          if (this.#idleRemainingMinutes !== undefined) {
            this.#idleRemainingMinutes--;
            if (this.#idleRemainingMinutes <= 0) {
              this.#idleRow.setActive(false);
              return false;
            }
            this.#updateIdleSubtitle();
          }
          return true;
        },
      );
    } else {
      this.#idleRow.setSubtitle(UI_LABELS["Current state: Indefinitely"]);
    }
  };

  #showAbout = () => {
    const dialog = new AboutWindow();
    const activeWindow = this.#app.getActiveWindow();
    if (activeWindow) {
      dialog.setTransientFor(activeWindow);
    }
    dialog.setApplicationName(APP_NAME);
    dialog.setVersion(VERSION);
    dialog.setDeveloperName("Bedis Nbiba");
    dialog.setDevelopers(["Bedis Nbiba <bedisnbiba@gmail.com>"]);
    dialog.setDesigners(["Meybo Nõmme <meybo@meybo.ee>"]);
    dialog.setTranslatorCredits(UI_LABELS["translator-credits"]);
    dialog.setLicenseType(License.MIT_X11);
    dialog.setWebsite("https://github.com/sigmaSd/stimulator");
    dialog.setIssueUrl(
      "https://github.com/sigmaSd/stimulator/issues",
    );
    dialog.setApplicationIcon(APP_ID);

    dialog.setVisible(true);
  };

  #showShortcuts = () => {
    const builder = new Builder();
    builder.addFromFile(
      new URL(import.meta.resolve("./ui/shortcuts.ui")).pathname,
    );
    const shortcutsWinPtr = builder.getObject("shortcutsWin");
    if (!shortcutsWinPtr) return;

    const shortcutsWin = new Window(shortcutsWinPtr);
    shortcutsWin.setTransientFor(this.#win);
    shortcutsWin.setModal(true);

    // Set titles via properties
    const shortcutsGroupPtr = builder.getObject("shortcutsGroup");
    if (shortcutsGroupPtr) {
      const shortcutsGroup = { ptr: shortcutsGroupPtr } as any;
      // Using setProperty since these are custom widgets
      // Note: In pure FFI we'd need to use g_object_set_property
    }

    const preferencesShortcutPtr = builder.getObject("preferencesShortcut");
    const keyboardShortcutShortcutPtr = builder.getObject(
      "keyboardShortcutShortcut",
    );
    const mainMenuShortcutPtr = builder.getObject("mainMenuShortcut");
    const quitShortcutPtr = builder.getObject("quitShortcut");

    // For shortcuts window, properties are set via the UI file
    // The translations would need to be handled differently in pure FFI

    shortcutsWin.present();
  };

  #platformUnsupportedExit() {
    const activeWindow = this.#app.getActiveWindow();
    const dialog = new MessageDialog(
      activeWindow,
      UI_LABELS["Unsupported System"],
      UI_LABELS[
        "Your desktop environment doesn't support Stimulator, click close to quit"
      ],
    );

    dialog.addResponse("close", UI_LABELS.Close);
    dialog.setCloseResponse("close");
    dialog.setDefaultResponse("close");
    dialog.setResponseAppearance(
      "close",
      ResponseAppearance.DESTRUCTIVE,
    );
    dialog.onResponse(
      (id) => {
        // make sure to turn off the buttons
        this.updateState({ suspend: false, idle: false });
        if (id === "close") this.#app.quit();
      },
    );

    dialog.setVisible(true);
    return true;
  }
}

if (import.meta.main) {
  const css_provider = new CssProvider();
  css_provider.loadFromData(mainCss);
  const display = Display.getDefault();
  if (display) {
    StyleContext.addProviderForDisplay(
      display,
      css_provider,
      StyleProviderPriority.APPLICATION,
    );
  }

  const app = new Application(APP_ID, ApplicationFlags.NONE);
  let win: MainWindow | undefined;

  app.onActivate(() => {
    // NOTE: there could be already an active window
    // if the app is restored after being hidden on exit
    if (!win) win = new MainWindow(app);

    win.present();
    win.indicator?.hideShowButton();
    // withdraw any active notification
    app.withdrawNotification(APP_ID);
  });

  unixSignalAdd(
    UnixSignal.SIGINT,
    () => {
      app.quit();
      return false;
    },
  );

  app.run(Deno.args);
}
