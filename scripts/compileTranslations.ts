#!/usr/bin/env -S deno run --allow-read=./po,./src/locales --allow-write=./src/locales,./distro/,./po --allow-run=deno
import { gettextToI18next } from "npm:i18next-conv@14.0.0";
import { APP_ID, EN_UI_LABELS } from "../src/consts.ts";
import i18n, { i18next } from "../src/i18n.ts";

async function genTranslations() {
  for await (const lang of Deno.readDir("./po")) {
    const langName = lang.name.slice(0, -3);
    const poFilePath = "./po/" + lang.name;
    const compiled = await gettextToI18next(
      langName,
      await Deno.readTextFile(poFilePath),
    ).then((data: string) => JSON.parse(data));
    const verified = verifyAndFixPoFiles(poFilePath, compiled);
    const targetDir = "./src/locales/" + langName;
    await Deno.mkdir(targetDir, { recursive: true });
    await Deno.writeTextFile(
      targetDir + "/translation.json",
      JSON.stringify(verified),
    );
  }
}

async function genDesktopFile() {
  const names = [`Name=${EN_UI_LABELS.AppName}`];
  const comments = [`Comment=${EN_UI_LABELS.Comments}`];
  const keywords = [`Keywords=${EN_UI_LABELS.Keywords}`];
  const langs = await Array.fromAsync(Deno.readDir("./po")).then((langs) =>
    langs.map((lang) => lang.name.slice(0, -3))
  );
  // make sure the order is not random
  langs.sort();
  for (const lang of langs) {
    if (lang === "en") continue;
    await i18next.changeLanguage(lang);
    const name = i18n(lang)(EN_UI_LABELS.AppName);
    const comment = i18n(lang)(EN_UI_LABELS.Comments);
    const keyword = i18n(lang)(EN_UI_LABELS.Keywords);
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

// deno-lint-ignore no-explicit-any
function verifyAndFixPoFiles(poFilePath: string, compiled: any) {
  const compiledEntries = Object.entries(compiled);
  let changes = false;
  Object.values(EN_UI_LABELS).forEach((prop, index) => {
    // 0 is the msgid
    // 1 is the msgstr
    if (compiledEntries[index][0] !== prop) {
      compiledEntries[index][0] = prop;
      compiledEntries[index][1] = "";
      changes = true;
    }
  });
  if (changes) {
    Deno.writeTextFileSync(
      poFilePath,
      `\
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"

${
        compiledEntries.map(([msgid, msgstr]) =>
          `\
msgid "${msgid}"
msgstr "${msgstr}"
`
        ).join("\n")
      }`,
    );
  }
  return Object.fromEntries(compiledEntries);
}

async function denoFmt() {
  await new Deno.Command("deno", {
    args: ["fmt", "--indent-width", "4", "./src/locales/"],
  }).spawn()
    .status;
}
