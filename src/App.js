import React, { Component } from 'react';
import './App.css';
import FavIconX from './faviconx/faviconx';

// set to 1 for debuging
var minuteFactor = 60;
var config = {
  sequence: [
    'work', 'short',
    'work', 'short',
    'work', 'short',
    'work', 'short',
    'long',
  ],
  duration: {
    'work': 25 * minuteFactor,
    'short': 5 * minuteFactor,
    'long': 30 * minuteFactor,
    'stopped': null,
  },
};

class Timer extends Component {
  render() {
    var className = "timer";
    if(this.props.inFlow) {
      className += ' in-flow';
    }
    className += ' ' + this.props.state;
    var time = (this.props.timeRemaining !== null) ? formatTime(this.props.timeRemaining) : '';

    return (
      <div className={className}>
        {time}
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: null,
      timeRemaining: null,
      state: 'stopped',
      inFlow: false,
      lastTick: null,
    }
  }
  componentDidMount() {
    this.intervalId = window.setInterval(this.tick.bind(this), 250);

    // ask for permission
    if (window.Notification && (Notification.permission !== "granted")) {
      Notification.requestPermission();
    }

    FavIconX.config({
      updateTitle: false,
      titleRenderer: function(v, t) { return t; },
      borderColor: '#222',
      borderWidth: 1,
      shadowColor: '#EEEEEE',
      fillColor: '#C00E0E',
      fillColor2: '#4E4EB0',
    });
  }
  componentWillUnmount() {
    window.clearInterval(this.intervalId);
  }
  render() {
    return (
      <div className="outer">
        <h1>tomato timer</h1>
        <Timer 
          inFlow={this.state.inFlow} 
          state={this.state.state} 
          timeRemaining={this.state.timeRemaining}
        />
        <div className="controls">
          <button onClick={this.transition.bind(this, null)}>Next</button>
          <button onClick={this.transition.bind(this, 'short')}>Short break</button>
          <button onClick={this.transition.bind(this, 'long')}>Long break</button>
          <button onClick={this.transition.bind(this, 'stopped')}>Stop</button>
        </div>
      </div>
    );
  }
  transition(nextState) {
    var nextPosition = (this.state.position !== null) ? this.state.position + 1 : 0;
    nextPosition = nextPosition % config.sequence.length;

    if(nextState === null) {
      nextState = config.sequence[nextPosition];
    }

    var inFlow;
    if(config.sequence[nextPosition] === nextState) {
      inFlow = true;
    }
    else {
      inFlow = false;
      nextPosition = null;
    }

    this.setState({
      inFlow: inFlow,
      state: nextState,
      // use small offset to remove jitter in display
      timeRemaining: config.duration[nextState] - 0.1,
      position: nextPosition,
      lastTick: +new Date(),
    });
  }
  tick() {
    if(this.state.timeRemaining == null) {
      FavIconX.setValue(100);
      return;
    }
    var now = +new Date();
    var delta = (this.state.lastTick !== null) ? (now - this.state.lastTick) / 1000 : 0.250;
    var nextTimeRemaining = Math.max(0, this.state.timeRemaining - delta);
    var didFinish = (this.state.timeRemaining > 0) && (nextTimeRemaining === 0);
    var duration = config.duration[this.state.state];

    this.setState({
      lastTick: now,
      timeRemaining: nextTimeRemaining,
    });

    FavIconX.setValue(100 * (1 - nextTimeRemaining / duration));

    if(didFinish) {
      this.postNotification();
    }
  }
  postNotification() {
    var title = "Finished " + this.state.state;
    var body = "Click to continue";
    var timeout = 60;
    
    var notification = new Notification(title, {body: body});
    notification.addEventListener("click", function() {
      notification.close();
      this.transition(null);
    }.bind(this));
    
    window.setTimeout(notification.close.bind(notification), 1000 * timeout);        
  }
}

function formatTime(value) {
  return (typeof value !== "number") ? value : min2(~~value / 60) + ":" + min2(~~value % 60);
  
  function min2(v) {
      v = "" + (~~v);
      return (v.length >= 2) ? v : ("0" + v);
  }
}

export default App;
