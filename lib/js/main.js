(function(){
var tt = window.tt = window.tt || {};

tt.minutesInSeconds = function(time) { 
    return time * 60; 
}

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

    state.timer = new tt.TimerUI({ 
        id: "timer",
        alarmId: "alarm"
    });

    state.history = new tt.History({ id: "history", load: true });
    
    var startInterval = function(type) {
        var interval = tt.intervals[type];
        state.history.add(interval.label);
        
        return state.timer.start(interval.duration)
        .then(function(){ console.log("done"); })
        .catch(function(){ console.log("aborted"); });
    }

    $("#button-start").click(startInterval.bind(this, "work"));
    $("#short-break").click(startInterval.bind(this, "short"));
    $("#long-break").click(startInterval.bind(this, "long"));

    $("#interruption").click(function() { 
        state.history.add("Interruption");
    });

    $("#stop").click(function() {
        state.timer.stop();
        state.history.add("Stop");
    });
};

$(document).ready(tt.main);

})();
