const ENCODER = new TextEncoder();

const LIB_DBUS = Deno.dlopen(
  "/usr/lib64/libgio-2.0.so.0",
  {
    "g_bus_get_sync": {
      parameters: ["u8", "pointer", "pointer"],
      result: "isize",
    },
    "g_dbus_connection_call_sync": {
      parameters: [
        "pointer",
        "buffer",
        "buffer",
        "buffer",
        "buffer",
        "pointer",
        "buffer",
        "isize",
        "isize",
        "pointer",
        "pointer",
      ],
      result: "pointer",
    },
    "g_variant_new": {
      parameters: ["buffer", "buffer", "isize", "buffer", "isize"],
      result: "pointer",
    },
    "g_variant_get_child_value": {
      parameters: ["pointer", "isize"],
      result: "buffer",
    },
  } as const,
);

/**
 * Encodes a C string.
 */
function cstr(str: string): Uint8Array {
  const buf = new Uint8Array(str.length + 1);
  ENCODER.encodeInto(str, buf);
  return buf;
}

export class Inhibitor {
  #bus: number | bigint;
  #cookie: Deno.PointerValue = null;
  constructor() {
    const G_BUS_TYPE_SESSION = 2;
    const bus = LIB_DBUS.symbols.g_bus_get_sync(
      G_BUS_TYPE_SESSION,
      null,
      null,
    );
    this.#bus = bus;
  }
  inhibit() {
    if (this.#cookie !== null) return;
    this.#cookie = LIB_DBUS.symbols.g_dbus_connection_call_sync(
      Deno.UnsafePointer.create(this.#bus),
      cstr("org.gnome.SessionManager"),
      cstr("/org/gnome/SessionManager"),
      cstr("org.gnome.SessionManager"),
      cstr("Inhibit"),
      LIB_DBUS.symbols.g_variant_new(
        cstr("(susu)"),
        cstr("id"),
        0,
        cstr("reason"),
        1 << 3,
      ),
      cstr("(u)"),
      0,
      99,
      null,
      null,
    );
  }
  unInhibit() {
    if (this.#cookie === null) return;
    LIB_DBUS.symbols.g_dbus_connection_call_sync(
      Deno.UnsafePointer.create(this.#bus),
      cstr("org.gnome.SessionManager"),
      cstr("/org/gnome/SessionManager"),
      cstr("org.gnome.SessionManager"),
      cstr("Uninhibit"),
      this.#cookie,
      cstr("(u)"),
      0,
      99,
      null,
      null,
    );
    this.#cookie = null;
  }
}
