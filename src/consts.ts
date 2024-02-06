import { t } from "./i18n.ts";

export class EN_UI_LABELS {
  static AppName = "Stimulator";
  static Comments = "Keep your computer awake";
  static Keywords = "caffeine;nosleep;awake;keepawake;keepon;";
  static SuspendTitle = "Disable Automatic Suspending";
  static IdleTitle = "Disable Screen Blanking and Locking";
  static SystemDefault = "Current state= System default";
  static Indefinitely = "Current state= Indefinitely";
  static SimulatorActive = "Stimulator is active";
  static ConfirmClose = "Close Stimulator?";
  static ConfirmCloseBody = "Stimulator is active; do you want to close it?";
  static Cancel = "Cancel";
  static Close = "Close";
  static Preferences = "Preferences";
  static Theme = "Theme";
  static ThemeSystem = "System Theme";
  static ThemeLight = "Light";
  static ThemeDark = "Dark";
  static EnableExistConfirmation = "Closing Confirmation";
  static EnableExistConfirmationSubTitle =
    "Ask for confirmation to close when Stimulator is active";
  static KeyboardShortcuts = "Keyboard Shortcuts";
  static General = "General";
  static MainMenu = "Open Menu";
  static Quit = "Quit";
  static About = "About Stimulator";
  static UnsupportedSystem = "Unsupported System";
  static UnsupportedSystemBody =
    "Your desktop environment doesn't support Stimulator; click close to quit";
  // we don't advertise tray icon support
  static EnableTrayIcon = "Run in Background";
  static Show = "Show";
}

@translate
export class UI_LABELS extends EN_UI_LABELS {}

// deno-lint-ignore no-explicit-any
function translate<T extends { [key: string]: any }>(klass: T, _: any) {
  for (const prop in klass) {
    // deno-lint-ignore no-explicit-any
    (klass as any)[prop] = t((klass as any)[prop]);
  }
  return klass;
}

export const APP_ID = "io.github.sigmasd.stimulator";
export const APP_NAME = UI_LABELS.AppName;
export const VERSION = "0.9.0";
