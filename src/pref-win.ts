import { Adw1_ as Adw_, python } from "deno-gtk-py";
import { UI_LABELS } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import { Adw, GLib, Gtk, MainWindow } from "./main.ts";

export type Theme = "System Theme" | "Dark" | "Light";

type ThemeItems =
  & {
    [key in Theme]: number;
  }
  & {
    fromId(id: number): Theme | undefined;
    toId(theme: Theme): number;
    label(item: Theme): string;
  };

export class PreferencesMenu {
  #preferencesWin: Adw_.PreferencesWindow;
  #themeItems: ThemeItems = {
    "System Theme": 0, // -> ["s","l","d"]
    "Light": 1,
    "Dark": 2,

    fromId(id: number): Theme {
      return Object.keys(this)
        .find((key) => this[key as Theme] === id) as Theme;
    },
    toId(theme: Theme): number {
      return this[theme];
    },
    label: (item: Theme) => {
      return UI_LABELS[item as keyof UI_LABELS];
    },
  };

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
        this.#themeItems.label("System Theme"),
        this.#themeItems.label("Light"),
        this.#themeItems.label("Dark"),
      ]),
    );
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    themeRow.set_selected(1);
    themeRow.set_selected(this.#themeItems.toId(mainWindow.state["themeV2"]));
    themeRow.connect(
      "notify::selected",
      python.callback(() => {
        const theme = this.#themeItems.fromId(
          themeRow.get_selected().valueOf(),
        );
        //deno-fmt-ignore
        Adw.StyleManager.get_default().set_color_scheme(
            theme === "System Theme" ? Adw.ColorScheme.DEFAULT
          : theme === "Light" ? Adw.ColorScheme.FORCE_LIGHT
          : Adw.ColorScheme.FORCE_DARK,
        );
        mainWindow.updateState({ "themeV2": theme });
      }),
    );

    const behaviorOnExitRow = builder.get_object(
      "behaviorOnExitRow",
    ) as Adw_.ComboRow;
    behaviorOnExitRow.set_title(UI_LABELS["Behavior on Closing"]);
    behaviorOnExitRow.set_subtitle(UI_LABELS["Applies only while active"]);
    const rowsLabels = [
      UI_LABELS["Ask Confirmation"],
      UI_LABELS["Run in Background"],
      UI_LABELS["Quit"],
    ];
    behaviorOnExitRow.set_model(
      Gtk.StringList.new(rowsLabels),
    );
    //NOTE: ADW bug, set_selected(0) doesn't set the item as selected initilally
    // so trigger it with this, before the actual correct selection
    behaviorOnExitRow.set_selected(1);
    behaviorOnExitRow.set_selected(mainWindow.state["exitBehavior"] as number);

    behaviorOnExitRow.connect(
      "notify::selected",
      python.callback(() => {
        const behaviorNumber = behaviorOnExitRow
          .get_selected().valueOf();
        // If the option is a `Run In Background` make sure to run the indicator
        if (behaviorNumber === 1) {
          if (mainWindow.indicator === undefined) {
            mainWindow.indicator = new Indicator(mainWindow);
          }
          if (mainWindow.state["suspend"]) {
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

        mainWindow.updateState({ "exitBehavior": behaviorNumber });
      }),
    );
  }

  present() {
    this.#preferencesWin.set_visible(true);
  }
}
