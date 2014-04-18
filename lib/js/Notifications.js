(function(){
var tt = window.tt = window.tt || {};

tt.Notifications = function() {
    this.hasPermission = 
        window.Notification && 
        (window.Notification.permission === "granted");
}

tt.Notifications.prototype.requestPermission = function() {
    return requestNotification()
    .then(function() {
        this.hasPermission = true;
    }.bind(this));
}

tt.Notifications.prototype.post = function(desc) {
    var d = Q.defer();

    if(!this.hasPermission) {
        d.reject(new Error("has not permission"));
        return d.promise;
    }
    
    var title = desc.title || "tt.Notication";
    var body = desc.body || "";
    var timeout = desc.timeout;

    var notification = new Notification(title, {
        body: body
    });
    
    notification.addEventListener("click", resolve(d));
    notification.addEventListener("close", reject(d, new Error("closed")));
    notification.addEventListener("error", reject(d, new Error("error")));
    
    if(timeout) {
        window.setTimeout(notification.close.bind(notification), timeoutInMilliseconds(timeout));
    }

    return d.promise;

    function timeoutInMilliseconds(t) {
        return 1000 * t;
    }
}

/**
 * Request the permission to post notifications
 *
 * copied from https://developer.mozilla.org/en-US/docs/Web/API/Notification
 *
 * @return promise on successful request
 */
function requestNotification() {
    var d = Q.defer();
    
    if (!("Notification" in window)) {
        d.reject(new Error("NotificationAPI not supported"));
    }
    else if (Notification.permission === "granted") {
        d.resolve();
    }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {

            // store result
            if(!('permission' in Notification)) {
                Notification.permission = permission;
            }

            if (permission === "granted") {
                d.resolve();
            }
            else {
                d.reject(new Error("Notification: did not obtain permission"));
            }
        });
    }
    else {
        d.reject(new Error("Notification: did not obtain permission"));
    }

    return d.promise;
}

function resolve(d, value) {
    return d.resolve.bind(d, value);
}

function reject(d, reason) {
    return d.reject.bind(d, reason);
}

})();

