#!/usr/bin/env -S deno run --allow-read=./po,./src/locales --allow-write=./src/locales
import { gettextToI18next } from "npm:i18next-conv@14.0.0";
import { APP_ID, EN_UI_LABELS } from "../src/consts.ts";
import i18n, { i18next } from "../src/i18n.ts";

for await (const lang of Deno.readDir("./po")) {
  const langName = lang.name.slice(0, -3);
  const compiled = await gettextToI18next(
    langName,
    await Deno.readTextFile("./po/" + lang.name),
  );
  const targetDir = "./src/locales/" + langName;
  await Deno.mkdir(targetDir, { recursive: true });
  await Deno.writeTextFile(
    targetDir + "/translation.json",
    compiled,
  );
}

const names = [`Name=${EN_UI_LABELS.AppName}`];
const comments = [`Comment=${EN_UI_LABELS.Comments}`];
const keywords = [`Keyword=${EN_UI_LABELS.Keywords}`];
for await (const lang of Deno.readDir("./po")) {
  const langName = lang.name.slice(0, -3);
  await i18next.changeLanguage(langName);
  const name = i18n(langName)(EN_UI_LABELS.AppName);
  const comment = i18n(langName)(EN_UI_LABELS.Comments);
  const keyword = i18n(langName)(EN_UI_LABELS.Keywords);
  names.push(`Name[${langName}]=${name}`);
  comments.push(`comment[${langName}]=${comment}`);
  keywords.push(`keyword[${langName}]=${keyword}`);
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

console.log(desktopFile);
