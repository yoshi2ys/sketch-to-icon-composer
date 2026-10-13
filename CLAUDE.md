# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A raw Sketch plugin (`.sketchplugin` bundle, no skpm / no build step) that exports each top-level layer of a selected icon frame as a **full-frame** SVG and copies the files to the clipboard, ready to drop into Apple's [Icon Composer](https://developer.apple.com/icon-composer/) as individual Liquid Glass layers.

The entire plugin is two files:
- `SketchToIconComposer.sketchplugin/Contents/Sketch/manifest.json` — command + menu wiring.
- `SketchToIconComposer.sketchplugin/Contents/Sketch/command.js` — all logic, entry point `onRun`.

## Commands

There is no compiler or test runner. Verify edits with:

```sh
node --check SketchToIconComposer.sketchplugin/Contents/Sketch/command.js   # JS syntax
python3 -m json.tool SketchToIconComposer.sketchplugin/Contents/Sketch/manifest.json   # manifest validity
```

The plugin is installed via a symlink (already present) at
`~/Library/Application Support/com.bohemiancoding.sketch3/Plugins/SketchToIconComposer.sketchplugin`,
so saved edits are picked up on the next Sketch run — no reinstall needed.

**Behavioral testing cannot be automated.** The command only runs inside Sketch's UI (Plugins → *Copy Layers as SVGs for Icon Composer*) against a live document. Ask Yoshi to run it and check the result in Icon Composer; don't claim runtime behavior is verified from a syntax check alone.

## Architecture / non-obvious constraints

**Runtime is CocoaScript, not Node.** `command.js` runs in Sketch's JS bridge: it mixes the Sketch JS API (`require('sketch')`, `require('sketch/ui')`) with raw Objective-C bridged calls (`NSFileManager`, `NSURL`, `NSPasteboard`, `NSTemporaryDirectory`, `nil`). `manifest.json` sets `disableCocoaScriptPreprocessor: true`, so there is no `@import`/macro preprocessing — write plain CommonJS-style ES5. Node-only APIs (`fs`, `require('path')`, etc.) are unavailable; `node --check` validates syntax only, never behavior.

**The full-frame export trick** (`exportChildrenAsFullFrameSVGs`) is the heart of the plugin and the reason layers drop into Icon Composer without realignment: duplicate the frame once, disable its background, hide *all* children, then reveal exactly one child at a time and export **the duplicate frame itself** (not the child). Because the duplicate's bounds never change, every SVG shares one `viewBox` = the frame bounds, so each layer keeps its absolute position. A `try/finally` guarantees the duplicate is removed even on error. Operate on children of the *duplicate* tree by identity (the filtered `dup.layers` array), never by index carried over from the original.

**Filename ordering is a contract with Icon Composer.** Files are named `<n>_<LayerName>.svg` with a zero-padded numeric prefix where **0 = backmost**. Icon Composer 27 puts the first file at the bottom of the stack, so this prefix is what makes the imported stack match Sketch's stacking order. `dup.layers` is already back-to-front, so it is used as is; the clipboard receives the files in the same order. Don't change the prefix scheme without re-checking Icon Composer's import order.

**Frame detection** (`isFrameLike` / `resolveTargetFrame`): the Sketch JS API (as of 2026.1) has no `Frame` type — a top-level Frame is an `Artboard`, a nested Frame is a `Group` with `isFrame === true`, and a Graphic is a `Group` with `isGraphicFrame === true` (treated as content, not a target). `resolveTargetFrame` walks up `parent` from each selected layer so selecting a layer *inside* a frame also works.

**Exclusions:** `isExportableChild` skips hidden layers, `Slice`, and `HotSpot` (export metadata, not artwork); the frame's background color is excluded from every export. Filter children *before* the hide-all pass, since the filter reads `layer.hidden`.
