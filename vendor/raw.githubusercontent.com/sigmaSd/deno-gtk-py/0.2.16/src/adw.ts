import type {
  Callback,
  Gio_,
  Gtk_,
  NamedArgument,
  PyObject,
  PythonConvertible,
} from "../mod.ts";

export interface Adw {
  ResponseAppearance: {
    DEFAULT: ResponseAppearance.DEFAULT;
    SUGGESTED: ResponseAppearance.SUGGESTED;
    DESTRUCTIVE: ResponseAppearance.DESTRUCTIVE;
  };
  PreferencesGroup(): PreferencesGroup;
  PreferencesPage(): PreferencesPage;
  PreferencesWindow(kwArg: NamedArgument): PreferencesWindow;
  MessageDialog(...kwArg: NamedArgument[]): MessageDialog;
  AboutWindow(kwArg: NamedArgument): AboutWindow;
  Application: ApplicationConstructor;
  run: () => void;
}
export interface AboutWindow {
  set_designers(designers: string[]): void;
  set_application_icon(icon: string): void;
  set_visible(visible: boolean): void;
  set_developers(developers: string[]): void;
  set_copyright(copyright: string): void;
  set_translator_credits(credits: string): void;
  add_credit_section(arg0: string, arg1: string[]): void;
  set_issue_url(url: string): void;
  set_website(website: string): void;
  set_comments(comments: string): void;
  set_license_type(license: never): void;
  set_developer_name(name: string): void;
  set_version(version: string): void;
  set_application_name(name: string): void;
}

export interface ApplicationConstructor {
  new (kwArg: NamedArgument): Application;
}

export interface Application extends PyObject {
  set_accels_for_action(detailedActionName: string, accels: [string]): void;
  add_action(action: Gio_.SimpleAction): void;
  inhibit(
    window: Gtk_.ApplicationWindow,
    flags: number,
    reason?: string,
  ): number;
  uninhibit(cookie: number): void;
  //FIXME: args type
  run: (args: string[]) => void;
  connect: (signal: "activate", callback: Callback) => void;
  //FIXME: PythonConvertible should not be needed
  // it should be ApplicaitonWindow
  get_active_window: () => PythonConvertible;
  quit: () => void;
}

export interface PreferencesPage extends Gtk_.Widget {
  add(group: PreferencesGroup): void;
}
export interface PreferencesWindow extends Gtk_.Window {
  set_visible(yes: boolean): void;
  add(page: PreferencesPage): void;
}
export interface PreferencesGroup extends Gtk_.Widget {
  set_title(title: string): void;
  add(child: Gtk_.Widget): void;
}
export interface SwitchRow extends Gtk_.Switch {
  get_active(): { valueOf: () => boolean };
  set_title(title: string): void;
  set_subtitle(subTitle: string): void;
  set_sensitive(yes: boolean): void;
  connect(event: "state-set" | "notify::active", callback: Callback): void;
}

export interface MessageDialog extends Gtk_.Window {
  add_response(id: string, label: string): void;
  set_response_appearance(id: string, apperance: ResponseAppearance): void;
  set_default_response(id: string): void;
  set_close_response(id: string): void;
  connect(signal: string, callback: Callback): void;
}

export enum ResponseAppearance {
  DEFAULT,
  SUGGESTED,
  DESTRUCTIVE,
}
