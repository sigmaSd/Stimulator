#!/usr/bin/env -S  deno run --allow-run=gnome-session-inhibit --allow-ffi --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi main.ts
import {
  Adw,
  Gdk,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.1.2/mod.ts";
import { Inhibitor } from "./inhibit.ts";

class MainWindow extends Gtk.ApplicationWindow {
  #button;
  #inhibitor = new Inhibitor();
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.set_default_size(300, 150);
    this.set_title("No Sleep");
    this.set_resizable(false);

    this.#button = Gtk.ToggleButton(
      new NamedArgument("label", "OFF"),
    );
    this.#button.connect("clicked", this.toggleSleep);
    this.set_child(this.#button);

    this.connect(
      "close-request",
      python.callback(() => {
        this.#inhibitor.unInhibit();
      }),
    );
  }

  toggleSleep = python.callback((_, button: Gtk_.ToggleButton) => {
    if (button.get_active().valueOf()) {
      button.set_label("ON");
      this.#inhibitor.inhibit();
    } else {
      button.set_label("OFF");
      this.#inhibitor.unInhibit();
    }
  });
}

class App extends Adw.Application {
  #win: MainWindow | undefined;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.onActivate);
  }
  onActivate = python.callback((_kwarg, app: Gtk_.Application) => {
    this.#win = new MainWindow(new NamedArgument("application", app));
    this.#win.present();
  });
}

if (import.meta.main) {
  const css_provider = Gtk.CssProvider();
  css_provider.load_from_path(
    Deno.env.get("CSS") || new URL(import.meta.resolve("./main.css")).pathname,
  );
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    css_provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );
  const app = new App(kw`application_id=${"io.github.sigmasd.nosleep"}`);
  app.run(Deno.args);
}
