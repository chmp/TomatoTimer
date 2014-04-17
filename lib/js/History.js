(function(){
var tt = window.tt = window.tt || {};

tt.History = function(desc)
{
    this.id = desc.id;
    this.load = (desc.load !== undefined) ? desc.load : true;
    this.loadKey = desc.loadKey || "tomato-timer-history";
    this.limit = desc.limit || 10;
    this.history = [];
    this._attach();
};

tt.History.prototype = new tt.TimeAccess();

tt.History.prototype._attach = function() 
{
    this.$element = $("#" + this.id);
    if(!this.$element.length) {
        throw new Error("could not attach to DOM element");
    }

    var _this = this;
    if(this.load) {
        this.loadHistory();
   
        $(window).on("unload", function(){
            _this.saveHistory();
        });
   }
};

tt.History.prototype.loadHistory = function()
{
    var hist = localStorage.getItem(this.loadKey);

    if(hist !== null) {
        JSON.parse(hist).forEach(function(item) {
            this.add(item[1], item[0]);
        }, this);
    }
};

tt.History.prototype.saveHistory = function()
{
    var hist = JSON.stringify(this.history);
    localStorage.setItem(this.loadKey, hist);
};

tt.History.prototype.add = function(text, time) 
{
    this.addItem(text, time);
    this.limitItemsTo(this.limit);
};

tt.History.prototype.addItem = function(text, time)
{
    time = time || this.nowComponents();
    this.history.push([time, text]);
    this.$element.prepend($('<div></div>')
        .text(this.formatTimeComponents(time) + ' - ' + text));
};

tt.History.prototype.formatTimeComponents = function(time)
{
    return time[1] + "." + 
           time[2] + ". " +
           time[3] + ":" +
           time[4];
};

tt.History.prototype.limitItemsTo = function(limit)
{
    this.$element.children().slice(limit).remove();
};
})();

