---
hide_table_of_contents: true
---

# Block types

Every block in an extension has a `blockType` that determines its shape, what it can return, and how it connects to other blocks.

## Standard block types

These are available in all extensions, including sandboxed ones.

### `Scratch.BlockType.COMMAND`

A **stack block** — runs an action and doesn't return a value. Connects above and below other stack blocks.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class Logger {
    getInfo() {
      return {
        id: 'logger',
        name: 'Logger',
        blocks: [
          {
            opcode: 'log',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log [TEXT] to console',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          }
        ]
      };
    }

    log(args) {
      console.log(String(args.TEXT));
    }
  }

  Scratch.extensions.register(new Logger());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.REPORTER`

A **round reporter** — returns a number or string value. Plugs into round input slots.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class MathExt {
    getInfo() {
      return {
        id: 'mathext',
        name: 'Math Ext',
        blocks: [
          {
            opcode: 'clamp',
            blockType: Scratch.BlockType.REPORTER,
            text: 'clamp [N] between [MIN] and [MAX]',
            arguments: {
              N:   { type: Scratch.ArgumentType.NUMBER, defaultValue: '5'  },
              MIN: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0'  },
              MAX: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' }
            }
          }
        ]
      };
    }

    clamp(args) {
      const n   = Scratch.Cast.toNumber(args.N);
      const min = Scratch.Cast.toNumber(args.MIN);
      const max = Scratch.Cast.toNumber(args.MAX);
      return Math.min(Math.max(n, min), max);
    }
  }

  Scratch.extensions.register(new MathExt());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.BOOLEAN`

A **hexagonal reporter** — returns `true` or `false`. Plugs into hexagonal (boolean) input slots and can be used directly as a condition in `if` and `repeat until` blocks.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class StringChecks {
    getInfo() {
      return {
        id: 'stringchecks',
        name: 'String Checks',
        blocks: [
          {
            opcode: 'startsWith',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[STR] starts with [PREFIX]',
            arguments: {
              STR:    { type: Scratch.ArgumentType.STRING, defaultValue: 'hello world' },
              PREFIX: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          }
        ]
      };
    }

    startsWith(args) {
      return String(args.STR).startsWith(String(args.PREFIX));
    }
  }

  Scratch.extensions.register(new StringChecks());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.HAT`

A **hat block** — starts a script when a condition becomes true. Scratch polls the implementation function every frame; the script runs when it returns true.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class TimerHat {
    constructor() {
      this._elapsed = 0;
      this._lastTime = Date.now();
    }

    getInfo() {
      return {
        id: 'timerhat',
        name: 'Timer Hat',
        blocks: [
          {
            opcode: 'whenSecondsElapsed',
            blockType: Scratch.BlockType.HAT,
            text: 'when [SECS] seconds pass',
            arguments: {
              SECS: { type: Scratch.ArgumentType.NUMBER, defaultValue: '2' }
            },
            isEdgeActivated: false
          }
        ]
      };
    }

    whenSecondsElapsed(args) {
      const now = Date.now();
      this._elapsed += (now - this._lastTime) / 1000;
      this._lastTime = now;
      const threshold = Scratch.Cast.toNumber(args.SECS);
      if (this._elapsed >= threshold) {
        this._elapsed = 0;
        return true;
      }
      return false;
    }
  }

  Scratch.extensions.register(new TimerHat());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.EVENT`

A **hat block that is triggered by code** rather than polled. Use `runtime.startHats('extensionId_opcode')` to fire it from JavaScript.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Event blocks require an unsandboxed extension');
  }

  const runtime = Scratch.vm.runtime;

  class KeyboardEvent {
    getInfo() {
      return {
        id: 'kbevent',
        name: 'Keyboard Event',
        blocks: [
          {
            opcode: 'onAnyKey',
            blockType: Scratch.BlockType.EVENT,
            text: 'when any key pressed',
            isEdgeActivated: false
          },
          {
            opcode: 'lastKey',
            blockType: Scratch.BlockType.REPORTER,
            text: 'last key pressed'
          }
        ]
      };
    }

    constructor() {
      this._lastKey = '';
      document.addEventListener('keydown', (e) => {
        this._lastKey = e.key;
        runtime.startHats('kbevent_onAnyKey');
      });
    }

    lastKey() {
      return this._lastKey;
    }
  }

  Scratch.extensions.register(new KeyboardEvent());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.LOOP`

A **C-shaped block that repeats its body**. The runtime re-runs the body branch as long as the block's function calls `util.startBranch(1, true)`.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class Loops {
    getInfo() {
      return {
        id: 'loops',
        name: 'Loops',
        blocks: [
          {
            opcode: 'repeatWhile',
            blockType: Scratch.BlockType.LOOP,
            text: 'repeat while [CONDITION]',
            arguments: {
              CONDITION: { type: Scratch.ArgumentType.BOOLEAN }
            },
            branchCount: 1
          }
        ]
      };
    }

    repeatWhile(args, util) {
      if (args.CONDITION) {
        util.startBranch(1, true);  // true = loop again after branch
      }
    }
  }

  Scratch.extensions.register(new Loops());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.CONDITIONAL`

A **C-shaped block that runs its branch at most once** — like `if`. The branch runs if the block calls `util.startBranch(1, false)`.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class Conditionals {
    getInfo() {
      return {
        id: 'cond',
        name: 'Conditionals',
        blocks: [
          {
            opcode: 'unlessBlock',
            blockType: Scratch.BlockType.CONDITIONAL,
            text: 'unless [CONDITION]',
            arguments: {
              CONDITION: { type: Scratch.ArgumentType.BOOLEAN }
            },
            branchCount: 1
          }
        ]
      };
    }

    unlessBlock(args, util) {
      if (!args.CONDITION) {
        util.startBranch(1, false);  // false = run branch once, don't loop
      }
    }
  }

  Scratch.extensions.register(new Conditionals());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.BUTTON`

Not a block — renders a **clickable button** in the block palette. Useful for opening a configuration UI or triggering a one-time setup action. Set `func` to the name of a method on your extension class.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class ConfigDemo {
    getInfo() {
      return {
        id: 'configdemo',
        name: 'Config Demo',
        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            text: 'Open settings',
            func: 'openSettings'
          },
          {
            opcode: 'getApiKey',
            blockType: Scratch.BlockType.REPORTER,
            text: 'API key'
          }
        ]
      };
    }

    openSettings() {
      const key = prompt('Enter your API key:');
      if (key) this._apiKey = key;
    }

    getApiKey() {
      return this._apiKey || '';
    }
  }

  Scratch.extensions.register(new ConfigDemo());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.LABEL`

Not a block — renders a **text label** in the palette as a section heading.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  class Sections {
    getInfo() {
      return {
        id: 'sections',
        name: 'Sections',
        blocks: [
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Reading'
          },
          {
            opcode: 'read',
            blockType: Scratch.BlockType.REPORTER,
            text: 'read value'
          },
          '---',
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Writing'
          },
          {
            opcode: 'write',
            blockType: Scratch.BlockType.COMMAND,
            text: 'write [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.STRING }
            }
          }
        ]
      };
    }

    read() { return this._value || ''; }
    write(args) { this._value = args.VALUE; }
  }

  Scratch.extensions.register(new Sections());
})(Scratch);
```

</details>

---

## Momentum-only block types

The following types are exclusive to Momentum Scratch. Extensions using them will not work in standard TurboWarp or vanilla Scratch.

### `Scratch.BlockType.OBJECT`

Returns a **JavaScript object** (`{}`). Use this for blocks that produce key-value pairs, records, or any structured data that isn't a plain string or number.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Object blocks require an unsandboxed extension');
  }

  class Points {
    getInfo() {
      return {
        id: 'points',
        name: 'Points',
        blocks: [
          {
            opcode: 'makePoint',
            blockType: Scratch.BlockType.OBJECT,
            text: 'point x: [X] y: [Y]',
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
            }
          },
          {
            opcode: 'getX',
            blockType: Scratch.BlockType.REPORTER,
            text: 'x of [POINT]',
            arguments: {
              POINT: { type: Scratch.ArgumentType.OBJECT }
            }
          },
          {
            opcode: 'getY',
            blockType: Scratch.BlockType.REPORTER,
            text: 'y of [POINT]',
            arguments: {
              POINT: { type: Scratch.ArgumentType.OBJECT }
            }
          }
        ]
      };
    }

    makePoint(args) {
      return {
        x: Scratch.Cast.toNumber(args.X),
        y: Scratch.Cast.toNumber(args.Y)
      };
    }

    getX(args) { return args.POINT && args.POINT.x || 0; }
    getY(args) { return args.POINT && args.POINT.y || 0; }
  }

  Scratch.extensions.register(new Points());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.ARRAY`

Returns a **JavaScript array** (`[]`). Use this for blocks that produce lists of values.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Array blocks require an unsandboxed extension');
  }

  class Lists {
    getInfo() {
      return {
        id: 'listext',
        name: 'List Ext',
        blocks: [
          {
            opcode: 'range',
            blockType: Scratch.BlockType.ARRAY,
            text: 'range [START] to [END]',
            arguments: {
              START: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1'  },
              END:   { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' }
            }
          },
          {
            opcode: 'length',
            blockType: Scratch.BlockType.REPORTER,
            text: 'length of [ARR]',
            arguments: {
              ARR: { type: Scratch.ArgumentType.ARRAY }
            }
          }
        ]
      };
    }

    range(args) {
      const start = Scratch.Cast.toNumber(args.START);
      const end   = Scratch.Cast.toNumber(args.END);
      const out = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    }

    length(args) {
      return Array.isArray(args.ARR) ? args.ARR.length : 0;
    }
  }

  Scratch.extensions.register(new Lists());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.LEAF`

A **rounded-rectangle reporter**. The `LEAF` shape creates its own connection type — only `LEAF` outputs plug into `LEAF` inputs. Use it for typed values that shouldn't mix with ordinary strings or numbers (e.g. CSS colors, enum tokens).

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Leaf blocks require an unsandboxed extension');
  }

  class Colors {
    getInfo() {
      return {
        id: 'colors',
        name: 'Colors',
        blocks: [
          {
            opcode: 'red',
            blockType: Scratch.BlockType.LEAF,
            text: 'red'
          },
          {
            opcode: 'rgb',
            blockType: Scratch.BlockType.LEAF,
            text: 'rgb [R] [G] [B]',
            arguments: {
              R: { type: Scratch.ArgumentType.NUMBER, defaultValue: '255' },
              G: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0'   },
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0'   }
            }
          },
          {
            opcode: 'applyColor',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set pen color to [COLOR]',
            arguments: {
              COLOR: { type: Scratch.ArgumentType.LEAF }
            }
          }
        ]
      };
    }

    red() { return '#ff0000'; }

    rgb(args) {
      const r = Math.round(Scratch.Cast.toNumber(args.R));
      const g = Math.round(Scratch.Cast.toNumber(args.G));
      const b = Math.round(Scratch.Cast.toNumber(args.B));
      return `rgb(${r},${g},${b})`;
    }

    applyColor(args) {
      // args.COLOR is a CSS color string — use it however your extension needs
      console.log('Color:', args.COLOR);
    }
  }

  Scratch.extensions.register(new Colors());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.PLUS`

A **cross/oval-bump reporter**. Like `LEAF`, `PLUS` outputs only connect to `PLUS` inputs. Use it for class instances, complex objects, or other values that require strict connection typing.

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Plus blocks require an unsandboxed extension');
  }

  class Vectors {
    getInfo() {
      return {
        id: 'vectors',
        name: 'Vectors',
        blocks: [
          {
            opcode: 'vec',
            blockType: Scratch.BlockType.PLUS,
            text: 'vector [X] [Y]',
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
            }
          },
          {
            opcode: 'addVec',
            blockType: Scratch.BlockType.PLUS,
            text: '[A] + [B]',
            arguments: {
              A: { type: Scratch.ArgumentType.PLUS },
              B: { type: Scratch.ArgumentType.PLUS }
            }
          },
          {
            opcode: 'magnitude',
            blockType: Scratch.BlockType.REPORTER,
            text: 'magnitude of [V]',
            arguments: {
              V: { type: Scratch.ArgumentType.PLUS }
            }
          }
        ]
      };
    }

    vec(args) {
      return { x: Scratch.Cast.toNumber(args.X), y: Scratch.Cast.toNumber(args.Y) };
    }

    addVec(args) {
      const a = args.A || { x: 0, y: 0 };
      const b = args.B || { x: 0, y: 0 };
      return { x: a.x + b.x, y: a.y + b.y };
    }

    magnitude(args) {
      const v = args.V || { x: 0, y: 0 };
      return Math.sqrt(v.x * v.x + v.y * v.y);
    }
  }

  Scratch.extensions.register(new Vectors());
})(Scratch);
```

</details>

---

### `Scratch.BlockType.FILE`

Returns a **file value** — a special Momentum type for raw file data (e.g. from a file picker or network response).

<details>
<summary>Example extension</summary>

```js
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('File blocks require an unsandboxed extension');
  }

  class FilePicker {
    getInfo() {
      return {
        id: 'filepicker',
        name: 'File Picker',
        blocks: [
          {
            opcode: 'pickFile',
            blockType: Scratch.BlockType.FILE,
            text: 'pick a file'
          },
          {
            opcode: 'fileName',
            blockType: Scratch.BlockType.REPORTER,
            text: 'name of [FILE]',
            arguments: {
              FILE: { type: Scratch.ArgumentType.FILE }
            }
          },
          {
            opcode: 'fileSize',
            blockType: Scratch.BlockType.REPORTER,
            text: 'size of [FILE] in bytes',
            arguments: {
              FILE: { type: Scratch.ArgumentType.FILE }
            }
          }
        ]
      };
    }

    async pickFile() {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => resolve(input.files[0] || null);
        input.click();
      });
    }

    fileName(args) {
      return args.FILE ? args.FILE.name : '';
    }

    fileSize(args) {
      return args.FILE ? args.FILE.size : 0;
    }
  }

  Scratch.extensions.register(new FilePicker());
})(Scratch);
```

</details>

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
