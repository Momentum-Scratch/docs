---
hide_table_of_contents: true
---

# Scoped loop variables (draggable item blocks)

This documents how to implement a C-block loop that exposes the current iteration value as a **draggable reporter block** scoped to the loop body — like `data_listforeach_item` ("item") inside `data_listforeach`, or `control_foreach_in_range_item` ("i") inside the range loop.

The user sees a block that looks like a regular round reporter, but it only makes sense inside its parent C-block. Dragging it out of the flyout or out of the C-block duplicates it rather than moving it.

---

## Overview of the three pieces

1. **The C-block** — the loop statement. Has an `input_value` slot in its header (not `field_variable`) where the item reporter lives as a shadow.
2. **The item reporter block** — a tiny round reporter with no inputs, `"duplicateOnDrag": true`. Reads the current value from the thread's `stackFrame`.
3. **The VM runtime** — the C-block stores the current value on `thread.stackFrames` each iteration; the item block walks the stack to find it.

---

## scratch-blocks

### 1. The C-block definition

In `blocks_vertical/<category>.js`:

```js
Blockly.Blocks['myext_myloop'] = {
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.MYEXT_MYLOOP,   // e.g. "for each %1 in %2"
      "message1": "%1",
      "args0": [
        {
          // %1 — the item reporter slot embedded in the header
          "type": "input_value",
          "name": "ITEM"
        },
        // any other inputs/fields the loop needs, e.g.:
        {
          "type": "field_variable",
          "name": "LIST",
          "variableTypes": [Blockly.LIST_VARIABLE_TYPE]
        }
      ],
      "args1": [
        {
          "type": "input_statement",
          "name": "SUBSTACK"
        }
      ],
      "category": Blockly.Categories.myCategory,
      "extensions": ["colours_myCategory", "shape_statement"]
    });
  }
};
```

Key point: `ITEM` is `input_value`, **not** `field_variable`. This lets a block sit inside the slot visually in the header.

### 2. The item reporter block

```js
Blockly.Blocks['myext_myloop_item'] = {
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.MYEXT_MYLOOP_ITEM,  // e.g. "item"
      "category": Blockly.Categories.myCategory,
      "duplicateOnDrag": true,                     // copies instead of moves
      "extensions": ["colours_myCategory", "output_string"]
    });
  }
};
```

`"duplicateOnDrag": true` is the only special thing needed here. Use `output_number` if the value is always numeric.

### 3. Messages

In `msg/messages.js`:
```js
Blockly.Msg.MYEXT_MYLOOP = 'for each %1 in %2';
Blockly.Msg.MYEXT_MYLOOP_ITEM = 'item';
```

In `msg/json/en.json`:
```json
"MYEXT_MYLOOP": "for each %1 in %2",
"MYEXT_MYLOOP_ITEM": "item",
```

### 4. Flyout entry (`data_category.js` or equivalent)

Build the flyout XML manually so the `ITEM` slot is pre-filled with the item shadow:

```js
Blockly.DataCategory.addMyLoop = function(xmlList, listVariable) {
  if (Blockly.Blocks['myext_myloop']) {
    var blockText = '<xml>' +
        '<block type="myext_myloop" gap="10">' +
        '<value name="ITEM"><shadow type="myext_myloop_item"></shadow></value>' +
        Blockly.Variables.generateVariableFieldXml_(listVariable, 'LIST') +
        '</block>' +
        '</xml>';
    xmlList.push(Blockly.Xml.textToDom(blockText).firstChild);
  }
};
```

The `addBlock` helper only handles a single variable field. For a loop block with both an `input_value` slot and a `field_variable`, write the XML by hand like above.

---

## scratch-vm

### 1. Register both opcodes

In `src/blocks/scratch3_mycat.js` `getPrimitives()`:

```js
myext_myloop:      this.myLoop,
myext_myloop_item: this.myLoopItem,
```

### 2. The C-block primitive

Store the current value on the **current stackFrame** each iteration, then delete it when the loop ends:

```js
myLoop (args, util) {
    const {stackFrame, thread} = util;

    // First call: initialise loop state
    if (typeof stackFrame.index === 'undefined') {
        stackFrame.index = 0;
    }

    const frame = thread.stackFrames[thread.stackFrames.length - 1];

    if (stackFrame.index < /* loop bound */) {
        // Store current value where the item reporter can find it
        frame.myLoopItem = /* current value */;
        stackFrame.index++;
        util.startBranch(1, true);
    } else {
        // Clean up so nested loops don't accidentally read this frame
        delete frame.myLoopItem;
    }
}
```

`util.stackFrame` is a shortcut for `thread.stackFrames[thread.stackFrames.length - 1]`, so `frame` and `stackFrame` are the same object here. Writing to `frame.myLoopItem` is the same as writing to `stackFrame.myLoopItem`.

### 3. The item reporter primitive

Walk the stack frames from top to bottom, returning the value from the nearest enclosing loop. This makes nested loops work correctly — each reads from its own parent frame.

```js
myLoopItem (args, util) {
    const frames = util.thread.stackFrames;
    for (let i = frames.length - 1; i >= 0; i--) {
        if (typeof frames[i].myLoopItem !== 'undefined') {
            return frames[i].myLoopItem;
        }
    }
    return '';  // or 0 if numeric
}
```

### 4. compat-blocks.js

The TurboWarp compiler must know these blocks go through the interpreter (compat layer), not be compiled natively.

In `src/compiler/compat-blocks.js`:

```js
// stacked = statement blocks (C-blocks, commands)
const stacked = [
    'myext_myloop',
    // ...
];

// inputs = reporter/boolean blocks
const inputs = [
    'myext_myloop_item',
    // ...
];
```

**Why this matters:** the compiler has a fallback that detects blocks with no inputs and a single field and treats them as menu constants — returning the field's string value. Without the compat-blocks entry, `myext_myloop_item` would compile to the constant `""` (empty string, since it has no fields at all) rather than executing the runtime primitive.

---

## Nesting

Because `myLoopItem` walks the stack from top to bottom, nested loops work automatically:

```
for each [item] in [outer list]   ← frame.myLoopItem = outer value
    for each [item] in [inner list]  ← frame.myLoopItem = inner value (different frame)
        say [item]  ← finds inner frame first → correct
```

Each C-block's frame is separate, so inner loops shadow outer ones.

---

## Checklist

- [ ] C-block: `input_value` for the item slot (not `field_variable`)
- [ ] Item block: `"duplicateOnDrag": true`, matching colour extension
- [ ] Messages added to `msg/messages.js` and `msg/json/en.json`
- [ ] Flyout: hand-written XML with `<value name="ITEM"><shadow type="...item"></shadow></value>`
- [ ] VM: C-block writes to `frame.myLoopItem`, deletes on loop end
- [ ] VM: item reporter walks `thread.stackFrames` top-to-bottom
- [ ] `compat-blocks.js`: C-block in `stacked`, item block in `inputs`
