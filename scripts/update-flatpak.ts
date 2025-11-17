// deno-lint-ignore-file no-import-prefix
import { parse as parseXML } from "jsr:@libs/xml@7.0.2";
import { $ } from "jsr:@david/dax@0.43.2";
import { createTempDirSync } from "jsr:@david/temp@0.1.1";

// parse metainfo
const metainfo = parseXML(
  Deno.readTextFileSync(
    new URL(
      import.meta.resolve(
        "../distro/io.github.sigmasd.stimulator.metainfo.xml",
      ),
    ).pathname,
  ),
);
const version = metainfo.component.releases.release[0]["@version"];
const oldVersion = metainfo.component.releases.release[1]["@version"];

const appVersion = await import("../src/consts.ts").then((r) => r.VERSION);
if (appVersion !== version) {
  console.error(`Update app version to ${version}`);
  Deno.exit(1);
}

// tag it and push
await $`git tag -a ${version} -m ${version}`;
await $`git push --follow-tags`;

// download flatpak repo and update
using tempDir = createTempDirSync();
await $`git clone git@github.com:flathub/io.github.sigmasd.stimulator.git`
  .cwd(tempDir.path);
Deno.chdir(tempDir.toString() + "/stimulator");

const newSha = await fetch(
  `https://github.com/sigmaSd/stimulator/archive/refs/tags/${version}.tar.gz`,
).then(async (res) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", await res.bytes());
  const sha256 = Array.from(new Uint8Array(hashBuffer)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return sha256;
});
const oldSha = await fetch(
  `https://github.com/sigmaSd/stimulator/archive/refs/tags/${oldVersion}.tar.gz`,
).then(async (res) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", await res.bytes());
  const sha256 = Array.from(new Uint8Array(hashBuffer)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return sha256;
});

Deno.readTextFile("./io.github.sigmasd.stimulator.yml")
  .then((r) => r.replace(oldSha, newSha))
  .then((r) => Deno.writeTextFile("./io.github.sigmasd.stimulator.yml", r));

await $`git checkout -b ${version} && git add -A && git commit -m ${version} && git push origin ${version}`;
