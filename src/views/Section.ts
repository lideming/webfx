import { Action, ObjectInit, objectInit } from "../lib/utils";
import { View } from "../lib/view";
import { IDOM, BuildDomExpr } from "../lib/buildDOM";
import { TextView } from "./Basics";


type SectionActionOptions = { text: string, onclick: Action<MouseEvent>; };

export class Section extends View {
    titleView = new TextView({ tag: 'span.section-title' });
    headerView = new View({
        tag: 'div.section-header',
        child: [
            this.titleView
        ]
    });
    constructor(arg?: { title?: string, content?: IDOM, actions?: SectionActionOptions[]; }) {
        super();
        this.ensureDom();
        if (arg) {
            if (arg.title) this.setTitle(arg.title);
            if (arg.content) this.setContent(arg.content);
            if (arg.actions) arg.actions.forEach(x => this.addAction(x));
        }
    }
    createDom(): BuildDomExpr {
        return {
            _ctx: this,
            tag: 'div.section',
            child: [
                this.headerView
            ]
        };
    }
    setTitle(text: string) {
        this.titleView.text = text;
    }
    setContent(view: IDOM) {
        var dom = this.dom;
        var firstChild = dom.firstChild;
        while (dom.lastChild !== firstChild) dom.removeChild(dom.lastChild!);
        dom.appendChild(view.getDOM());
    }
    addAction(arg: SectionAction | SectionActionOptions) {
        var view = arg instanceof View ?
            arg :
            new SectionAction({ text: arg.text, onActive: arg.onclick });
        this.headerView.dom.appendChild(view.dom);
    }
}

export class SectionAction extends TextView {
    constructor(init?: ObjectInit<SectionAction>) {
        super();
        objectInit(this, init);
    }
    createDom() {
        return {
            tag: 'div.section-action.clickable',
            tabIndex: 0
        }
    }
}
