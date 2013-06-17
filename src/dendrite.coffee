# get fastest
_ = require 'lodash'

###
**dendrite** - An extended Observer pattern implementation, worked at any JavaScript environment.

@version v0.5.9
@author Dmitrii Karpich  
@copyright Dmitrii Karpich (c) 2013 under MIT Licence  
**GitHub repository** [dendrite](https://github.com/Meettya/dendrite)

Thanks to [Joe Zim](http://www.joezimjs.com) for original [Publish/Subscribe plugin](http://www.joezimjs.com/projects/publish-subscribe-jquery-plugin/) for jQuery 
###
module.exports = class Dendrite

  #Verbose levels constants
  DEBUG   = 3
  WARNING = 2
  ERROR   = 1
  SILENT  = 0

  ###
  Construct a new Dendrite.
  
  @example
    dendrite_obj = new Dendrite verbose : 'warning'
  
  @overload constructor()
    Construct new Dendrite with default options
  
  @overload constructor(options)
    Constrict new Dendrite with settings
    @param [Object] options
    @option options [String] verbose verbose level, may be [ 'debug' | 'warning' | 'error' | 'silent' ]
  ###
  constructor: (options={}) ->
      
    @_subscriptions_       = {}
    @_publishing_counter_  = 0
    @_unsubscribe_queue_   = []
    @_tasks_counter_       = 0
    @_tasks_dictionary_    = {}
    @_observer_verbose_level_ = @_parseVerboseLevel options?.verbose
  

  ###
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
  ###
  subscribe: (topics, callback, context = {}) ->
    @subscribeGuarded topics, callback, undefined, context

  ###
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
  ###
  subscribeGuarded: (topics, callback, watchdog, context = {}) ->

    # Make sure that each argument is valid
    unless _.isString(topics) or _.isFunction(callback) or ( not watchdog? or _.isFunction watchdog )
      throw @_subscribeErrorMessage topics, callback, watchdog, context

    task_number = @_getNextTaskNumber()
    @_tasks_dictionary_[task_number] = [callback, context, watchdog]

    for topic in @_topicsToArraySplitter topics
      @_subscriptions_[topic] or= []
      @_subscriptions_[topic].push task_number
      
    { topics, callback, watchdog, context }

  ###
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
  ###
  unsubscribe: (topics, callback, context) ->
 
    # If the handler was used we are need to parse args
    if topics.topics
      [topics, callback, context] = @_handlerParser topics, callback, context
      
    context or= {}
 
    # if somthing go wrong
    unless _.isString(topics)
      throw @_unsubscribeErrorMessage topics, callback, context
    
    # If someone is trying to unsubscribe while we're publishing, put it off until publishing is done
    if @_isPublishing()
      @_unsubscribe_queue_.push [topics, callback, context]
      return this
    
    ###
    IMPORTANT! Yes, we are remove subscriptions ONLY, 
    and keep tasks_dictionary untouched because its not necessary.
    Dictionary compacted, calculations of links to dictionary from subscriptions
    may be nightmare - its like pointers in C, exceptionally funny in async mode. 
    So, who get f*ck about this? Not me!!!
    ###
    # Do unsubscribe on all topics
    for topic in @_topicsToArraySplitter topics
      
      if _.isFunction(callback)
        for task_number,idx in @_subscriptions_[topic] when task = @_tasks_dictionary_[task_number]
          if _.isEqual [task[0], task[1]], [callback, context]
            @_subscriptions_[topic].splice idx, 1
      else
        # If no callback is given, then remove all subscriptions to this topic
        delete @_subscriptions_[topic]
         
    this

  ###
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
  ###
  publish: (topics, data...) ->
    @_publisher 'sync', topics, data
    this
    
  ###
  Alias for {#publish}
  @return [Object] *this* for chaining
  ###
  publishSync: (topics, data...) ->
    @_publisher 'sync', topics, data
    this

  ###
  Asynchronously publish any data to topic(s).
  
  @note Used exactly as {#publish}, but this method puts task to queue and will returns immediately 
  
  @example
    dendrite_obj.publishAsync 'foo bar', 'This is some data'
  
  See {#publish} for all info
  @return [Object] *this* for chaining
  ###
  publishAsync: (topics, data...) ->
    @_publisher 'async', topics, data
    this

  ###
  Get list of all topic(s) with listeners
  
  @example
    dendrite_obj.getListenedTopicsList()
  
  See {#publish} for all info
  @return [Array] list of all listened topics 
  ###
  getListenedTopicsList: ->
    topic for topic, listiners of @_subscriptions_ when listiners.length


  ###
  !!!! Internal methods from now !!!!
  ###

  ###
  Self-incapsulate @_publishing_counter_ properties to internal methods
  @private
  @return [Boolean] true if Dendrite is publishing, false is idle
  ###
  _isPublishing: ->
    !!@_publishing_counter_

  ###
  Self-incapsulate @_publishing_counter_ properties to internal methods
  @private
  ###
  _publishingInc: ->
    @_publishing_counter_ += 1
    null

  ###
  Self-incapsulate @_publishing_counter_ properties to internal methods
  @private
  ###
  _publishingDec: ->
    unless @_isPublishing
      throw Error """
                    Error on decrement publishing counter
                      @_publishing_counter_ is |#{@_publishing_counter_}|
                  """  
    @_publishing_counter_ -= 1
    null

  ###
  Self-incapsulated task auto-incremented counter
  @private
  @return [Integer] unique task number
  ###
  _getNextTaskNumber: ->
    @_tasks_counter_ += 1

  ###
  Verbose level args parser
  @private
  @param level [String] verbose level name
  @return [Integer] verbose level
  ###
  _parseVerboseLevel: (level) ->
    # default level is ERROR
    unless level?
      return ERROR

    unless _.isString level
      throw @_parseVerboseLevelError level

    switch level.toUpperCase()
      when "DEBUG"    then DEBUG
      when "SILENT"   then SILENT
      when "ERROR"    then ERROR
      when "WARNING"  then WARNING
      else 
        throw Error "unknown verbose level |#{level}|"

  ###
  Internal method for different events types definitions
  @private
  @param type [String] engine type name
  @return [Array<publish, unsubscribe>] engine or throw exception on invalid arguments
  ###
  _publisherEngine: (type) ->
    # we are need to have reference to this object itself
    self = @

    engine_dictionary = 
      sync :
        publish : self._publishFiring
        unsubscribe : self._unsubscribeResume
      async :
        publish : (topic, task, data) -> setTimeout ( -> self._publishFiring topic, task, data ), 0
        unsubscribe : -> setTimeout ( -> self._unsubscribeResume() ), 0

    selected_engine = engine_dictionary[type]
    unless selected_engine?
      throw TypeError """
                      Error undefined publisher engine type |#{type}|
                      """  

    [selected_engine.publish, selected_engine.unsubscribe]

  ###
  Publisher itself
  @private
  @param type [String] engine type name
  @param topics [String] topic names
  @param data [Array] any kind of data(s)
  ###
  _publisher: (type, topics, data) ->

    # if somthing go wrong
    unless _.isString(topics)
      throw @_publishErrorMessage topics, data
    
    # get our engins
    [_publish, _unsubscribe] = @_publisherEngine type

    for topic in @_topicsToArraySplitter(topics, false) when @_subscriptions_[topic]
      for task_number in @_subscriptions_[topic]
        @_publishingInc()
        _publish.call @, topic, @_tasks_dictionary_[task_number], data

    _unsubscribe.call @

    null


  ###
  Internal method for splitting topics string to array.
  @note May skip duplicate (it used for un/subscription )
  @private
  @param topics [String] topic names
  @param skip_duplicate [Boolean] *optional* is it needed to skip duplicate?
  @return [Array<topics>] individual topics
  ###
  _topicsToArraySplitter: (topics, skip_duplicate = true) ->
    used_topics = {}

    for topic in topics.split(' ') when topic isnt ''
      continue if skip_duplicate and used_topics[topic]
      used_topics[topic] = true
      topic

  ###
  Internal method for handler parser
  @private
  @param handler [Object] handler
  @param callback [Function] *optional*
  @param context [Object] *optional*
  @return [Array<topics, callback, context>] parsed handler
  ###
  _handlerParser: (handler, callback, context) ->
    callback  or= handler.callback
    context   or= handler.context
    topics    = handler.topics
    [topics, callback, context]
  
  ###
  Internal method for unsubscribe continue
  @private
  ###
  _unsubscribeResume: ->
    # its unimportant if unsubscribe queue is empty
    return unless @_unsubscribe_queue_.length

    if @_isPublishing()
      if @_observer_verbose_level_ >= DEBUG
        console?.log 'still publishing'
      return 
    # Go through the queue and run unsubscribe again
    while task = @_unsubscribe_queue_.shift?()
      if @_observer_verbose_level_ >= DEBUG
        console?.log "retry unsubscribe #{task}"
      @unsubscribe.apply @, task
    
    null

  ###
  Internal method for publish firing
  @private
  ###
  _publishFiring: (topic, task, data) ->
    try 
      task[0].apply task[1], [topic].concat data
    catch err
      # try to wakeup watchdog
      task[2]?.call task[1], err,
                                  topic     : topic
                                  callback  : task[0]
                                  object    : task[1]
                                  data      : data

      # or just put message to log
      if @_observer_verbose_level_ >= ERROR
        console?.error """
                      Error on call callback we got exception:
                        topic     = |#{topic}|
                        callback  = |#{task[0]}|
                        watchdog  = |#{task[2]}|
                        object    = |#{task[1]}|
                        data      = |#{data?.join ', '}|
                        error     = |#{err}|
                      """   
    finally
      @_publishingDec()

    null

  ###
  Internal method for publish error message constructor
  @private
  @return [Object] Error
  ###
  _publishErrorMessage: (topics, data) ->
    new TypeError """
                  Error on call |publish| used non-string topics:
                    topics  = |#{topics}|
                    data    = |#{data?.join ', '}|
                  """

  ###
  Internal method for unsubscribe error message constructor
  @private
  @return [Object] Error
  ###
  _unsubscribeErrorMessage: (topics, callback, context) ->
    new TypeError """
                  Error on call |unsubscribe| used non-string topics:
                    topics    = |#{topics}|
                    callback  = |#{callback}|
                    context   = |#{context}|
                  """
  
  ###  
  Internal method for subscribe error message constructor
  @private
  @return [Object] Error
  ###
  _subscribeErrorMessage: (topics, callback, watchdog, context) ->
    new TypeError """
                  Error! on call |subscribe| used non-string topics OR/AND callback isn`t function OR/AND watchdog defined but isn`t function:
                    topics    = |#{topics}|
                    callback  = |#{callback}|
                    watchdog  = |#{watchdog}|
                    context   = |#{context}|
                  """

  ###
  Internal method for error message from verbose level parser
  @private
  @return [Object] Error
  ###
  _parseVerboseLevelError: (level) ->
    new TypeError "Error on parsing verbose level - not a String |#{level}|"

    