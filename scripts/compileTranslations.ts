#!/usr/bin/env -S deno run --allow-read=./po --allow-write=./src/locales
import { gettextToI18next } from "npm:i18next-conv@14.0.0";

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
