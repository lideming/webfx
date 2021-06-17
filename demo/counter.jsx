
(function () {
    /** @jsx webfx.jsx */

    /** @type {import("../")} */
    const webfx = window.webfx;
    const { View, Toast, ButtonView, jsxBuild } = webfx;

    document.body.appendChild(webfx.buildDOM(
        <h2>JSX</h2>
    ));

    class Card extends View {
        createDom() {
            return <div class={"card " + this.cardClass} />;
        }
    }
    class CounterView2 extends View {
        constructor() {
            super();
            this.counter = 0;
        }
        createDom() {
            return <Card cardClass="counter">
                You've click
                <div class="btn inline" onclick={() => this.updateWith({ counter: this.counter + 1 })}>
                    this button
                </div>
                for {() => this.counter} time{() => this.counter > 1 ? 's' : ''}.
            </Card>;
        }
    }
    webfx.appendView(document.body, new CounterView2());

    webfx.appendView(document.body, new View(
        <Card cardClass="buttons">
            <ButtonView onActive={() => Toast.show("This is a toast!", 3000)}>Show toast</ButtonView>
            <ButtonView onActive={(ev) => {
                var m = new webfx.ContextMenu();
                for (let i = 1; i <= 5; i++) {
                    m.add(new webfx.MenuItem({
                        text: 'Show toast ' + i, onActive: () => {
                            Toast.show(`This is toast ${i}!`, 3000);
                        }
                    }));
                }
                m.show({ ev });
            }}>Show context menu</ButtonView>
            <ButtonView onActive={(ev) => {
                var d = jsxBuild(
                    <webfx.Dialog>
                        <p>Dialog content</p>
                        <p>webfx version: {webfx.version}</p>
                    </webfx.Dialog>
                );
                d.show(ev);
            }}>Show dialog</ButtonView>
        </Card>));

    class TimeView extends View {
        createDom() {
            return <Card cardClass="time">
                Current time: {() => new Date().toLocaleString()}
            </Card>;
        }
        postCreateDom() {
            super.postCreateDom();
            setInterval(() => this.updateDom(), 500);
        }
    }
    webfx.appendView(document.body, new TimeView());

})();
