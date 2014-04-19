(function(){
"use strict";
var tt = window.tt = window.tt || {};

tt.FlowMachine = function(desc) {
    this.states = desc.states || [];
    this.currentState = undefined;
    this.flowIndex = undefined;
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
}

tt.FlowMachine.prototype.goto = function(state) {
    this.currentState = state;
    
    if(state == this.getNextState()) {
        this.flowIndex = this._getNextFlowIndex(); 
    }
    else {
        this.flowIndex = undefined;
    }
}

tt.FlowMachine.prototype._getNextFlowIndex = function() {
    if(this.flowIndex === undefined) {
        return 0; 
    }
    else {
        return (this.flowIndex + 1) % this.states.length;
    }
}

})();
