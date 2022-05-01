import { Action, ObjectInit, objectInit } from "@yuuza/utils";
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
    content: View;
    constructor(arg?: { title?: BuildDomExpr, content?: BuildDomExpr, actions?: SectionActionOptions[]; }) {
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
            tag: 'div.section',
            child: [
                this.headerView
            ]
        };
    }
    setTitle(text: BuildDomExpr) {
        this.titleView.removeAllView();
        this.titleView.addChild(text);
    }
    setContent(view: BuildDomExpr) {
        if (this.content) this.removeView(this.content);
        this.content = View.getView(view);
        this.appendView(this.content);
    }
    addAction(arg: SectionAction | SectionActionOptions) {
        var view = arg instanceof View ?
            arg :
            new SectionAction({ text: arg.text, onActive: arg.onclick });
        this.headerView.appendView(view);
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
