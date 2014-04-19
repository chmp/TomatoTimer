(function(){
var tt = window.tt = window.tt || {};

tt.minutesInSeconds = function(time) { 
    return time * 60.; 
}

tt.notificationTimeout = 15;

tt.flowStates = [
    "work", "short", 
    "work", "short", 
    "work", "short", 
    "work", "long" 
];

tt.intervals = {};
tt.intervals["work"] = {
    label: "Work",
    duration: tt.minutesInSeconds(25)
};

tt.intervals["short"] = {
    label: "Short break",
    duration: tt.minutesInSeconds(5)
}

tt.intervals["long"] = {
    label: "Long break",
    duration: tt.minutesInSeconds(15)
}

tt.main = function() 
{
    var state = tt.state = {};
    
    state.history = new tt.History({ id: "history", load: true });
    state.notifications = new tt.Notifications();

    state.flow = new tt.FlowMachine({ states: tt.flowStates });

    state.timer = new tt.TimerUI({ 
        id: "timer",
        alarmId: "alarm"
    });
    
    state.notifications.requestPermission()
    .then(function() {
        state.history.add("Got notification permission");
    })
    .catch(function(e) {
        state.history.add("Could not request notification permission: " + e);
    });
    
    var startInterval = function(type) {
        var interval = tt.intervals[type];
        state.history.add(interval.label);

        updateFlowState(state.flow.goto(type));

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

    $("#button-start").click(startInterval.bind(this, "work"));
    $("#short-break").click(startInterval.bind(this, "short"));
    $("#long-break").click(startInterval.bind(this, "long"));

    $("#interruption").click(function() { 
        state.history.add("Interruption");
    });

    $("#stop").click(function() {
        state.timer.stop();
        state.flow.reset();
        state.history.add("Stop");
    });
    
    // TODO: replace flow state update function with a callback
    function updateFlowState() {
        var isInFlow = state.flow.isInFlow();
        
        if(isInFlow) {
            $('#timer').addClass("in-flow");
        } 
        else {
            $('#timer').removeClass("in-flow");
        }
    }
};

$(document).ready(tt.main);

})();
