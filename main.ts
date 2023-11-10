#!/usr/bin/env -S  deno run --allow-run=read --allow-ffi --allow-env=DENO_PYTHON_PATH --unstable-ffi main.ts
import {
  Adw,
  Gdk,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/13f3da6c4890d62e09312747c905fa85263f5ca8/mod.ts";

const css_provider = Gtk.CssProvider();
css_provider.load_from_path(
  new URL(import.meta.resolve("./main.css")).pathname,
);
Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  css_provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);

class MainWindow extends Gtk.ApplicationWindow {
  #button;
  #noSleep = false;
  #proc: Deno.ChildProcess | undefined;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.set_default_size(300, 150);
    this.set_title("Awaker");

    this.#button = Gtk.ToggleButton(
      new NamedArgument("label", "No Sleep: OFF"),
    );
    this.#button.connect("clicked", this.toggleSleep);
    this.set_child(this.#button);
  }

  toggleSleep = python.callback((_, button: Gtk_.ToggleButton): undefined => {
    this.#noSleep = !this.#noSleep;
    if (this.#noSleep) {
      button.set_label("No Sleep: ON");
      this.#proc = noSleep();
    } else {
      button.set_label("No Sleep: OFF");
      if (this.#proc) {
        //FIXME: this doesn't work
        // seems to be an interaciton with python.callback
        this.#proc.kill();
      }
    }
  });
}

class App extends Adw.Application {
  #win: MainWindow | undefined;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.onActivate);
  }
  onActivate = python.callback((_kwarg, app: Gtk_.Application): undefined => {
    this.#win = new MainWindow(new NamedArgument("application", app));
    this.#win.present();
  });
}

function noSleep(): Deno.ChildProcess {
  return new Deno.Command("gnome-session-inhibit", {
    args: ["--inhibit", "idle", "read"],
  }).spawn();
}

const app = new App(kw`application_id=${"io.sigmasd.nosleep"}`);
app.run(Deno.args);
