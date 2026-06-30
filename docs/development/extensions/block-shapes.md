---
hide_table_of_contents: true
---

# Block shapes

Momentum Scratch includes a **block shape registry** that lets extensions declare and use custom block output shapes beyond the built-in round (reporter) and hexagonal (boolean) shapes.

This is a **Momentum-only feature** and requires an unsandboxed extension.

## Built-in custom shapes

Two additional shapes are registered by default:

| Shape | `BlockType` | `ArgumentType` | Visual |
|---|---|---|---|
| **Leaf** | `Scratch.BlockType.LEAF` | `Scratch.ArgumentType.LEAF` | Rounded rectangle (like a label tag) |
| **Plus** | `Scratch.BlockType.PLUS` | `Scratch.ArgumentType.PLUS` | Cross/oval bump shape |

These shapes create new connection types — a Leaf output can only plug into a Leaf input, and a Plus output can only plug into a Plus input.

## Using Leaf and Plus block types

To make a reporter block with a Leaf or Plus output shape, set `blockType` to `Scratch.BlockType.LEAF` or `Scratch.BlockType.PLUS`:

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Custom block shapes require an unsandboxed extension');
  }

  class ShapeDemo {
    getInfo() {
      return {
        id: 'shapedemo',
        name: 'Shape Demo',
        blocks: [
          {
            opcode: 'leafValue',
            blockType: Scratch.BlockType.LEAF,
            text: 'leaf [TEXT]',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          },
          {
            opcode: 'plusValue',
            blockType: Scratch.BlockType.PLUS,
            text: 'plus [NUM]',
            arguments: {
              NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
            }
          },
          {
            opcode: 'acceptLeaf',
            blockType: Scratch.BlockType.REPORTER,
            text: 'process [LEAF]',
            arguments: {
              LEAF: { type: Scratch.ArgumentType.LEAF }
            }
          }
        ]
      };
    }

    leafValue(args) {
      return args.TEXT;
    }

    plusValue(args) {
      return args.NUM;
    }

    acceptLeaf(args) {
      return args.LEAF;
    }
  }

  Scratch.extensions.register(new ShapeDemo());
})(Scratch);
```

In this example, only a `LEAF`-type block can be dropped into the `LEAF` argument slot — regular round reporters are rejected by the connection type check.

## Registering a custom shape

You can register your own shapes using `Scratch.registerBlockShape()`:

```js
Scratch.registerBlockShape({
  shape: 8,                    // unique integer ID (≥ 8 to avoid collisions)
  outputShapeName: 'Diamond',  // identifier used in BlockType / ArgumentType
  typeChecks: ['Diamond'],     // connection type label — must match on both ends
  // Blockly SVG path segments for the shape outline:
  path: 'M 0 8 L 8 0 L 0 -8 L -8 0 Z',
  pathLeft: 'l -8 0 l 8 8 l 8 -8',
  pathRight: 'l 8 0 l -8 -8 l -8 8',
});
```

After registering, the shape is available as:

- `Scratch.BlockType['Diamond']` for block output type
- `Scratch.ArgumentType['Diamond']` for argument input type

`registerBlockShape` is a thin wrapper over `Blockly.ShapeRegistry.register()` from scratch-blocks.

### Shape definition fields

| Field | Type | Description |
|---|---|---|
| `shape` | number | Unique integer ID for this shape. Values 1–7 are reserved by the built-in shapes. Use 8 or higher. |
| `outputShapeName` | string | The name used in `BlockType` and `ArgumentType`. Must be a valid JS identifier. |
| `typeChecks` | string[] | Connection type labels. Inputs with a matching label only accept outputs with the same label. |
| `path` | string | SVG path for the shape interior fill. |
| `pathLeft` | string | SVG path for the left connector notch. |
| `pathRight` | string | SVG path for the right connector notch. |

### Full custom shape example

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Custom shapes require an unsandboxed extension');
  }

  // Register the shape before getInfo() runs
  Scratch.registerBlockShape({
    shape: 8,
    outputShapeName: 'Tag',
    typeChecks: ['Tag'],
    path: 'M 0 10 L 10 0 L 0 -10 L -10 0 Z',
    pathLeft: 'l -10 0 l 10 10 l 10 -10',
    pathRight: 'l 10 0 l -10 -10 l -10 10',
  });

  class Tags {
    getInfo() {
      return {
        id: 'tags',
        name: 'Tags',
        blocks: [
          {
            opcode: 'makeTag',
            blockType: Scratch.BlockType.Tag,
            text: 'tag [LABEL]',
            arguments: {
              LABEL: { type: Scratch.ArgumentType.STRING, defaultValue: 'item' }
            }
          },
          {
            opcode: 'tagLabel',
            blockType: Scratch.BlockType.REPORTER,
            text: 'label of [TAG]',
            arguments: {
              TAG: { type: Scratch.ArgumentType.Tag }
            }
          }
        ]
      };
    }

    makeTag(args) {
      return args.LABEL;
    }

    tagLabel(args) {
      return args.TAG;
    }
  }

  Scratch.extensions.register(new Tags());
})(Scratch);
```

:::info
`registerBlockShape` must be called before `Scratch.extensions.register()`. If the shape is registered after the extension is registered, `getInfo()` may have already run and the shape IDs won't be resolved correctly.
:::

## Shape IDs reference

| ID | Name | `BlockType` / `ArgumentType` |
|:-:|---|---|
| 1 | Round (reporter) | `REPORTER` |
| 2 | Square (square reporter) | — (internal) |
| 3 | Hexagon (boolean) | `BOOLEAN` |
| 4 | Puzzle (command) | `COMMAND` |
| 5 | Hat | `HAT` |
| 6 | Leaf | `LEAF` |
| 7 | Plus | `PLUS` |
| 8+ | Custom | (your `outputShapeName`) |
