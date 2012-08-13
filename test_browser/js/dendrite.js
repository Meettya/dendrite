
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), module = cache[path], fn;
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"dendrite": function(exports, require, module) {(function() {
  var Dendrite, _, _ref,
    __slice = [].slice;

  _ = (_ref = this._) != null ? _ref : require('underscore');

  /*
  **dendrite** - An extended Observer pattern implementation, worked at any JavaScript environment.
  
  @version v0.5.1
  @author Dmitrii Karpich  
  @copyright Dmitrii Karpich (c) 2012 under MIT Licence  
  **GitHub repository** [dendrite](https://github.com/Meettya/dendrite)
  
  Thanks to [Joe Zim](http://www.joezimjs.com) for original [Publish/Subscribe plugin](http://www.joezimjs.com/projects/publish-subscribe-jquery-plugin/) for jQuery
  */


  module.exports = Dendrite = (function() {
    var DEBUG, ERROR, SILENT, WARNING;

    DEBUG = 3;

    WARNING = 2;

    ERROR = 1;

    SILENT = 0;

    /*
      Construct a new Dendrite.
      
      @example
        dendrite_obj = new Dendrite verbose : 'warning'
      
      @overload constructor()
        Construct new Dendrite with default options
      
      @overload constructor(options)
        Constrict new Dendrite with settings
        @param [Object] options
        @option options [String] verbose verbose level, may be [ 'debug' | 'warning' | 'error' | 'silent' ]
    */


    function Dendrite(options) {
      if (options == null) {
        options = {};
      }
      this._subscriptions_ = {};
      this._publishing_counter_ = 0;
      this._unsubscribe_queue_ = [];
      this._tasks_counter_ = 0;
      this._tasks_dictionary_ = {};
      this._observer_verbose_level_ = this._parseVerboseLevel(options != null ? options.verbose : void 0);
    }

    /*
      Subscribe to topic(s).
      
      @note The 'callback' function receives 'topic' [String] as first argument and 'data' [Any] as any data that the publisher sent
      
      @example
        handler = dendrite_obj.subscribe 'foo', (topic, data...) -> console.log data, topic
      
      @overload subscribe(topics, callback)
        Subscribe to topic(s) without context
        @param topics [String] 1 or more topic names, separated by a space, to subscribe to
        @param callback [Function] function to be called when the given topic(s) is published to
        @return [Object]
      
      @overload subscribe(topics, callback, context)
        Subscribe to topic(s) with context
        @param topics [String] 1 or more topic names, separated by a space, to subscribe to
        @param callback [Function] function to be called when the given topic(s) is published to
        @param context [Object] an object to call the function on
        @return [Object]
      
      @return [Object] handler { topics: topics, callback: callback, watchdog: undefined, context: context } or throw exception on invalid arguments
    */


    Dendrite.prototype.subscribe = function(topics, callback, context) {
      if (context == null) {
        context = {};
      }
      return this.subscribeGuarded(topics, callback, void 0, context);
    };

    /*
      Subscribe to topic(s) with 'watchdog' function to handle errors here, in subscriber.
      
      @note The 'callback' function receives 'topic' [String] as first argument and 'data' [Any] as any data that the publisher sent
      
      @note The 'watchdog' function receives two arguments: 'err' [Error] and 'options' [Object] as all 'callback' properties
      
      @example
        context_object = 
          name : 'Context Object'
          callback : (topic, data) -> throw Error "Die at #{topic}"
          watchdog : (err, options) -> 
            console.log "Error in | #{@name} |"
            console.log "Error string: | #{err} |"
            console.log "Error detail", options
            null  
        
        handler = dendrite_obj.subscribeGuarded 'foo', context_object.callback, context_object.watchdog, context_object
      
      @overload subscribeGuarded(topics, callback, watchdog)
        Subscribe with 'watchdog' without context
        @param topics [String] 1 or more topic names, separated by a space, to subscribe to
        @param callback [Function] function to be called when the given topic(s) is published to
        @param watchdog [Function] function to be called when callback under publishing topic rise exception
        @return [Object]
      
      @overload subscribeGuarded(topics, callback, watchdog, context)
        Subscribe with 'watchdog' with context
        @param topics [String] 1 or more topic names, separated by a space, to subscribe to
        @param callback [Function] function to be called when the given topic(s) is published to
        @param watchdog [Function] function to be called when callback under publishing topic rise exception
        @param context [Object] an object to call the function on
        @return [Object]
      
      @see #subscribe
      @return [Object] handler { topics: topics, callback: callback, watchdog: watchdog, context: context } or throw exception on invalid arguments
    */


    Dendrite.prototype.subscribeGuarded = function(topics, callback, watchdog, context) {
      var task_number, topic, _base, _i, _len, _ref1;
      if (context == null) {
        context = {};
      }
      if (!(_.isString(topics) || _.isFunction(callback) || (!(watchdog != null) || _.isFunction(watchdog)))) {
        throw this._subscribeErrorMessage(topics, callback, watchdog, context);
      }
      task_number = this._getNextTaskNumber();
      this._tasks_dictionary_[task_number] = [callback, context, watchdog];
      _ref1 = this._topicsToArraySplitter(topics);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        topic = _ref1[_i];
        (_base = this._subscriptions_)[topic] || (_base[topic] = []);
        this._subscriptions_[topic].push(task_number);
      }
      return {
        topics: topics,
        callback: callback,
        watchdog: watchdog,
        context: context
      };
    };

    /*
      Unsubscribe from topic(s) or remove all subscribers from topic(s).
      
      @note Unsubscriptions may be placed to queue if Dendrite do some publish tasks  
        and restarted to unsubscribe when all publish tasks is done.
      
      @example
        # unsubscribe 'obj' from topics 'foo bar'
        dendrite_obj.unsubscribe 'foo bar', callback_reference, obj
        # remove all subscribers from topics 'bar baz'
        dendrite_obj.unsubscribe 'bar baz'
      
      @overload unsubscribe(topics)
        Remove **all** subscriptions from topic(s) 
        @param topics [String] 1 or more topic names, separated by a space, to unsubscribe from
        @return [Object]
      
      @overload unsubscribe(topics, callback)
        Remove subscriptions for callback from topic(s) if no context used in the #subscribe() call
        @param topics [String] 1 or more topic names, separated by a space, to unsubscribe from
        @param callback [Function] function to be removed from the topics subscription list
        @return [Object]
      
      @overload unsubscribe(topics, callback, context)
        Remove subscriptions for callback and given context object from topic(s) 
        @param topics [String] 1 or more topic names, separated by a space, to unsubscribe from
        @param callback [Function] function to be removed from the topics subscription list
        @param context [Object] object that was used as the context in the #subscribe() call
        @return [Object]
      
      @overload unsubscribe(handler)
        Remove subscriptions with *handler* object. May be usefully if subscription created with anonymous 'callback' 
        @param [Object] handler subscription handler, returned by #subscribeX() method
        @option handler [String] topics 1 or more topic names, separated by a space, to unsubscribe from
        @option handler [Function] callback function to be removed from the topics subscription list
        @option handler [Object] context object that was used as the context in the #subscribe() call
        @return [Object]
      
      @return [Object]  *this* for chaining
    */


    Dendrite.prototype.unsubscribe = function(topics, callback, context) {
      var idx, task, task_number, topic, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      if (topics.topics) {
        _ref1 = this._handlerParser(topics, callback, context), topics = _ref1[0], callback = _ref1[1], context = _ref1[2];
      }
      context || (context = {});
      if (!_.isString(topics)) {
        throw this._unsubscribeErrorMessage(topics, callback, context);
      }
      if (this._isPublishing()) {
        this._unsubscribe_queue_.push([topics, callback, context]);
        return this;
      }
      /*
          IMPORTANT! Yes, we are remove subscriptions ONLY, 
          and keep tasks_dictionary untouched because its not necessary.
          Dictionary compacted, calculations of links to dictionary from subscriptions
          may be nightmare - its like pointers in C, exceptionally funny in async mode. 
          So, who get f*ck about this? Not me!!!
      */

      _ref2 = this._topicsToArraySplitter(topics);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        topic = _ref2[_i];
        if (_.isFunction(callback)) {
          _ref3 = this._subscriptions_[topic];
          for (idx = _j = 0, _len1 = _ref3.length; _j < _len1; idx = ++_j) {
            task_number = _ref3[idx];
            if (task = this._tasks_dictionary_[task_number]) {
              if (_.isEqual([task[0], task[1]], [callback, context])) {
                this._subscriptions_[topic].splice(idx, 1);
              }
            }
          }
        } else {
          delete this._subscriptions_[topic];
        }
      }
      return this;
    };

    /*
      Synchronously publish any data to topic(s).
      
      @example
        dendrite_obj.publish 'foo bar', 'This is some data'
      
      @overload publish(topics)
        Do publish to topics without any data
        @param topics [String] 1 or more topic names, separated by a space, to publish to
        @return [Object]
      
      @overload publish(topics, data...)
        Do publish with some data to topics
        @param topics [String] 1 or more topic names, separated by a space, to publish to
        @param data [Any] any kind of data(s) you wish to give to the subscribers
        @return [Object]
      
      @return [Object] *this* for chaining
    */


    Dendrite.prototype.publish = function() {
      var data, topics;
      topics = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._publisher('sync', topics, data);
      return this;
    };

    /*
      Alias for {#publish}
      @return [Object] *this* for chaining
    */


    Dendrite.prototype.publishSync = function() {
      var data, topics;
      topics = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._publisher('sync', topics, data);
      return this;
    };

    /*
      Asynchronously publish any data to topic(s).
      
      @note Used exactly as {#publish}, but this method puts task to queue and will returns immediately 
      
      @example
        dendrite_obj.publishAsync 'foo bar', 'This is some data'
      
      See {#publish} for all info
      @return [Object] *this* for chaining
    */


    Dendrite.prototype.publishAsync = function() {
      var data, topics;
      topics = arguments[0], data = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._publisher('async', topics, data);
      return this;
    };

    /*
      !!!! Internal methods from now !!!!
    */


    /*
      Self-incapsulate @_publishing_counter_ properties to internal methods
      @private
      @return [Boolean] true if Dendrite is publishing, false is idle
    */


    Dendrite.prototype._isPublishing = function() {
      return !!this._publishing_counter_;
    };

    /*
      Self-incapsulate @_publishing_counter_ properties to internal methods
      @private
    */


    Dendrite.prototype._publishingInc = function() {
      this._publishing_counter_ += 1;
      return null;
    };

    /*
      Self-incapsulate @_publishing_counter_ properties to internal methods
      @private
    */


    Dendrite.prototype._publishingDec = function() {
      if (!this._isPublishing) {
        throw Error("Error on decrement publishing counter\n  @_publishing_counter_ is |" + this._publishing_counter_ + "|");
      }
      this._publishing_counter_ -= 1;
      return null;
    };

    /*
      Self-incapsulated task auto-incremented counter
      @private
      @return [Integer] unique task number
    */


    Dendrite.prototype._getNextTaskNumber = function() {
      return this._tasks_counter_ += 1;
    };

    /*
      Verbose level args parser
      @private
      @param level [String] verbose level name
      @return [Integer] verbose level
    */


    Dendrite.prototype._parseVerboseLevel = function(level) {
      if (level == null) {
        return ERROR;
      }
      if (!_.isString(level)) {
        throw this._parseVerboseLevelError(level);
      }
      switch (level.toUpperCase()) {
        case "DEBUG":
          return DEBUG;
        case "SILENT":
          return SILENT;
        case "ERROR":
          return ERROR;
        case "WARNING":
          return WARNING;
        default:
          throw Error("unknown verbose level |" + level + "|");
      }
    };

    /*
      Internal method for different events types definitions
      @private
      @param type [String] engine type name
      @return [Array<publish, unsubscribe>] engine or throw exception on invalid arguments
    */


    Dendrite.prototype._publisherEngine = function(type) {
      var engine_dictionary, selected_engine, self;
      self = this;
      engine_dictionary = {
        sync: {
          publish: self._publishFiring,
          unsubscribe: self._unsubscribeResume
        },
        async: {
          publish: function(topic, task, data) {
            return setTimeout((function() {
              return self._publishFiring(topic, task, data);
            }), 0);
          },
          unsubscribe: function() {
            return setTimeout((function() {
              return self._unsubscribeResume();
            }), 0);
          }
        }
      };
      selected_engine = engine_dictionary[type];
      if (selected_engine == null) {
        throw TypeError("Error undefined publisher engine type |" + type + "|");
      }
      return [selected_engine.publish, selected_engine.unsubscribe];
    };

    /*
      Publisher itself
      @private
      @param type [String] engine type name
      @param topics [String] topic names
      @param data [Array] any kind of data(s)
    */


    Dendrite.prototype._publisher = function(type, topics, data) {
      var task_number, topic, _i, _j, _len, _len1, _publish, _ref1, _ref2, _ref3, _unsubscribe;
      if (!_.isString(topics)) {
        throw this._publishErrorMessage(topics, data);
      }
      _ref1 = this._publisherEngine(type), _publish = _ref1[0], _unsubscribe = _ref1[1];
      _ref2 = this._topicsToArraySplitter(topics, false);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        topic = _ref2[_i];
        if (this._subscriptions_[topic]) {
          _ref3 = this._subscriptions_[topic];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            task_number = _ref3[_j];
            this._publishingInc();
            _publish.call(this, topic, this._tasks_dictionary_[task_number], data);
          }
        }
      }
      _unsubscribe.call(this);
      return null;
    };

    /*
      Internal method for splitting topics string to array.
      @note May skip duplicate (it used for un/subscription )
      @private
      @param topics [String] topic names
      @param skip_duplicate [Boolean] *optional* is it needed to skip duplicate?
      @return [Array<topics>] individual topics
    */


    Dendrite.prototype._topicsToArraySplitter = function(topics, skip_duplicate) {
      var topic, used_topics, _i, _len, _ref1, _results;
      if (skip_duplicate == null) {
        skip_duplicate = true;
      }
      used_topics = {};
      _ref1 = topics.split(' ');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        topic = _ref1[_i];
        if (!(topic !== '')) {
          continue;
        }
        if (skip_duplicate && used_topics[topic]) {
          continue;
        }
        used_topics[topic] = true;
        _results.push(topic);
      }
      return _results;
    };

    /*
      Internal method for handler parser
      @private
      @param handler [Object] handler
      @param callback [Function] *optional*
      @param context [Object] *optional*
      @return [Array<topics, callback, context>] parsed handler
    */


    Dendrite.prototype._handlerParser = function(handler, callback, context) {
      var topics;
      callback || (callback = handler.callback);
      context || (context = handler.context);
      topics = handler.topics;
      return [topics, callback, context];
    };

    /*
      Internal method for unsubscribe continue
      @private
    */


    Dendrite.prototype._unsubscribeResume = function() {
      var task, _base;
      if (this._isPublishing()) {
        if (this._observer_verbose_level_ >= DEBUG) {
          if (typeof console !== "undefined" && console !== null) {
            console.log('still publishing');
          }
        }
        return;
      }
      while (task = typeof (_base = this._unsubscribe_queue_).shift === "function" ? _base.shift() : void 0) {
        if (this._observer_verbose_level_ >= DEBUG) {
          if (typeof console !== "undefined" && console !== null) {
            console.log("retry unsubscribe " + task);
          }
        }
        this.unsubscribe.apply(this, task);
      }
      return null;
    };

    /*
      Internal method for publish firing
      @private
    */


    Dendrite.prototype._publishFiring = function(topic, task, data) {
      var _ref1;
      try {
        task[0].apply(task[1], [topic].concat(data));
      } catch (err) {
        if ((_ref1 = task[2]) != null) {
          _ref1.call(task[1], err, {
            topic: topic,
            callback: task[0],
            object: task[1],
            data: data
          });
        }
        if (this._observer_verbose_level_ >= ERROR) {
          if (typeof console !== "undefined" && console !== null) {
            console.error("Error on call callback we got exception:\n  topic     = |" + topic + "|\n  callback  = |" + task[0] + "|\n  watchdog  = |" + task[2] + "|\n  object    = |" + task[1] + "|\n  data      = |" + (data != null ? data.join(', ') : void 0) + "|\n  error     = |" + err + "|");
          }
        }
      } finally {
        this._publishingDec();
      }
      return null;
    };

    /*
      Internal method for publish error message constructor
      @private
      @return [Object] Error
    */


    Dendrite.prototype._publishErrorMessage = function(topics, data) {
      return {
        name: "TypeError",
        message: "Error on call |publish| used non-string topics:\n  topics  = |" + topics + "|\n  data    = |" + (data != null ? data.join(', ') : void 0) + "|"
      };
    };

    /*
      Internal method for unsubscribe error message constructor
      @private
      @return [Object] Error
    */


    Dendrite.prototype._unsubscribeErrorMessage = function(topics, callback, context) {
      return {
        name: "TypeError",
        message: "Error on call |unsubscribe| used non-string topics:\n  topics    = |" + topics + "|\n  callback  = |" + callback + "|\n  context   = |" + context + "|"
      };
    };

    /*  
    Internal method for subscribe error message constructor
    @private
    @return [Object] Error
    */


    Dendrite.prototype._subscribeErrorMessage = function(topics, callback, watchdog, context) {
      return {
        name: "TypeError",
        message: "Error! on call |subscribe| used non-string topics OR/AND callback isn`t function OR/AND watchdog defined but isn`t function:\n  topics    = |" + topics + "|\n  callback  = |" + callback + "|\n  watchdog  = |" + watchdog + "|\n  context   = |" + context + "|"
      };
    };

    /*
      Internal method for error message from verbose level parser
      @private
      @return [Object] Error
    */


    Dendrite.prototype._parseVerboseLevelError = function(level) {
      return {
        name: "TypeError",
        message: "Error on parsing verbose level - not a String |" + level + "|"
      };
    };

    return Dendrite;

  })();

}).call(this);
}});
