import { Adw1_ as Adw_, Gtk4_ as Gtk_, python } from "deno-gtk-py";
import { UI_LABELS } from "./consts.ts";
import { Indicator } from "./indicator/indicator_api.ts";
import { Adw, GLib, Gtk, MainWindow } from "./main.ts";

export type Theme = "System Theme" | "Light" | "Dark";
export type Behavior = "Ask Confirmation" | "Run in Background" | "Quit";

export class PreferencesMenu {
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
      themeItems.indexOf(mainWindow.state["themeV2"]),
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
        mainWindow.updateState({ "themeV2": theme });
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
      behaviorOnExitItems.indexOf(mainWindow.state["exitBehaviorV2"]),
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

        mainWindow.updateState({ "exitBehaviorV2": behavior });
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
