import { python } from "deno-gtk-py";
import { Gio, GLib, MainWindow } from "../main.ts";

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
    this.#stdin.write_all_async(
      Array.from(this.#encoder.encode("Activate")),
      this.#io_priority,
    );
  }
  deactivate() {
    this.#stdin.write_all_async(
      Array.from(this.#encoder.encode("Deactivate")),
      this.#io_priority,
    );
  }
  hide() {
    this.#stdin.write_all_async(
      Array.from(this.#encoder.encode("Hide")),
      this.#io_priority,
    );
  }
  close() {
    this.#stdin.write_all_async(
      Array.from(this.#encoder.encode("Close")),
      this.#io_priority,
    );
  }

  #monitorStdout(stdoutPipe: any) {
    const readCallback = python.callback(() => {
      stdoutPipe.read_bytes_async(
        512, /*buffer size*/
        GLib.PRIORITY_DEFAULT,
        undefined,
        python.callback((_, __, asyncResult) => {
          const readData = stdoutPipe
            .read_bytes_finish(asyncResult)
            .get_data().decode("utf-8")
            .valueOf()
            .trim();

          if (readData === "Activate") {
            this.#mainWindow.suspendRow.set_active(true);
          } else if (readData === "Deactivate") {
            this.#mainWindow.suspendRow.set_active(false);
          }

          GLib.idle_add(readCallback);
        }),
      );
      return false;
    });
    GLib.idle_add(readCallback);
  }
}
