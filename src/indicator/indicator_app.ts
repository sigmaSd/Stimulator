// This is a standalone application for the tray
// It has its own imports

import "@sigmasd/gtk/eventloop";

import { main, mainQuit, Menu, MenuItem } from "@sigmasd/gtk/gtk3";

import { timeout, UnixSignal, unixSignalAdd } from "@sigmasd/gtk/glib";

import { MESSAGES } from "./messages.ts";
import { APP_ID, UI_LABELS } from "../consts.ts";

// since this app is used with ipc, this is a better name
const sendMsg = console.log;

// Try to load AppIndicator, but handle gracefully if not available
let Indicator: typeof import("@sigmasd/gtk/appindicator").Indicator | null =
  null;
let IndicatorCategory:
  | typeof import("@sigmasd/gtk/appindicator").IndicatorCategory
  | null = null;
let IndicatorStatus:
  | typeof import("@sigmasd/gtk/appindicator").IndicatorStatus
  | null = null;

try {
  const appIndicatorModule = await import("@sigmasd/gtk/appindicator");
  Indicator = appIndicatorModule.Indicator;
  IndicatorCategory = appIndicatorModule.IndicatorCategory;
  IndicatorStatus = appIndicatorModule.IndicatorStatus;
} catch (e) {
  console.error(
    "Warning: AppIndicator library not available. Tray icon support disabled.",
  );
  console.error(
    "On Fedora, install with: sudo dnf install libayatana-appindicator-gtk3",
  );
  console.error("Error details:", e instanceof Error ? e.message : e);
  // Exit gracefully - the main app will detect this via empty stdout
  Deno.exit(0);
}

if (import.meta.main) {
  if (!Indicator || !IndicatorCategory || !IndicatorStatus) {
    // Should not reach here, but just in case
    Deno.exit(0);
  }

  const indicator = new Indicator(
    `${APP_ID}-tray`,
    `${APP_ID}-tray`,
    IndicatorCategory.APPLICATION_STATUS,
  );
  indicator.setTitle(UI_LABELS.Stimulator);

  const menu = new Menu();

  const showApp = new MenuItem(UI_LABELS.Show);
  const closeApp = new MenuItem(UI_LABELS.Close);

  showApp.connect(
    "activate",
    () => {
      sendMsg(MESSAGES.Show);
      menu.remove(showApp);
    },
  );

  closeApp.connect(
    "activate",
    () => {
      sendMsg(MESSAGES.Close);
      mainQuit();
    },
  );

  let first_try = true;

  // Monitor stdin for messages from the main process
  const stdinMonitor = () => {
    const buf = new Uint8Array(512);
    try {
      const n = Deno.stdin.readSync(buf);
      if (!n) {
        // EOF or error
        return true;
      }

      const message = new TextDecoder()
        .decode(buf.slice(0, n))
        .trim();

      switch (message) {
        case MESSAGES.Activate:
          indicator.setStatus(IndicatorStatus!.ACTIVE);
          // NOTE: if the indicator is not connected after being set to active, this means the system doesn't support tray icons, so exit
          if (!indicator.props.connected) {
            // The icon might take some time to be active (happens in kde)
            // Give it one more chance
            if (!first_try) {
              // The user will receive this error in the logs:
              // `(.:11550): Gtk-CRITICAL **: 05:57:05.429: gtk_widget_get_scale_factor: assertion 'GTK_IS_WIDGET (widget)' failed`
              // because they don't have tray icon support, its harmless though
              mainQuit();
            } else {
              first_try = false;
            }
          }
          break;
        case MESSAGES.Deactivate:
          indicator.setStatus(IndicatorStatus!.PASSIVE);
          break;
        case MESSAGES.Hide:
          indicator.setStatus(IndicatorStatus!.PASSIVE);
          break;
        case MESSAGES.Close:
          mainQuit();
          break;
        case MESSAGES.showShowButton:
          showApp.show();
          menu.prepend(showApp);
          break;
        case MESSAGES.HideShowButton:
          menu.remove(showApp);
          break;
        default:
          // Ignore unknown messages
          break;
      }
    } catch {
      // stdin closed or error, continue
    }

    return true;
  };

  // Poll every 100ms
  timeout(100, stdinMonitor);

  menu.append(closeApp);
  menu.showAll();
  indicator.setMenu(menu);

  unixSignalAdd(UnixSignal.SIGINT, () => {
    mainQuit();
    return false;
  });

  main();
}
