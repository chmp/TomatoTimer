(function() {
var tt = window.tt = window.tt || {};

tt.TimerUI = function(desc) {
    this.parent.call(this, desc);

    this.id = desc.id;
    this.alarmId = desc.alarmId;
    this.jQuery = desc.jQuery || window.jQuery;
    
    this._attach();
}

tt.TimerUI.prototype = Object.create(tt.Timer.prototype);
tt.TimerUI.prototype.parent = tt.Timer;

tt.TimerUI.prototype._attach = function() {
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }
    this.stop();
}

tt.TimerUI.prototype.start = function(interval) {
    // jump forward in time to prevent sudden jump
    this.parent.prototype.start.call(this, interval - 0.1);
}

tt.TimerUI.prototype.onStateChange = function(type, remaining) {
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
    var text = this.formatValue(value);
    this.$element.removeClass().addClass(klass).text(text);
};

tt.TimerUI.prototype.formatValue = function(value) 
{
    var min2 = function(v) 
    { 
        v = "" + (~~v);
        return (v.length >= 2) ? v : ("0" + v); 
    }

    if(typeof value === "number") {
        value = ~~value;
        return min2(value / 60) + " : " + min2(value % 60);
    }
    return value;
};

})();
