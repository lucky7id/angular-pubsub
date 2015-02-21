module.exports = Class({

    constructor: function($q) {
        this.$q = $q;
    },

    subscribers: {
        any: []
    },

    logger: false,
    showStackOnLog: false,

    subscribe: function(type, fn, context) {
        var pubType = type || 'any';
        var action = typeof fn === 'function' ? fn : context[fn];
        var windowEvent = document.hasOwnProperty('on' + type) || type === 'storage';

        if (typeof this.subscribers[type] === 'undefined') {
            this.subscribers[type] = [];
        }

        if (windowEvent) {
            window.addEventListener(type, this);
        }

        //remove dupes
        this.subscribers[type] = _.filter(this.subscribers[type], function(sub){
            var eventContext = _.omit(sub.context, ['$scope', 'vm']);
            var reqestContext = _.omit(context, ['$scope','vm']);
            var dupe = sub.fn === action &&  _.isEqual(eventContext, reqestContext);
            return !dupe;
        });

        this.subscribers[type].push({
            type: pubType,
            name: name,
            fn: action,
            context: context || this
        });

        return {
            unsubscribe: this.unsubscribe.bind(this, type, fn, context),
            traceAll: this.traceAll.bind(this)
        };
    },

    //this event is necessary to handle window event binding
    //and also to allow for removal and dupe checking
    handleEvent: function(event){
        this.fire(event.type);
    },

    traceAll: function(showStack) {
        this.logger = true;
        this.showStackOnLog = !!showStack;
        return this.cancelTrace;
    },

    cancelTrace: function() {
        this.logger = false;
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

    _log: function(sub, data, type) {
        var log = {};
        var self = this;

        if (!this.logger) {return;}

        log.fn = sub.fn.name || sub.fn.prototype;
        log.data = data;
        log.event = type;
        console.log(log);
        this._generateStack();
    },

    _generateStack: function() {
        if (!this.showStackOnLog) {return;}
        console.error(new Error('stackTrace').stack);
    },

    _publish: function(type, data, promise) {
        var self = this;
        var subs = this.subscribers[type];

        _.map(subs, function(sub){
            self._log(sub, data, type);
            sub.fn.call(sub.context, {data: data});
            return sub;
        });

        if (promise) {
            promise.resolve();
        }
    }

});
