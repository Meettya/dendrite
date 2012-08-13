#!/usr/bin/env coffee

###
Its #subscribeGuarded() method live example
###

Dendrite = require "../src/dendrite"

dendrite_obj = new Dendrite verbose : 'silent'

context_object = 
  name : 'Context Object'

  callback : (topic, data) -> throw Error "Die at #{topic}"

  watchdog : (err, options) -> 
    console.log "Error in | #{@name} |"
    console.log "Error string: | #{err} |"
    console.log "Error detail", options
    null

handle = dendrite_obj.subscribeGuarded 'foo', context_object.callback, context_object.watchdog, context_object

dendrite_obj.publish 'foo', 'some data'