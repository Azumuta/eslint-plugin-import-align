/* eslint-disable */

const SOURCE_COLUMN_START = 45;
const spacingRegex = /[^\s](\s)+}/;

// Get whitespace length before last curly brace of import statement;
// >> import { Meteor   } from 'meteor';
//                  >---<
function getWhitespace(statement) {
    let match = statement.match(spacingRegex);
    if (match) {
        return (match[0].length - 2) + 1;
    }
    return 1;
}

function importFixer(imports, sourceStartColumns, sourceCode) {

    // First column ends after specifiers or after import if no specifiers
    let firstColumnEnds = imports.map(decl => {
        if (decl.specifiers.length === 0) {
            return 'import'.length;
        } else {
            let lastSpecifier = decl.specifiers[decl.specifiers.length - 1];
            let start = lastSpecifier.loc.end.column;

            return start
                + (lastSpecifier.type === 'ImportSpecifier' ? getWhitespace(sourceCode.getText(decl)) : 0);
        }
    });

    // Second column starts before from or before source if no specifiers
    let secondColumnStarts = sourceStartColumns.map((oldValue, i) => {
        if (imports[i].specifiers.length > 0) {
            oldValue -= 'from '.length;
        }
        return oldValue;
    });

    // Spacing between first column end and second column start should change this much
    let deltas = sourceStartColumns.map(col => SOURCE_COLUMN_START - col);

    console.log('First column end   ', firstColumnEnds);
    console.log('Second column start', secondColumnStarts);


    return function* (fixer) {
        for (let i = 0; i < imports.length; i++) {

            let lineStart = imports[i].range[0];

            let oldSize = secondColumnStarts[i] - firstColumnEnds[i];
            let newSize = oldSize + deltas[i];

            let oldRange = [
                lineStart + firstColumnEnds[i],
                lineStart + secondColumnStarts[i]
            ];

            yield fixer.replaceTextRange(oldRange, ' '.repeat(newSize));
        }
    }

}


module.exports = {
    meta: {
        docs: {
            description: 'Align \'from\' parts of imports',
            recommended: true,
        },
        fixable: "whitespace"
    },

    create: function (context) {
        let imports = [];
        let done = false;

        function importsDone() {

            const sourceStartColumns = imports.map(decl => decl.source.loc.start.column);
            console.log('Source start', sourceStartColumns);

            if (!sourceStartColumns.every((col, i) => {
                return col === SOURCE_COLUMN_START
            })) {
                context.report({
                    node: imports[0],
                    message: 'Imports not aligned correctly',
                    fix: importFixer(imports, sourceStartColumns, context.getSourceCode())
                });
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
