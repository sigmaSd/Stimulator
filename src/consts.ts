import { t } from "./i18n.ts";

export const EN_UI_LABELS = {
  AppName: "Stimulator",
  Comments: "Keep your computer awake",
  Keywords: "caffeine;nosleep;awake;keepawake;keepon;",
  SuspendTitle: "Disable Automatic Suspending",
  IdleTitle: "Disable Screen Blanking and Locking",
  SystemDefault: "Current state: System default",
  Indefinitely: "Current state: Indefinitely",
  SimulatorActive: "Stimulator is active",
  ConfirmClose: "Close Stimulator?",
  ConfirmCloseBody: "Stimulator is active, do you want to close it?",
  Cancel: "Cancel",
  Close: "Close",
  Preferences: "Preferences",
  Theme: "Theme",
  ThemeSystem: "System Theme",
  ThemeLight: "Light",
  ThemeDark: "Dark",
  EnableExistConfirmation: "Closing Confirmation",
  EnableExistConfirmationSubTitle:
    "Ask for confirmation to close when Stimulator is active",
  KeyboardShortcuts: "Keyboard Shortcuts",
  General: "General",
  MainMenu: "Open Menu",
  Quit: "Quit",
  About: "About Stimulator",
  UnsupportedSystem: "Unsupported System",
  UnsupportedSystemBody:
    "Your desktop environment doesn't support Stimulator, click close to quit",
  EnableTrayIcon: "Run in Background With Tray Icon",
  Show: "Show",
};

export const UI_LABELS = {
  AppName: t(EN_UI_LABELS.AppName),
  Comments: t(EN_UI_LABELS.Comments),
  Keywords: t(EN_UI_LABELS.Keywords),
  SuspendTitle: t(EN_UI_LABELS.SuspendTitle),
  IdleTitle: t(EN_UI_LABELS.IdleTitle),
  SystemDefault: t(EN_UI_LABELS.SystemDefault),
  Indefinitely: t(EN_UI_LABELS.Indefinitely),
  SimulatorActive: t(EN_UI_LABELS.SimulatorActive),
  ConfirmClose: t(EN_UI_LABELS.ConfirmClose),
  ConfirmCloseBody: t(EN_UI_LABELS.ConfirmCloseBody),
  Cancel: t(EN_UI_LABELS.Cancel),
  Close: t(EN_UI_LABELS.Close),
  Preferences: t(EN_UI_LABELS.Preferences),
  Theme: t(EN_UI_LABELS.Theme),
  ThemeSystem: t(EN_UI_LABELS.ThemeSystem),
  ThemeLight: t(EN_UI_LABELS.ThemeLight),
  ThemeDark: t(EN_UI_LABELS.ThemeDark),
  EnableExistConfirmation: t(EN_UI_LABELS.EnableExistConfirmation),
  EnableExistConfirmationSubTitle: t(
    EN_UI_LABELS.EnableExistConfirmationSubTitle,
  ),
  KeyboardShortcuts: t(EN_UI_LABELS.KeyboardShortcuts),
  General: t(EN_UI_LABELS.General),
  MainMenu: t(EN_UI_LABELS.MainMenu),
  Quit: t(EN_UI_LABELS.Quit),
  About: t(EN_UI_LABELS.About),
  UnsupportedSystem: t(EN_UI_LABELS.UnsupportedSystem),
  UnsupportedSystemBody: t(EN_UI_LABELS.UnsupportedSystemBody),
  EnableTrayIcon: t(EN_UI_LABELS.EnableTrayIcon),
  Show: t(EN_UI_LABELS.Show),
};

export const APP_ID = "io.github.sigmasd.stimulator";
export const APP_NAME = UI_LABELS.AppName;
export const VERSION = "0.9.0";
