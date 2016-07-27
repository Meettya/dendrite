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

import 'core-js';

// Verbose levels constants
const DEBUG   = 3;
const WARNING = 2;
const ERROR   = 1;
const SILENT  = 0;

// Internal buses name for 'active' observer
const INTERNAL_BUS_NAME_SUBSCRIBE = 'internal_bus_name_subscribe'; //Symbol("internal bus");
const INTERNAL_BUS_NAME_UNSUBSCRIBE = 'internal_bus_name_unsubscribe'; //Symbol("internal bus");

class Dendrite {
  constructor(options) {
    this.observerVerboseLevel = this.parseVerboseLevel(options);
    this.publishingCounter = 0;
    this.subscriptions = {};
    this.tasksCounter = 0;
    this.tasksDictionary = [];
    this.unsubscribeQueue = [];
  }

  /**
   * Subscribe to topic(s).
   */
  subscribe(topics, callback, context) {
    return this.subscribeGuarded(topics, callback, undefined, context);
  }
    
  /**
   * Subscribe to topic(s) with 'watchdog' function to handle errors here, in subscriber.
   */
  subscribeGuarded(topics, callback, watchdog, context) {
    // Make sure that each argument is valid
    if (!(typeof topics === "string" && typeof callback === "function" && ( !watchdog || typeof watchdog === "function" ))) {
      throw this.subscribeErrorMessage(topics, callback, watchdog, context);
    }

    let taskNumber = this.getNextTaskNumber(),
      splitedTopics = this.topicsToArraySplitter(topics);

    this.tasksDictionary[taskNumber] = [callback, context, watchdog];

    for (let topic of splitedTopics) {
      if (!this.subscriptions[topic]){
        this.subscriptions[topic] = [];
      }
      this.subscriptions[topic].push(taskNumber);

      // do not cycle this
      if (!this.isInternalChannel(topic)) {
        this.publishAsync(INTERNAL_BUS_NAME_SUBSCRIBE, topic);
      }
    }
    return { topics, callback, watchdog, context };
  }

  /**
   * Unsubscribe from topic(s) or remove all subscribers from topic(s).
   */
  unsubscribe(topics, callback, context) {
    let splitedTopics;

    // If the handler was used we are need to parse args
    if (topics.topics) {
      [topics, callback, context] = this.handlerParser(topics, callback, context);
    }

    // if somthing go wrong
    if (typeof topics !== "string") {
      throw this.unsubscribeErrorMessage(topics, callback, context)
    }

    // If someone is trying to unsubscribe while we're publishing, put it off until publishing is done
    if (this.isPublishing()) {
      this.unsubscribeQueue.push([topics, callback, context]);
      return this;
    }

    /**
     * IMPORTANT! Yes, we are remove subscriptions ONLY, 
     * and keep tasks_dictionary untouched because its not necessary.
     * Dictionary compacted, calculations of links to dictionary from subscriptions
     * may be nightmare - its like pointers in C, exceptionally funny in async mode. 
     * So, who get f*ck about this? Not me!!!
     */
    splitedTopics = this.topicsToArraySplitter(topics);
    for (let topic of splitedTopics) {
      if (!this.subscriptions[topic]){
        continue;
      }
      if (typeof callback === "function") {
        for (let [idx, taskNumber] of this.subscriptions[topic].entries()) {
          let [taskCallback, taskContext] = this.tasksDictionary[taskNumber];

          if (Object.is(taskCallback, callback)) {
            if (context) {
              if (Object.is(taskContext, context)) {
                this.subscriptions[topic].splice(idx, 1);
              }
            } else {
              this.subscriptions[topic].splice(idx, 1);
            }
          }
        }
      } else {
        // If no callback is given, then remove all subscriptions to this topic
        Reflect.deleteProperty(this.subscriptions, topic);
      }
      if (!this.isInternalChannel(topic)) {
        this.publishAsync(INTERNAL_BUS_NAME_UNSUBSCRIBE, topic);
      }
    }
    return this;
  }

  /**
   * Synchronously publish any data to topic(s).
   */
  publish(topics, ...data) {
    this.publisher('sync', topics, data);
    return this;
  }

  /**
   * Alias for {#publish}
   */
  publishSync(topics, ...data) {
    this.publisher('sync', topics, data);
    return this;
  }

  /**
   * Asynchronously publish any data to topic(s).
   */
  publishAsync(topics, ...data) {
    this.publisher('async', topics, data);
    return this;
  }

  /**
   * Get list of all topic(s) with listeners
   */
  getListenedTopicsList() {
    let result = [];

    for (let [topic, listiners] of Object.entries(this.subscriptions)) {
      if (listiners.length && !this.isInternalChannel(topic)) {
        result.push(topic);
      }
    }
    return result;
  }

  /**
   * Return is topic listened or not
   */
  isTopicListened(topic) {
    if (typeof topic !== "string" || topic === "") {
      throw this.isTopicListenedErrorMessage(topic, "isTopicListened", "topic");
    }
    return !!(this.subscriptions[topic] && this.subscriptions[topic].length);
  }

  /**
   * Attach listeners on Dendrite object directly, to watch subscribe\unsubscribe activity
   */
  on(activity_type, callback) {
    let lcActivityType;

    if (typeof activity_type !== "string" || activity_type === "") {
      throw this.isTopicListenedErrorMessage(activity_type, "on", "activity type");
    }
    if (typeof callback !== "function") {
      throw TypeError("callback is not function");
    }

    lcActivityType = activity_type.toLowerCase();

    if (lcActivityType === "subscribe") {
      return this.subscribe(INTERNAL_BUS_NAME_SUBSCRIBE, (topic, data) => {
        callback(data);
      });
    } else if (lcActivityType === "unsubscribe" ){
      return this.subscribe(INTERNAL_BUS_NAME_UNSUBSCRIBE, (topic, data) => {
        callback(data);
      });
    } else {
      throw Error(`unknown activity type |${activity_type}|`);
    }
  }

  /**
   * Detach listeners from Dendrite object directly, to unwatch subscribe\unsubscribe activity
   */
  off(topic) {
    // Two different case for handler and string
    if (topic && typeof topic === "object" && topic.topics){
      let callback, context;

      [topic, callback, context] = this.handlerParser(topic);
      this.unsubscribe(topic, callback, context);
    } else {
      let lcActivityType, busName;

      if (typeof topic !== "string" || topic === "") {
        throw this.isTopicListenedErrorMessage(topic, "off", "activity type");
      }

      lcActivityType = topic.toLowerCase();

      if (lcActivityType === "subscribe") {
        busName = INTERNAL_BUS_NAME_SUBSCRIBE;
      } else if (lcActivityType === "unsubscribe" ){
        busName = INTERNAL_BUS_NAME_UNSUBSCRIBE;
      } else {
        throw Error(`unknown activity type |${topic}|`);
      }
      this.unsubscribe(busName);
    }
  }

  /**
   * Find out is it internal channel or not
   */
  isInternalChannel(topic) {
    return topic === INTERNAL_BUS_NAME_SUBSCRIBE || topic === INTERNAL_BUS_NAME_UNSUBSCRIBE;
  }

  /**
   * Self-incapsulated task auto-incremented counter
   */
  getNextTaskNumber() {
    return this.tasksCounter = this.tasksCounter + 1;
  }

  /**
   * Internal method for handler parser
   */
  handlerParser(handler, callback, context) {
    let topics = handler.topics;

    if(!callback) {
      callback = handler.callback;
    }
    if(!context) {
      context = handler.context;
    }
    return [topics, callback, context];
  }

  /**
   * Self-incapsulate this.publishingCounter properties to internal methods
   */
  isPublishing() {
    return !!this.publishingCounter;
  }

  /**
   * Internal method for different events types definitions
   */
  getPublisherEngine(type) {
    // we are need to have reference to this object itself
    let engineDictionary, selectedEngine,
      self = this;

    engineDictionary = {
      sync : {
        publish : self.publishFiring,
        unsubscribe : self.unsubscribeResume,
      },
      async : {
        publish : function (topic, task, data) {
          setImmediate(function() {
             self.publishFiring(topic, task, data);
          });
        },
        unsubscribe : function () {
          setImmediate(function() {
             self.unsubscribeResume()
          });
        },
      },
    };

    selectedEngine = engineDictionary[type];
    if (!selectedEngine) {
      throw TypeError `Undefined publisher engine type |${type}|`;
    }
    return [selectedEngine.publish, selectedEngine.unsubscribe];
  }

  /**
   * Publisher itself
   */
  publisher(type, topics, data) {
    // get our engins
    let splitedTopics,
      [publishEngine, unsubscribeEngine] = this.getPublisherEngine(type);

    // if somthing go wrong
    if (typeof topics !== "string") {
      throw this.publishErrorMessage(topics, data);
    }

    splitedTopics = this.topicsToArraySplitter(topics, false);

    for (let topic of splitedTopics) {
      if (!this.subscriptions[topic]) {
        continue;
      }
      for (let taskNumber of this.subscriptions[topic]) {
        this.publishingInc();
        publishEngine.call(this, topic, this.tasksDictionary[taskNumber], data);
      }
    }
    unsubscribeEngine.call(this);
  }

  /**
   * Self-incapsulate this.publishingCounter properties to internal methods
   */
  publishingInc() {
    this.publishingCounter = this.publishingCounter + 1;
  }

  /**
   * Self-incapsulate this.publishingCounter properties to internal methods
   */
  publishingDec() {
    if (!this.publishingCounter) {
      throw Error(`Error on decrement publishing counter - this.publishingCounte is |#{this.publishingCounte}|`);
    }
    this.publishingCounter = this.publishingCounter - 1;
  }

  /**
   * Internal method for splitting topics string to array.
   */
  topicsToArraySplitter(topics, skip_duplicate = true) {
    let rawSplited, 
      result = [],
      usedTopics = {};

    // for case if internal bus used
    if (topics === INTERNAL_BUS_NAME_SUBSCRIBE) {
      return [INTERNAL_BUS_NAME_SUBSCRIBE];
    }

    rawSplited = topics.split(' ');

    for (let topic of rawSplited) {
      if (topic === '' || (skip_duplicate && usedTopics[topic])){
        continue;
      }
      usedTopics[topic] = true;
      result.push(topic);
    }
    return result;
  }

  /**
   * Return verbose level (for test etc.)
   */
  getVerboseLevel() {
    return this.observerVerboseLevel;
  }

  /**
   * Return subscriptions count for topic (for test etc.)
   */
  getSubscribtionsCount(topic) {
    let subscriptions = this.subscriptions[topic];

    if (subscriptions) {
      return subscriptions.length;
    }
  }

  /**
   * Internal method for unsubscribe continue
   */
  unsubscribeResume() {
    let task;

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
          console.log(`retry unsubscribe |${task}|`);
        }
        this.unsubscribe.apply(this, task);
      }
    } while (task);
  }

  /**
   * Internal method for publish firing
   */
  publishFiring(topic, task, data) {
    try {
      task[0].apply((task[1] || {}), [topic].concat(data));
    } catch (err) {
      // try to wakeup watchdog
      if (task[2]){
         task[2].call((task[1] || {}), err, {topic, callback: task[0], object: task[1], data });
      }
      // or just put message to log
      if (this.observerVerboseLevel >= ERROR) {
        console.error `Error: on call subscribe callback we got exception
          topic     = |${topic}|
          callback  = |${task[0]}|
          watchdog  = |${task[2]}|
          object    = |${JSON.stringify(task[1]) || task[1]}|
          data      = |${data}|
          error     = |${err}|
        `;
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
  parseVerboseLevel(options) {
    if (options && typeof options === "object") {
      let level = Reflect.get(options, "verbose");

      if (level) {
        if (typeof level !== "string") {
          throw TypeError(`Error on parsing verbose level - not a String |${level}|`);
        }
        switch(level.toUpperCase()){
          case "DEBUG":
            return DEBUG;
          case "SILENT":
            return SILENT;
          case "ERROR":
            return ERROR;
          case "WARNING":
            return WARNING;
          default:
            throw Error(`Unknown verbose level |${level}|`);
        }
      }
    }
    // default level is ERROR
    return ERROR;
  }

  /**
   * Internal method for subscribe error message constructor
   */
  subscribeErrorMessage(topics, callback, watchdog, context) {
    let message = `Error! on call |subscribe| used non-string topics OR/AND callback isn\`t function OR/AND watchdog defined but isn\`t function:
      topics    = |${topics}|
      callback  = |${callback}|
      watchdog  = |${watchdog}|
      context   = |${context}|`;

    return TypeError(message);
  }


  /**
   * Internal method for publish error message constructor
   */
  publishErrorMessage(topics, data) {
    let message = `Error on call |publish| used non-string topics:
      topics    = |${topics}|
      data      = |${data}|`;

    return TypeError(message);
  }

  /**
   * Internal method for unsubscribe error message constructor
   */
  unsubscribeErrorMessage(topics, callback, context) {
    let message = `Error on call |unsubscribe| used non-string topics:
      topics    = |${topics}|
      callback  = |${callback}|
      context   = |${context}|`;

    return TypeError(message);
  }

  /**
   *Internal method for publish error message about non-string topic
   */
  isTopicListenedErrorMessage(topic, functionName, channelName) {
    let message = `Error on call |${functionName}| used non-string, or empty string as ${channelName}:
      ${channelName}  = |${topic}|`;

    return TypeError(message);
  }


}

export default Dendrite;
