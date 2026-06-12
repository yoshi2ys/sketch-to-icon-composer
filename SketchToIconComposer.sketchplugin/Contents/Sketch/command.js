var sketch = require('sketch')
var UI = require('sketch/ui')

// Icon Composer canvas sizes: 1024 for iPhone/iPad/Mac, 1088 for Apple Watch.
var ICON_COMPOSER_CANVAS_SIZES = [1024, 1088]

function onRun() {
  var document = sketch.getSelectedDocument()
  if (!document) {
    UI.message('⚠️ No document open')
    return
  }

  var iconFrame = resolveTargetFrame(document.selectedLayers.layers)
  if (!iconFrame) {
    UI.message('⚠️ Select an icon frame (or a layer inside one) first')
    return
  }

  if (iconFrame.layers.filter(isExportableChild).length === 0) {
    UI.message('⚠️ The selected frame has no visible layers to export')
    return
  }

  var exportDir = makeExportDirectory(iconFrame.name)
  if (!exportDir) {
    UI.message('⚠️ Could not create the export folder')
    return
  }

  var paths = exportChildrenAsFullFrameSVGs(iconFrame, exportDir)

  var fileManager = NSFileManager.defaultManager()
  var missing = paths.filter(function (path) {
    return !fileManager.fileExistsAtPath(path)
  })
  if (missing.length > 0) {
    UI.message('⚠️ Export failed for ' + missing.length + ' layer(s) — see ' + exportDir)
    return
  }

  if (!copyFilesToClipboard(paths)) {
    UI.message('⚠️ Could not copy to clipboard — files are in ' + exportDir)
    return
  }

  UI.message('✓ ' + paths.length + ' SVG file(s) copied to clipboard' + frameSizeNote(iconFrame))
}

// The selected frame itself, or the nearest frame containing the selection.
// In the JS API (as of Sketch 2026.1) a top-level Frame is `Artboard` and a
// nested Frame is a `Group` with `isFrame === true` — there is no `Frame`
// type. Graphics (`isGraphicFrame`) are content, not a target frame.
function resolveTargetFrame(selectedLayers) {
  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i]
    while (layer) {
      if (isFrameLike(layer)) return layer
      layer = layer.parent
    }
  }
  return undefined
}

function isFrameLike(layer) {
  if (layer.type === 'Artboard') return true
  return layer.type === 'Group' && layer.isFrame === true && layer.isGraphicFrame !== true
}

// Slices and hotspots are export metadata, not artwork; hidden layers would
// only produce empty SVGs.
function isExportableChild(layer) {
  return !layer.hidden && layer.type !== 'Slice' && layer.type !== 'HotSpot'
}

// Exports each child at full frame size: duplicate the frame once, then for
// each exportable child reveal only that child and export the duplicate
// itself, so the SVG viewBox is the frame bounds and the child keeps its
// position (hidden layers are excluded from exports). Filenames get a
// zero-padded z-order prefix (0 = frontmost): Icon Composer imports
// alphabetically and stacks the first file on top, so front-to-back here
// matches Sketch's stacking order there.
function exportChildrenAsFullFrameSVGs(iconFrame, exportDir) {
  var dup = iconFrame.duplicate()
  try {
    if (dup.background) {
      dup.background.includedInExport = false
      dup.background.enabled = false
    }

    // Pick the children before hiding everything — the filter reads `hidden`.
    // `dup.layers` is back-to-front; reverse so prefix 0 is the frontmost.
    var children = dup.layers.filter(isExportableChild).reverse()
    var padWidth = String(children.length - 1).length
    dup.layers.forEach(function (layer) {
      layer.hidden = true
    })

    return children.map(function (child, position) {
      var fileBaseName = String(position).padStart(padWidth, '0') + '_' + sanitizeName(child.name)
      dup.name = fileBaseName
      child.hidden = false
      sketch.export(dup, { output: exportDir, formats: 'svg', overwriting: true })
      child.hidden = true
      return exportDir + '/' + fileBaseName + '.svg'
    })
  } finally {
    dup.remove()
  }
}

function makeExportDirectory(frameName) {
  var dir =
    String(NSTemporaryDirectory()) + 'SketchToIconComposer/' + sanitizeName(frameName) + '-' + Date.now()
  var created = NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
    dir,
    true,
    nil,
    nil
  )
  return created ? dir : null
}

// "/" would create subfolders on export and ":" is unsafe in filenames.
function sanitizeName(name) {
  var safe = String(name).replace(/[/:]/g, '-').trim()
  return safe.length > 0 ? safe : 'Layer'
}

function copyFilesToClipboard(paths) {
  // A raw JS array does not reliably bridge to NSArray — wrap it explicitly.
  var urls = paths.map(function (path) {
    return NSURL.fileURLWithPath(path)
  })
  var pasteboard = NSPasteboard.generalPasteboard()
  pasteboard.clearContents()
  return !!pasteboard.writeObjects(NSArray.arrayWithArray(urls))
}

function frameSizeNote(iconFrame) {
  var width = iconFrame.frame.width
  var height = iconFrame.frame.height
  if (width === height && ICON_COMPOSER_CANVAS_SIZES.includes(width)) return ''
  return (
    ' (frame is ' + width + '×' + height + ' — Icon Composer expects ' +
    ICON_COMPOSER_CANVAS_SIZES.join(' or ') + ' square)'
  )
}
