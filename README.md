[![Build Status](https://secure.travis-ci.org/Meettya/whet.observer.png)](http://travis-ci.org/Meettya/whet.observer)

# whet.observer

A standalone Observer that actually works on node.js, adapted from Publish/Subscribe plugin for jQuery.

Oh! Yes, it works in browser too, just connect undercore above. See test_browser folder for detail or [jsfiddle example](http://jsfiddle.net/Meettya/r5XkG/embedded/result/)

And last, but not least - it have asynchronous publishing method #publishAsync()

Surprise! At now we have a dog! Its name "watchdog" and its lives in #subscribeGuarded(). Its watch on callbacks when they firing. See Readme/tests/example for more.

## Description:

This script implement Observer pattern in Object Oriented-manner.

I find this mush more predictable than one huge global observer.

Also its allow you to operate to multiple topics just by separating the topic names with a space, as [JZ-Publish-Subscribe-jQuery-Plugin](https://github.com/joezimjs/JZ-Publish-Subscribe-jQuery-Plugin) do it.

See the examples below or test files.

## Install:

    npm install whet.observer

## Usage:

All examples use CoffeeScript, you may use plain JS instead (but why?).


At first you must create Observer object to interact with it
    
    Observer = require 'whet.observer'
    observer_obj = new Observer

Constructor have some options on create

    verbose : ['debug'|'warning'|'error'|'silent'] # verbose levels placed by decrementing

### Subscribing:

Subscribe to a single topic called 'foo'

The callback function receives two arguments:

- data: any data that the publisher sent
- topic: the topic that was published to that called the function
  
Note: #subscribe() returns a 'handle' that can be used to unsubscribe easily
    
    handle = observer_obj.subscribe("foo", (topic, data) -> console.log data, topic )

Subscribe to multiple topics at once
'foo', 'bar', and 'baz' are three different topics
    
    handle = observer_obj.subscribe("foo bar baz", (topic, data) -> console.log data, topic )

Subscribe with a context
Callback now has its this variable assigned to the specified object
    
    obj = 
      internal_data: 0
      func: (topic, data) -> console.log data, topic, @internal_data

    handle = observer_obj.subscribe("foo", obj.func, obj)

### Subscribing with watchdog:

Guarded subscription give as powerful technique to manage errors in subscribed functions
    
    observer_obj = new Observer verbose : 'silent'

    callback = (topic, data) -> throw Error "Die at #{topic}"
    watchdog = (err, options) -> 
      console.log "Error string: | #{err} |"
      console.log "Error detail", options
      null
    handle = observer_obj.subscribeGuarded 'foo', callback, watchdog

    observer_obj.publish 'foo', 'some data'

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
    
    observer_obj.unsubscribe(handle)

Unsubscribe by specifying the topics, callback, and context (if one was
when subscribed).
Note: if you use an anonymous in the #subscribe() call, you can retrieve a
reference to the callback from the handle's 'callback' property

    observer_obj.unsubscribe("foo bar", callback_reference, obj)
    # or
    observer_obj.unsubscribe("foo bar", handle.callback);

Using the second syntax is useful if you used an anonymous function and got
the handle, but don't want to unsubscribe from all of the topics.

Unsubscribe all callbacks from 1+ topics
If you skip giving a callback as a parameter, it'll unsubscribe all functions
from the topic(s) given
    
    observer_obj.unsubscribe("foo bar")


### Publishing:

Publish to a topic (or topics)
When you publish, you may send data to the subscribers, or you can leave the
parameter empty if you have no particular data to send. The data does not have
a particular format that it must be in, giving you the flexibility to use it
in whatever way is appropriate for your application
    
    observer_obj.publish("foo bar", "This is some data")

Or you may send task to queue for asynchronous execution (see ./tests for more examples)

    observer_obj.publishAsync("foo bar", "This is some data") 

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
