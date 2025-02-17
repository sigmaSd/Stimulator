import type {
  Callback,
  Gio2_,
  Gtk4_,
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
  ColorScheme: {
    DEFAULT: ColorScheme.DEFAULT;
    FORCE_LIGHT: ColorScheme.FORCE_LIGHT;
    FORCE_DARK: ColorScheme.FORCE_DARK;
  };
  PreferencesGroup(): PreferencesGroup;
  PreferencesPage(): PreferencesPage;
  PreferencesWindow(kwArg: NamedArgument): PreferencesWindow;
  MessageDialog(...kwArg: NamedArgument[]): MessageDialog;
  AboutWindow(kwArg: NamedArgument): AboutWindow;
  Application: ApplicationConstructor;
  StyleManager: { get_default(): StyleManager };
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
  send_notification(id: string, notification: Gio2_.Notification): void;
  withdraw_notification(id: string): void;
  set_accels_for_action(detailedActionName: string, accels: [string]): void;
  add_action(action: Gio2_.SimpleAction): void;
  inhibit(
    window: Gtk4_.ApplicationWindow,
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

export interface PreferencesPage extends Gtk4_.Widget {
  add(group: PreferencesGroup): void;
}
export interface PreferencesWindow extends Gtk4_.Window {
  set_visible(yes: boolean): void;
  add(page: PreferencesPage): void;
}
export interface PreferencesGroup extends Gtk4_.Widget {
  set_title(title: string): void;
  add(child: Gtk4_.Widget): void;
}

export interface PreferencesRow extends Gtk4_.Widget {
  set_title(title: string): void;
}

export interface ActionRow extends PreferencesRow {
  set_subtitle(subtitle: string): void;
}

export interface SwitchRow extends PreferencesRow {
  is_sensitive(): { valueOf: () => boolean };
  get_active(): { valueOf: () => boolean };
  set_active(yes: boolean): void;
  set_subtitle(subTitle: string): void;
  set_sensitive(yes: boolean): void;
  connect(event: "state-set" | "notify::active", callback: Callback): void;
}

export interface ComboRow extends ActionRow {
  get_selected(): { valueOf(): number };
  set_selected(item: number): void;
  set_model(model: Gio2_.ListModel): void;
  connect(signal: "notify::selected", callback: Callback): void;
}

export interface MessageDialog extends Gtk4_.Window {
  add_response(id: string, label: string): void;
  set_response_appearance(id: string, apperance: ResponseAppearance): void;
  set_default_response(id: string): void;
  set_close_response(id: string): void;
  connect(signal: string, callback: Callback): void;
}

export interface StyleManager {
  set_color_scheme: (scheme: ColorScheme) => void;
}

export enum ResponseAppearance {
  DEFAULT = 0,
  SUGGESTED = 1,
  DESTRUCTIVE = 2,
}

export enum ColorScheme {
  DEFAULT = 0,
  FORCE_LIGHT = 1,
  FORCE_DARK = 4,
}
