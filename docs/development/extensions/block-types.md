---
hide_table_of_contents: true
---

# Block types

Every block in an extension has a `blockType` that determines its shape, what it can return, and how it connects to other blocks.

## Standard block types

These are available in all extensions, including sandboxed ones.

### `Scratch.BlockType.COMMAND`

A **stack block** — runs an action and doesn't return a value. Connects above and below other stack blocks.

```js
{
  opcode: 'moveForward',
  blockType: Scratch.BlockType.COMMAND,
  text: 'move [STEPS] steps',
  arguments: {
    STEPS: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' }
  }
}
```

### `Scratch.BlockType.REPORTER`

A **round reporter** — returns a number or string value. Plugs into round input slots.

```js
{
  opcode: 'getScore',
  blockType: Scratch.BlockType.REPORTER,
  text: 'score'
}
```

### `Scratch.BlockType.BOOLEAN`

A **hexagonal reporter** — returns `true` or `false`. Plugs into hexagonal (boolean) input slots and can be used directly as a condition in `if` and `repeat until` blocks.

```js
{
  opcode: 'isAlive',
  blockType: Scratch.BlockType.BOOLEAN,
  text: 'is alive?'
}
```

### `Scratch.BlockType.HAT`

A **hat block** — starts a script when a condition becomes true. Scratch polls the implementation function every frame; the script runs when it returns true.

```js
{
  opcode: 'onScore',
  blockType: Scratch.BlockType.HAT,
  text: 'when score > [N]',
  arguments: {
    N: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' }
  }
}
```

### `Scratch.BlockType.EVENT`

A **hat block that is triggered by code** rather than polled. Use `runtime.startHats('extensionId_opcode')` to fire it from JavaScript.

```js
{
  opcode: 'onDataReceived',
  blockType: Scratch.BlockType.EVENT,
  text: 'when data received',
  isEdgeActivated: false
}
```

### `Scratch.BlockType.LOOP`

A **C-shaped block** that can repeat its body. The runtime re-runs the body branch as long as the block's function calls `util.startBranch(1, true)`.

```js
{
  opcode: 'repeatWhile',
  blockType: Scratch.BlockType.LOOP,
  text: 'repeat while [CONDITION]',
  arguments: {
    CONDITION: { type: Scratch.ArgumentType.BOOLEAN }
  },
  branchCount: 1
}
```

### `Scratch.BlockType.CONDITIONAL`

A **C-shaped block that runs its branch at most once** — like `if`. The branch runs if the block calls `util.startBranch(1, false)`.

```js
{
  opcode: 'ifEqual',
  blockType: Scratch.BlockType.CONDITIONAL,
  text: 'if [A] = [B]',
  arguments: {
    A: { type: Scratch.ArgumentType.STRING },
    B: { type: Scratch.ArgumentType.STRING }
  },
  branchCount: 1
}
```

### `Scratch.BlockType.BUTTON`

Not a block — renders a **clickable button** in the block palette. Useful for opening a configuration UI or triggering a one-time setup action. There is no `opcode` function; set `func` to the name of a method on your extension class.

```js
{
  blockType: Scratch.BlockType.BUTTON,
  text: 'Connect device',
  func: 'openSettings'
}
```

### `Scratch.BlockType.LABEL`

Not a block — renders a **text label** in the palette as a separator with a description.

```js
{
  blockType: Scratch.BlockType.LABEL,
  text: 'Motion blocks'
}
```

---

## Momentum-only block types

The following types are exclusive to Momentum Scratch. Extensions using them will not work in standard TurboWarp or vanilla Scratch.

### `Scratch.BlockType.OBJECT`

Returns a **JavaScript object** (`{}`). The block has a distinctive shape that signals it carries structured data. Use this for blocks that produce key-value pairs, records, or anything that isn't a plain string or number.

```js
{
  opcode: 'makePoint',
  blockType: Scratch.BlockType.OBJECT,
  text: 'point x: [X] y: [Y]',
  arguments: {
    X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
    Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
  }
}

makePoint(args) {
  return { x: Scratch.Cast.toNumber(args.X), y: Scratch.Cast.toNumber(args.Y) };
}
```

### `Scratch.BlockType.ARRAY`

Returns a **JavaScript array** (`[]`). Use this for blocks that produce lists of values.

```js
{
  opcode: 'range',
  blockType: Scratch.BlockType.ARRAY,
  text: 'range [START] to [END]',
  arguments: {
    START: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' },
    END:   { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' }
  }
}

range(args) {
  const start = Scratch.Cast.toNumber(args.START);
  const end   = Scratch.Cast.toNumber(args.END);
  const result = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}
```

### `Scratch.BlockType.LEAF`

A **rounded-rectangle reporter**. The `LEAF` shape creates its own connection type — only `LEAF` outputs plug into `LEAF` inputs. Use it to represent typed values that shouldn't be mixed with ordinary strings or numbers (e.g. color values, CSS strings, enum-like tokens).

```js
{
  opcode: 'colorRed',
  blockType: Scratch.BlockType.LEAF,
  text: 'red'
}
```

See [Block shapes](./block-shapes) for details on registering custom shapes.

### `Scratch.BlockType.PLUS`

A **cross/oval-bump reporter**. Like `LEAF`, `PLUS` outputs only connect to `PLUS` inputs. Use it for class instances, complex objects, or other values that require strict connection typing.

```js
{
  opcode: 'newVec',
  blockType: Scratch.BlockType.PLUS,
  text: 'new Vector [X] [Y]',
  arguments: {
    X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
    Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
  }
}
```

### `Scratch.BlockType.FILE`

Returns a **file value** — a special Momentum type for raw file data (e.g. from a file picker or network response). Blocks of this type carry binary file content as their value.

```js
{
  opcode: 'loadFile',
  blockType: Scratch.BlockType.FILE,
  text: 'load file [PATH]',
  arguments: {
    PATH: { type: Scratch.ArgumentType.STRING }
  }
}
```

---

## Quick reference

| Block type | Shape | Returns | Standard? |
|---|---|---|:-:|
| `COMMAND` | Stack (puzzle) | nothing | ✓ |
| `REPORTER` | Round | string / number | ✓ |
| `BOOLEAN` | Hexagon | boolean | ✓ |
| `HAT` | Hat (curved top) | boolean (polled) | ✓ |
| `EVENT` | Hat (code-triggered) | — | ✓ |
| `LOOP` | C-shape (repeating) | — | ✓ |
| `CONDITIONAL` | C-shape (once) | — | ✓ |
| `BUTTON` | Button (palette UI) | — | ✓ |
| `LABEL` | Text label (palette) | — | ✓ |
| `OBJECT` | Object shape | `{}` | Momentum only |
| `ARRAY` | Array shape | `[]` | Momentum only |
| `LEAF` | Rounded rectangle | any | Momentum only |
| `PLUS` | Cross / oval bump | any | Momentum only |
| `FILE` | File shape | file data | Momentum only |
