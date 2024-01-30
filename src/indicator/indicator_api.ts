import { Gio2 as Gio } from "../../../deno-gtk-py/mod.ts";

export class Indicator {
  #encoder = new TextEncoder();
  #io_priority = 0;
  #stdin;
  constructor() {
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
}
