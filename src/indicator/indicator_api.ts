import {
  type InputStream,
  Subprocess,
  SubprocessFlags,
} from "@sigmasd/gtk/gio";
import type { MainWindow } from "../main.ts";
import { MESSAGES } from "./messages.ts";

export class Indicator {
  #encoder = new TextEncoder();
  #io_priority = 0;
  #stdin;
  #mainWindow: MainWindow;
  constructor(mainWindow: MainWindow) {
    this.#mainWindow = mainWindow;
    const child = new Subprocess(
      [
        "deno",
        "run",
        "--allow-read",
        "--allow-ffi",
        import.meta.resolve("./indicator_app.ts"),
      ],
      SubprocessFlags.STDIN_PIPE | SubprocessFlags.STDOUT_PIPE,
    );
    this.#stdin = child.getStdinPipe()!;
    this.#monitorStdout(child.getStdoutPipe()!);
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
    this.#stdin.writeAllAsync(
      this.#encoder.encode(message),
      this.#io_priority,
    );
  }

  #monitorStdout(stdoutPipe: InputStream) {
    const decoder = new TextDecoder();
    const readNext = () => {
      stdoutPipe.readBytesAsync(
        512, /*buffer size*/
        0, /*priority*/
        (data) => {
          const message = data && data.length > 0
            ? decoder.decode(data).trim()
            : MESSAGES.Empty;

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
              throw new Error(`Incorrect message: '${message}'`);
          }

          readNext();
        },
      );
    };
    readNext();
  }
}
