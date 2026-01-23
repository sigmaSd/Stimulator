import {
  ColorScheme,
  getComboRow,
  getPreferencesWindow,
  StyleManager,
} from "@sigmasd/gtk/adw";

import { Builder, StringList, Window } from "@sigmasd/gtk/gtk4";

import { timeout } from "@sigmasd/gtk/glib";

import { UI_LABELS } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import type { MainWindow, TimerDuration } from "./main.ts";

import preferencesUi from "./ui/preferences.ui" with { type: "text" };

export type Theme = "System Theme" | "Light" | "Dark";
export type Behavior = "Ask Confirmation" | "Run in Background" | "Quit";

export class PreferencesMenu {
  #preferencesWin: Window;

  constructor(mainWindow: MainWindow) {
    const builder = new Builder();
    builder.addFromString(preferencesUi);

    const preferencesWin = getPreferencesWindow(builder, "preferencesWin");
    if (!preferencesWin) {
      throw new Error("Could not find preferencesWin in UI file");
    }
    this.#preferencesWin = preferencesWin;

    this.#preferencesWin.setProperty("hide-on-close", true);
    this.#preferencesWin.setModal(true);

    const themeRow = getComboRow(builder, "themeRow");
    if (!themeRow) {
      throw new Error("Could not find themeRow in UI file");
    }
    const themeItems = ["System Theme", "Light", "Dark"] as Theme[];

    themeRow.setTitle(UI_LABELS.Theme);
    const themeModel = new StringList();
    themeItems.forEach((item) => {
      themeModel.append(UI_LABELS[item as keyof typeof UI_LABELS] as string);
    });
    themeRow.setModel(themeModel);
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initially
    // so trigger it with this, before the actual correct selection
    themeRow.setSelected(1);
    themeRow.setSelected(
      themeItems.indexOf(mainWindow.state.themeV2),
    );
    themeRow.onSelectedChanged(
      () => {
        const theme = themeItems[themeRow.getSelected()];
        //deno-fmt-ignore
        StyleManager.getDefault().setColorScheme(
            theme === "System Theme" ? ColorScheme.DEFAULT
          : theme === "Light" ? ColorScheme.FORCE_LIGHT
          : ColorScheme.FORCE_DARK,
        );
        mainWindow.updateState({ themeV2: theme });
      },
    );

    const behaviorOnExitRow = getComboRow(builder, "behaviorOnExitRow");
    if (!behaviorOnExitRow) {
      throw new Error("Could not find behaviorOnExitRow in UI file");
    }
    const behaviorOnExitItems = [
      "Ask Confirmation",
      "Run in Background",
      "Quit",
    ] as Behavior[];
    behaviorOnExitRow.setTitle(UI_LABELS["Behavior on Closing"]);
    behaviorOnExitRow.setSubtitle(UI_LABELS["Applies only while active"]);
    const behaviorModel = new StringList();
    behaviorOnExitItems.forEach((item) => {
      behaviorModel.append(UI_LABELS[item as keyof typeof UI_LABELS] as string);
    });
    behaviorOnExitRow.setModel(behaviorModel);
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initially
    // so trigger it with this, before the actual correct selection
    behaviorOnExitRow.setSelected(1);
    behaviorOnExitRow.setSelected(
      behaviorOnExitItems.indexOf(mainWindow.state.exitBehaviorV2),
    );

    behaviorOnExitRow.onSelectedChanged(
      () => {
        const behavior = behaviorOnExitItems[
          behaviorOnExitRow.getSelected()
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

    const suspendTimer = getComboRow(builder, "suspendTimer");
    if (!suspendTimer) {
      throw new Error("Could not find suspendTimer in UI file");
    }
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
    const suspendTimerModel = new StringList();
    timerLabels.forEach((label) => {
      suspendTimerModel.append(label);
    });
    suspendTimer.setModel(suspendTimerModel);
    //NOTE: ADW bug workaround
    suspendTimer.setSelected(1);
    suspendTimer.setSelected(
      timerOptions.indexOf(mainWindow.state.suspendTimer),
    );
    suspendTimer.onSelectedChanged(
      () => {
        const duration = timerOptions[suspendTimer.getSelected()];
        mainWindow.updateState({ suspendTimer: duration });
      },
    );

    const idleTimer = getComboRow(builder, "idleTimer");
    if (!idleTimer) {
      throw new Error("Could not find idleTimer in UI file");
    }
    idleTimer.setTitle(UI_LABELS["Idle Timer"]);
    idleTimer.setSubtitle(UI_LABELS["Auto-disable after selected time"]);
    const idleTimerModel = new StringList();
    timerLabels.forEach((label) => {
      idleTimerModel.append(label);
    });
    idleTimer.setModel(idleTimerModel);
    //NOTE: ADW bug workaround
    idleTimer.setSelected(1);
    idleTimer.setSelected(
      timerOptions.indexOf(mainWindow.state.idleTimer),
    );
    idleTimer.onSelectedChanged(
      () => {
        const duration = timerOptions[idleTimer.getSelected()];
        mainWindow.updateState({ idleTimer: duration });
      },
    );
  }

  setTransientFor(window: Window) {
    this.#preferencesWin.setTransientFor(window);
  }

  setModal(modal: boolean) {
    this.#preferencesWin.setModal(modal);
  }

  present() {
    this.#preferencesWin.setVisible(true);
  }
}
