#!/usr/bin/env -S deno run --allow-read=./po,README.md,./src/locales --allow-write=README.md --allow-run=deno
import iso6391 from "npm:iso-639-1@3.1.0";
import { UI_LABELS } from "../src/labels.ts";

const TOTAL_TRANSLATIONS = Object.keys(UI_LABELS).length + 1;

const mdHeader = "## Translations";
async function generateTranslationsTable() {
  let output = `
${mdHeader}
| Language   | Translated (%) |
|------------|-----------------|\n`;

  for await (const lang of Deno.readDir("./po")) {
    await Deno.readTextFile("./po/" + lang.name).then((data) => {
      const translations = [...data.matchAll(/msgid/g)].length;

      const name = iso6391.getName(lang.name.slice(0, -3));
      output += `|${name}|${(translations / TOTAL_TRANSLATIONS) * 100}|\n`;
    });
  }
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
