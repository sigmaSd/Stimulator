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
import { $, Path } from "jsr:@david/dax@0.43.2";
import { createTempDirSync } from "jsr:@david/temp@0.1.1";

const [arch, outputPathArg] = Deno.args;
if ((arch !== "x86_64" && arch !== "aarch64") || !outputPathArg) {
  console.error("Usage: build-appimage.ts <x86_64|aarch64> <output-path>");
  Deno.exit(1);
}
const outputPath = new Path(outputPathArg);

$.setPrintCommand(true);

const APP_ID = "io.github.sigmasd.stimulator";
const rootDir = new Path(import.meta.url).parentOrThrow().parentOrThrow();
const distroDir = rootDir.join("distro");

using workDir = createTempDirSync();
const appDir = workDir.path.join("AppDir");
// where the bundled app source + deno runtime live inside the AppDir
const appLibDir = appDir.join("usr", "lib", "stimulator");

await appDir.join("usr", "bin").mkdir();
await appDir.join("usr", "share", "applications").mkdir();
await appDir.join("usr", "share", "icons", "hicolor", "scalable", "apps")
  .mkdir();
await appDir.join("usr", "share", "metainfo").mkdir();
await appLibDir.mkdir();

// --- icon, desktop entry, appstream metadata ---

await distroDir.join(`${APP_ID}.svg`).copyFile(
  appDir.join(
    "usr",
    "share",
    "icons",
    "hicolor",
    "scalable",
    "apps",
    `${APP_ID}.svg`,
  ),
);
await distroDir.join(`${APP_ID}.svg`).copyFile(appDir.join(`${APP_ID}.svg`));
await appDir.join(".DirIcon").symlinkTo(`${APP_ID}.svg`);

await distroDir.join(`${APP_ID}.desktop`).copyFile(
  appDir.join("usr", "share", "applications", `${APP_ID}.desktop`),
);
await distroDir.join(`${APP_ID}.desktop`).copyFile(
  appDir.join(`${APP_ID}.desktop`),
);

await distroDir.join(`${APP_ID}.metainfo.xml`).copyFile(
  appDir.join("usr", "share", "metainfo", `${APP_ID}.metainfo.xml`),
);

// --- app source + pre-fetched dependency cache ---

await rootDir.join("src").copy(appLibDir.join("src"));
await rootDir.join("deno.jsonc").copyFile(appLibDir.join("deno.jsonc"));
await rootDir.join("deno.lock").copyFile(appLibDir.join("deno.lock"));

// enable vendoring so `deno cache` below fetches every dependency into a
// local vendor/ directory, and the bundled runtime never needs the network
await $`sed -i 's/"vendor": false/"vendor": true/' ${
  appLibDir.join("deno.jsonc")
}`;
await $`deno cache src/main.ts src/indicator/indicator_app.ts`.cwd(appLibDir);

// --- bundle a deno runtime matching the target arch ---

const denoBin = appDir.join("usr", "bin", "deno");
if (arch === Deno.build.arch) {
  // cross-packaging aside, packaging for the host's own arch can just reuse
  // the deno currently running this very script
  await new Path(Deno.execPath()).copyFile(denoBin);
} else {
  const version = Deno.version.deno;
  const zipPath = await $.request(
    `https://github.com/denoland/deno/releases/download/v${version}/deno-${arch}-unknown-linux-gnu.zip`,
  ).pipeToPath(workDir.path.join("deno.zip"));
  await $`unzip -o ${zipPath} -d ${denoBin.parentOrThrow()}`;
}
await denoBin.chmod(0o755);

// pin a stable, fake origin: `deno run`'s default origin for the Web
// Storage APIs (localStorage) is derived from the entry script's path,
// which changes on every launch since --appimage-extract-and-run
// re-extracts to a fresh temp dir each time - without this, saved
// preferences wouldn't survive between runs.
const appRun = appDir.join("AppRun");
await appRun.writeText(
  `#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "\${0}")")"
export PATH="$HERE/usr/bin:$PATH"
exec "$HERE/usr/bin/deno" run -A --cached-only \\
  --location "https://${APP_ID}.invalid/" \\
  "$HERE/usr/lib/stimulator/src/main.ts" "$@"
`,
);
await appRun.chmod(0o755);

// --- package with appimagetool ---
//
// appimagetool itself only needs to run on the host (x86_64 CI runner);
// packaging an AppImage is just squashfs + concatenation, so it doesn't need
// to execute any target-arch code. But by default it embeds its own host
// runtime regardless of $ARCH, which would silently produce a broken,
// non-executable AppImage when cross-packaging for aarch64 - so the matching
// runtime stub is always fetched explicitly and passed via --runtime-file.

const appimagetool = await $.request(
  "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage",
).pipeToPath(workDir.path.join("appimagetool"));
await appimagetool.chmod(0o755);

// appimagetool's own arch names don't all match deno's --target triples
const appimagetoolArch = arch === "aarch64" ? "arm_aarch64" : arch;

const runtimeFile = await $.request(
  `https://github.com/AppImage/AppImageKit/releases/download/continuous/runtime-${arch}`,
).pipeToPath(workDir.path.join(`runtime-${arch}`));

await outputPath.parentOrThrow().mkdir();
await $`${appimagetool} --appimage-extract-and-run --runtime-file ${runtimeFile} ${appDir} ${outputPath}`
  .env("ARCH", appimagetoolArch);
