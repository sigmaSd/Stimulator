// Handles registering/unregistering Stimulator as a user autostart entry
// following the XDG Desktop Entry Specification:
// https://specifications.freedesktop.org/autostart-spec/latest/
import { APP_ID, APP_NAME } from "./consts.ts";

/** Flag passed to the executable to skip presenting the window on launch. */
export const MINIMIZED_FLAG = "--minimized";

function isFlatpak(): boolean {
  try {
    Deno.statSync("/.flatpak-info");
    return true;
  } catch {
    return false;
  }
}

function getAutostartDir(): string {
  const xdgConfigHome = Deno.env.get("XDG_CONFIG_HOME");
  const home = Deno.env.get("HOME") ?? "";
  return `${xdgConfigHome || `${home}/.config`}/autostart`;
}

function getAutostartFilePath(): string {
  return `${getAutostartDir()}/${APP_ID}.desktop`;
}

// Figures out the executable (quoted as needed) and extra arguments that
// should be used to relaunch the app. Kept separate so callers can append
// their own flags after the executable instead of inside its quoting.
function getExecInvocation(): { exe: string; args: string[] } {
  if (isFlatpak()) {
    // Inside the sandbox `Deno.execPath()` points to a path that only makes
    // sense inside the sandbox, `flatpak run` is the correct way to autostart
    return { exe: "flatpak", args: ["run", APP_ID] };
  }
  // AppImages set this to the path of the AppImage file itself, which is
  // what we want to relaunch, instead of the temporary extracted binary
  const appImagePath = Deno.env.get("APPIMAGE");
  if (appImagePath) {
    // AppImages normally mount themselves through FUSE, which may not be
    // available yet this early in a desktop session (module not loaded,
    // /dev/fuse permissions not set up), silently breaking autostart.
    // --appimage-extract-and-run makes the AppImage runtime extract and
    // run itself directly instead, sidestepping FUSE entirely.
    return { exe: appImagePath, args: ["--appimage-extract-and-run"] };
  }

  return { exe: Deno.execPath(), args: [] };
}

/** Whether an autostart entry currently exists for Stimulator. */
export function isAutostartEnabled(): boolean {
  try {
    Deno.statSync(getAutostartFilePath());
    return true;
  } catch {
    return false;
  }
}

/** Whether the existing autostart entry (if any) starts the app minimized. */
export function isAutostartMinimized(): boolean {
  try {
    const content = Deno.readTextFileSync(getAutostartFilePath());
    return content.includes(MINIMIZED_FLAG);
  } catch {
    return false;
  }
}

/**
 * Creates or removes the autostart entry.
 * When `minimized` is true the app is launched without presenting its
 * window, only the appindicator tray icon will be shown.
 */
export function setAutostart(enabled: boolean, minimized: boolean): void {
  const filePath = getAutostartFilePath();

  if (!enabled) {
    try {
      Deno.removeSync(filePath);
    } catch {
      // already absent, nothing to do
    }
    return;
  }

  const { exe, args } = getExecInvocation();
  const allArgs = [...args, ...(minimized ? [MINIMIZED_FLAG] : [])];
  // only the executable itself needs quoting (it may contain spaces),
  // flags are always simple tokens
  const exec = [`"${exe}"`, ...allArgs].join(" ");
  const content = `[Desktop Entry]
Type=Application
Version=1.0
Name=${APP_NAME}
Exec=${exec}
Icon=${APP_ID}
Terminal=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
`;

  Deno.mkdirSync(getAutostartDir(), { recursive: true });
  Deno.writeTextFileSync(filePath, content);
}
