#!/usr/bin/env -S deno run -A --no-lock
// deno-lint-ignore-file no-import-prefix
import iso6391 from "npm:iso-639-1@3.1.0";
import { EN_UI_LABELS } from "../src/consts.ts";
import { CUT_OFF } from "./compileTranslations.ts";

//deno-fmt-ignore
const TOTAL_TRANSLATIONS = Object.keys(EN_UI_LABELS).length;

const mdHeader = "## Translations";
async function generateTranslationsTable() {
  let output = `
${mdHeader}
| Language   | Translated (%) |
|------------|-----------------|\n`;

  const langs = [];
  for await (const lang of Deno.readDir("./po")) {
    langs.push(lang.name);
  }
  langs.sort();

  for (const langPath of langs) {
    await Deno.readTextFile(`./po/${langPath}`).then((data) => {
      const msgIdNum = [...data.matchAll(/msgid/g)].length;
      if (msgIdNum !== TOTAL_TRANSLATIONS + 1 /*first empty string*/) {
        throw new Error(`po file: ${langPath} is missing some entries`);
      }
      const emptyMsgStr = [...data.matchAll(/msgstr ""/g)].length -
        1 /* first empty msgstr */;

      let name = langPath.includes("_")
        ? iso6391.getName(langPath.split("_")[0])
        : iso6391.getName(langPath.slice(0, -3));
      if (langPath.includes("_")) {
        name += "_" + langPath.split("_")[1].split(".")[0];
      }
      output += `|${name}|${
        (((TOTAL_TRANSLATIONS - emptyMsgStr) / TOTAL_TRANSLATIONS) * 100)
          .toFixed(2)
      }|\n`;
    });
  }
  output +=
    `- Translations with less than ${CUT_OFF}% completion will not be embedded into the app`;

  return output;
}

function appendToREADME(table: string) {
  const orgReadme = Deno.readTextFileSync("README.md");
  let lines = orgReadme.split("\n");
  const idx = lines.findIndex((line) => line.startsWith(mdHeader));
  if (idx !== undefined) lines = lines.slice(0, idx);

  if (lines.at(-1) === "") lines.pop();
  lines.push(table);
  Deno.writeTextFileSync("README.md", lines.join("\n"));
}

async function denoFmt() {
  await new Deno.Command("deno", { args: ["fmt", "README.md"] }).spawn().status;
}

if (import.meta.main) {
  const table = await generateTranslationsTable();
  appendToREADME(table);
  await denoFmt();
}
