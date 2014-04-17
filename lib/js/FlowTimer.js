(function() {
var tt = window.tt = window.tt || {};

tt.FlowTimer = function(desc) {
    tt.Timer.call(this, desc);
    this.createNewPromise();
}

tt.FlowTimer.prototype = Object.create(tt.Timer.prototype);

tt.FlowTimer.prototype.start = function(interval) {
    tt.Timer.prototype.start.call(this, interval);
    return this.createNewPromise();
}

tt.FlowTimer.prototype.createNewPromise = function() {
    this.deferred = Q.defer();
    return this.deferred.promise;
}

tt.FlowTimer.prototype.onStateChange = function(state, remaining) {
    if(state == "done") {
        this.deferred.resolve();
    }
    else if(state == "stop") {
        this.deferred.reject();
    }
}

})();
