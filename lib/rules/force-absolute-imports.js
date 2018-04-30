const path = require('path');

module.exports = {
    meta: {
        docs: {
            description: 'Force local imports to have absolute paths',
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: 'string'
            }
        ]
    },

    create: function (context) {
        let root = context.options[0];
        if(root) {
            return {
                'ImportDeclaration': function (node) {
                    if (node.source.value.startsWith('.'))
                        context.report({
                            node: node,
                            message: 'Import source should be absolute path',
                            fix: (fixer) => {
                                let filename = context.getFilename();
                                let newSource = path.resolve(path.parse(filename).dir, node.source.value);
                                newSource = newSource.substring(newSource.indexOf(root) + root.length);
                                return fixer.replaceTextRange(node.source.range, '\'' + newSource + '\'');
                            }
                        });
                }
            };
        } else {
            return {};
        }
    },
};
