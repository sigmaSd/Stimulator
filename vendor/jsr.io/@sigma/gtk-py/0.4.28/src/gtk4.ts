import type {
  Adw1_,
  Callback,
  Gdk4_,
  Gio2_,
  GObject2_,
  NamedArgument,
  PythonConvertible,
} from "../mod.ts";

export interface Gtk {
  Picture(): Picture;
  Builder(): Builder;
  GestureClick: GestureClick;
  DrawingArea(): DrawingArea;
  AboutDialog(): AboutDialog;
  MenuButton(): MenuButton;
  HeaderBar(): HeaderBar;
  Scale(): Scale;
  PopoverMenu(): PopoverMenu;
  Label(kwArg: NamedArgument): Label;
  Switch(): Switch;
  Box: (kwArg: NamedArgument) => Box;
  ToggleButton(kwArg?: NamedArgument): ToggleButton;
  Button: (kwArg: NamedArgument) => Button;
  CheckButton(arg0: NamedArgument): CheckButton;
  Orientation: {
    HORIZONTAL: PythonConvertible;
    VERTICAL: PythonConvertible;
  };
  License: {
    MIT_X11: never;
    GPL_3_0: never;
  };
  ApplicationInhibitFlags: {
    LOGOUT: ApplicationInhibitFlags;
    SWITCH: ApplicationInhibitFlags;
    SUSPEND: ApplicationInhibitFlags;
    IDLE: ApplicationInhibitFlags;
  };
  FileFilter(): FileFilter;
  STYLE_PROVIDER_PRIORITY_APPLICATION: number;
  StyleContext: StyleContext;
  CssProvider(): CssProvider;
  ApplicationWindow: {
    new (kwArg: NamedArgument): ApplicationWindow;
  };
  FileDialog: FileDialog;
  StringList: { new: (strings: string[]) => StringList };
  DropTarget: {
    new: (
      type: GObject2_.GType | Gio2_.File,
      actions: Gdk4_.DragAction,
    ) => DropTarget;
  };
  EventControllerKey: {
    new: () => EventControllerKey;
  };
  Align: {
    FILL: Align;
    START: Align;
    END: Align;
    CENTER: Align;
    BASELINE: Align;
    BASELINE_FILL: Align;
    BASELINE_CENTER: Align;
  };
}

export type Application = PythonConvertible;

export interface FileFilter {
  set_name(name: string): void;
  add_mime_type(type: "image/jpeg" | "image/png" | string): void;
}

export interface StyleContext {
  add_provider_for_display(
    display: Gdk4_.Display,
    provider: CssProvider,
    proiority: number,
  ): void;
  add_class(class_name: string): void;
}

export interface CssProvider {
  load_from_file(file: Gio2_.File): void;
  load_from_path(path: string): void;
  load_from_data(data: string): void;
}
export interface Window extends Widget {
  hide: () => void;
  present: () => void;
  set_transient_for(parent: ApplicationWindow): void;
  set_modal(modal: boolean): void;
  set_hide_on_close(yes: boolean): void;
}
// deno-lint-ignore no-empty-interface
export interface ShortcutsWindow extends Window {
}
export interface ApplicationWindow extends Window {
  is_visible(): { valueOf(): boolean };
  get_default_size(): {
    width: { valueOf(): number };
    height: { valueOf(): number };
  };
  set_application(app: Adw1_.Application): void;
  set_child: (widget: Widget) => void;
  set_default_size: (width: number, height: number) => void;
  set_title: (name: string) => void;
  set_titlebar: (header: HeaderBar) => void;
  close: () => void;
  add_action(action: Gio2_.SimpleAction): void;
  connect(signal: "close-request", callback: Callback): void;
  set_resizable(yes: boolean): void;
}

export interface Widget extends GObject2_.Object {
  set_css_classes(classes: string[]): void;
  set_tooltip_text(text: string): void;
  set_visible(visible: boolean): void;
  set_size_request(width: number, height: number): void;
  set_halign(align: Align): void;
  add_controller(controller: EventController): void;
  get_style_context(): StyleContext;
}

export interface FileDialog extends Widget {
  set_default_filter(f: FileFilter): void;
  set_filters(filters: Gio2_.ListStore): void;
  // deno-lint-ignore no-explicit-any
  open_finish(result: any): Gio2_.File;
  open(
    window: ApplicationWindow,
    // deno-lint-ignore no-explicit-any
    cancellable: any,
    callback: Callback,
  ): void;
  new: () => FileDialog;
  set_title(title: string): void;
}
export interface Builder {
  get_object<T>(object: string): T;
  add_from_file(file: string): void;
}
export interface GestureClick {
  connect(arg0: string, dw_click: Callback): void;
  new: () => GestureClick;
}
export interface AboutDialog extends Widget {
  /**
   * Sets the comments string to display in the about dialog. This should be a short string of one or two lines.
   */
  set_comments(comments: string): void;
  /**
   * Sets the name to display in the about dialog. If this is not set, it defaults to g_get_application_name().
   */
  set_program_name(name: string): void;
  set_logo_icon_name(name: string): void;
  set_version(version: string): void;
  set_website_label(label: string): void;
  set_website(site: string): void;
  set_license_type(license: never): void;
  set_copyright(copyright: string): void;
  set_authors(authors: string[]): void;
  set_modal(modal: ApplicationWindow): void;
  set_transient_for(window: ApplicationWindow): void;
}
export interface Box extends Widget {
  set_homogeneous(yes: boolean): void;
  set_margin_end(margin: number): void;
  set_margin_start(margin: number): void;
  set_margin_bottom(margin: number): void;
  set_margin_top(margin: number): void;
  append(child: Widget): void;
  set_spacing(spacing: number): void;
}

export interface MenuButton extends Widget {
  set_primary(yes: boolean): void;
  set_popover(menu: PopoverMenu): void;
  set_icon_name(name: string): void;
}

export interface HeaderBar extends Widget {
  pack_start(widget: Widget): void;
}

export interface Switch extends Widget {
  set_active(state: boolean): void;
  connect(event: "state-set", callback: Callback): void;
}

export interface PopoverMenu extends Widget {
  set_menu_model(menu: Gio2_.Menu): void;
}
export interface Scale extends Widget {
  connect(signal: "value-changed", callback: Callback): void;
  set_value(value: number): void;
  set_draw_value(show: boolean): void;
  set_range(start: number, end: number): void;
  set_digits(digits: number): void;
  get_value(): { valueOf(): number };
}

export interface Label extends Widget {
  get_label(): { valueOf: () => string };
  set_label(label: string): void;
  set_text(label: string): void;
}

export interface ToggleButton extends Button {
  get_active(): { valueOf: () => boolean };
}
export interface Button extends Widget {
  set_icon_name(name: string): void;
  connect(event: "clicked", callback: Callback): void;
  set_label(label: string): void;
}
export interface CheckButton extends Widget {
  get_active(): { valueOf: () => boolean };
  set_group(group: CheckButton): void;
  connect: (signal: "toggled", callback: Callback) => void;
}
export interface DrawingArea extends Widget {
  queue_draw(): void;
  set_draw_func(callback: Callback): void;
  set_vexpand(arg0: boolean): void;
  set_hexpand(arg0: boolean): void;
}
export interface Picture extends Widget {
  set_filename(filename: string): void;
  set_keep_aspect_ratio(keep_aspect_ratio: boolean): void;
}
export interface Image extends Widget {
  set_from_icon_name(iconName: string): void;
}
export interface ShortcutsGroup extends Box {
  props: { title: string };
}
export interface ShortcutsShortcut extends Widget {
  props: { title: string };
}

// deno-lint-ignore no-empty-interface
export interface StringList extends Gio2_.ListModel {
}

export interface EventController extends GObject2_.Object {
}

export interface DropTarget extends EventController {
}

export interface EventControllerKey extends GObject2_.Object {
}

export enum ApplicationInhibitFlags {
  LOGOUT = 1,
  SWITCH = 2,
  SUSPEND = 4,
  IDLE = 8,
}
export enum Align {
  FILL = 0,
  START = 1,
  END = 2,
  CENTER = 3,
  BASELINE = 4,
  BASELINE_FILL = 4,
  BASELINE_CENTER = 5,
}
