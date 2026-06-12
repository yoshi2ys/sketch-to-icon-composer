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
  (0 = frontmost), so the stack matches Sketch once Icon Composer imports them
  alphabetically.
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
