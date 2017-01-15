(function(){
"use strict";
var tt = window.tt = window.tt || {};

tt.minutesInSeconds = function(time) {
    return time * 60.;
}

tt.notificationTimeout = 15;

tt.titlePrefix = "tomato timer"


tt.loadSettings = function() {
    var settings = localStorage.getItem('settings');
    if(settings == null) {
        console.log('load default settings');
        settings = tt.defaultSettings();
    }
    else {
        console.log('load settings', settings);
        settings = JSON.parse(settings);
    }

    tt.flowStates = settings.flowStates;
    tt.intervals = settings.intervals;
}

tt.saveSettings = function() {
    var settings = JSON.stringify({
        flowStates: tt.flowStates,
        intervals: tt.intervals,
    });
    console.log('store settings', settings);
    localStorage.setItem('settings', settings);
}

tt.defaultSettings = function(){
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
                duration: tt.minutesInSeconds(25),
            },

            short: {
                label: "Short break",
                duration: tt.minutesInSeconds(5),
            },
            long: {
                label: "Long break",
                duration: tt.minutesInSeconds(15)
            },
        },
    };
}

})();

