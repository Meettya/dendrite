'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['Undefined publisher engine type |', '|'], ['Undefined publisher engine type |', '|']);

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * **dendrite** - An extended Observer pattern implementation, worked at any JavaScript environment.
 *
 * @version v0.8.1
 * @author Dmitrii Karpich
 * @copyright Dmitrii Karpich (c) 2014-2016 under MIT Licence
 * **GitHub repository** [dendrite](https://github.com/Meettya/dendrite)
 *
 * Thanks to [Joe Zim](http://www.joezimjs.com) for original [Publish/Subscribe plugin](http://www.joezimjs.com/projects/publish-subscribe-jquery-plugin/) for jQuery
 */

// Verbose levels constants
var DEBUG = 3;
var WARNING = 2;
var ERROR = 1;
var SILENT = 0;

// Internal buses name for 'active' observer
var INTERNAL_BUS_NAME_SUBSCRIBE = Symbol('internal subscribe bus');
var INTERNAL_BUS_NAME_UNSUBSCRIBE = Symbol('internal unsubscribe bus');

var Dendrite = function () {
  function Dendrite(options) {
    _classCallCheck(this, Dendrite);

    this.observerVerboseLevel = this.parseVerboseLevel(options);
    this.publishingCounter = 0;
    this.subscriptions = new Map();
    this.tasksDictionary = new WeakMap();
    this.unsubscribeQueue = [];
  }

  /**
   * Subscribe to topic(s).
   */


  _createClass(Dendrite, [{
    key: 'subscribe',
    value: function subscribe(topics, callback, context) {
      return this.subscribeGuarded(topics, callback, undefined, context);
    }

    /**
     * Subscribe to topic(s) with 'watchdog' function to handle errors here, in subscriber.
     */

  }, {
    key: 'subscribeGuarded',
    value: function subscribeGuarded(topics, callback, watchdog, context) {
      // Make sure that each argument is valid
      if (!((typeof topics === 'string' || this.isInternalChannel(topics)) && typeof callback === 'function' && (!watchdog || typeof watchdog === 'function'))) {
        throw this.subscribeErrorMessage(topics, callback, watchdog, context);
      }

      var taskObject = {};
      var splitedTopics = this.topicsToArraySplitter(topics);

      this.tasksDictionary.set(taskObject, [callback, context, watchdog]);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = splitedTopics[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var topic = _step.value;

          var collector = [];
          if (this.subscriptions.has(topic)) {
            collector = this.subscriptions.get(topic);
          }
          collector.push(taskObject);
          this.subscriptions.set(topic, collector);
          // do not cycle this
          if (!this.isInternalChannel(topic)) {
            this.publishAsync(INTERNAL_BUS_NAME_SUBSCRIBE, topic);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return { topics: topics, callback: callback, watchdog: watchdog, context: context };
    }

    /**
     * Unsubscribe from topic(s) or remove all subscribers from topic(s).
     */

  }, {
    key: 'unsubscribe',
    value: function unsubscribe(topics, callback, context) {
      var splitedTopics = void 0;

      // If the handler was used we are need to parse args
      if (topics.topics) {
        var _handlerParser = this.handlerParser(topics, callback, context);

        var _handlerParser2 = _slicedToArray(_handlerParser, 3);

        topics = _handlerParser2[0];
        callback = _handlerParser2[1];
        context = _handlerParser2[2];
      }

      // if somthing go wrong
      if (!(typeof topics === 'string' || this.isInternalChannel(topics))) {
        throw this.unsubscribeErrorMessage(topics, callback, context);
      }

      // If someone is trying to unsubscribe while we're publishing, put it off until publishing is done
      if (this.isPublishing()) {
        this.unsubscribeQueue.push([topics, callback, context]);
        return this;
      }

      splitedTopics = this.topicsToArraySplitter(topics);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = splitedTopics[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var topic = _step2.value;

          if (!this.subscriptions.has(topic)) {
            continue;
          }
          if (typeof callback === 'function') {
            var collector = this.subscriptions.get(topic);

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = collector.entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _step3$value = _slicedToArray(_step3.value, 2);

                var idx = _step3$value[0];
                var taskObject = _step3$value[1];

                var taskPack = this.tasksDictionary.get(taskObject);

                if (taskPack) {
                  var _taskPack = _slicedToArray(taskPack, 2);

                  var taskCallback = _taskPack[0];
                  var taskContext = _taskPack[1];


                  if (Object.is(taskCallback, callback)) {
                    if (context) {
                      if (Object.is(taskContext, context)) {
                        collector.splice(idx, 1);
                      }
                    } else {
                      collector.splice(idx, 1);
                    }
                  }
                }
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }

            this.subscriptions.set(topic, collector);
          } else {
            // If no callback is given, then remove all subscriptions to this topic
            this.subscriptions.delete(topic);
          }

          if (!this.isInternalChannel(topic)) {
            this.publishAsync(INTERNAL_BUS_NAME_UNSUBSCRIBE, topic);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return this;
    }

    /**
     * Synchronously publish any data to topic(s).
     */

  }, {
    key: 'publish',
    value: function publish(topics) {
      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      this.publisher('sync', topics, data);
      return this;
    }

    /**
     * Alias for {#publish}
     */

  }, {
    key: 'publishSync',
    value: function publishSync(topics) {
      for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        data[_key2 - 1] = arguments[_key2];
      }

      this.publisher('sync', topics, data);
      return this;
    }

    /**
     * Asynchronously publish any data to topic(s).
     */

  }, {
    key: 'publishAsync',
    value: function publishAsync(topics) {
      for (var _len3 = arguments.length, data = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        data[_key3 - 1] = arguments[_key3];
      }

      this.publisher('async', topics, data);
      return this;
    }

    /**
     * Get list of all topic(s) with listeners
     */

  }, {
    key: 'getListenedTopicsList',
    value: function getListenedTopicsList() {
      var result = [];

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.subscriptions.entries()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _step4$value = _slicedToArray(_step4.value, 2);

          var topic = _step4$value[0];
          var listiners = _step4$value[1];

          if (listiners.length && !this.isInternalChannel(topic)) {
            result.push(topic);
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return result;
    }

    /**
     * Return is topic listened or not
     */

  }, {
    key: 'isTopicListened',
    value: function isTopicListened(topic) {
      if (typeof topic !== 'string' || topic === '') {
        throw this.isTopicListenedErrorMessage(topic, 'isTopicListened', 'topic');
      }
      return !!this.getSubscribtionsCount(topic);
    }

    /**
     * Attach listeners on Dendrite object directly, to watch subscribe\unsubscribe activity
     */

  }, {
    key: 'on',
    value: function on(activityType, callback) {
      var lcActivityType = void 0;

      if (typeof activityType !== 'string' || activityType === '') {
        throw this.isTopicListenedErrorMessage(activityType, 'on', 'activity type');
      }
      if (typeof callback !== 'function') {
        throw TypeError('callback is not function');
      }

      lcActivityType = activityType.toLowerCase();

      if (lcActivityType === 'subscribe') {
        return this.subscribe(INTERNAL_BUS_NAME_SUBSCRIBE, function (topic, data) {
          callback(data);
        });
      } else if (lcActivityType === 'unsubscribe') {
        return this.subscribe(INTERNAL_BUS_NAME_UNSUBSCRIBE, function (topic, data) {
          callback(data);
        });
      } else {
        throw Error('unknown activity type |' + activityType + '|');
      }
    }

    /**
     * Detach listeners from Dendrite object directly, to unwatch subscribe\unsubscribe activity
     */

  }, {
    key: 'off',
    value: function off(topic) {
      // Two different case for handler and string
      if (topic && (typeof topic === 'undefined' ? 'undefined' : _typeof(topic)) === 'object' && topic.topics) {
        var callback = void 0,
            context = void 0;

        var _handlerParser3 = this.handlerParser(topic);

        var _handlerParser4 = _slicedToArray(_handlerParser3, 3);

        topic = _handlerParser4[0];
        callback = _handlerParser4[1];
        context = _handlerParser4[2];

        this.unsubscribe(topic, callback, context);
      } else {
        var lcActivityType = void 0,
            busName = void 0;

        if (typeof topic !== 'string' || topic === '') {
          throw this.isTopicListenedErrorMessage(topic, 'off', 'activity type');
        }

        lcActivityType = topic.toLowerCase();

        if (lcActivityType === 'subscribe') {
          busName = INTERNAL_BUS_NAME_SUBSCRIBE;
        } else if (lcActivityType === 'unsubscribe') {
          busName = INTERNAL_BUS_NAME_UNSUBSCRIBE;
        } else {
          throw Error('unknown activity type |' + topic + '|');
        }
        this.unsubscribe(busName);
      }
    }

    /**
     * Find out is it internal channel or not
     */

  }, {
    key: 'isInternalChannel',
    value: function isInternalChannel(topic) {
      return topic === INTERNAL_BUS_NAME_SUBSCRIBE || topic === INTERNAL_BUS_NAME_UNSUBSCRIBE;
    }

    /**
     * Internal method for handler parser
     */

  }, {
    key: 'handlerParser',
    value: function handlerParser(handler, callback, context) {
      var topics = handler.topics;

      if (!callback) {
        callback = handler.callback;
      }
      if (!context) {
        context = handler.context;
      }
      return [topics, callback, context];
    }

    /**
     * Self-incapsulate this.publishingCounter properties to internal methods
     */

  }, {
    key: 'isPublishing',
    value: function isPublishing() {
      return !!this.publishingCounter;
    }

    /**
     * Internal method for different events types definitions
     */

  }, {
    key: 'getPublisherEngine',
    value: function getPublisherEngine(type) {
      // we are need to have reference to this object itself
      var engineDictionary = void 0,
          selectedEngine = void 0;
      var self = this;

      engineDictionary = {
        sync: {
          publish: self.publishFiring,
          unsubscribe: self.unsubscribeResume
        },
        async: {
          publish: function publish(topic, task, data) {
            setTimeout(function () {
              self.publishFiring(topic, task, data);
            }, 0);
          },
          unsubscribe: function unsubscribe() {
            setTimeout(function () {
              self.unsubscribeResume();
            }, 0);
          }
        }
      };

      selectedEngine = engineDictionary[type];
      if (!selectedEngine) {
        throw TypeError(_templateObject, type);
      }
      return [selectedEngine.publish, selectedEngine.unsubscribe];
    }

    /**
     * Publisher itself
     */

  }, {
    key: 'publisher',
    value: function publisher(type, topics, data) {
      // get our engins
      var splitedTopics = void 0;

      var _getPublisherEngine = this.getPublisherEngine(type);

      var _getPublisherEngine2 = _slicedToArray(_getPublisherEngine, 2);

      var publishEngine = _getPublisherEngine2[0];
      var unsubscribeEngine = _getPublisherEngine2[1];

      // if somthing go wrong

      if (!(typeof topics === 'string' || this.isInternalChannel(topics))) {
        throw this.publishErrorMessage(topics, data);
      }

      splitedTopics = this.topicsToArraySplitter(topics, false);

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = splitedTopics[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var topic = _step5.value;

          if (!this.subscriptions.has(topic)) {
            continue;
          }
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = this.subscriptions.get(topic)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var taskObject = _step6.value;

              var taskPack = this.tasksDictionary.get(taskObject);

              if (taskPack) {
                this.publishingInc();
                publishEngine.call(this, topic, taskPack, data);
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      unsubscribeEngine.call(this);
    }

    /**
     * Self-incapsulate this.publishingCounter properties to internal methods
     */

  }, {
    key: 'publishingInc',
    value: function publishingInc() {
      this.publishingCounter = this.publishingCounter + 1;
    }

    /**
     * Self-incapsulate this.publishingCounter properties to internal methods
     */

  }, {
    key: 'publishingDec',
    value: function publishingDec() {
      if (!this.publishingCounter) {
        throw Error('Error on decrement publishing counter - this.publishingCounter is |' + this.publishingCounter + '|');
      }
      this.publishingCounter = this.publishingCounter - 1;
    }

    /**
     * Internal method for splitting topics string to array.
     */

  }, {
    key: 'topicsToArraySplitter',
    value: function topicsToArraySplitter(topics) {
      var skipDuplicate = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      var rawSplited = void 0;
      var result = [];
      var usedTopics = {};

      // for case if internal bus used
      if (this.isInternalChannel(topics)) {
        return [topics];
      }

      rawSplited = topics.split(' ');

      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = rawSplited[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var topic = _step7.value;

          if (topic === '' || skipDuplicate && usedTopics[topic]) {
            continue;
          }
          usedTopics[topic] = true;
          result.push(topic);
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      return result;
    }

    /**
     * Return verbose level (for test etc.)
     */

  }, {
    key: 'getVerboseLevel',
    value: function getVerboseLevel() {
      return this.observerVerboseLevel;
    }

    /**
     * Return subscriptions count for topic (for test etc.)
     */

  }, {
    key: 'getSubscribtionsCount',
    value: function getSubscribtionsCount(topic) {
      var collector = this.subscriptions.get(topic);

      if (collector) {
        return collector.length;
      }
    }

    /**
     * Internal method for unsubscribe continue
     */

  }, {
    key: 'unsubscribeResume',
    value: function unsubscribeResume() {
      var task = void 0;

      // its unimportant if unsubscribe queue is empty
      if (!this.unsubscribeQueue.length) {
        return;
      }

      if (this.isPublishing()) {
        if (this.observerVerboseLevel >= DEBUG) {
          console.log('still publishing');
        }
        return;
      }

      do {
        task = this.unsubscribeQueue.shift();
        if (task) {
          if (this.observerVerboseLevel >= DEBUG) {
            console.log('retry unsubscribe |' + task + '|');
          }
          this.unsubscribe.apply(this, task);
        }
      } while (task);
    }

    /**
     * Internal method for publish firing
     */

  }, {
    key: 'publishFiring',
    value: function publishFiring(topic, task, data) {
      try {
        task[0].apply(task[1] || {}, [topic].concat(data));
      } catch (err) {
        // try to wakeup watchdog
        if (task[2]) {
          task[2].call(task[1] || {}, err, { topic: topic, callback: task[0], object: task[1], data: data });
        }
        // or just put message to log
        if (this.observerVerboseLevel >= ERROR) {
          console.error('Error: on call subscribe callback we got exception\n          topic     = |' + topic + '|\n          callback  = |' + task[0] + '|\n          watchdog  = |' + task[2] + '|\n          object    = |' + (JSON.stringify(task[1]) || task[1]) + '|\n          data      = |' + data + '|\n          error     = |' + err + '|\n        ');
        }
        if (this.observerVerboseLevel === DEBUG && err.stack) {
          console.error(err.stack);
        }
      } finally {
        this.publishingDec();
      }
    }

    /**
     * Verbose level args parser
     */

  }, {
    key: 'parseVerboseLevel',
    value: function parseVerboseLevel(options) {
      if (options && (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
        var level = options.verbose;

        if (level) {
          if (typeof level !== 'string') {
            throw TypeError('Error on parsing verbose level - not a String |' + level + '|');
          }
          switch (level.toUpperCase()) {
            case 'DEBUG':
              return DEBUG;
            case 'SILENT':
              return SILENT;
            case 'ERROR':
              return ERROR;
            case 'WARNING':
              return WARNING;
            default:
              throw Error('Unknown verbose level |' + level + '|');
          }
        }
      }
      // default level is ERROR
      return ERROR;
    }

    /**
     * Internal method for subscribe error message constructor
     */

  }, {
    key: 'subscribeErrorMessage',
    value: function subscribeErrorMessage(topics, callback, watchdog, context) {
      var message = 'Error! on call |subscribe| used non-string topics OR/AND callback isn`t function OR/AND watchdog defined but isn`t function:\n      topics    = |' + topics + '|\n      callback  = |' + callback + '|\n      watchdog  = |' + watchdog + '|\n      context   = |' + context + '|';

      return TypeError(message);
    }

    /**
     * Internal method for publish error message constructor
     */

  }, {
    key: 'publishErrorMessage',
    value: function publishErrorMessage(topics, data) {
      var message = 'Error on call |publish| used non-string topics:\n      topics    = |' + topics + '|\n      data      = |' + data + '|';

      return TypeError(message);
    }

    /**
     * Internal method for unsubscribe error message constructor
     */

  }, {
    key: 'unsubscribeErrorMessage',
    value: function unsubscribeErrorMessage(topics, callback, context) {
      var message = 'Error on call |unsubscribe| used non-string topics:\n      topics    = |' + topics + '|\n      callback  = |' + callback + '|\n      context   = |' + context + '|';

      return TypeError(message);
    }

    /**
     *Internal method for publish error message about non-string topic
     */

  }, {
    key: 'isTopicListenedErrorMessage',
    value: function isTopicListenedErrorMessage(topic, functionName, channelName) {
      var message = 'Error on call |' + functionName + '| used non-string, or empty string as ' + channelName + ':\n      ' + channelName + '  = |' + topic + '|';

      return TypeError(message);
    }
  }]);

  return Dendrite;
}();

exports.default = Dendrite;
// to fix node.js require

module.exports = Dendrite;