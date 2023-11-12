#!/usr/bin/env -S  deno run --allow-run=gnome-session-inhibit --allow-ffi --allow-env=DENO_PYTHON_PATH --unstable-ffi main.ts
import {
  Adw,
  Gdk,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.1.0/mod.ts";

class MainWindow extends Gtk.ApplicationWindow {
  #button;
  #idleStop = new IdleStop();
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
      python.callback((): undefined => {
        this.#idleStop.end();
      }),
    );
  }

  toggleSleep = python.callback((_, button: Gtk_.ToggleButton): undefined => {
    if (button.get_active().toString() === "True") {
      button.set_label("ON");
      this.#idleStop.start();
    } else {
      button.set_label("OFF");
      this.#idleStop.end();
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

class IdleStop {
  #proc?: Deno.ChildProcess;
  start() {
    this.#proc = new Deno.Command("gnome-session-inhibit", {
      args: ["--inhibit", "idle", "read"],
      stdin: "piped",
    }).spawn();
  }
  end() {
    //FIXME: this does't kill the process at runtime
    // it seems to be an ineraction with Gtk.Application
    // But its still needed to stop the gnome idle inhibitor
    this.#proc?.kill();
  }
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
  const app = new App(kw`application_id=${"io.sigmasd.nosleep"}`);
  app.run(Deno.args);
}
