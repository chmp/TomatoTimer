(function() {
var tt = window.tt = window.tt || {};

tt.TimerUI = function(desc) {
    tt.FlowTimer.call(this, desc);

    this.id = desc.id;
    this.alarmId = desc.alarmId;
    this.jQuery = desc.jQuery || window.jQuery;

    this._attach();
}

tt.TimerUI.prototype = Object.create(tt.FlowTimer.prototype);

tt.TimerUI.prototype._attach = function() {
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }
    this.stop();
}

tt.TimerUI.prototype.start = function(interval) {
    // jump forward in time to prevent sudden jump
    return tt.FlowTimer.prototype.start.call(this, interval - 0.1);
}

tt.TimerUI.prototype.onStateChange = function(type, remaining) {
    tt.FlowTimer.prototype.onStateChange.call(this, type, remaining);

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

tt.TimerUI.prototype.playAlarm = function() {
    if(this.alarmId) {
        document.getElementById(this.alarmId).play();
    }
}

tt.TimerUI.prototype.setMessage = function(klass, value)
{
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
    document.title = lessAccurateText + " - " + tt.titlePrefix;
 };

tt.TimerUI.prototype.formatValue = function(value, opts)  {
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

})();
