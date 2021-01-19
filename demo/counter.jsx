
(function () {
    /** @jsx webfx.jsx */

    /** @type {import("../")} */
    const webfx = window.webfx;
    const { utils, View, Toast, ButtonView } = webfx;

    document.body.appendChild(webfx.buildDOM(
        <h2>JSX</h2>
    ));

    class CounterView2 extends View {
        constructor() {
            super();
            this.counter = 0;
        }
        createDom() {
            return <div class="counter card">
                You've click
                <div class="btn inline" onclick={() => this.updateWith({ counter: this.counter + 1 })}>
                    this button
                </div>
                for {() => this.counter} time{() => this.counter > 1 ? 's' : ''}.
            </div>;
        }
    }
    document.body.appendView(new CounterView2());

    document.body.appendView(new View(
        <div class="buttons card">
            <ButtonView onclick={() => Toast.show("This is a toast!", 3000)}>Show toast</ButtonView>
            <ButtonView onclick={(ev) => {
                var m = new webfx.ContextMenu();
                for (let i = 1; i <= 5; i++) {
                    m.add(new webfx.MenuItem({
                        text: 'Show toast ' + i, onclick: () => {
                            Toast.show(`This is toast ${i}!`, 3000);
                        }
                    }));
                }
                m.show({ ev });
            }}>Show context menu</ButtonView>
            <ButtonView onclick={(ev) => {
                var d = new webfx.Dialog();
                d.title = 'A dialog';
                d.addContent(new View(<p>Dialog content</p>));
                d.show(ev);
            }}>Show dialog</ButtonView>
        </div>));

    class TimeView extends View {
        createDom() {
            return <div class="time card">
                Current time: {() => new Date().toLocaleString()}
            </div>;
        }
        postCreateDom() {
            super.postCreateDom();
            setInterval(() => this.updateDom(), 500);
        }
    }
    document.body.appendView(new TimeView());

})();