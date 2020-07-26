var boostrap = (function () {
    "use strict"
    const {createElement, useState, useEffect} = React;

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
            work: 25 * minuteFactor,
            short: 5 * minuteFactor,
            long: 10 * minuteFactor,
            extralong: 30 * minuteFactor,
            stopped: null,
        },
        labels: {
            work: 'work',
            short: 'short break',
            long: 'long break',
            extralong: 'extra long break',
        },
        shortLabels: {
            work: "work",
            short: "short",
            long: "long",
            extralong: "long",
        }
    };
    
    function formatTime(value) {
        return (typeof value !== "number") ? value : min2(~~value / 60) + ":" + min2(~~value % 60);
    
        function min2(v) {
            v = "" + (~~v);
            return (v.length >= 2) ? v : ("0" + v);
        }
    }

    function Timer(props) {
        var className = (
            "timer"
            + (props.inFlow ? " in-flow" : "")
            + " " + props.state
        );

        var time = props.timeRemaining !== null ? formatTime(props.timeRemaining) : '';
        var stateLabel = props.state !== 'stopped' ? '(' + config.labels[props.state] + ')' : '';
        return createElement("div", {className}, time, " ", stateLabel);
    }

    function Controls(props) {
        return createElement(
            "div", {className: "controls"}, 
            createElement(
                "button", {onClick: handleTransition(null)}, "Next (", config.shortLabels[props.nextState], ")",
            ), 
            createElement(
                "button", {onClick: handleTransition('short')}, "Short break",
            ), 
            createElement(
                "button", {onClick: handleTransition('long')}, "Long break",
            ), 
            createElement(
                "button", {onClick: handleTransition('stopped')}, "Stop",
            ),
        );

        function handleTransition(nextState) {
            if (props.onTransition !== undefined) {
                return () => props.onTransition(nextState);
            }
            return () => null;
        }
    }

    function History(props) {
        const items = (props.items || []).map(
            (state, index) => React.createElement(
                "div", {key: ("" + state + ":" + index), className: 'history-item ' + state},
            )
        );
        return createElement("div", {className: "history"}, items);
    }

    function App() {
        const [appState, setAppState] = useState({
            nextState: 'work',
            position: null,
            timeRemaining: null,
            state: 'stopped',
            inFlow: false,
            lastTick: null,
            history: []
        });

        const updateFavIcon = useFavIconX();
        useTimer(tick);
        
        return createElement(
            "div", {className: "outer"}, 
            createElement("h1", null, "tomato timer"), 
            createElement(
                Timer, 
                {
                    inFlow: appState.inFlow, 
                    state: appState.state, 
                    timeRemaining: appState.timeRemaining,
                },
            ), 
            createElement(
                Controls, 
                {nextState: appState.nextState, onTransition: transition},
            ), 
            createElement(History, {items: appState.history}),
        );
            
        function transition(nextState) {
            // NOTE: the permission must be requested from an event handler
            if (window.Notification && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            setAppState(stateTransition(config, appState, nextState));
        }

        function tick() {
            if (appState.timeRemaining == null) {
                updateFavIcon(100);
                return;
            }
            
            // TODO: use now - started to get compute timeRemaining, instead of counting down
            var now = +new Date();
            var delta = appState.lastTick !== null ? (now - appState.lastTick) / 1000 : 0.250;
            var nextTimeRemaining = Math.max(0, appState.timeRemaining - delta);
            var didFinish = appState.timeRemaining > 0 && nextTimeRemaining === 0;
            var duration = config.duration[appState.state];
            
            const update = {};
            update.lastTick = now;
            update.timeRemaining = nextTimeRemaining;

            setAppState(Object.assign({}, appState, update));
            updateFavIcon(100 * (1 - nextTimeRemaining / duration));

            if (didFinish) {
                postNotification(appState.state, appState.nextState, transition);
            }
        }
    }

    // TOOD: clean up meaning between app state and pomodoro state 
    // TODO: document the implementation
    function stateTransition(config, appState, nextState) {
        const newPosition = (appState.position !== null) ? (appState.position + 1) % config.sequence.length : 0;
        const newState = nextState !== null ? nextState : config.sequence[newPosition];
        const update = {};

        if (config.sequence[newPosition] === newState) {
            update.inFlow = true;
            update.nextState = config.sequence[(newPosition + 1) % config.sequence.length];
            update.position = newPosition;
        } else {
            update.inFlow = false;
            update.position = null;
            update.nextState = 'work';
        } 
        
        // use small negative offset to remove jitter in display
        update.timeRemaining = config.duration[newState];
        update.timeRemaining = update.timeRemaining !== null ? update.timeRemaining - 0.1 : null;

        update.state = newState;
        update.lastTick = +new Date();

        // clear the history when the timer is stopped
        update.history = (nextState == "stopped") ? [] : [newState].concat(appState.history).slice(0, 100);

        return Object.assign({}, appState, update);
    }

    // custom effect handlers
    function useTimer(tick) {
        useEffect(() => {
            const intervalId = window.setInterval(tick, 250);
            return () => window.clearInterval(intervalId);
        })
    }

    function useFavIconX() {
        useState(() => {
            window.FavIconX.config({
                updateTitle: false,
                titleRenderer: (_, t) => t,
                borderColor: '#222',
                borderWidth: 1,
                shadowColor: '#EEEEEE',
                fillColor: '#C00E0E',
                fillColor2: '#4E4EB0'
            });
        });
        return (value) => {
            window.FavIconX.setValue(value)
        };
    }

    function postNotification(state, nextState, transition) {
        var title = "Finished " + state;
        var body = "Click to continue with " + nextState;
        var timeout = 60;
        var notification = new Notification(title, {body});
        notification.addEventListener("click", ev => {
            ev.preventDefault();
            notification.close();
            transition(null);
        });
        window.setTimeout(notification.close.bind(notification), 1000 * timeout);
    }

    return function boostrap() {
        ReactDOM.render(
            React.createElement(App, null, null),
            document.getElementById('root'),
        );
    };
})();

boostrap()
