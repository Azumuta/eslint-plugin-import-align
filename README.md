# eslint-plugin-azumuta

This eslint plugin implements three rules for import declarations with possible autofix

## Default options

```json
{
  "rules": {
    "azumuta/force-absolute-imports": [2, "azumuta/app"],
    "azumuta/align-imports": [2, 45],
    "azumuta/sort-imports": [2, [
      [0, "react"],
      [1, "contain", "react"],
      [1, "prop-types"],
      [2, "meteor/meteor"],
      [3, "contain", "meteor"],
      [5, "*"],
      [10, "start", "/imports/api/"],
      [11, "start", "/imports/ui/"],
      [12, "start", "/imports/"],
      [20, "start", "/"],
      [20, "start", "."]
    ]]
  }
}
```

## ``force-absolute-imports``

Forces all imports to be 'absolute' paths relative to given root. Should always be mentioned before ``sort-imports`` in rules config.

Useful in conjunction with [babel-root-slash-import](https://github.com/mantrajs/babel-root-slash-import)

## ``align-imports``

Aligns sources of all import declarations at set column.

## ``sort-imports``

Sorts imports by source according to given array of tuples.
The first element of a tuple defines the **order** at which any import matching the tuple should end up.
If a tuple has three elements, the second element is an **operator**:
- ``start``: the last element should be a prefix of the source
- ``contain``: the last element should be a substring of the source

If no operator is set, the last element should be an **exact match** with the source.

The tuples are processed sequentially in the given order, for each import, to determine that import's intended order.
The ``*`` string is a special case, it catches all remaining imports. 
It is always processed last but can be anywhere in the tuple list, for convenience sake.