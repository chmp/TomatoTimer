(function(){
var tt = window.tt = window.tt || {};

tt.Timer = function(desc) 
{
    this.id = desc.id;
    this.refreshRate = desc.refreshRate || 250;
    this.interval = null;
    this.end = null;
    this.running = false;
    this._attach();
};

tt.Timer.prototype = new tt.TimeAccess();

tt.Timer.prototype._attach = function() 
{
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }
    this.stop();
};

tt.Timer.prototype.start = function(togo)
{
    if(this.interval === null) {
        this.interval = window.setInterval(this.tick.bind(this), 
            this.refreshRate);
    }
    this.running = true;
    this.end = this.now() + togo - 0.1;
    this.tick();
};

tt.Timer.prototype.stop = function() 
{
    if(this.interval !== null) {
        window.clearInterval(this.interval);
        this.interval = null;
    }
    this.running = false;
    this.setMessage("stopped", "Stopped");
};

tt.Timer.prototype.tick = function() 
{
    var remaining = this.end - this.now();
    this.setMessage("running", Math.max(remaining, 0));

    if(this.running && (remaining < 0)) {
        this.running = false;
        document.getElementById("alarm").play();
    }
};

tt.Timer.prototype.setMessage = function(klass, value)
{
    var text = this.formatValue(value);
    this.$element.removeClass().addClass(klass).text(text);
};

tt.Timer.prototype.formatValue = function(value) 
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

