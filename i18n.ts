import i18next from "https://deno.land/x/i18next/index.js";
import Backend from "https://deno.land/x/i18next_fs_backend/index.js";

const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
i18next
  .use(Backend)
  .init({
    initImmediate: false,
    fallbackLng: "en",
    preload: ["en", "fr"],
    backend: {
      loadPath: "locales/{{lng}}/{{ns}}.json",
    },
  });

export default (lng?: string) => i18next.getFixedT(lng || systemLocale);
