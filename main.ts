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
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.2.0/mod.ts";

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

    this.#button = Gtk.ToggleButton(
      new NamedArgument("label", "OFF"),
    );
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
      button.set_label("ON");
      if (this.#cookie !== undefined) return;
      // NOTE: works but for some reason it issues a warning the first time its called about invalid flags
      this.#cookie = this.#app.inhibit(
        this,
        Gtk.ApplicationInhibitFlags.IDLE,
      );
    } else {
      button.set_label("OFF");
      if (this.#cookie === undefined) return;
      this.#app.uninhibit(this.#cookie);
      this.#cookie = undefined;
    }
  });

  #showAbout = python.callback(() => {
    const about = Gtk.AboutDialog();
    about.set_transient_for(this);
    about.set_modal(this);

    about.set_program_name("No Sleep");
    about.set_comments(
      "Inhibit the desktop environment from sleeping (Ideling)",
    );
    about.set_authors(["Bedis Nbiba"]);
    about.set_license_type(Gtk.License.MIT_X11);
    about.set_website("https://github.com/sigmaSd/nosleep");
    about.set_website_label("Github");
    about.set_version("0.3.0");
    about.set_logo_icon_name("io.github.sigmasd.nosleep");

    about.set_visible(true);
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
