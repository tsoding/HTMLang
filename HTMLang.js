function evalNode(node, scope = {}) {
    switch (node.tagName) {
    case 'FOR': {
        const fromValue = parseInt(node.attributes['from'].value);
        const toValue = parseInt(node.attributes['to'].value);
        const varName = node.attributes['var'].value;
        for (let i = fromValue; i <= toValue; ++i) {
            let context = {};
            context[varName] = i;
            for (let forChild of node.children) {
                evalNode.bind(context)(forChild);
            }
        }
    } break;

    case 'COND': {
        for (let switchChild of node.children) {
            switch (switchChild.tagName) {
            case 'WHEN': {
                if (switchChild.children.length > 0) {
                    if (evalNode.bind(this)(switchChild.children[0])) {
                        for (let i = 1; i < switchChild.children.length; ++i) {
                            evalNode.bind(this)(switchChild.children[i]);
                        }
                        return undefined;
                    }
                } else {
                    throw '<case> requires at least one argument. The first argument is expected to be the condition';
                }
            } break;

            case 'ELSE': {
                for (let defaultChild of switchChild.children) {
                    evalNode.bind(this)(defaultChild);
                }
                return undefined;
            } break;

            default: {
                throw `Unsupported tag ${switchChild.tagName} inside of a switch construct`;
            }
            }
        }
    } break;

    case 'PRINT': {
        console.log(evalNode.bind(this)(node.children[0]));
    } break;

    case 'HTMLANG': {
        for (let htmlangChild of node.children) {
            evalNode.bind(this)(htmlangChild);
        }
    } break;

    case 'BLOCK': {
        for (let htmlangChild of node.children) {
            evalNode.bind(this)(htmlangChild);
        }
    } break;

    case 'STRING': {
        return node.innerText;
    } break;

    case 'NUMBER': {
        return parseInt(node.innerText);
    } break;

    case 'VAR': {
        return this[node.innerText];
    } break;

    case 'EQUALS': {
        if (node.children.length > 0) {
            const x = evalNode.bind(this)(node.children[0]);
            for (let i = 1; i < node.children.length; ++i) {
                if (x !== evalNode.bind(this)(node.children[i])) {
                    return false;
                }
            }

            return true;
        } else {
            throw '<equals> requires at least one argument';
        }
    } break;

    case 'MOD': {
        if (node.children.length > 0)  {
            let result = evalNode.bind(this)(node.children[0]);

            for (let i = 1; i < node.children.length; ++i) {
                result = result % evalNode.bind(this)(node.children[i]);
            }

            return result;
        } else {
            throw '<mod> requires at least one argument';
        }
    } break;

    default:
        throw `Unknown node '${node.tagName}'`;
    }
}

for (let htmlang of document.querySelectorAll("htmlang")) {
    evalNode(htmlang);
}
