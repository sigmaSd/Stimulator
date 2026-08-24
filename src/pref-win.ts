import {
  ColorScheme,
  getComboRow,
  getPreferencesWindow,
  type PreferencesWindow,
  StyleManager,
} from "@sigmasd/gtk/adw";
import { Builder, StringList, type Window } from "@sigmasd/gtk/gtk4";
import { timeout } from "@sigmasd/gtk/glib";
import { UI_LABELS } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import type { MainWindow, TimerDuration } from "./main.ts";

import preferencesUi from "./ui/preferences.ui" with { type: "text" };

export type Theme = "System Theme" | "Light" | "Dark";
export type Behavior = "Ask Confirmation" | "Run in Background" | "Quit";

export class PreferencesMenu {
  #preferencesWin: PreferencesWindow;

  constructor(mainWindow: MainWindow) {
    const builder = new Builder();
    builder.addFromString(preferencesUi);

    this.#preferencesWin = getPreferencesWindow(builder, "preferencesWin")!;
    this.#preferencesWin.setHideOnClose(true);
    this.#preferencesWin.setModal(true);

    const themeRow = getComboRow(builder, "themeRow")!;
    const themeItems = ["System Theme", "Light", "Dark"] as Theme[];

    themeRow.setTitle(UI_LABELS.Theme);
    themeRow.setModel(
      new StringList(
        themeItems.map((item) => UI_LABELS[item as keyof UI_LABELS]),
      ),
    );
    //NOTE: ADW bug, setSelected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    themeRow.setSelected(1);
    themeRow.setSelected(
      themeItems.indexOf(mainWindow.state.themeV2),
    );
    themeRow.onSelectedChanged(
      (selected) => {
        const theme = themeItems[selected];
        //deno-fmt-ignore
        StyleManager.getDefault().setColorScheme(
            theme === "System Theme" ? ColorScheme.DEFAULT
          : theme === "Light" ? ColorScheme.FORCE_LIGHT
          : ColorScheme.FORCE_DARK,
        );
        mainWindow.updateState({ themeV2: theme });
      },
    );

    const behaviorOnExitRow = getComboRow(builder, "behaviorOnExitRow")!;
    const behaviorOnExitItems = [
      "Ask Confirmation",
      "Run in Background",
      "Quit",
    ] as Behavior[];
    behaviorOnExitRow.setTitle(UI_LABELS["Behavior on Closing"]);
    behaviorOnExitRow.setSubtitle(UI_LABELS["Applies only while active"]);
    behaviorOnExitRow.setModel(
      new StringList(
        behaviorOnExitItems.map((item) => UI_LABELS[item as keyof UI_LABELS]),
      ),
    );
    //NOTE: ADW bug, setSelected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    behaviorOnExitRow.setSelected(1);
    behaviorOnExitRow.setSelected(
      behaviorOnExitItems.indexOf(mainWindow.state.exitBehaviorV2),
    );

    behaviorOnExitRow.onSelectedChanged(
      (selected) => {
        const behavior = behaviorOnExitItems[selected];
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
          timeout(
            500,
            () => {
              mainWindow.indicator?.hide();
              return false;
            },
          );
        }

        mainWindow.updateState({ exitBehaviorV2: behavior });
      },
    );

    const suspendTimer = getComboRow(builder, "suspendTimer")!;
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

    suspendTimer.setTitle(UI_LABELS["Suspend Timer"]);
    suspendTimer.setSubtitle(UI_LABELS["Auto-disable after selected time"]);
    suspendTimer.setModel(new StringList(timerLabels));
    //NOTE: ADW bug workaround
    suspendTimer.setSelected(1);
    suspendTimer.setSelected(
      timerOptions.indexOf(mainWindow.state.suspendTimer),
    );
    suspendTimer.onSelectedChanged(
      (selected) => {
        const duration = timerOptions[selected];
        mainWindow.updateState({ suspendTimer: duration });
      },
    );

    const idleTimer = getComboRow(builder, "idleTimer")!;
    idleTimer.setTitle(UI_LABELS["Idle Timer"]);
    idleTimer.setSubtitle(UI_LABELS["Auto-disable after selected time"]);
    idleTimer.setModel(new StringList(timerLabels));
    //NOTE: ADW bug workaround
    idleTimer.setSelected(1);
    idleTimer.setSelected(
      timerOptions.indexOf(mainWindow.state.idleTimer),
    );
    idleTimer.onSelectedChanged(
      (selected) => {
        const duration = timerOptions[selected];
        mainWindow.updateState({ idleTimer: duration });
      },
    );
  }

  set_transient_for(window: Window) {
    this.#preferencesWin.setTransientFor(window);
  }
  present() {
    this.#preferencesWin.setVisible(true);
  }
}
