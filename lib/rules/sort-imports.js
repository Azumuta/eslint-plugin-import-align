const sortBy = require('lodash/sortBy');

const DEFAULT_ORDER_LIST = [
    [0, "react"],
    [2, "meteor/meteor"],
    [3, "start", "meteor/"],
    [1, "contain", "react-"],
    [1, "prop-types"],
    [5, "*"],
    [10, "start", "/imports/api/"],
    [11, "start", "/imports/ui/"],
    [12, "start", "/imports/"],
    [20, "start", "/"],
    [20, "start", "."]
];

function importFixer(imports, ordered, sourceCode) {

    let allImportsRange = [imports[0].start, imports[imports.length - 1].end];
    let importText = ordered
        .reduce((text, decl) => (text + sourceCode.getText(decl)) + '\n', '')
        .slice(0, -1);

    return function (fixer) {
        return fixer.replaceTextRange(allImportsRange, importText);
    }

}

function buildList(list) {
    let catchAll;

    return list
        .reduce((list, arr) => {
            let [order, operator, string] = arr;

            if (!string) {
                string = string || operator;

                if (string === '*') {
                    catchAll = () => order;
                    return list;
                }

                return list.concat((source) =>
                    source === string ? order : null
                );
            }

            switch (operator) {
                case 'contain':
                    return list.concat((source) =>
                        source.indexOf(string) > -1 ? order : null
                    );
                case 'start':
                    return list.concat((source) =>
                        source.startsWith(string) ? order : null
                    );
                default:
                    return list;
            }
        }, [])
        .concat(catchAll ? [catchAll] : []);
}

function orderImports(imports, orderFuncs) {
    const importsWithOrder = imports.map((decl) => [
        orderFuncs.find((func) => func(decl.source.value) !== null)(decl.source.value),
        decl
    ]);

    const sortedBySourceString = sortBy(importsWithOrder, ([order, decl]) => decl.source.value);
    const sortedByOrder = sortBy(sortedBySourceString, ([order, decl]) => order);
    const sortedBySpecifierPresence = sortBy(sortedByOrder, ([order, decl]) => decl.specifiers.length > 0 ? 0 : 1);

    return sortedBySpecifierPresence.map(([order, decl]) => decl);
}

module.exports = {
    meta: {
        docs: {
            description: 'Sort imports',
            recommended: true,
        },
        fixable: 'code',
        schema: [
            {
                type: 'array',
                items: {
                    type: 'array',
                    minItems: 2,
                    maxItems: 3,
                    items: [
                        {
                            type: 'number'
                        },
                        {
                            type: 'string'
                        },
                        {
                            type: 'string'
                        }
                    ]
                }
            }
        ]
    },

    create: function (context) {
        const orderList = buildList((context.options.length && context.options[0]) || DEFAULT_ORDER_LIST);
        let imports = [];
        let done = false;

        function importsDone() {
            if (imports.length > 1) {
                let ordered = orderImports(imports, orderList);

                if (!imports.every((decl, i) => decl === ordered[i])) {
                    context.report({
                        node: imports[0],
                        message: 'Imports not sorted correctly',
                        fix: importFixer(imports, ordered, context.getSourceCode())
                    });
                }
            }
        }

        return {
            'ImportDeclaration': function (node) {
                imports.push(node);
            },
            // Selector 'ImportDeclaration + :not(ImportDeclaration)' gives an error
            ':not(ImportDeclaration):not(ImportDeclaration *)': function (node) {
                if (!done && imports.length > 1) {
                    done = true;
                    importsDone();
                }
            },
        };
    }
    ,
}
;
