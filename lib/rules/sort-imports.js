const sortBy = require('lodash/sortBy');

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
                } else {
                    return list.concat((source) => {
                        return source === string ? order : null
                    });
                }
            } else {
                switch (operator) {
                    case 'contain':
                        return list.concat((source) => {
                            return source.indexOf(string) > -1 ? order : null
                        });
                    case 'start':
                        return list.concat((source) => {
                            return source.startsWith(string) ? order : null
                        });
                }
            }
        }, [])
        .concat(catchAll ? [catchAll] : []);
}

const orderList = buildList([
    [0, 'react'],
    [1, 'contain', 'react'],
    [1, 'prop-types'],
    [2, 'meteor/meteor'],
    [3, 'contain', 'meteor'],
    [5, '*'],
    [10, 'start', '/imports/api/'],
    [11, 'start', '/imports/ui/'],
    [12, 'start', '/imports/'],
    [20, 'start', '/'],
    [20, 'start', '.'],

]);

function orderImports(imports) {
    return sortBy(sortBy(
        imports.map((decl) => [
            orderList.find((func) => func(decl.source.value) !== null)(decl.source.value),
            decl
        ]),
        (arr) => arr[1].source.value  // Sort by source string
    ), (arr) => arr[0])             // Sort by calculate order
        .map((arr) => arr[1]);
}

module.exports = {
    meta: {
        docs: {
            description: 'Sort imports',
            recommended: true,
        },
        fixable: "code"
    },

    create: function (context) {
        let imports = [];
        let done = false;

        function importsDone() {
            if (imports.length > 1) {
                let ordered = orderImports(imports);

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
    },
};
