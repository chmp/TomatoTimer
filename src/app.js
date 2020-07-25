var boostrap = (function () {
    "use strict"

    // set to 1 for debugging
    var minuteFactor = 60;
    var config = {
        sequence: [
            'work', 'short',
            'work', 'short',
            'work', 'short',
            'work', 'long',

            'work', 'short',
            'work', 'short',
            'work', 'short',
            'work', 'extralong',
        ],
        duration: {
            'work': 25 * minuteFactor,
            'short': 5 * minuteFactor,
            'long': 10 * minuteFactor,
            'extralong': 30 * minuteFactor,
            'stopped': null,
        },
        labels: {
            work: 'work',
            short: 'short break',
            long: 'long break',
            extralong: 'extra long break',
        }
    };

    
    function formatTime(value) {
        return (typeof value !== "number") ? value : min2(~~value / 60) + ":" + min2(~~value % 60);
    
        function min2(v) {
            v = "" + (~~v);
            return (v.length >= 2) ? v : ("0" + v);
        }
    }

    class Timer extends React.Component {
        render() {
            var className = "timer";

            if (this.props.inFlow) {
                className += ' in-flow';
            }

            className += ' ' + this.props.state;
            var time = this.props.timeRemaining !== null ? formatTime(this.props.timeRemaining) : '';
            var stateLabel = this.props.state !== 'stopped' ? '(' + config.labels[this.props.state] + ')' : '';
            return React.createElement("div", {className}, time, " ", stateLabel);
        }
    }

    class Controls extends React.Component {
        render() {
            return React.createElement(
                "div", {className: "controls"}, 
                React.createElement(
                    "button", {onClick: this.handleTransition.bind(this, null)}, "Next (", this.props.nextState, ")",
                ), 
                React.createElement(
                    "button", {onClick: this.handleTransition.bind(this, 'short')}, "Short break",
                ), 
                React.createElement(
                    "button", {onClick: this.handleTransition.bind(this, 'long')}, "Long break",
                ), 
                React.createElement(
                    "button", {onClick: this.handleTransition.bind(this, 'stopped')}, "Stop",
                ),
            );
        }

        handleTransition(nextState) {
            if (this.props.onTransition !== undefined) {
                this.props.onTransition(nextState);
            }
        }
    }

    class History extends React.Component {
        constructor(props) {
            super(props);
            this.key = 0;
        }

        render() {
            // TODO: fix keys to prevent re-render of history items
            var items = (this.props.items || []).map(
                state => React.createElement(
                    "div", {key: this.key++, className: 'history-item ' + state},
                )
            );
            return React.createElement("div", {className: "history"}, items);
        }

    }

    class App extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                nextState: 'work',
                position: null,
                timeRemaining: null,
                state: 'stopped',
                inFlow: false,
                lastTick: null,
                history: []
            };
        }

        componentDidMount() {
            this.intervalId = window.setInterval(this.tick.bind(this), 250); // ask for permission

            if (window.Notification && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            window.FavIconX.config({
                updateTitle: false,
                titleRenderer: function (v, t) {
                    return t;
                },
                borderColor: '#222',
                borderWidth: 1,
                shadowColor: '#EEEEEE',
                fillColor: '#C00E0E',
                fillColor2: '#4E4EB0'
            }); // document why set state seems to be ok here

            var history = localStorage.getItem('tt-history');
            history = history !== null ? JSON.parse(history) : [];
            this.setState({
                history: history
            });

            this.saveHistory = () => localStorage.setItem('tt-history', JSON.stringify(this.state.history));

            window.addEventListener('beforeunload', this.saveHistory);
        }

        componentWillUnmount() {
            window.clearInterval(this.intervalId);
            window.removeEventListener('beforeunload', this.saveHistory);
            this.saveHistory();
        }

        render() {
            return React.createElement(
                "div", {className: "outer"}, 
                React.createElement("h1", null, "tomato timer"), 
                React.createElement(
                    Timer, 
                    {
                        inFlow: this.state.inFlow, 
                        state: this.state.state, 
                        timeRemaining: this.state.timeRemaining,
                    },
                ), 
                React.createElement(
                    Controls, 
                    {nextState: this.state.nextState, onTransition: this.transition.bind(this)},
                ), 
                React.createElement(History, {items: this.state.history}),
            );
        }

        transition(nextState) {
            var nextPosition = this.state.position !== null ? this.state.position + 1 : 0;
            nextPosition = nextPosition % config.sequence.length;

            if (nextState === null) {
                nextState = config.sequence[nextPosition];
            }

            var inFlow, stateAfterNext;

            if (config.sequence[nextPosition] === nextState) {
                inFlow = true;
                stateAfterNext = config.sequence[(nextPosition + 1) % config.sequence.length];
            } else {
                inFlow = false;
                nextPosition = null;
                stateAfterNext = 'work';
            } 
            // use small offset to remove jitter in display
            var duration = config.duration[nextState];
            duration = duration !== null ? duration - 0.1 : null;

            // clear the history when the timer is stopped
            var nextHistory = (nextState == "stopped") ? [] : [nextState].concat(this.state.history).slice(0, 100);
            
            this.setState({
                inFlow: inFlow,
                state: nextState,
                nextState: stateAfterNext,
                timeRemaining: duration,
                position: nextPosition,
                lastTick: +new Date(),
                history: nextHistory
            });
        }

        tick() {
            if (this.state.timeRemaining == null) {
                window.FavIconX.setValue(100);
                return;
            }

            var now = +new Date();
            var delta = this.state.lastTick !== null ? (now - this.state.lastTick) / 1000 : 0.250;
            var nextTimeRemaining = Math.max(0, this.state.timeRemaining - delta);
            var didFinish = this.state.timeRemaining > 0 && nextTimeRemaining === 0;
            var duration = config.duration[this.state.state];
            this.setState({
                lastTick: now,
                timeRemaining: nextTimeRemaining
            });
            window.FavIconX.setValue(100 * (1 - nextTimeRemaining / duration));

            if (didFinish) {
                this.postNotification();
            }
        }

        postNotification() {
            var title = "Finished " + this.state.state;
            var body = "Click to continue with " + this.state.nextState;
            var timeout = 60;
            var notification = new Notification(title, {
                body: body
            });
            notification.addEventListener("click", function (ev) {
                ev.preventDefault();
                notification.close();
                this.transition(null);
            }.bind(this));
            window.setTimeout(notification.close.bind(notification), 1000 * timeout);
        }
    }

    return function boostrap() {
        ReactDOM.render(
            React.createElement(App, null, null),
            document.getElementById('root'),
        );
    };
})();

boostrap()
