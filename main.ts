#!/usr/bin/env -S  deno run --allow-ffi --allow-read --allow-env=DENO_PYTHON_PATH,CSS --unstable-ffi main.ts
import {
  Adw,
  Gdk,
  Gio,
  Gtk,
  Gtk_,
  kw,
  NamedArgument,
  python,
} from "https://raw.githubusercontent.com/sigmaSd/deno-gtk-py/0.1.3/mod.ts";
import { Inhibitor } from "./inhibit.ts";

class MainWindow extends Gtk.ApplicationWindow {
  #button;
  #inhibitor = new Inhibitor();
  #about?: Gtk_.AboutDialog;
  #popover: Gtk_.PopoverMenu;
  #hamburger: Gtk_.MenuButton;
  #header: Gtk_.HeaderBar;
  constructor(kwArg: NamedArgument) {
    super(kwArg);
    this.set_default_size(300, 150);
    this.set_title("No Sleep");
    this.set_resizable(false);
    this.#header = Gtk.HeaderBar();
    this.set_titlebar(this.#header);

    this.#button = Gtk.ToggleButton(
      new NamedArgument("label", "OFF"),
    );
    this.#button.set_css_classes(["mainToggle"]);
    this.#button.connect("clicked", this.#toggleSleep);
    this.set_child(this.#button);

    this.connect(
      "close-request",
      python.callback(() => {
        this.#inhibitor.unInhibit();
      }),
    );

    // menu
    const menu = Gio.Menu.new();
    this.#popover = Gtk.PopoverMenu();
    this.#popover.set_menu_model(menu);
    this.#hamburger = Gtk.MenuButton();
    this.#hamburger.set_popover(this.#popover);
    this.#hamburger.set_icon_name("open-menu-symbolic");
    this.#header.pack_start(this.#hamburger);

    // about dialog
    const action = Gio.SimpleAction.new("about");
    action.connect("activate", this.#showAbout);
    this.add_action(action);
    menu.append("About", "win.about");
  }

  #toggleSleep = python.callback((_, button: Gtk_.ToggleButton) => {
    if (button.get_active().valueOf()) {
      button.set_label("ON");
      this.#inhibitor.inhibit();
    } else {
      button.set_label("OFF");
      this.#inhibitor.unInhibit();
    }
  });

  #showAbout = python.callback(() => {
    this.#about = Gtk.AboutDialog();
    this.#about.set_transient_for(this);
    this.#about.set_modal(this);

    this.#about.set_program_name("No Sleep");
    this.#about.set_comments("Inhibit gnome from sleeping (Ideling)");
    this.#about.set_authors(["Bedis Nbiba"]);
    this.#about.set_license_type(Gtk.License.MIT_X11);
    this.#about.set_website("https://github.com/sigmaSd/gnome-nosleep");
    this.#about.set_website_label("Github");
    this.#about.set_version("0.2.8");
    this.#about.set_logo_icon_name("io.github.sigmasd.nosleep");

    this.#about.set_visible(true);
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
