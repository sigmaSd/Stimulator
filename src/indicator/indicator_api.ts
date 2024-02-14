import { Gio2_, python } from "deno-gtk-py";
import { Gio, GLib, MainWindow } from "../main.ts";
import { MESSAGES } from "./messages.ts";

export class Indicator {
  #encoder = new TextEncoder();
  #io_priority = 0;
  #stdin;
  #mainWindow: MainWindow;
  constructor(mainWindow: MainWindow) {
    this.#mainWindow = mainWindow;
    const child = Gio.Subprocess.new(
      [
        "deno",
        "run",
        "--allow-read=./src/locales",
        "--allow-env=DENO_PYTHON_PATH",
        "--allow-ffi",
        "--unstable-ffi",
        import.meta.resolve("./indicator_app.ts"),
      ],
      Gio.SubprocessFlags.STDIN_PIPE
        .__or__(Gio.SubprocessFlags.STDOUT_PIPE),
    );
    this.#stdin = child.get_stdin_pipe();
    this.#monitorStdout(child.get_stdout_pipe());
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
    this.#stdin.write_all_async(
      Array.from(this.#encoder.encode(message)),
      this.#io_priority,
    );
  }

  #monitorStdout(stdoutPipe: Gio2_.InputStream) {
    const readCallback = python.callback(() => {
      stdoutPipe.read_bytes_async(
        512, /*buffer size*/
        GLib.PRIORITY_DEFAULT,
        undefined,
        python.callback((_, __, asyncResult) => {
          const message = stdoutPipe
            .read_bytes_finish(asyncResult)
            .get_data().decode("utf-8")
            .valueOf()
            .trim();

          switch (message) {
            case MESSAGES.Show:
              this.#mainWindow.present();
              break;
            case MESSAGES.Close:
              this.#mainWindow.app.quit();
              break;
            case MESSAGES.Empty:
              // NOTE: the indicator have exited
              // the only reason for this currently is if the system doesn't support tray icons, so we stop polling data
              return false;
            default:
              throw new Error(`Incorrect message: '${message}'`);
          }

          GLib.idle_add(readCallback);
        }),
      );
      return false;
    });
    GLib.idle_add(readCallback);
  }
}
