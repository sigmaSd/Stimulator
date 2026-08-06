#!/usr/bin/env bash
# Packages a deno-compiled Stimulator binary into an AppImage.
#
# Usage: build-appimage.sh <binary-path> <arch> <output-path>
#   binary-path  path to the deno-compiled `stimulator` executable
#   arch         target architecture, matches deno's --target triples:
#                x86_64 or aarch64
#   output-path  where to write the resulting .AppImage
set -euo pipefail

BINARY_PATH="$1"
ARCH="$2"
OUTPUT_PATH="$3"

APP_ID="io.github.sigmasd.stimulator"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
APPDIR="$WORK_DIR/AppDir"

mkdir -p \
  "$APPDIR/usr/bin" \
  "$APPDIR/usr/share/applications" \
  "$APPDIR/usr/share/icons/hicolor/scalable/apps" \
  "$APPDIR/usr/share/metainfo"

install -m755 "$BINARY_PATH" "$APPDIR/usr/bin/stimulator"

cp "$ROOT_DIR/distro/$APP_ID.svg" \
  "$APPDIR/usr/share/icons/hicolor/scalable/apps/$APP_ID.svg"
cp "$ROOT_DIR/distro/$APP_ID.svg" "$APPDIR/$APP_ID.svg"
ln -s "$APP_ID.svg" "$APPDIR/.DirIcon"

cp "$ROOT_DIR/distro/$APP_ID.desktop" \
  "$APPDIR/usr/share/applications/$APP_ID.desktop"
cp "$ROOT_DIR/distro/$APP_ID.desktop" "$APPDIR/$APP_ID.desktop"

cp "$ROOT_DIR/distro/$APP_ID.metainfo.xml" "$APPDIR/usr/share/metainfo/"

cat > "$APPDIR/AppRun" <<'EOF'
#!/usr/bin/env bash
HERE="$(dirname "$(readlink -f "${0}")")"
exec "$HERE/usr/bin/stimulator" "$@"
EOF
chmod +x "$APPDIR/AppRun"

# appimagetool itself only needs to run on the host (x86_64 CI runner);
# packaging an AppImage is just squashfs + concatenation, so it doesn't need
# to execute any target-arch code. But by default it embeds its own host
# runtime regardless of $ARCH, which would silently produce a broken,
# non-executable AppImage when cross-packaging for aarch64 - so the matching
# runtime stub is always fetched explicitly and passed via --runtime-file.
APPIMAGETOOL="$WORK_DIR/appimagetool"
curl -fsSL -o "$APPIMAGETOOL" \
  "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
chmod +x "$APPIMAGETOOL"

# appimagetool's own arch names don't all match deno's --target triples
case "$ARCH" in
  aarch64) APPIMAGETOOL_ARCH="arm_aarch64" ;;
  *) APPIMAGETOOL_ARCH="$ARCH" ;;
esac

RUNTIME_FILE="$WORK_DIR/runtime-$ARCH"
curl -fsSL -o "$RUNTIME_FILE" \
  "https://github.com/AppImage/AppImageKit/releases/download/continuous/runtime-$ARCH"

mkdir -p "$(dirname "$OUTPUT_PATH")"
ARCH="$APPIMAGETOOL_ARCH" "$APPIMAGETOOL" --appimage-extract-and-run \
  --runtime-file "$RUNTIME_FILE" "$APPDIR" "$OUTPUT_PATH"
