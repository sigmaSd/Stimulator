import {
  InputStream,
  OutputStream,
  Subprocess,
  SubprocessFlags,
} from "@sigmasd/gtk/gio";

import { idleAdd, Priority } from "@sigmasd/gtk/glib";

import type { MainWindow } from "../main.ts";
import { MESSAGES } from "./messages.ts";

export class Indicator {
  #encoder = new TextEncoder();
  #decoder = new TextDecoder();
  #stdin: OutputStream | null;
  #stdout: InputStream | null;
  #mainWindow: MainWindow;

  constructor(mainWindow: MainWindow) {
    this.#mainWindow = mainWindow;

    const child = new Subprocess(
      [
        "deno",
        "run",
        "--allow-env=DENO_PYTHON_PATH",
        "--allow-read",
        "--allow-ffi",
        "--unstable-ffi",
        new URL(import.meta.resolve("./indicator_app.ts")).pathname,
      ],
      SubprocessFlags.STDIN_PIPE | SubprocessFlags.STDOUT_PIPE,
    );

    this.#stdin = child.getStdinPipe();
    this.#stdout = child.getStdoutPipe();
    this.#monitorStdout();
  }

  activate() {
    this.#writeToStdin(MESSAGES.Activate);
  }

  deactivate() {
    this.#writeToStdin(MESSAGES.Deactivate);
  }

  hide() {
    this.#writeToStdin(MESSAGES.Hide);
  }

  close() {
    this.#writeToStdin(MESSAGES.Close);
  }

  showShowButton() {
    this.#writeToStdin(MESSAGES.showShowButton);
  }

  hideShowButton() {
    this.#writeToStdin(MESSAGES.HideShowButton);
  }

  #writeToStdin(message: string) {
    if (!this.#stdin) return;

    const data = this.#encoder.encode(message);
    this.#stdin.write(data);
  }

  #monitorStdout() {
    if (!this.#stdout) return;

    const readCallback = (): boolean => {
      this.#stdout!.readBytesAsync(
        512, /*buffer size*/
        Priority.DEFAULT,
        (data) => {
          if (!data || data.length === 0) {
            // NOTE: the indicator have exited
            // the only reason for this currently is if the system doesn't support tray icons, so we stop polling data
            return;
          }

          const message = this.#decoder.decode(data).trim();

          switch (message) {
            case MESSAGES.Show:
              this.#mainWindow.present();
              break;
            case MESSAGES.Close:
              this.#mainWindow.quit();
              break;
            case MESSAGES.Empty:
              // NOTE: the indicator have exited
              // the only reason for this currently is if the system doesn't support tray icons, so we stop polling data
              return;
            default:
              if (message) {
                throw new Error(`Incorrect message: '${message}'`);
              }
              return;
          }

          idleAdd(readCallback);
        },
      );
      return false;
    };

    idleAdd(readCallback);
  }
}
