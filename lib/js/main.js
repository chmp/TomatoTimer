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
    this.hasPermission =
        window.Notification &&
        (window.Notification.permission === "granted");
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

    var notification = new Notification(title, {
        body: body
    });

    notification.addEventListener("click", function() {
        notification.close();
        d.resolve();
    });
    notification.addEventListener("close", reject(d, new Error("closed")));
    notification.addEventListener("error", reject(d, new Error("error")));

    if(timeout) {
        window.setTimeout(notification.close.bind(notification), timeoutInMilliseconds(timeout));
    }

    return d.promise;

    function timeoutInMilliseconds(t) {
        return 1000 * t;
    }
}

tt.History = function(desc)
{
    this.id = desc.id;
    this.load = (desc.load !== undefined) ? desc.load : true;
    this.loadKey = desc.loadKey || "tomato-timer-history";
    this.limit = desc.limit || 10;
    this.history = [];
    this._attach();
};

tt.History.prototype._attach = function()
{
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }

    var _this = this;
    if(this.load) {
        this.loadHistory();

        $(window).on("unload", function(){
            _this.saveHistory();
        });
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
    var hist = JSON.stringify(this.history);
    localStorage.setItem(this.loadKey, hist);
};

tt.History.prototype.add = function(text, time) {
    this.addItem(text, time);
    this.limitItemsTo(this.limit);
};

tt.History.prototype.addItem = function(text, time)
{
    time = time || nowComponents();
    this.history.push([time, text]);
    this.$element.prepend($('<div></div>')
        .text(this.formatTimeComponents(time) + ' - ' + text));
};

tt.History.prototype.formatTimeComponents = function(time)
{
    return time[1] + "." +
           time[2] + ". " +
           time[3] + ":" +
           time[4];
};

tt.History.prototype.limitItemsTo = function(limit)
{
    this.$element.children().slice(limit).remove();
};

/**
 * A timer which allows to enqueue a time out and gives a promise
 */
tt.TimerUI = function(desc) {
    this.refreshRate = desc.refreshRate || 250;
    this.interval = null;
    this.duration = NaN;
    this.end = NaN;
    this.timingApi = desc.timingApi || window;

    if(this.onStateChange === undefined) {
        this.onStateChange = function() {};
    }
    
    this.createNewPromise();

    this.id = desc.id;
    this.alarmId = desc.alarmId;
    this.jQuery = desc.jQuery || window.jQuery;

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
        this.interval = this.timingApi.setInterval(this.tick.bind(this),
            this.refreshRate);
    }
}

tt.TimerUI.prototype.stopTicking = function() {
    if(this.isTicking()) {
        this.timingApi.clearInterval(this.interval);
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
    if(type == "done") {
        this.deferred.resolve();
    }
    else if(type == "stop") {
        this.deferred.reject();
    }

    if((type == "start") || (type == "running")) {
        this.setMessage("running", remaining);
    }
    else if(type == "stop") {
        this.setMessage("stopped", "Stopped");
    }
    else if(type == "done") {
        this.setMessage("done", 0);
    }
}

tt.TimerUI.prototype.setMessage = function(klass, value) {
    var text = this.formatValue(value, {separator: " : "});
    this.$element
        .removeClass("running stopped done")
        .addClass(klass)
        .text(text);

    if(typeof value === "number") {
        FavIconX.setValue(100 * (1.0 - value / (this.duration || value)));
    }
    else {
        FavIconX.setValue(100);
    }

    var lessAccurateText = this.formatValue(value, {accuracy: 10.0});
    document.title = lessAccurateText + " - tomato timer";
};

tt.TimerUI.prototype.formatValue = function(value, opts) {
    opts = opts || {};
    var accuracy = opts.accuracy || 1.0;
    var separator = opts.separator || ":";

    var seconds;
    if(typeof value === "number") {
        value = Math.ceil(value / accuracy) * accuracy;
        return min2(value / 60) + separator + min2(value % 60);
    }
    return value;

    function min2(v) {
        v = "" + (~~v);
        return (v.length >= 2) ? v : ("0" + v);
    }
};

tt.main = function() {
    var state = tt.state = {};

    FavIconX.config({
        updateTitle: false,
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
        state.history = new tt.History({ id: "history", load: true });
        state.notifications = new tt.Notifications();
        state.timer = new tt.TimerUI({
            id: "timer",
            alarmId: "alarm"
        });

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

function resolve(d, value) {
    return d.resolve.bind(d, value);
}

function reject(d, reason) {
    return d.reject.bind(d, reason);
}

})();
