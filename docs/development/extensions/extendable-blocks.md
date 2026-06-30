---
hide_table_of_contents: true
---

# Extendable blocks

Momentum Scratch supports **extendable blocks** — blocks with ◄ ► buttons that let users add or remove input slots at runtime, like the built-in `+`, `and`, and `join` blocks.

:::warning Momentum-only
The `extendable` block API is exclusive to Momentum Scratch. Extensions using it will not work in standard TurboWarp or vanilla Scratch. This feature also requires an [unsandboxed extension](./unsandboxed).
:::

## Basic example

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Extendable blocks require an unsandboxed extension');
  }

  const Cast = Scratch.Cast;

  class MyMath {
    getInfo() {
      return {
        id: 'mymath',
        name: 'My Math',
        blocks: [
          {
            opcode: 'sum',
            blockType: Scratch.BlockType.REPORTER,
            text: 'sum',
            arguments: {},     // no static arguments — slots are dynamic
            extendable: {
              prefixText:   'sum',
              itemLabel:    '+',
              inputName:    'NUM',
              shadowType:   'math_number',
              shadowField:  'NUM',
              shadowValue:  '0',
              minItems:     1,
              defaultItems: 2
            }
          }
        ]
      };
    }

    sum(args, util) {
      const count = Scratch.getItemCount(util);
      let result = 0;
      for (let i = 1; i <= count; i++) {
        result += Cast.toNumber(args['NUM' + i]);
      }
      return result;
    }
  }

  Scratch.extensions.register(new MyMath());
})(Scratch);
```

This produces a round reporter block that starts with two number slots and ◄ ► buttons to add or remove them. The mutation (slot count) is saved and reloaded with the project.

## The `extendable` config object

Add an `extendable` property to any block definition. It accepts these fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `prefixText` | string \| null | `null` | Static label rendered before the first slot. |
| `itemLabel` | string \| null | `null` | Label inserted between adjacent slots (e.g. `'+'`, `'and'`). |
| `inputName` | string | `'ITEM'` | Base name for generated inputs. Slots are named `ITEM1`, `ITEM2`, … |
| `inputCheck` | string \| null | `null` | Connection type check on each slot (e.g. `'Boolean'` to only accept boolean blocks). |
| `shadowType` | string \| null | `null` | Block type for the shadow placed in each new slot (e.g. `'math_number'`, `'text'`). |
| `shadowField` | string \| null | `null` | Field name on the shadow block (e.g. `'NUM'`, `'TEXT'`). |
| `shadowValue` | string | `''` | Default value in the shadow field. |
| `minItems` | number | `1` | Minimum number of slots. The ◄ button does nothing at this count. |
| `defaultItems` | number | `2` | Number of slots created when the block is first placed. |

## Reading slot values in a primitive

Use `Scratch.getItemCount(util)` to find out how many slots are active, then read `args['NAME1']`, `args['NAME2']`, … up to that count.

```js
myBlock(args, util) {
  const count = Scratch.getItemCount(util);
  for (let i = 1; i <= count; i++) {
    const value = args['ITEM' + i];  // 'ITEM' matches inputName
    // ...
  }
}
```

`Scratch.getItemCount` reads the `items` attribute from the block's mutation data. It returns `2` when no mutation is present (safe default).

## Block type compatibility

`extendable` works with these block types:

| `blockType` | Produces |
|---|---|
| `Scratch.BlockType.REPORTER` | Round reporter with dynamic number/string slots |
| `Scratch.BlockType.BOOLEAN` | Hexagonal boolean with dynamic boolean slots (set `inputCheck: 'Boolean'`) |
| `Scratch.BlockType.COMMAND` | Statement block with dynamic slots |

## Boolean example

```js
{
  opcode: 'all',
  blockType: Scratch.BlockType.BOOLEAN,
  text: 'all of',
  arguments: {},
  extendable: {
    prefixText:   'all of',
    itemLabel:    'and',
    inputName:    'BOOL',
    inputCheck:   'Boolean',
    minItems:     2,
    defaultItems: 2
  }
}
```

```js
all(args, util) {
  const count = Scratch.getItemCount(util);
  for (let i = 1; i <= count; i++) {
    if (!Cast.toBoolean(args['BOOL' + i])) return false;
  }
  return true;
}
```

## How it works internally

When a block has `extendable` set, Momentum:

1. Registers the block type in Blockly with `buildShape_`, `addItem_`, `removeItem_`, `mutationToDom`, and `domToMutation` methods — the same mechanism used by built-in extendable blocks.
2. Renders ◄ ► (`Blockly.FieldButton`) arrows at the end of the block.
3. Stores the slot count in a `<mutation items="N"/>` XML element, which is saved inside the `.sb3` project file.
4. When a project is loaded, `domToMutation` reads `items` and rebuilds the correct number of slots.

The TurboWarp compiler routes extendable extension blocks through the compatibility layer (interpreter) whenever `items > 2`. For 1–2 slots it runs compiled.
