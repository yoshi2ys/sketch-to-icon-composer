# Sketch to Icon Composer

A Sketch plugin for Apple's [Icon Composer](https://developer.apple.com/icon-composer/).
Select an icon frame and copy each of its top-level layers to the clipboard as
separate SVG files — ready to drop into Icon Composer as individual layers.

Icon Composer treats one SVG file as one layer, so building a layered Liquid
Glass icon normally means exporting every layer by hand. This plugin does it
in one command.

## Features

- **No realignment needed** — every SVG is exported at the full bounds of the
  selected frame, so all layers drop right into position in Icon Composer.
- **Keeps your layer order** — files are named `0_Name.svg`, `1_Name.svg`, …
  (0 = backmost), so the stack matches Sketch once Icon Composer 27 imports
  them.
- Hidden layers, slices, and hotspots are skipped, and the frame's background
  color is not included.

## Installation

Download this repository and double-click `SketchToIconComposer.sketchplugin`.

## Usage

1. In Sketch, select your icon frame (1024×1024 recommended) — selecting a
   layer inside the frame works too.
2. Run **Plugins → Copy Layers as SVGs for Icon Composer**.
3. Paste into Icon Composer — or paste into a Finder folder and drag the
   files in.

## Releasing (maintainers)

Auto-update is wired through Sketch's [appcast](https://developer.sketch.com/plugins/update-a-plugin):
the `appcast` URL in `manifest.json` points at the `appcast.json` attached to the
latest GitHub Release, so installed copies are notified of new versions.

To ship a release:

1. Bump `version` (and `bundleVersion`) in `manifest.json`.
2. Tag the matching version and push it:
   ```sh
   git tag v0.2.0 && git push origin v0.2.0   # tag must equal manifest "version"
   ```
3. The **Release** GitHub Action zips the plugin, creates the Release, and
   publishes a generated `appcast.json` — no manual editing needed.
