import type { Menu } from "./gtk3.ts";

export interface AppIndicator {
  Indicator: {
    new: (
      id: string,
      iconName: string,
      category: IndicatorCategory,
    ) => Indicator;
  };
  IndicatorCategory: {
    APPLICATION_STATUS: IndicatorCategory.APPLICATION_STATUS;
    COMMUNICATIONS: IndicatorCategory.COMMUNICATIONS;
    SYSTEM_SERVICES: IndicatorCategory.SYSTEM_SERVICES;
    HARDWARE: IndicatorCategory.HARDWARE;
    OTHER: IndicatorCategory.OTHER;
  };
  IndicatorStatus: {
    PASSIVE: IndicatorStatus.PASSIVE;
    ACTIVE: IndicatorStatus.ACTIVE;
    ATTENTION: IndicatorStatus.ATTENTION;
  };
}

export interface Indicator {
  set_title(title: string): void;
  set_menu(menu: Menu): void;
  set_status(status: IndicatorStatus): void;
  set_attention_icon(icon: string): void;
  props: {
    connected: { valueOf: () => boolean };
  };
}

export enum IndicatorCategory {
  APPLICATION_STATUS = 0,
  COMMUNICATIONS = 1,
  SYSTEM_SERVICES = 2,
  HARDWARE = 3,
  OTHER = 4,
}

export enum IndicatorStatus {
  PASSIVE = 0,
  ACTIVE = 1,
  ATTENTION = 2,
}
