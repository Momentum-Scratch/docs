---
hide_table_of_contents: true
---

# Adding a custom variable type

Momentum supports multiple variable types beyond scalars — Lists and Tables are built-in examples. This page shows how to add a new one. It touches **scratch-blocks**, **scratch-vm**, and **scratch-gui**.

The worked example adds a hypothetical `"set"` variable type (like a List but stores unique values). Replace `set` / `Set` / `MY_SET` with your own names throughout.

---

## scratch-blocks

### 1. Register the type constant and category

**`core/constants.js`**

```js
// Add with the other variable type constants (~line 375)
Blockly.SET_VARIABLE_TYPE = 'set';
```

```js
// Add to the Blockly.Categories object (~line 285)
Blockly.Categories = {
  // ...existing...
  "dataSets": "data-sets",   // used as the category id and CSS class base
};
```

### 2. Register a colour extension for the new category

**`blocks_vertical/vertical_extensions.js`** — find the `categoryNames` array and add your name:

```js
var categoryNames =
    ['control', 'data', 'data_lists', 'data_tables', 'data_sets', /* ... */];
```

The name must match the value you put in `Blockly.Categories` (`"data-sets"` → string `'data_sets'` with dashes replaced by underscores). This auto-registers a `colours_data_sets` extension that blocks can reference. The actual colour values come from the GUI theme (see the scratch-gui section below).

### 3. Add block definitions

**`blocks_vertical/data.js`** — add blocks that reference the new variable type. Use `variableTypes: [Blockly.SET_VARIABLE_TYPE]` on any `field_variable` that should only show variables of this type.

```js
Blockly.Blocks['data_setcontents'] = {
  init: function() {
    this.jsonInit({
      "message0": "%1",
      "args0": [
        {
          "type": "field_variable_getter",
          "name": "SET",
          "variableType": Blockly.SET_VARIABLE_TYPE
        }
      ],
      "category": Blockly.Categories.dataSets,
      "extensions": ["colours_data_sets", "output_string"],
      "checkboxInFlyout": true
    });
  }
};

Blockly.Blocks['data_addtoset'] = {
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.DATA_ADDTOSET,    // "add %1 to %2"
      "args0": [
        { "type": "input_value", "name": "ITEM" },
        {
          "type": "field_variable",
          "name": "SET",
          "variableTypes": [Blockly.SET_VARIABLE_TYPE]
        }
      ],
      "category": Blockly.Categories.dataSets,
      "extensions": ["colours_data_sets", "shape_statement"]
    });
  }
};
// ... etc.
```

### 4. Add messages

**`msg/messages.js`**:
```js
Blockly.Msg.CATEGORY_SETS = 'Sets';
Blockly.Msg.DATA_ADDTOSET = 'add %1 to %2';
// ...
```

**`msg/json/en.json`**:
```json
"CATEGORY_SETS": "Sets",
"DATA_ADDTOSET": "add %1 to %2",
```

### 5. Add a flyout category function and register it

**`core/data_category.js`** — add a function that builds the flyout block list:

```js
Blockly.SetDataCategory = function(workspace) {
  var xmlList = [];

  // "Make a Set" create button
  Blockly.DataCategory.addCreateButton(xmlList, workspace, 'SET');

  var setList = workspace.getVariablesOfType(Blockly.SET_VARIABLE_TYPE);
  setList.sort(Blockly.VariableModel.compareByName);

  for (var i = 0; i < setList.length; i++) {
    Blockly.DataCategory.addBlock(xmlList, setList[i], 'data_setcontents', 'SET');
    xmlList[xmlList.length - 1].setAttribute('id', setList[i].getId());
  }

  if (setList.length > 0) {
    xmlList[xmlList.length - 1].setAttribute('gap', 28);
    var first = setList[0];
    Blockly.DataCategory.addBlock(xmlList, first, 'data_addtoset', 'SET',
        ['ITEM', 'text', 'thing']);
    // ... more blocks
  }

  return xmlList;
};
```

**`core/workspace_svg.js`** — register the flyout callback in the `WorkspaceSvg` constructor (alongside `'TABLE'` and `'LIST'`):

```js
this.registerToolboxCategoryCallback('SET', Blockly.SetDataCategory);
```

---

## scratch-vm

### 1. Add the type constant

**`src/engine/variable.js`** — add a static getter alongside `LIST_TYPE` and `TABLE_TYPE`:

```js
static get SET_TYPE () {
    return 'set';
}
```

Also handle it in the constructor's `switch` so the variable gets the right initial value:

```js
switch (this.type) {
    case Variable.SCALAR_TYPE:
        this.value = 0;
        break;
    case Variable.LIST_TYPE:
        this.value = [];
        break;
    case Variable.SET_TYPE:        // ← add this
        this.value = [];           // internal representation
        break;
    // ...
}
```

### 2. Add a lookup helper

**`src/engine/target.js`** — add `lookupOrCreateSet` alongside `lookupOrCreateList`:

```js
lookupOrCreateSet (id, name) {
    let set = this.lookupVariableById(id);
    if (set) return set;
    set = this.lookupVariableByNameAndType(name, Variable.SET_TYPE);
    if (set) return set;
    const newSet = new Variable(id, name, Variable.SET_TYPE, false);
    this.variables[id] = newSet;
    return newSet;
}
```

### 3. Handle serialization

**`src/serialization/sb3.js`** — there are three places to touch:

**Saving** (inside the variable export loop, ~line 542):
```js
if (v.type === Variable.SET_TYPE) {
    if (!obj.sets) obj.sets = Object.create(null);
    obj.sets[varId] = [v.name, makeSafeForJSON(v.value)];
}
```

**Copying between targets** (~line 601):
```js
if (vars.sets) obj.sets = vars.sets;
```

**Loading** (inside the variable import loop, ~line 1258):
```js
if (Object.prototype.hasOwnProperty.call(object, 'sets')) {
    for (const setId in object.sets) {
        const setData = object.sets[setId];
        const newSet = new Variable(setId, setData[0], Variable.SET_TYPE, false);
        newSet.value = setData[1] || [];
        target.variables[setId] = newSet;
    }
}
```

**Field name resolution** (the `fieldName === 'LIST'` section, ~line 1038 — add a parallel branch):
```js
} else if (fieldName === 'SET') {
    obj[fieldName].variableType = Variable.SET_TYPE;
}
```

### 4. Add block primitives

**`src/blocks/scratch3_data.js`** — add opcode mappings and implementations using `util.target.lookupOrCreateSet(args.SET.id, args.SET.name)`.

### 5. Register with the compiler

**`src/compiler/compat-blocks.js`** — any new reporter or statement block that isn't handled by a native compiled IR node must be listed here so the compiler routes it through the interpreter. See the [scoped loop variables](../scoped-loop-variables) page for why this matters.

```js
const stacked = [
    // ...
    'data_addtoset',
];
const inputs = [
    // ...
    'data_setcontents',
    'data_setisempty',
];
```

---

## scratch-gui

### 1. Add a theme colour

Each variable category needs primary/secondary/tertiary colours in every theme file.

**`src/lib/themes/blocks/three.js`** (and `dark.js`, `high-contrast.js`):
```js
data_sets: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    tertiary: '#6D28D9'
},
```

**`src/lib/themes/guiHelpers.js`** — add `'data_sets'` to the list of known category colour keys so it gets passed through to the blocks:
```js
// find the array of category names
'data_sets',
```

### 2. Add a toolbox category

**`src/lib/make-toolbox-xml.js`** — add a category function:

```js
const sets = function (isInitialSetup, isStage, targetId, colors) {
    return `
    <category
        name="%{BKY_CATEGORY_SETS}"
        id="data-sets"
        colour="${colors.primary}"
        secondaryColour="${colors.tertiary}"
        custom="SET">
    </category>
    `;
};
```

Then wire it into the `makeXml` function that assembles the full toolbox:

```js
const setsXML = moveCategory('data-sets') || sets(isInitialSetup, isStage, targetId,
    colors.data_sets || colors.data);

// and in the everything array, at the right position:
setsXML, gap,
```

The `custom="SET"` attribute must match the key you registered in `workspace_svg.js`.

---

## Checklist

- [ ] `scratch-blocks/core/constants.js` — `Blockly.SET_VARIABLE_TYPE`, `Blockly.Categories.dataSets`
- [ ] `scratch-blocks/blocks_vertical/vertical_extensions.js` — add `'data_sets'` to `categoryNames`
- [ ] `scratch-blocks/blocks_vertical/data.js` — block definitions using `variableTypes: [Blockly.SET_VARIABLE_TYPE]`
- [ ] `scratch-blocks/msg/messages.js` + `msg/json/en.json` — `CATEGORY_SETS` + block messages
- [ ] `scratch-blocks/core/data_category.js` — `Blockly.SetDataCategory` flyout function
- [ ] `scratch-blocks/core/workspace_svg.js` — `registerToolboxCategoryCallback('SET', ...)`
- [ ] `scratch-vm/src/engine/variable.js` — `SET_TYPE` static, constructor `case`
- [ ] `scratch-vm/src/engine/target.js` — `lookupOrCreateSet`
- [ ] `scratch-vm/src/serialization/sb3.js` — save, copy, load, field name resolution
- [ ] `scratch-vm/src/blocks/scratch3_data.js` — primitives
- [ ] `scratch-vm/src/compiler/compat-blocks.js` — stacked + inputs entries
- [ ] `scratch-gui/src/lib/themes/blocks/*.js` — colour entries
- [ ] `scratch-gui/src/lib/themes/guiHelpers.js` — category key registration
- [ ] `scratch-gui/src/lib/make-toolbox-xml.js` — category function + assembly
