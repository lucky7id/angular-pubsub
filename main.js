module.exports = Class({

    constructor: function($timeout, $q) {
        this.$timeout = $timeout;
        this.$q = $q;
    },

    subscribers: {
        any: []
    },

    on: function(type, fn, context) {
        return this.subscribe(type,fn,context);
    },

    off: function(type, fn, context) {
        return this.unsubscribe(type,fn,context);
    },

    subscribe: function(type, fn, context) {
        console.log(type, fn, context);
        var pubType = type || 'any';
        var action = typeof fn === 'function' ? fn : context[fn];
        var windowEvent = document.hasOwnProperty('on' + type) || window.hasOwnProperty('on' + type);

        if (typeof this.subscribers[type] === 'undefined') {
            this.subscribers[type] = [];
        }

        if (windowEvent) {
            window.addEventListener(type, this);
        }

        this.subscribers[type].push({
            type: pubType,
            name: name,
            fn: action,
            context: context || this
        });

        return {
            unsubscribe: this.unsubscribe.bind(this, type, fn, context)
        };
    },

    //this event is necessary to handle window event binding
    //and also to allow for removal and dupe checking
    handleEvent: function(event){
        this.fire(event.type);
    },

    Tracer: function(type, name) {
        return {

        };
    },

    unsubscribe: function(type, fn, context) {
        var action = typeof fn === 'function' ? fn : context[fn];
        var windowEvent = document.hasOwnProperty('on' + type);
        var newSubs = _.filter(this.subscribers[type], function(sub){
            var match = sub.fn === action && sub.context === context;
            return !match;
        });

        if (windowEvent) {
            window.removeEventListener(type, this);
        }

        this.subscribers[type] = newSubs;
    },

    fire: function(type, data) {
        this._publish(type, data, undefined);
    },

    fireAsync: function(type, data) {
        var defered = this.$q.defer();
        this._publish(type, data, defered);
        return defered.promise;
    },

    _publish: function(type, data, promise) {
        var subs = this.subscribers[type];

        _.map(subs, function(sub){
            sub.fn.call(sub.context, {data: data});
            return sub;
        });

        if (promise) {
            promise.resolve();
        }
    }

});
