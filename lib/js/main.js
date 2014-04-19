(function(){
var tt = window.tt = window.tt || {};

tt.main = function() {
    var state = tt.state = {};
    
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

        state.flow = new tt.FlowMachine({ states: tt.flowStates });
        state.flow.onStateChange = function() {
            if(this.isInFlow()) {
                $('#timer').addClass("in-flow");
            } 
            else {
                $('#timer').removeClass("in-flow");
            }
        }
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

        $("#interruption").click(function() { 
            state.history.add("Interruption");
        });

        $("#stop").click(function() {
            state.timer.stop();
            state.flow.reset();
            state.history.add("Stop");
        });
    }
    
    function startInterval(type) {
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

$(document).ready(tt.main);

})();
