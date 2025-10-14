#!/usr/bin/env -S deno run -A --no-lock
// deno-lint-ignore-file no-import-prefix
import { gettextToI18next } from "npm:i18next-conv@14.0.0";
import { APP_ID, EN_UI_LABELS } from "../src/consts.ts";
import i18n, { i18next } from "../src/i18n.ts";

export const CUT_OFF = 60;

async function genTranslations() {
  for await (const lang of Deno.readDir("./po")) {
    const langName = lang.name.slice(0, -3);
    const poFilePath = `./po/${lang.name}`;
    const compiled = await gettextToI18next(
      langName,
      await Deno.readTextFile(poFilePath),
    ).then((data: string) => JSON.parse(data));
    const verified = verifyAndFixPoFiles(poFilePath, compiled);

    let targetDir = `./src/locales/${langName}`;
    // i18 expectes the translation folders to be aa-AA instead of aa_AA
    targetDir = targetDir.replace("_", "-");
    if (fewTranslations(verified)) {
      await Deno.remove(targetDir, { recursive: true }).catch(() => {});
    } else {
      await Deno.mkdir(targetDir, { recursive: true });
      await Deno.writeTextFile(
        `${targetDir}/translation.json`,
        JSON.stringify(verified),
      );
    }
  }
}

async function genDesktopFile() {
  const names = [`Name=${EN_UI_LABELS.Stimulator}`];
  const comments = [`Comment=${EN_UI_LABELS["Keep your computer awake"]}`];
  const keywords = [
    `Keywords=${EN_UI_LABELS["caffeine;nosleep;awake;keepawake;keepon;"]}`,
  ];
  const langs = await Array.fromAsync(Deno.readDir("./po")).then((langs) =>
    langs.map((lang) => lang.name.slice(0, -3))
  );
  // make sure the order is not random
  langs.sort();
  for (let lang of langs) {
    if (lang === "en") continue;
    // i18 expectes the translation code to be aa-AA instead of aa_AA
    lang = lang.replace("_", "-");
    await i18next.changeLanguage(lang);
    const name = i18n(lang)(EN_UI_LABELS.Stimulator);
    const comment = i18n(lang)(EN_UI_LABELS["Keep your computer awake"]);
    const keyword = i18n(lang)(
      EN_UI_LABELS["caffeine;nosleep;awake;keepawake;keepon;"],
    );
    if (name) names.push(`Name[${lang}]=${name}`);
    if (comment) comments.push(`Comment[${lang}]=${comment}`);
    if (keyword) keywords.push(`Keywords[${lang}]=${keyword}`);
  }

  const desktopFile = `\
[Desktop Entry]
${names.join("\n")}
${comments.join("\n")}
${keywords.join("\n")}
TryExec=stimulator
Exec=stimulator %F
Icon=${APP_ID}
Type=Application
Categories=Utility;
`;

  Deno.writeTextFileSync(
    `./distro/${APP_ID}.desktop`,
    desktopFile,
  );
}

if (import.meta.main) {
  await genTranslations();
  await genDesktopFile();
  await denoFmt();
}

function verifyAndFixPoFiles(
  poFilePath: string,
  TranslateRecord: Record<string, string>,
) {
  const updatedTranslateRecord = { ...TranslateRecord };

  const is_english = poFilePath.endsWith("en.po");
  let changes = false;
  for (const prop of Object.values(EN_UI_LABELS)) {
    if (!(prop in updatedTranslateRecord)) {
      updatedTranslateRecord[prop] = is_english ? prop : "";
      changes = true;
    }
  }
  for (const prop of Object.keys(updatedTranslateRecord)) {
    if (!(prop in EN_UI_LABELS)) {
      delete updatedTranslateRecord[prop];
      changes = true;
    }
  }

  if (changes) {
    Deno.writeTextFileSync(
      poFilePath,
      `\
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"

${
        Object.entries(updatedTranslateRecord).map(([msgid, msgstr]) =>
          `\
msgid "${msgid}"
msgstr "${msgstr}"
`
        ).join("\n")
      }`,
    );
  }
  return updatedTranslateRecord;
}

async function denoFmt() {
  await new Deno.Command("deno", {
    args: ["fmt"],
  }).spawn()
    .status;
}

function fewTranslations(locales: Record<string, string>) {
  const total = Object.values(locales).length;
  const empty = Object.values(locales).filter((value) => value === "").length;

  const translatedPercentage = ((total - empty) / total) * 100;

  if (translatedPercentage >= CUT_OFF) return false;
  return true;
}
