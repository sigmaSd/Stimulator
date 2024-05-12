import { t } from "./i18n.ts";

@genLabels
export class EN_UI_LABELS {
  static Stimulator: string;
  static "Keep your computer awake": string;
  static "caffeine;nosleep;awake;keepawake;keepon;": string;
  static "Disable Automatic Suspending": string;
  static "Disable Screen Blanking and Locking": string;
  static "Current state: System default": string;
  static "Current state: Indefinitely": string;
  static "Stimulator is active": string;
  static "Close Stimulator?": string;
  static "Stimulator is active, do you want to close it?": string;
  static Cancel: string;
  static Close: string;
  static "Main Menu": string;
  static Preferences: string;
  static Theme: string;
  static "System Theme": string;
  static Light: string;
  static Dark: string;
  static "Behavior on Closing": string;
  static "Applies only while active": string;
  static "Ask Confirmation": string;
  static "Run in Background": string;
  static Quit: string;
  static "Keyboard Shortcuts": string;
  static General: string;
  static "Open Menu": string;
  static "About Stimulator": string;
  static "Unsupported System": string;
  static "Your desktop environment doesn't support Stimulator, click close to quit":
    string;
  // we don't advertise tray icon support
  static Show: string;
  static "Stimulator is running in the backround": string;
  static "translator-credits": string;
}

@translate
export class UI_LABELS extends EN_UI_LABELS {}

export const APP_ID = "io.github.sigmasd.stimulator";
export const APP_NAME = UI_LABELS.Stimulator;
export const VERSION = "1.7";

function genLabels<T>(klass: T, ctx: ClassDecoratorContext) {
  ctx.addInitializer(function () {
    for (const prop in this) {
      // deno-lint-ignore no-explicit-any
      (klass as any)[prop] = prop;
    }
  });
  return klass;
}

function translate<T>(klass: T, _: ClassDecoratorContext) {
  for (const prop in klass) {
    // deno-lint-ignore no-explicit-any
    (klass as any)[prop] = t((klass as any)[prop]);
  }
  return klass;
}
