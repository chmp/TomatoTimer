(function(){
"use strict";

var tt = window.tt = window.tt || {};

tt.notificationTimeout = 15;

tt.FlowMachine = function(desc) {
    this.states = desc.states || [];
    this.onStateChange = function() {};

    this.reset();
}

tt.FlowMachine.prototype.setStates = function(states) {
    this.states = states;
    this.reset();
}

tt.FlowMachine.prototype.isInFlow = function() {
    return (this.flowIndex !== undefined);
}

tt.FlowMachine.prototype.getCurrentState = function() {
    return this.currentState;
}

tt.FlowMachine.prototype.getNextState = function() {
    var nextFlowIndex = this._getNextFlowIndex();
    return this.states[nextFlowIndex];
}

tt.FlowMachine.prototype.continue = function() {
    this.flowIndex = this._getNextFlowIndex();
    this.currentState = this.states[this.flowIndex];
    this.onStateChange();
}

tt.FlowMachine.prototype.goto = function(state) {
    this.currentState = state;

    if(state == this.getNextState()) {
        this.flowIndex = this._getNextFlowIndex();
    }
    else {
        this.flowIndex = undefined;
    }
    this.onStateChange();
}

tt.FlowMachine.prototype.reset = function() {
    this.currentState = undefined;
    this.flowIndex = undefined;
    this.onStateChange();
}

tt.FlowMachine.prototype._getNextFlowIndex = function() {
    if(this.flowIndex === undefined) {
        return 0;
    }
    else {
        return (this.flowIndex + 1) % this.states.length;
    }
}

tt.Notifications = function() {
    this.hasPermission = window.Notification && (window.Notification.permission == "granted");
}

tt.Notifications.prototype.requestPermission = function() {
    return requestNotification()
    .then(function() {
        this.hasPermission = true;
    }.bind(this));
}

tt.Notifications.prototype.post = function(desc) {
    var d = Q.defer();

    if(!this.hasPermission) {
        d.reject(new Error("has not permission"));
        return d.promise;
    }

    var title = desc.title || "tt.Notication";
    var body = desc.body || "";
    var timeout = desc.timeout;

    var notification = new Notification(title, {body: body});
    notification.addEventListener("click", function() {
        notification.close();
        d.resolve();
    });
    notification.addEventListener("close", d.reject.bind(d, new Error("closed")));
    notification.addEventListener("error", d.reject.bind(d, new Error("error")));

    if(timeout) {
        window.setTimeout(notification.close.bind(notification), 1000 * timeout);
    }

    return d.promise;
}

tt.History = function(desc) {
    this.id = desc.id;
    this.load = (desc.load !== undefined) ? desc.load : true;
    this.loadKey = desc.loadKey || "tomato-timer-history";
    this.limit = desc.limit || 10;
    this.history = [];
    this._attach();
};

tt.History.prototype._attach = function() {
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }

    if(this.load) {
        this.loadHistory();
        $(window).on("unload", this.saveHistory.bind(this));
   }
};

tt.History.prototype.loadHistory = function() {
    var hist = localStorage.getItem(this.loadKey);

    if(hist !== null) {
        JSON.parse(hist).forEach(function(item) {
            this.add(item[1], item[0]);
        }, this);
    }
};

tt.History.prototype.saveHistory = function() {
    localStorage.setItem(this.loadKey, JSON.stringify(this.history));
};

tt.History.prototype.add = function(text, time) {
    time = time || nowComponents();
    var timeStr = time[1] + "." + time[2] + ". " + time[3] + ":" + time[4];
    
    this.history.push([time, text]);
    this.$element.prepend($('<div></div>').text(timeStr + ' - ' + text));
    this.$element.children().slice(this.limit).remove();
};

/**
 * A timer which allows to enqueue a time out and gives a promise
 */
tt.TimerUI = function(desc) {
    this.refreshRate = desc.refreshRate || 250;
    this.id = desc.id;
    this.jQuery = desc.jQuery || window.jQuery;

    this.interval = null;
    this.duration = NaN;
    this.end = NaN;

    if(this.onStateChange === undefined) {
        this.onStateChange = function() {};
    }
    
    this.createNewPromise();

    this._attach();
}

tt.TimerUI.prototype.start = function(interval) {
    if(!this.isTicking()) {
        this.startTicking();
    }

    if(this.isRunning()) {
        this.emitState("stop");
    }

    // jump forward in time to prevent sudden jump
    interval = interval - 0.1;
    this.duration = interval;
    this.end = now() + interval;
    this.emitState("start", interval);
    
    return this.createNewPromise();
}

tt.TimerUI.prototype.stop = function() {
    this.stopTicking();
    this.end = NaN;
    this.emitState("stop");
}

tt.TimerUI.prototype.getRemaining = function() {
    return this.end - now();
}

tt.TimerUI.prototype.tick = function() {
    var remaining = this.getRemaining();

    if(remaining <= 0) {
        this.end = NaN;
        this.stopTicking();
        this.emitState("done");
    } else if (Number.isFinite(remaining)) {
        this.emitState("running", remaining);
    }
}

tt.TimerUI.prototype.emitState = function() {
    this.onStateChange.apply(this, arguments);
}

tt.TimerUI.prototype.isRunning = function() {
    return Number.isFinite(this.end);
}

tt.TimerUI.prototype.isTicking = function() {
    return this.interval !== null;
}

tt.TimerUI.prototype.startTicking = function() {
    if(!this.isTicking()) {
        this.interval = setInterval(this.tick.bind(this), this.refreshRate);
    }
}

tt.TimerUI.prototype.stopTicking = function() {
    if(this.isTicking()) {
        clearInterval(this.interval);
        this.interval = null;
    }
}

tt.TimerUI.prototype.createNewPromise = function() {
    this.deferred = Q.defer();
    return this.deferred.promise;
}

tt.TimerUI.prototype._attach = function() {
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }
    this.stop();
}

tt.TimerUI.prototype.onStateChange = function(type, remaining) {
    if((type == "start") || (type == "running")) {
        this.setMessage("running", remaining);
    }
    else if(type == "stop") {
        this.deferred.reject();
        this.setMessage("stopped", "Stopped");
    }
    else if(type == "done") {
        this.deferred.resolve();
        this.setMessage("done", 0);
    }
}

tt.TimerUI.prototype.setMessage = function(klass, value) {
    this.$element
        .removeClass("running stopped done")
        .addClass(klass)
        .text(this.formatValue(value));

    FavIconX.setValue((typeof value !== "number") ? 100 :  100 * (1.0 - value / (this.duration || value)));
};

tt.TimerUI.prototype.formatValue = function(value, opts) {
    return (typeof value !== "number") ? value : min2(~~value / 60) + ":" + min2(~~value % 60);
    
    function min2(v) {
        v = "" + (~~v);
        return (v.length >= 2) ? v : ("0" + v);
    }
};

tt.main = function() {
    var state = tt.state = {};

    FavIconX.config({
        updateTitle: false,
        titleRenderer: function(v, t) { return t; },
        borderColor: '#222',
        borderWidth: 1,
        shadowColor: '#EEEEEE',
        fillColor: '#C00E0E',
        fillColor2: '#4E4EB0',
    });
    initComponents();
    requestPermissions();
    bindHandlers();

    function initComponents() {
        state.history = new tt.History({id: "history", load: true});
        state.notifications = new tt.Notifications();
        state.timer = new tt.TimerUI({id: "timer"});

        // note settings are access below
        tt.state.history.add('load preferences');
        loadSettings();

        state.flow = new tt.FlowMachine({ states: tt.flowStates });
        state.flow.onStateChange = function() {
            if(this.isInFlow()) {
                $('#timer').addClass("in-flow");
            }
            else {
                $('#timer').removeClass("in-flow");
            }
        }

        $('#options').hide();

        $('#flow-states').attr('value', tt.flowStates.join(' '));
        $('#interval-work').attr('value', tt.intervals['work']['duration'] / 60);
        $('#interval-short').attr('value', tt.intervals['short']['duration'] / 60);
        $('#interval-long').attr('value', tt.intervals['long']['duration'] / 60);
    }

    function requestPermissions() {
        state.notifications.requestPermission()
        .then(function() {
            state.history.add("Got notification permission");
        })
        .catch(function(e) {
            state.history.add("Could not request notification permission: " + e);
        });
    }

    function bindHandlers() {
        $("#button-start").click(startInterval.bind(this, "work"));
        $("#short-break").click(startInterval.bind(this, "short"));
        $("#long-break").click(startInterval.bind(this, "long"));
        $("#stop").click(function() {
            state.timer.stop();
            state.flow.reset();
            state.history.add("Stop");
        });

        $('#configure').click(function() {
            $('#options').toggle();
        });

        $('#save').click(function() {
            tt.flowStates = $('#flow-states').val().split(/\s+/);

            tt.intervals['work']['duration'] = minutesInSeconds(parseInt($('#interval-work').val()));
            tt.intervals['short']['duration'] = minutesInSeconds(parseInt($('#interval-short').val()));
            tt.intervals['long']['duration'] = minutesInSeconds(parseInt($('#interval-long').val()));

            state.history.add('save preferences');
            saveSettings();

            state.flow.setStates(tt.flowStates);
            state.timer.stop();

            $('#options').hide();
        });
    }

    function startInterval(type) {
        console.log('start interval', type);

        var interval = tt.intervals[type];
        state.history.add(interval.label);
        state.flow.goto(type);

        return state.timer.start(interval.duration)
        .then(function(){
            return state.notifications.post({
                title: "Finished " + type,
                body: "Click to continue with " + state.flow.getNextState(),
                timeout: tt.notificationTimeout
            });
        })
        .then(function() {
            startInterval(state.flow.getNextState());
        },
        function(){
            console.log("abort timer");
        })
        .catch(console.error.bind(console));
    }
}

function loadSettings() {
    var settings = localStorage.getItem('settings');
    if(settings == null) {
        console.log('load default settings');
        settings = defaultSettings();
    }
    else {
        console.log('load settings', settings);
        settings = JSON.parse(settings);
    }

    tt.flowStates = settings.flowStates;
    tt.intervals = settings.intervals;
}

function saveSettings() {
    var settings = JSON.stringify({
        flowStates: tt.flowStates,
        intervals: tt.intervals,
    });
    console.log('store settings', settings);
    localStorage.setItem('settings', settings);
}

function defaultSettings(){
    return {
        flowStates: [
                "work", "short",
                "work", "short",
                "work", "short",
                "work", "long"
            ],
        intervals: {
            work: {
                label: "Work",
                duration: minutesInSeconds(25),
            },

            short: {
                label: "Short break",
                duration: minutesInSeconds(5),
            },
            long: {
                label: "Long break",
                duration: minutesInSeconds(15)
            },
        },
    };
}


function minutesInSeconds(time) {
    return time * 60.;
}

function now() {
    return new Date().getTime() / 1000;
}

function nowComponents() {
    var date = new Date();
    return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ];
}

/**
 * Request the permission to post notifications
 *
 * copied from https://developer.mozilla.org/en-US/docs/Web/API/Notification
 *
 * @return promise on successful request
 */
function requestNotification() {
    var d = Q.defer();

    if (!("Notification" in window)) {
        d.reject(new Error("NotificationAPI not supported"));
    }
    else if (Notification.permission === "granted") {
        d.resolve();
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {

            // store result
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }

            if (permission === "granted") {
                d.resolve();
            }
            else {
                d.reject(new Error("Notification: did not obtain permission"));
            }
        });
    }
    else {
        d.reject(new Error("Notification: did not obtain permission"));
    }

    return d.promise;
}

})();
