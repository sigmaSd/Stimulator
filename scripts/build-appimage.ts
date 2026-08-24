#!/usr/bin/env -S deno -A
// deno-lint-ignore-file no-import-prefix
//
// Packages Stimulator into an AppImage.
//
// Rather than a `deno compile`d binary, this bundles a real `deno` runtime
// together with the app's source and a pre-fetched dependency cache (like
// the Flatpak build does). A standalone compile only embeds main.ts's own
// static import graph, so the indicator - spawned by src/indicator/indicator_api.ts
// as a `deno run` subprocess of src/indicator/indicator_app.ts, resolved
// only via `import.meta.resolve` - would be missing at runtime, and a bare
// `deno` on $PATH can't be assumed on the host. Bundling the runtime and
// scripts sidesteps both.
//
// Usage: build-appimage.ts <arch> <output-path>
//   arch         target architecture: x86_64 or aarch64
//   output-path  where to write the resulting .AppImage
import { $ } from "jsr:@david/dax@0.43.2";
import { createTempDirSync } from "jsr:@david/temp@0.1.1";

const [arch, outputPath] = Deno.args;
if ((arch !== "x86_64" && arch !== "aarch64") || !outputPath) {
  console.error("Usage: build-appimage.ts <x86_64|aarch64> <output-path>");
  Deno.exit(1);
}

$.setPrintCommand(true);

const APP_ID = "io.github.sigmasd.stimulator";
const rootDir = new URL("..", import.meta.url).pathname;
const distro = `${rootDir}distro/${APP_ID}`;

using workDir = createTempDirSync();
const appDir = `${workDir.path}/AppDir`;
// where the bundled app source + deno runtime live inside the AppDir
const appLib = `${appDir}/usr/lib/stimulator`;

await $`mkdir -p ${appDir}/usr/bin ${appDir}/usr/share/applications \
  ${appDir}/usr/share/icons/hicolor/scalable/apps ${appDir}/usr/share/metainfo ${appLib}`;

// --- icon, desktop entry, appstream metadata ---

await $`cp ${distro}.svg ${appDir}/usr/share/icons/hicolor/scalable/apps/${APP_ID}.svg`;
await $`cp ${distro}.svg ${appDir}/${APP_ID}.svg`;
await $`ln -s ${APP_ID}.svg ${appDir}/.DirIcon`;

await $`cp ${distro}.desktop ${appDir}/usr/share/applications/${APP_ID}.desktop`;
await $`cp ${distro}.desktop ${appDir}/${APP_ID}.desktop`;

await $`cp ${distro}.metainfo.xml ${appDir}/usr/share/metainfo/${APP_ID}.metainfo.xml`;

// --- app source + pre-fetched dependency cache ---

await $`cp -r ${rootDir}src ${appLib}/src`;
await $`cp ${rootDir}deno.jsonc ${rootDir}deno.lock ${appLib}`;

// enable vendoring so `deno cache` below fetches every dependency into a
// local vendor/ directory, and the bundled runtime never needs the network
await $`sed -i 's/"vendor": false/"vendor": true/' ${appLib}/deno.jsonc`;
await $`deno cache src/main.ts src/indicator/indicator_app.ts`.cwd(appLib);

// --- bundle a deno runtime matching the target arch ---

const denoBin = `${appDir}/usr/bin/deno`;
if (arch === Deno.build.arch) {
  // cross-packaging aside, packaging for the host's own arch can just reuse
  // the deno currently running this very script
  await $`cp ${Deno.execPath()} ${denoBin}`;
} else {
  const version = Deno.version.deno;
  await $.request(
    `https://github.com/denoland/deno/releases/download/v${version}/deno-${arch}-unknown-linux-gnu.zip`,
  ).pipeToPath(`${workDir.path}/deno.zip`);
  await $`unzip -o ${workDir.path}/deno.zip -d ${appDir}/usr/bin`;
}
await $`chmod +x ${denoBin}`;

// pin a stable, fake origin: `deno run`'s default origin for the Web
// Storage APIs (localStorage) is derived from the entry script's path,
// which changes on every launch since --appimage-extract-and-run
// re-extracts to a fresh temp dir each time - without this, saved
// preferences wouldn't survive between runs.
await Deno.writeTextFile(
  `${appDir}/AppRun`,
  `#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "\${0}")")"
export PATH="$HERE/usr/bin:$PATH"
exec "$HERE/usr/bin/deno" run -A --cached-only \\
  --location "https://${APP_ID}.invalid/" \\
  "$HERE/usr/lib/stimulator/src/main.ts" "$@"
`,
);
await $`chmod +x ${appDir}/AppRun`;

// --- package with appimagetool ---
//
// appimagetool itself only needs to run on the host (x86_64 CI runner);
// packaging an AppImage is just squashfs + concatenation, so it doesn't need
// to execute any target-arch code. But by default it embeds its own host
// runtime regardless of $ARCH, which would silently produce a broken,
// non-executable AppImage when cross-packaging for aarch64 - so the matching
// runtime stub is always fetched explicitly and passed via --runtime-file.

const appimagetool = `${workDir.path}/appimagetool`;
await $.request(
  "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage",
).pipeToPath(appimagetool);
await $`chmod +x ${appimagetool}`;

// appimagetool's own arch names don't all match deno's --target triples
const appimagetoolArch = arch === "aarch64" ? "arm_aarch64" : arch;

const runtimeFile = `${workDir.path}/runtime-${arch}`;
await $.request(
  `https://github.com/AppImage/AppImageKit/releases/download/continuous/runtime-${arch}`,
).pipeToPath(runtimeFile);

await $`mkdir -p ${outputPath.replace(/[^/]+$/, "") || "."}`;
await $`${appimagetool} --appimage-extract-and-run --runtime-file ${runtimeFile} ${appDir} ${outputPath}`
  .env("ARCH", appimagetoolArch);
