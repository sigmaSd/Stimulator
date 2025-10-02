import { type Adw1_ as Adw_, type Gtk4_ as Gtk_, python } from "deno-gtk-py";
import { UI_LABELS } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import { Adw, GLib, Gtk, type MainWindow, type TimerDuration } from "./main.ts";

import preferencesUi from "./ui/preferences.ui" with { type: "text" };

export type Theme = "System Theme" | "Light" | "Dark";
export type Behavior = "Ask Confirmation" | "Run in Background" | "Quit";

export class PreferencesMenu {
  #preferencesWin: Adw_.PreferencesWindow;

  constructor(mainWindow: MainWindow) {
    const builder = Gtk.Builder();
    builder.add_from_string(preferencesUi);

    this.#preferencesWin = builder.get_object(
      "preferencesWin",
    ) as Adw_.PreferencesWindow;
    this.#preferencesWin.set_hide_on_close(true);
    this.#preferencesWin.set_modal(true);

    const themeRow = builder.get_object<Adw_.ComboRow>("themeRow");
    const themeItems = ["System Theme", "Light", "Dark"] as Theme[];

    themeRow.set_title(UI_LABELS.Theme);
    themeRow.set_model(
      Gtk.StringList.new(
        themeItems.map((item) => UI_LABELS[item as keyof UI_LABELS]),
      ),
    );
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    themeRow.set_selected(1);
    themeRow.set_selected(
      themeItems.indexOf(mainWindow.state.themeV2),
    );
    themeRow.connect(
      "notify::selected",
      python.callback(() => {
        const theme = themeItems[themeRow.get_selected().valueOf()];
        //deno-fmt-ignore
        Adw.StyleManager.get_default().set_color_scheme(
            theme === "System Theme" ? Adw.ColorScheme.DEFAULT
          : theme === "Light" ? Adw.ColorScheme.FORCE_LIGHT
          : Adw.ColorScheme.FORCE_DARK,
        );
        mainWindow.updateState({ themeV2: theme });
      }),
    );

    const behaviorOnExitRow = builder.get_object(
      "behaviorOnExitRow",
    ) as Adw_.ComboRow;
    const behaviorOnExitItems = [
      "Ask Confirmation",
      "Run in Background",
      "Quit",
    ] as Behavior[];
    behaviorOnExitRow.set_title(UI_LABELS["Behavior on Closing"]);
    behaviorOnExitRow.set_subtitle(UI_LABELS["Applies only while active"]);
    behaviorOnExitRow.set_model(
      Gtk.StringList.new(
        behaviorOnExitItems.map((item) => UI_LABELS[item as keyof UI_LABELS]),
      ),
    );
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    behaviorOnExitRow.set_selected(1);
    behaviorOnExitRow.set_selected(
      behaviorOnExitItems.indexOf(mainWindow.state.exitBehaviorV2),
    );

    behaviorOnExitRow.connect(
      "notify::selected",
      python.callback(() => {
        const behavior = behaviorOnExitItems[
          behaviorOnExitRow
            .get_selected().valueOf()
        ];
        // If the option is a `Run In Background` make sure to run the indicator
        if (behavior === "Run in Background") {
          if (mainWindow.indicator === undefined) {
            mainWindow.indicator = new Indicator(mainWindow);
          }
          if (mainWindow.state.suspend) {
            mainWindow.indicator.activate();
          } else {
            mainWindow.indicator.deactivate();
          }
        } else {
          // NOTE: run this after a bit of time, so messages don't get mixed up in the write buffer
          GLib.timeout_add(
            500,
            python.callback(() => mainWindow.indicator?.hide()),
          );
        }

        mainWindow.updateState({ exitBehaviorV2: behavior });
      }),
    );

    const suspendTimer = builder.get_object<Adw_.ComboRow>("suspendTimer");
    const timerOptions = [
      "5",
      "15",
      "30",
      "60",
      "120",
      "240",
      "Never",
    ] as TimerDuration[];
    const timerLabels = [
      UI_LABELS["5 minutes"],
      UI_LABELS["15 minutes"],
      UI_LABELS["30 minutes"],
      UI_LABELS["1 hour"],
      UI_LABELS["2 hours"],
      UI_LABELS["4 hours"],
      UI_LABELS.Never,
    ];

    suspendTimer.set_title(UI_LABELS["Suspend Timer"]);
    suspendTimer.set_subtitle(UI_LABELS["Auto-disable after selected time"]);
    suspendTimer.set_model(Gtk.StringList.new(timerLabels));
    //NOTE: ADW bug workaround
    suspendTimer.set_selected(1);
    suspendTimer.set_selected(
      timerOptions.indexOf(mainWindow.state.suspendTimer),
    );
    suspendTimer.connect(
      "notify::selected",
      python.callback(() => {
        const duration = timerOptions[suspendTimer.get_selected().valueOf()];
        mainWindow.updateState({ suspendTimer: duration });
      }),
    );

    const idleTimer = builder.get_object<Adw_.ComboRow>("idleTimer");
    idleTimer.set_title(UI_LABELS["Idle Timer"]);
    idleTimer.set_subtitle(UI_LABELS["Auto-disable after selected time"]);
    idleTimer.set_model(Gtk.StringList.new(timerLabels));
    //NOTE: ADW bug workaround
    idleTimer.set_selected(1);
    idleTimer.set_selected(
      timerOptions.indexOf(mainWindow.state.idleTimer),
    );
    idleTimer.connect(
      "notify::selected",
      python.callback(() => {
        const duration = timerOptions[idleTimer.get_selected().valueOf()];
        mainWindow.updateState({ idleTimer: duration });
      }),
    );
  }

  set_transient_for(window: Gtk_.ApplicationWindow) {
    this.#preferencesWin.set_transient_for(window);
  }
  present() {
    this.#preferencesWin.set_visible(true);
  }
}
