// Generated by clinch 0.3.1

(function() {
 'use strict';
    
var dependencies, name_resolver, require, sources, _this = this;

name_resolver = function(parent, name) {
  if (dependencies[parent] == null) {
    throw Error("no dependencies list for parent |" + parent + "|");
  }
  if (dependencies[parent][name] == null) {
    throw Error("no one module resolved, name - |" + name + "|, parent - |" + parent + "|");
  }
  return dependencies[parent][name];
};
require = function(name, parent) {
  var exports, module, module_source, resolved_name, _ref;
  if (!(module_source = sources[name])) {
    resolved_name = name_resolver(parent, name);
    if (!(module_source = sources[resolved_name])) {
      throw Error("can`t find module source code: original_name - |" + name + "|, resolved_name - |" + resolved_name + "|");
    }
  }
  module_source.call(_this,exports = {}, module = {}, function(mod_name) {
    return require(mod_name, resolved_name != null ? resolved_name : name);
  });
  return (_ref = module.exports) != null ? _ref : exports;
};
    dependencies = {"823658104":{"..":3105106743},"3105106743":{"lodash":1154215551}};
    sources = {
"823658104": function(exports, module, require) {
// /Users/meettya/github/dendrite/test/dendrite-test.coffee 
/*
Test suite for node AND browser in one file
So, we are need some data from global
Its so wrong, but its OK for test
*/

var Dendrite,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Dendrite = (typeof GLOBAL !== "undefined" && GLOBAL !== null ? GLOBAL.lib_path : void 0) ? require("" + lib_path + "dendrite") : require('..');

describe('Dendrite:', function() {
  var async_obj, callback_simple, callback_simple_obj, callback_with_args, callback_with_error, dendrite_obj, huge_logic, result_simple, result_with_args;

  dendrite_obj = result_simple = result_with_args = null;
  callback_simple = function() {
    return result_simple = true;
  };
  callback_simple_obj = {
    topics: 'callback_simple',
    callback: callback_simple,
    watchdog: void 0,
    context: {}
  };
  callback_with_args = function(topic, a, b) {
    return result_with_args = a + b;
  };
  callback_with_error = function() {
    throw new Error('callback stop');
  };
  huge_logic = {
    internal_var: 0,
    test_function: function(topic, a, b) {
      switch (topic) {
        case 'one':
          return this.internal_var += a + b;
        case 'two':
          return this.internal_var += 10 * (a + b);
        case 'three':
          return this.internal_var += 400;
        default:
          return this.internal_var += 44;
      }
    }
  };
  async_obj = {
    internal_var: 0,
    calc_func: function(n) {
      return this.internal_var = n * n;
    },
    run_function: function(topic, cb, arg) {
      var _this = this;

      return setTimeout((function() {
        return cb(_this.calc_func(arg));
      }), 0);
    }
  };
  beforeEach(function() {
    dendrite_obj = new Dendrite;
    /*
    Clean up global vars before each test
    */

    result_simple = false;
    result_with_args = false;
    return huge_logic.internal_var = 0;
  });
  describe('class', function() {
    return it('should may be used as base class', function() {
      var SuperDendrite, super_dendrite_obj, _ref;

      SuperDendrite = (function(_super) {
        __extends(SuperDendrite, _super);

        function SuperDendrite() {
          _ref = SuperDendrite.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        SuperDendrite.prototype.foo = false;

        SuperDendrite.prototype.makeFoo = function() {
          return this.foo = true;
        };

        return SuperDendrite;

      })(Dendrite);
      super_dendrite_obj = new SuperDendrite({
        verbose: 'debug'
      });
      super_dendrite_obj.makeFoo();
      super_dendrite_obj._observer_verbose_level_.should.be.equal(3);
      return super_dendrite_obj.foo.should.to.be["true"];
    });
  });
  describe('#subscribe()', function() {
    it('should register callback and return handle', function() {
      var handle;

      handle = dendrite_obj.subscribe('callback_simple', callback_simple);
      return handle.should.be.deep.equal(callback_simple_obj);
    });
    it('should keep callback unfired on register', function() {
      dendrite_obj.subscribe('callback_simple', callback_simple);
      return result_simple.should.not.be["true"];
    });
    return it('should skip duplicate topic at register', function() {
      dendrite_obj.subscribe('callback_simple callback_simple', callback_simple);
      return dendrite_obj._subscriptions_['callback_simple'].length.should.be.equal(1);
    });
  });
  describe('#subscribeGuarded()', function() {
    it('should register callback and watchdog and return handle', function() {
      var handle, watchdog;

      callback_simple_obj.watchdog = watchdog = function() {};
      handle = dendrite_obj.subscribeGuarded('callback_simple', callback_simple, watchdog);
      return handle.should.be.deep.equal(callback_simple_obj);
    });
    return it('should fired up watchdog on publishing error', function() {
      var result;

      result = '';
      dendrite_obj = new Dendrite({
        verbose: 'silent'
      });
      dendrite_obj.subscribeGuarded('callback_channel', callback_with_error, function(err, options) {
        return result = err;
      });
      dendrite_obj.publish('callback_channel');
      return result.should.be.match(/Error: callback stop/);
    });
  });
  describe('#publish()', function() {
    it('should return Error on non-string topic args', function() {
      dendrite_obj.subscribe('callback_simple', callback_simple);
      return (function() {
        return dendrite_obj.publish(true);
      }).should.to["throw"](/^Error on call \|publish\| used non-string topics/);
    });
    it('should fired up event with void call', function() {
      dendrite_obj.subscribe('callback_simple', callback_simple);
      dendrite_obj.publish('callback_simple');
      return result_simple.should.be["true"];
    });
    it('should fired up event with args call', function() {
      dendrite_obj.subscribe('callback_with_args', callback_with_args);
      dendrite_obj.publish('callback_with_args', 5, 7);
      return result_with_args.should.be.equal(12);
    });
    it('should fired up some different events on one channel', function() {
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.subscribe('callback_channel', callback_with_args);
      dendrite_obj.publish('callback_channel', 10, 32);
      return result_simple.should.be["true"] && result_with_args.should.be.equal(42);
    });
    it('should not fired up events on different channel call', function() {
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.publish('unknown_callback_channel', 10, 20);
      return result_simple.should.not.be["true"] && result_with_args.should.be.not.equal(30);
    });
    it('should not stop all on some broken events callback', function() {
      dendrite_obj = new Dendrite({
        verbose: 'silent'
      });
      dendrite_obj.subscribe('callback_channel', callback_with_error);
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.publish('callback_channel');
      return result_simple.should.be["true"];
    });
    it('should fired up one subscriber on some different chanel', function() {
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic);
      dendrite_obj.publish('one two four', 2, 6);
      return huge_logic.internal_var.should.be.equal(132);
    });
    return it('should work with async function', function(done) {
      var temp_var;

      temp_var = null;
      dendrite_obj.subscribe('async', async_obj.run_function, async_obj);
      dendrite_obj.publish('async', (function() {
        async_obj.internal_var.should.be.equal(4) && temp_var.should.be.equal(0);
        return done();
      }), 2);
      return temp_var = async_obj.internal_var;
    });
  });
  describe('#publishSync()', function() {
    return it('just alias to #publish() and should work in some way', function() {
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic);
      dendrite_obj.publish('one two four', 2, 6);
      return huge_logic.internal_var.should.be.equal(132);
    });
  });
  describe('#publishAsync()', function() {
    it('should fired up event with void call', function(done) {
      var void_cb;

      void_cb = function() {
        callback_simple();
        result_simple.should.be["true"];
        return done();
      };
      dendrite_obj.subscribe('callback_simple', void_cb);
      return dendrite_obj.publishAsync('callback_simple');
    });
    it('should fired up event with args call', function(done) {
      var args_cb;

      args_cb = function() {
        var args;

        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callback_with_args.apply(this, args);
        result_with_args.should.be.equal(12);
        return done();
      };
      dendrite_obj.subscribe('callback_with_args', args_cb);
      return dendrite_obj.publishAsync('callback_with_args', 5, 7);
    });
    it('should fired up some different events on one channel', function(done) {
      var args_obj, void_obj, watchdog;

      void_obj = {
        result: false,
        run: function(topic) {
          this.result = true;
          return watchdog.step('void');
        }
      };
      args_obj = {
        result: 0,
        run: function(topic, a, b) {
          this.result = a + b;
          return watchdog.step('args');
        }
      };
      watchdog = {
        counter: 2,
        step: function(name) {
          if ((this.counter -= 1) === 0) {
            void_obj.result.should.be["true"] && args_obj.result.should.be.equal(42);
            return done();
          }
        }
      };
      dendrite_obj.subscribe('callback_channel', args_obj.run, args_obj);
      dendrite_obj.subscribe('callback_channel', void_obj.run, void_obj);
      return dendrite_obj.publishAsync('callback_channel', 10, 32);
    });
    return it('should work truly async', function(done) {
      var args_cb, temp_var;

      temp_var = 0;
      args_cb = function() {
        var args;

        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callback_with_args.apply(this, args);
        (result_with_args.should.be.equal(12)) && (temp_var.should.to.be.equal(10));
        return done();
      };
      dendrite_obj.subscribe('callback_with_args', args_cb);
      dendrite_obj.publishAsync('callback_with_args', 5, 7);
      return temp_var = 10;
    });
  });
  return describe('#unsubscribe()', function() {
    it('should unsubscribe one named function', function() {
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.unsubscribe('callback_channel', callback_simple);
      dendrite_obj.publish('callback_channel');
      return result_simple.should.not.be["true"];
    });
    it('should unsubscribe one named function ONLY and keep others', function() {
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.subscribe('callback_channel', callback_with_args);
      dendrite_obj.unsubscribe('callback_channel', callback_simple);
      dendrite_obj.publish('callback_channel', 22, 43);
      return result_simple.should.not.be["true"] && result_with_args.should.be.equal(65);
    });
    it('may not unsubscribe unnamed (un-referenced) function', function() {
      var tmp;

      tmp = false;
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.subscribe('callback_channel', function() {
        return tmp = true;
      });
      dendrite_obj.unsubscribe('callback_channel', function() {
        return tmp = true;
      });
      dendrite_obj.publish('callback_channel');
      return result_simple.should.be["true"] && tmp.should.be["true"];
    });
    it('should unsubscribe unnamed (un-referenced) function when handle used', function() {
      var handle, tmp;

      tmp = false;
      dendrite_obj.subscribe('callback_channel', callback_simple);
      handle = dendrite_obj.subscribe('callback_channel', function() {
        return tmp = true;
      });
      dendrite_obj.unsubscribe(handle);
      dendrite_obj.publish('callback_channel');
      return result_simple.should.be["true"] && tmp.should.be["false"];
    });
    it('should silent and working on after un-existents function unsubscribe', function() {
      dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj.unsubscribe('callback_channel', callback_with_args);
      dendrite_obj.publish('callback_channel');
      return result_simple.should.be["true"];
    });
    it('should unsubscribe all binded event on some different chanel if callback undefined', function() {
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic);
      dendrite_obj.unsubscribe('one two four');
      dendrite_obj.publish('one two three four', 2, 6);
      return huge_logic.internal_var.should.be.equal(400);
    });
    it('should unsubscribe some binded event on some different chanel if callback exists', function() {
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic);
      dendrite_obj.unsubscribe('one two three', huge_logic.test_function, huge_logic);
      dendrite_obj.publish('one two three four', 2, 6);
      return huge_logic.internal_var.should.be.equal(44);
    });
    it('should unsubscribe subscriptions ONLY if context matched', function() {
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic);
      dendrite_obj.unsubscribe('one two three', huge_logic.test_function, {});
      dendrite_obj.publish('one two', 2, 6);
      return huge_logic.internal_var.should.be.equal(88);
    });
    it('should prevent unsubscribe while publishing ', function() {
      var handle;

      dendrite_obj = new Dendrite({
        verbose: 'error'
      });
      handle = dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj._publishingInc();
      dendrite_obj.unsubscribe(handle);
      dendrite_obj.publish('callback_channel', 'test');
      return result_simple.should.be["true"];
    });
    return it('should resume unsubscribing after publishing ', function() {
      var handle;

      dendrite_obj = new Dendrite({
        verbose: 'error'
      });
      handle = dendrite_obj.subscribe('callback_channel', callback_simple);
      dendrite_obj._publishingInc();
      dendrite_obj.unsubscribe(handle);
      dendrite_obj._publishingDec();
      dendrite_obj.publish('callback_channel', 'test');
      result_simple = false;
      dendrite_obj.publish('callback_channel', 'test');
      return result_simple.should.not.be["true"];
    });
  });
});
},
"1154215551": function(exports, module, require) {
// /Users/meettya/github/dendrite/web_modules/lodash.coffee 
/*
This is lodash shim
*/
module.exports = this._;
},
"3105106743": function(exports, module, require) {
// /Users/meettya/github/dendrite/lib/dendrite.js 
// Generated by CoffeeScript 1.6.2
(function() {
  var Dendrite, _,
    __slice = [].slice;

  _ = require('lodash');

  /*
  **dendrite** - An extended Observer pattern implementation, worked at any JavaScript environment.
  
  @version v0.5.7
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
      var task_number, topic, _base, _i, _len, _ref;

      if (context == null) {
        context = {};
      }
      if (!(_.isString(topics) || _.isFunction(callback) || ((watchdog == null) || _.isFunction(watchdog)))) {
        throw this._subscribeErrorMessage(topics, callback, watchdog, context);
      }
      task_number = this._getNextTaskNumber();
      this._tasks_dictionary_[task_number] = [callback, context, watchdog];
      _ref = this._topicsToArraySplitter(topics);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        topic = _ref[_i];
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
      var idx, task, task_number, topic, _i, _j, _len, _len1, _ref, _ref1, _ref2;

      if (topics.topics) {
        _ref = this._handlerParser(topics, callback, context), topics = _ref[0], callback = _ref[1], context = _ref[2];
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

      _ref1 = this._topicsToArraySplitter(topics);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        topic = _ref1[_i];
        if (_.isFunction(callback)) {
          _ref2 = this._subscriptions_[topic];
          for (idx = _j = 0, _len1 = _ref2.length; _j < _len1; idx = ++_j) {
            task_number = _ref2[idx];
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
      var task_number, topic, _i, _j, _len, _len1, _publish, _ref, _ref1, _ref2, _unsubscribe;

      if (!_.isString(topics)) {
        throw this._publishErrorMessage(topics, data);
      }
      _ref = this._publisherEngine(type), _publish = _ref[0], _unsubscribe = _ref[1];
      _ref1 = this._topicsToArraySplitter(topics, false);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        topic = _ref1[_i];
        if (this._subscriptions_[topic]) {
          _ref2 = this._subscriptions_[topic];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            task_number = _ref2[_j];
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
      var topic, used_topics, _i, _len, _ref, _results;

      if (skip_duplicate == null) {
        skip_duplicate = true;
      }
      used_topics = {};
      _ref = topics.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        topic = _ref[_i];
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

      if (!this._unsubscribe_queue_.length) {
        return;
      }
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
      var err, _ref;

      try {
        task[0].apply(task[1], [topic].concat(data));
      } catch (_error) {
        err = _error;
        if ((_ref = task[2]) != null) {
          _ref.call(task[1], err, {
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
      return new TypeError("Error on call |publish| used non-string topics:\n  topics  = |" + topics + "|\n  data    = |" + (data != null ? data.join(', ') : void 0) + "|");
    };

    /*
    Internal method for unsubscribe error message constructor
    @private
    @return [Object] Error
    */


    Dendrite.prototype._unsubscribeErrorMessage = function(topics, callback, context) {
      return new TypeError("Error on call |unsubscribe| used non-string topics:\n  topics    = |" + topics + "|\n  callback  = |" + callback + "|\n  context   = |" + context + "|");
    };

    /*  
    Internal method for subscribe error message constructor
    @private
    @return [Object] Error
    */


    Dendrite.prototype._subscribeErrorMessage = function(topics, callback, watchdog, context) {
      return new TypeError("Error! on call |subscribe| used non-string topics OR/AND callback isn`t function OR/AND watchdog defined but isn`t function:\n  topics    = |" + topics + "|\n  callback  = |" + callback + "|\n  watchdog  = |" + watchdog + "|\n  context   = |" + context + "|");
    };

    /*
    Internal method for error message from verbose level parser
    @private
    @return [Object] Error
    */


    Dendrite.prototype._parseVerboseLevelError = function(level) {
      return new TypeError("Error on parsing verbose level - not a String |" + level + "|");
    };

    return Dendrite;

  })();

}).call(this);
}};

/* bundle export */
var test_suite = {
"dendrite_test": require(823658104)};
}).call(this);