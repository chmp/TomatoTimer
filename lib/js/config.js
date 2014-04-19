(function(){
"use strict";
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

})();

