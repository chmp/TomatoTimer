test("new flow machine is not in flow", function(assert) {
    var flowMachine = newTestFlowMachine();
    assert.equal(flowMachine.isInFlow(), false);
});

test("new flow machine has not current state", function(assert) {
    var flowMachine = newTestFlowMachine();
    assert.strictEqual(flowMachine.getCurrentState(), undefined);
});

test("new flow machine next state is first state", function(assert) {
    var flowMachine = newTestFlowMachine();
    assert.equal(flowMachine.getNextState(), "work");
});

test("new flow machine continues to first state", function(assert) {
    var flowMachine = newTestFlowMachine(["continue"]);
    assert.equal(flowMachine.getCurrentState(), "work");
    assert.equal(flowMachine.isInFlow(), true);
});

test("new flow machine go to the state is in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work"]);
    assert.equal(flowMachine.getCurrentState(), "work");
    assert.equal(flowMachine.isInFlow(), true);
});

test("flow machine trackst next state", function(assert) {
    var flowMachine = newTestFlowMachine(["work"]);
    assert.equal(flowMachine.getNextState(), "short");
});

test("machine going through two correct states is in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short"]);
    assert.equal(flowMachine.getCurrentState(), "short");
    assert.equal(flowMachine.isInFlow(), true);
});

test("machine continues through correct states is in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "continue", "continue"]);
    assert.equal(flowMachine.getCurrentState(), "long");
    assert.equal(flowMachine.isInFlow(), true);
});

test("machine continues states periodically", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "continue", "continue", "continue", "continue"]);
    assert.equal(flowMachine.getCurrentState(), "short");
    assert.equal(flowMachine.isInFlow(), true);
});

test("machine going into correct state afer one period is still in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "continue", "continue", "continue", "short"]);
    assert.equal(flowMachine.getCurrentState(), "short");
    assert.equal(flowMachine.isInFlow(), true);
});

test("machine going into wrong state afer one period is not in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "continue", "continue", "continue", "work"]);
    assert.equal(flowMachine.getCurrentState(), "work");
    assert.equal(flowMachine.isInFlow(), false);
});

test("machine going into wrong  states is not in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "short"]);
    assert.equal(flowMachine.getCurrentState(), "short");
    assert.equal(flowMachine.isInFlow(), false);
});

test("machine continues to first state if not in flow", function(assert) {
    var flowMachine = newTestFlowMachine(["work", "short", "short", "continue"]);
    assert.equal(flowMachine.getCurrentState(), "work");
    assert.equal(flowMachine.isInFlow(), true);
});

test("new flow machine can go to any state", function(assert) {
    var flowMachine = newTestFlowMachine(["testState"]);
    assert.equal(flowMachine.getCurrentState(), "testState");
    assert.equal(flowMachine.isInFlow(), false);
});

function newTestFlowMachine(steps) {
    var flowMachine = new tt.FlowMachine({ states: ["work", "short", "work", "long"] });

    steps = steps || [];
    steps.forEach(function(step) {
        if(step == "continue") {
            flowMachine.continue();
        }
        else {
            flowMachine.goto(step);
        }
    });

    return flowMachine;
}

