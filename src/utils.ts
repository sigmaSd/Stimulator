import { UI_LABELS } from "./consts.ts";

/** Utility class for working with Gtk combo items */
export class ComboItemManager<T> {
  items: T[];

  constructor(items: T[]) {
    this.items = items;
  }

  get itemsTranslated(): string[] {
    return this.items.map((item) => UI_LABELS[item as keyof UI_LABELS]);
  }

  fromId(id: number): T {
    if (id < 0 || id >= this.items.length) {
      throw new Error(`Invalid item ID: ${id}`);
    }
    return this.items[id];
  }

  toId(item: T): number {
    return this.items.indexOf(item);
  }
}
