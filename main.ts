#!/usr/bin/env -S  deno run --allow-ffi --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi main.ts
import {
  Adw,
  Adw_,
  Gdk,
  Gio,
  GLib,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.2.2/mod.ts";

const VERSION = "0.4.0";

class MainWindow extends Gtk.ApplicationWindow {
  #app: Adw_.Application;
  #button: Gtk_.ToggleButton;
  #cookie?: number;
  constructor(app: Adw_.Application) {
    super(new NamedArgument("application", app));
    this.#app = app;
    this.set_default_size(300, 150);
    this.set_title("No Sleep");
    this.set_resizable(false);
    const header = Gtk.HeaderBar();
    this.set_titlebar(header);

    this.#button = Gtk.ToggleButton();
    this.#button.set_icon_name("system-shutdown-symbolic");
    this.#button.set_css_classes(["mainToggle"]);
    this.#button.connect("clicked", this.#toggleSleep);
    this.set_child(this.#button);

    // menu
    const menu = Gio.Menu.new();
    const popover = Gtk.PopoverMenu();
    popover.set_menu_model(menu);
    const hamburger = Gtk.MenuButton();
    hamburger.set_popover(popover);
    hamburger.set_icon_name("open-menu-symbolic");
    header.pack_start(hamburger);

    // about dialog
    const action = Gio.SimpleAction.new("about");
    action.connect("activate", this.#showAbout);
    this.add_action(action);
    menu.append("About", "win.about");
  }

  #toggleSleep = python.callback((_, button: Gtk_.ToggleButton) => {
    if (button.get_active().valueOf()) {
      if (this.#cookie !== undefined) return;
      // NOTE: works but for some reason it issues a warning the first time its called about invalid flags
      this.#cookie = this.#app.inhibit(
        this,
        Gtk.ApplicationInhibitFlags.IDLE,
      );
    } else {
      if (this.#cookie === undefined) return;
      this.#app.uninhibit(this.#cookie);
      this.#cookie = undefined;
    }
  });

  #showAbout = python.callback(() => {
    const dialog = Adw.AboutWindow(
      new NamedArgument("transient_for", this.#app.get_active_window()),
    );
    dialog.set_application_name("No Sleep");
    dialog.set_version(VERSION);
    dialog.set_developer_name("Bedis Nbiba");
    dialog.set_license_type(Gtk.License.MIT_X11);
    dialog.set_comments("Stop the desktop environment from sleeping");
    dialog.set_website("https://github.com/sigmaSd/nosleep");
    dialog.set_issue_url(
      "https://github.com/sigmaSd/nosleep/issues",
    );
    dialog.set_application_icon("io.github.sigmasd.nosleep");

    dialog.set_visible(true);
  });
}

class App extends Adw.Application {
  #win?: MainWindow;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.connect("activate", this.#onActivate);
  }
  #onActivate = python.callback((_kwarg, app: Adw_.Application) => {
    this.#win = new MainWindow(app);
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
  const signal = python.import("signal");
  GLib.unix_signal_add(
    GLib.PRIORITY_HIGH,
    signal.SIGINT,
    python.callback(() => {
      app.quit();
    }),
  );
  app.run(Deno.args);
}
