#!/usr/bin/env -S  deno run --allow-run=gnome-session-inhibit --allow-ffi --allow-env=DENO_PYTHON_PATH --unstable-ffi main.ts
import {
  Adw,
  Gdk,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/9e2432d/mod.ts";

class MainWindow extends Gtk.ApplicationWindow {
  #button;
  #idleStop = new IdleStop();
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.set_default_size(300, 150);
    this.set_title("Awaker");

    this.#button = Gtk.ToggleButton(
      new NamedArgument("label", "No Sleep: OFF"),
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
      button.set_label("No Sleep: ON");
      this.#idleStop.start();
    } else {
      button.set_label("No Sleep: OFF");
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
  #enc = new TextEncoder();
  // keep track of all process spawned
  // since there is a bug, that we can't end the process at runtime
  // this atleast ensures that at exit, all processs gets cleaned up
  #procs: Deno.ChildProcess[] = [];
  start() {
    this.#procs.push(new Deno.Command("gnome-session-inhibit", {
      args: ["--inhibit", "idle", "read"],
      stdin: "piped",
    }).spawn());
  }
  end() {
    for (const proc of this.#procs) {
      try {
        proc.stdin.getWriter().write(this.#enc.encode("\n"));
      } catch {
        // we tried to close it twice, its cool
      }
    }
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
