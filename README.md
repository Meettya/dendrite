[![Build Status](https://secure.travis-ci.org/Meettya/dendrite.png)](http://travis-ci.org/Meettya/dendrite)  [![Dependency Status](https://gemnasium.com/Meettya/dendrite.png)](https://gemnasium.com/Meettya/dendrite)

# dendrite

An extended Observer pattern implementation, (must)worked at any JavaScript environment.

It designed to simplify creation of low coupling and high cohesion systems with upgraded Dendrite realization.

Dendrite was created on base of [JZ-Publish-Subscribe-jQuery-Plugin](https://github.com/joezimjs/JZ-Publish-Subscribe-jQuery-Plugin), plus have some unique methods like #publishAsync() and #subscribeGuarded().

Dendrite build as CommonJS module, but actually it may be used in browser too. You need to resolve [underscore](http://underscorejs.org/) or [lodash](http://lodash.com/) dependency and get packed verson (see _test\_browser/js/dendrite.js_) or pack all you project with [clinch](https://github.com/Meettya/clinch). See test_browser folder for detail.


## Description:

Dendrite, as [JZ-Publish-Subscribe-jQuery-Plugin](https://github.com/joezimjs/JZ-Publish-Subscribe-jQuery-Plugin) successor implement all forerunner methods and may be used as replacement with slightly changes in code.

Dendrite created to be used as local object, not one huge global observer. Its possible to have any numbers of dendrite objects without any interactions.

To have some more benefits from Dendrite you should be used #publishAsync() and #subscribeGuarded() methods. These methods may reduce GUI latency and simplify exception handling with callbacks.

See the examples below or test files.

## Documentation:

See [full documentation](http://meettya.github.com/dendrite/doc/), created with [codo](https://github.com/netzpirat/codo).

Also quick link to module interface docs - [Class: Dendrite](http://meettya.github.com/dendrite/doc/classes/Dendrite.html).

## Install:

    npm install dendrite

## Usage:

All examples written in CoffeeScript, you may use plain JS instead (but why?).


At first you must create Dendrite object to interact with it
    
    Dendrite = require 'dendrite'
    dendrite_obj = new Dendrite

Constructor have some options on create

    verbose : ['debug'|'warning'|'error'|'silent'] # verbose levels placed by decrementing

### Subscribing:

Subscribe to a single topic called 'foo'

The callback function receives two arguments:

- data: any data that the publisher sent
- topic: the topic that was published to that called the function
  
Note: #subscribe() returns a 'handle' that can be used to unsubscribe easily
    
    handle = dendrite_obj.subscribe("foo", (topic, data) -> console.log data, topic )

Subscribe to multiple topics at once
'foo', 'bar', and 'baz' are three different topics
    
    handle = dendrite_obj.subscribe("foo bar baz", (topic, data) -> console.log data, topic )

Subscribe with a context
Callback now has its this variable assigned to the specified object
    
    obj = 
      internal_data: 0
      func: (topic, data) -> console.log data, topic, @internal_data

    handle = dendrite_obj.subscribe("foo", obj.func, obj)

### Subscribing with watchdog:

Guarded subscription give as powerful technique to manage errors in subscribed functions
    
    dendrite_obj = new Dendrite verbose : 'silent'

    callback = (topic, data) -> throw Error "Die at #{topic}"
    watchdog = (err, options) -> 
      console.log "Error string: | #{err} |"
      console.log "Error detail", options
      null
    handle = dendrite_obj.subscribeGuarded 'foo', callback, watchdog

    dendrite_obj.publish 'foo', 'some data'

return to console

    Error string: | Error: Die at foo |
    Error detail { topic: 'foo',
      callback: [Function],
      object: {},
      data: [ 'some data' ] }

Now subscribed object MAY decide how support itself errors

### Unsubscribing:

Unsubscribe using the handle gained from calling #subscribe().
The callback that was sent into the #subscribe() call that you retrieved the
handle from will be unsubscribed from all of the topics subscribed to
    
    dendrite_obj.unsubscribe(handle)

Unsubscribe by specifying the topics, callback, and context (if one was
when subscribed).
Note: if you use an anonymous in the #subscribe() call, you can retrieve a
reference to the callback from the handle's 'callback' property

    dendrite_obj.unsubscribe("foo bar", callback_reference, obj)
    # or
    dendrite_obj.unsubscribe("foo bar", handle.callback);

Using the second syntax is useful if you used an anonymous function and got
the handle, but don't want to unsubscribe from all of the topics.

Unsubscribe all callbacks from 1+ topics
If you skip giving a callback as a parameter, it'll unsubscribe all functions
from the topic(s) given
    
    dendrite_obj.unsubscribe("foo bar")


### Publishing:

Publish to a topic (or topics)
When you publish, you may send data to the subscribers, or you can leave the
parameter empty if you have no particular data to send. The data does not have
a particular format that it must be in, giving you the flexibility to use it
in whatever way is appropriate for your application
    
    dendrite_obj.publish("foo bar", "This is some data")

Or you may send task to queue for asynchronous execution (see ./tests for more examples)

    dendrite_obj.publishAsync("foo bar", "This is some data") 


### Get list of listened topics

This method will return list of topics with listiners on it. 

    dendrite_obj.getListenedTopicsList()

## General Notes

### Topics:

Topics can use any name that can also be used as a property name. Since the
topic is always retrieved using the bracket notation (e.g. object["prop"]), as
opposed to the dot notation (e.g. object.prop), you are allowed to use a large
numbers of characters that aren't legal for variable names, such as slashes ("/")
or periods ("."). You cannot, however, use a space (" ") because this is the 
character that separates multiple topics.
All three functions (subscribe, unsubscribe, and publish) are able to take one
or multiple topics (separated by a space).

### Callback Context:
When a callback function is invoked, it is called in the context of blank object.
This means that `` this === {} `` inside of your function.
You may use you own object instead, passed it as context object.

### Handle:
The handle that is returned from the #subscribe() function is simply an object
with three properties, named "topics", "callback", and "context" that correspond
to the three parameters that you sent in (or context will be a blank object if
no context was provided):

    handle =
      topics : "the topics you sent in"
      callback : (topic, data)-> 
        // this is the callback function you sent in
      context : contextObjYouSentIn || {}

### Callback Topic Argument:
The first argument that the callback receives is the topic in which the
function was subscribed and invoked from. This will always be a string
containing only one topic, even if the #publish() function is called with
multiple topics because the callback will be run once for each individual
topic that is published.

## Need you help!
If you feel ability to translate good Russain README (I'm add it soon) to correct English - please, ping me. Thanks in advance!
