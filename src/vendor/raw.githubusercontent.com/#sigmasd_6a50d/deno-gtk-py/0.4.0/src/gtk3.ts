import {
  Callback,
  NamedArgument,
} from "https://deno.land/x/python@0.4.3/src/python.ts";

export interface Gtk {
  MenuItem(kwArg: NamedArgument): MenuItem;
  Menu(): Menu;
  main(): void;
  main_quit(): void;
}

export interface Widget {
  show(): void;
  connect(signal: string, callback: Callback): void;
}

export interface MenuShell extends Widget {
  append(a: MenuItem): unknown;
}

// deno-lint-ignore no-empty-interface
export interface Menu extends MenuShell {
}

// deno-lint-ignore no-empty-interface
export interface MenuItem extends Widget {
}
