"use strict";

function newScope(scope) {
    return {
        names: {},
        prev: scope,
    };
}

function popScope(scope) {
    return scope.prev;
}

function scopeLookup(scope, name) {
    while (scope && scope.names) {
        if (name in scope.names) {
            return scope;
        }
        scope = scope.prev;
    }
}

function evalNode(node, scope=newScope()) {
    switch (node.tagName) {
    case 'LET': {
        let varName = node.attributes['name'].value;
        scope.names[varName] = evalNode(node.children[0], scope);
    } break;

    case 'SET': {
        let varName = node.attributes['name'].value;
        let s = scopeLookup(scope, varName);
        if (s) {
            s.names[varName] = evalNode(node.children[0], scope);
        } else {
            throw `Could not assign variable ${varName} because it was not defined`;
        }
    } break;

    case 'FOR': {
        const fromValue = parseInt(node.attributes['from'].value);
        const toValue = parseInt(node.attributes['to'].value);
        const varName = node.attributes['var'].value;
        scope = newScope(scope);
        for (let varValue = fromValue; varValue <= toValue; ++varValue) {
            scope.names[varName] = varValue;
            for (let forChild of node.children) {
                evalNode(forChild, scope);
            }
        }
        scope = popScope(scope);
    } break;

    case 'COND': {
        for (let switchChild of node.children) {
            switch (switchChild.tagName) {
            case 'WHEN': {
                if (switchChild.children.length > 0) {
                    if (evalNode(switchChild.children[0], scope)) {
                        for (let whenChild of Array.from(switchChild.children).slice(1)) {
                            evalNode(whenChild, scope);
                        }
                        return undefined;
                    }
                } else {
                    throw '<case> requires at least one argument. The first argument is expected to be the condition';
                }
            } break;

            case 'ELSE': {
                for (let defaultChild of switchChild.children) {
                    evalNode(defaultChild, scope);
                }
                return undefined;
            }

            default: {
                throw `Unsupported tag ${switchChild.tagName} inside of a switch construct`;
            }
            }
        }
    } break;

    case 'PRINT': {
        console.log(evalNode(node.children[0], scope));
    } break;

    case 'HTMLANG': {
        for (let htmlangChild of node.children) {
            evalNode(htmlangChild, scope);
        }
    } break;

    case 'BLOCK': {
        for (let blockChild of node.children) {
            evalNode(blockChild, scope);
        }
    } break;

    case 'STRING': {
        return node.innerText;
    }

    case 'NUMBER': {
        return parseInt(node.innerText);
    }

    case 'VAR': {
        let s = scopeLookup(scope, node.innerText);
        return s ? s.names[node.innerText] : undefined;
    }

    case 'EQUALS': {
        if (node.children.length > 0) {
            const x = evalNode(node.children[0], scope);
            for (let equalsArg of Array.from(node.children).slice(1)) {
                if (x !== evalNode(equalsArg, scope)) {
                    return false;
                }
            }

            return true;
        } else {
            throw '<equals> requires at least one argument';
        }
    }

    case 'PLUS': {
        let result = 0;
        for (let plusArg of node.children) {
            result += evalNode(plusArg, scope);
        }
        return result;
    }

    case 'MOD': {
        if (node.children.length > 0)  {
            let result = evalNode(node.children[0], scope);

            for (let modArg of Array.from(node.children).slice(1)) {
                result = result % evalNode(modArg, scope);
            }

            return result;
        } else {
            throw '<mod> requires at least one argument';
        }
    }

    default:
        throw `Unknown node '${node.tagName}'`;
    }
}

(() => {
    for (let htmlang of document.querySelectorAll("htmlang")) {
        evalNode(htmlang);
    }
})();
