(function(){
var tt = window.tt = window.tt || {};

/**
 * A timer which allows to enqueue a time out and gives a promise
 */
tt.Timer = function(desc) 
{
    this.refreshRate = desc.refreshRate || 250;
    this.interval = null;
    this.end = NaN;
    this.timingApi = desc.timingApi || window;
    
    if(this.onStateChange === undefined) {
        this.onStateChange = function() {};
    }
}

tt.Timer.prototype = new tt.TimeAccess();

tt.Timer.prototype.start = function(interval)
{   
    if(!this.isTicking()) {
        this.startTicking();
    }

    if(this.isRunning()) {
        this.emitState("stop");
    }

    this.end = this.now() + interval;
    this.emitState("start", interval);
}

tt.Timer.prototype.stop = function() 
{
    this.stopTicking();
    this.end = NaN;
    this.emitState("stop");
}

tt.Timer.prototype.tick = function() 
{
    var remaining = this.end - this.now();

    if(remaining <= 0) {
        this.end = NaN;
        this.stopTicking();
        this.emitState("done");
    } else if (Number.isFinite(remaining)) {
        this.emitState("running", remaining);
    }
}

tt.Timer.prototype.emitState = function() {
    this.onStateChange.apply(this, arguments);
}

tt.Timer.prototype.isRunning = function() {
    return Number.isFinite(this.end);
}

tt.Timer.prototype.isTicking = function() {
    return this.interval !== null;
}

tt.Timer.prototype.startTicking = function() {
    if(!this.isTicking()) {
        this.interval = this.timingApi.setInterval(this.tick.bind(this), 
            this.refreshRate);
    }
}

tt.Timer.prototype.stopTicking = function() {
    if(this.isTicking()) {
        this.timingApi.clearInterval(this.interval);
        this.interval = null;
    }
}

})();

