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
        if (node.children.length < 2) {
            throw '<let> expects at least two arguments: <let><v/><e/></let>';
        }

        if (node.children[0].tagName !== 'V') {
            throw 'first argument of <let> is expected to be <v>';
        }

        let varName = node.children[0].innerHTML.trim();
        scope.names[varName] = evalNode(node.children[1], scope);
    } break;

    case 'SET': {
        if (node.children.length < 2) {
            throw '<set> expects at least two argument: <set><v/><e/></set>';
        }

        if (node.children[0].tagName != 'V') {
            throw 'first argument of <set> is expected to be <v>';
        }

        let varName = node.children[0].innerHTML.trim();
        let s = scopeLookup(scope, varName);
        if (s) {
            s.names[varName] = evalNode(node.children[1], scope);
        } else {
            throw `<set> could not assign variable ${varName} because it was not defined in this scope`;
        }
    } break;

    case 'FOR': {
        if (node.children.length < 3) {
            throw '<for> expects at least 3 arguments: <for><v/><e/><e/> ... </for>';
        }

        if (node.children[0].tagName === 'v') {
            throw 'first argument of <for> is expected to be <v>';
        }

        const varName = node.children[0].innerHTML.trim();
        const fromValue = evalNode(node.children[1], scope);
        const toValue = evalNode(node.children[2], scope);
        scope = newScope(scope);
        for (let varValue = fromValue; varValue <= toValue; ++varValue) {
            scope.names[varName] = varValue;
            for (let i = 3; i < node.children.length; ++i) {
                evalNode(node.children[i], scope);
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

    case 'S': {
        return node.innerText;
    }

    case 'N': {
        return parseInt(node.innerText);
    }

    case 'V': {
        let parts = node.innerText.split('.');
        let s = scopeLookup(scope, parts[0]);
        if (s) {
            let target = s.names[parts[0]];
            parts = parts.slice(1);

            for (let i = 0; i < parts.length; ++i) {
                if (target[parts[i]] === undefined) {
                    throw `Could not find ${node.innerText}`;
                }
                target = target[parts[i]];
            }

            return target;
        }
        return undefined;
    }

    case 'EQ': {
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

    case 'SUM': {
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

    case 'CALL': {
        let args = Array.from(node.children).map((child) => evalNode(child, scope));
        let parts = node.attributes['target'].value.split('.');

        let target = window;
        let s = scopeLookup(scope, parts[0]);
        if (s) {
            target = s.names[parts[0]];
            parts = parts.slice(1);
        }

        for (let i = 0; i < parts.length; ++i) {
            if (target[parts[i]] === undefined) {
                throw `Could not find ${node.attributes['target'].value}`;
            }

            if (i === parts.length - 1) {
                return target[parts[i]].bind(target)(...args);
            }

            target = target[parts[i]];
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
