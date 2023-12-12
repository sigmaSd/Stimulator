import type {
  Callback,
  Gtk_,
  NamedArgument,
  PyObject,
  PythonConvertible,
} from "../mod.ts";

export interface Adw {
  AboutWindow(kwArg: NamedArgument): AboutWindow;
  Application: ApplicationConstructor;
  run: () => void;
}
export interface AboutWindow {
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
