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

    case 'SWITCH': {
        for (let switchChild of node.children) {
            switch (switchChild.tagName) {
            case 'CASE': {
                const caseCondition = switchChild.attributes['condition'].value;
                if (eval(caseCondition)) {
                    for (let caseChild of switchChild.children) {
                        evalNode.bind(this)(caseChild);
                    }
                    return;
                }
            } break;

            case 'DEFAULT': {
                for (let defaultChild of switchChild.children) {
                    evalNode.bind(this)(defaultChild);
                }
                return;
            } break;

            default: {
                throw `Unsupported tag ${switchChild.tagName} inside of a switch construct`;
            }
            }
        }
    } break;

    case 'PRINT': {
        console.log(eval(node.attributes['message'].value));
    } break;

    case 'HTMLANG': {
        console.log(node);
        for (let htmlangChild of node.children) {
            evalNode.bind(this)(htmlangChild);
        }
    } break;

    default:
        throw `Unknown node '${node.tagName}'`;
    }
}

for (let htmlang of document.querySelectorAll("htmlang")) {
    evalNode(htmlang);
}
