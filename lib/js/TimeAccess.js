(function(){ 
var tt = window.tt = window.tt || {};

tt.TimeAccess = function() {};

tt.TimeAccess.prototype.now = function() 
{
    return new Date().getTime() / 1000;
};

tt.TimeAccess.prototype.nowComponents = function()
{
    var date = new Date();
    return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ];
};

})();
