---
hide_table_of_contents: true
---

# Block shape registry

Momentum uses two separate registries to define a custom block output shape. One controls **rendering** (how the block looks in the editor), the other controls **connections** (what plugs into what at runtime). Both must be registered for a shape to work end-to-end.

---

## The two registries

| Registry | Where | What it does |
|---|---|---|
| `Blockly.ShapeRegistry` | scratch-blocks | SVG outline path, socket shape, colours |
| `BlockShapeRegistry` | scratch-vm | Maps `blockType`/`argumentType` strings to `{output, outputShape}` |

Extensions register on both via `ScratchBlocks.ShapeRegistry.register()` and `Scratch.registerBlockShape()`. When adding a shape directly to Momentum's source (not via extension), you skip the extension wrapper and call the same underlying registries directly.

---

## scratch-blocks: `Blockly.ShapeRegistry`

Defined in `core/shape_registry.js`. Built-in shapes are registered at the bottom of `core/block_render_svg_vertical.js`.

### Shape definition fields

```js
Blockly.ShapeRegistry.register({
    id: 9,                   // unique integer; 1-7 are built-in, 8 is used by the Vector2D example
    typeChecks: ['MyType'],  // connection type label — must match on both block output and input check
    priority: 85,            // higher = checked first when multiple shapes match; built-ins use 50-100
    cssClass: 'my-type',     // added to the block's SVG root for CSS targeting
    hasEdgeShape: true,      // true if leftEdge/rightEdge actually draw something

    // SVG path string for the socket notch drawn on inputs that accept this type.
    // Drawn as a filled path centred on the connection point.
    inputPath: 'M 0 4 L 4 0 L 4 -4 L -4 -4 L -4 0 Z',
    inputWidth: 16,          // horizontal space reserved for the socket (px)
    inputArgType: 'mytype',  // internal arg type string used by the renderer

    // Functions that return SVG path *fragments* appended to the block outline.
    // w = the block's output shape size constant (from BlockSvg).
    leftEdge: function(w) {
        // Called when drawing the left side of the block.
        // Return a relative SVG path segment (e.g. 'l dx dy v h l dx dy').
        return 'l ' + (-0.5 * w) + ' ' + (-0.5 * w) +
               ' v ' + (-w) +
               ' l ' + (0.5 * w) + ' ' + (-0.5 * w);
    },
    rightEdge: function(w) {
        // Called when drawing the right side of the block.
        return 'l ' + (0.5 * w) + ' ' + (0.5 * w) +
               ' v ' + w +
               ' l ' + (-0.5 * w) + ' ' + (0.5 * w);
    },

    // Padding between an outer block's socket and the inner block's edge.
    // Keys are output shape IDs. Use 0 as a fallback default.
    padding: {
        0: 8,   // default padding when nested inside a square-output block
        1: 4,   // nested inside a round-output block
        3: 4,   // nested inside a hexagonal-output block
    },
    defaultPadding: 8
});
```

### Reading the grid unit

All measurements should be multiples of `Blockly.BlockSvg.GRID_UNIT` (4 px). Read it as a constant rather than hardcoding:

```js
const GU = Blockly.BlockSvg.GRID_UNIT; // 4
```

### Where to place the registration call

If adding a shape to Momentum's source (not an extension), put the `Blockly.ShapeRegistry.register()` call at the bottom of `core/block_render_svg_vertical.js`, alongside the existing built-in registrations for Boolean, Round, Square, Object, File, Leaf, and Plus.

Also add a constant for the ID:

```js
// core/constants.js or at the top of block_render_svg_vertical.js
Blockly.OUTPUT_SHAPE_MYSET = 9;
```

### Built-in shape IDs for reference

| ID | Constant | Shape |
|:-:|---|---|
| 1 | `OUTPUT_SHAPE_ROUND` | Round (reporter) |
| 2 | `OUTPUT_SHAPE_SQUARE` | Square (command) |
| 3 | `OUTPUT_SHAPE_HEXAGONAL` | Hexagonal (boolean) |
| 4 | *(puzzle piece)* | Command connector |
| 5 | *(hat)* | Hat block |
| 6 | `OUTPUT_SHAPE_LEAF` | Leaf |
| 7 | `OUTPUT_SHAPE_PLUS` | Plus |
| 8 | *(Vector2D example)* | Octagonal |
| 9+ | yours | — |

---

## scratch-vm: `BlockShapeRegistry`

Defined in `src/engine/block-shape-registry.js`. Controls which output shape and connection check the VM uses when evaluating a block.

### Registration

```js
// src/engine/block-shape-registry.js  (or wherever built-in shapes are registered)
BlockShapeRegistry.register({
    blockType:   'MyType',   // used in getInfo() blockType field
    argumentType: 'MyType', // used in getInfo() argument type field
    output:       'MyType', // Scratch connection type check string
    outputShape:  9         // must match the Blockly.ShapeRegistry id above
});
```

`output` is the string that Scratch uses for connection type-checking — a reporter's output must match the input's check for the connection to be allowed. It should match the `typeChecks` array in the Blockly shape definition.

### Where to place it

Built-in shapes are registered at the bottom of `src/engine/block-shape-registry.js`. Add yours there alongside `LEAF`, `PLUS`, `OBJECT`, `ARRAY`, `FILE`.

---

## Adding a `BlockType` and `ArgumentType` constant

To let blocks reference the new shape via `Scratch.BlockType.MyType` and `Scratch.ArgumentType.MyType`:

**`src/extension-support/block-type.js`**:
```js
const BlockType = {
    // ...existing...
    MY_TYPE: 'MyType',
};
```

**`src/extension-support/argument-type.js`**:
```js
const ArgumentType = {
    // ...existing...
    MY_TYPE: 'MyType',
};
```

---

## Wiring into the colour extension system

For the new shape's blocks to use a consistent colour, add a `colours_my_type` extension in scratch-blocks:

1. Add `'my_type'` to the `categoryNames` array in `blocks_vertical/vertical_extensions.js`.
2. Add a matching colour entry in the scratch-gui theme files (`src/lib/themes/blocks/*.js`).
3. Use `"extensions": ["colours_my_type", "output_my_type_shape"]` in block definitions, or use a standard shape extension like `output_string` and rely on the shape registry for the visual form.

---

## Extension vs. source registration

If you're building a **Momentum extension** (loaded at runtime via URL), use the dual extension API instead:

```js
// scratch-blocks side (called at extension load time, bare global)
ScratchBlocks.ShapeRegistry.register({ id: 9, /* ... */ });

// scratch-vm side
Scratch.registerBlockShape({
    blockType:    'MyType',
    argumentType: 'MyType',
    output:       'MyType',
    outputShape:  9
});
```

The extension approach is documented in [block shapes](../extensions/block-shapes). The internal/source approach described on this page is for adding shapes permanently to Momentum itself.

---

## Checklist

**scratch-blocks:**
- [ ] `core/constants.js` — `Blockly.OUTPUT_SHAPE_MYTYPE = N`
- [ ] `core/block_render_svg_vertical.js` — `Blockly.ShapeRegistry.register({...})` with all required fields
- [ ] `blocks_vertical/vertical_extensions.js` — add `'my_type'` to `categoryNames`

**scratch-vm:**
- [ ] `src/engine/block-shape-registry.js` — `BlockShapeRegistry.register({...})`
- [ ] `src/extension-support/block-type.js` — `MY_TYPE` constant
- [ ] `src/extension-support/argument-type.js` — `MY_TYPE` constant

**scratch-gui:**
- [ ] `src/lib/themes/blocks/*.js` — colour entries
- [ ] `src/lib/themes/guiHelpers.js` — add colour key to categories list
