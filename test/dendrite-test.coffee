###
Test suite for node AND browser in one file
So, we are need some data from global
Its so wrong, but its OK for test
###
lib_path = GLOBAL?.lib_path || ''

Dendrite = require "#{lib_path}dendrite"

describe 'Dendrite:', ->
  
  dendrite_obj = result_simple = result_with_args = null

  callback_simple = ->
    result_simple = true
  
  callback_simple_obj = 
    topics: 'callback_simple'
    callback: callback_simple
    watchdog: undefined
    context: {}

  callback_with_args = (topic, a, b) ->
    result_with_args = a + b

  callback_with_error = ->
    throw new Error 'callback stop'
  
  huge_logic = 
    internal_var : 0
    test_function : (topic, a, b) ->
      switch topic
        when 'one' then @internal_var += a + b
        when 'two' then @internal_var += 10 * ( a + b )
        when 'three' then @internal_var += 400
        else @internal_var += 44
  
  async_obj =
    internal_var : 0
    calc_func : (n) -> @internal_var =  n*n 
    run_function : (topic, cb, arg) ->
       setTimeout ( => cb @calc_func arg ) , 0

  beforeEach ->
    dendrite_obj = new Dendrite
    ###
    Clean up global vars before each test
    ###
    result_simple = false
    result_with_args = false
    huge_logic.internal_var = 0
  
  describe 'class', ->
    
    it 'should may be used as base class', ->
      class SuperDendrite extends Dendrite
        foo  : false
        makeFoo : -> @foo = true

      super_dendrite_obj = new SuperDendrite verbose : 'debug'
      super_dendrite_obj.makeFoo()
      super_dendrite_obj._observer_verbose_level_.should.be.equal 3
      super_dendrite_obj.foo.should.to.be.true

  describe '#subscribe()', ->
    
    it 'should register callback and return handle', ->
      handle = dendrite_obj.subscribe('callback_simple', callback_simple)
      handle.should.be.deep.equal callback_simple_obj
      
    it 'should keep callback unfired on register', ->
      dendrite_obj.subscribe('callback_simple', callback_simple)
      result_simple.should.not.be.true
 
    it 'should skip duplicate topic at register', ->
      dendrite_obj.subscribe('callback_simple callback_simple', callback_simple)
      # yap, its durty but it only for test
      dendrite_obj._subscriptions_['callback_simple'].length.should.be.equal 1

  describe '#subscribeGuarded()', ->

    it 'should register callback and watchdog and return handle', ->
      callback_simple_obj.watchdog = watchdog = ->
      handle = dendrite_obj.subscribeGuarded('callback_simple', callback_simple, watchdog)
      handle.should.be.deep.equal callback_simple_obj

    it 'should fired up watchdog on publishing error', ->
      result = ''
      dendrite_obj = new Dendrite verbose : 'silent'
      dendrite_obj.subscribeGuarded('callback_channel', callback_with_error, (err, options) -> result = err)
      dendrite_obj.publish('callback_channel')
      result.should.be.match /Error: callback stop/  

  describe '#publish()', ->

    it 'should return Error on non-string topic args', ->
      dendrite_obj.subscribe('callback_simple', callback_simple)
      ( -> dendrite_obj.publish(true) ).should.to.throw /^Error on call \|publish\| used non-string topics/

    it 'should fired up event with void call', ->
      dendrite_obj.subscribe('callback_simple', callback_simple)
      dendrite_obj.publish('callback_simple')
      result_simple.should.be.true

    it 'should fired up event with args call', ->
      dendrite_obj.subscribe('callback_with_args', callback_with_args)
      dendrite_obj.publish('callback_with_args', 5, 7)
      result_with_args.should.be.equal 12

    it 'should fired up some different events on one channel', ->
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.subscribe('callback_channel', callback_with_args)
      dendrite_obj.publish('callback_channel', 10, 32)
      result_simple.should.be.true and result_with_args.should.be.equal 42
      
    it 'should not fired up events on different channel call', ->
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.publish('unknown_callback_channel', 10, 20)
      result_simple.should.not.be.true and result_with_args.should.be.not.equal 30
      
    it 'should not stop all on some broken events callback', ->
      dendrite_obj = new Dendrite verbose : 'silent'
      dendrite_obj.subscribe('callback_channel', callback_with_error)
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.publish('callback_channel')
      result_simple.should.be.true
    
    it 'should fired up one subscriber on some different chanel', ->
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic)
      dendrite_obj.publish('one two four', 2, 6)
      huge_logic.internal_var.should.be.equal 132

    it 'should work with async function', (done) ->
      temp_var = null
      dendrite_obj.subscribe('async', async_obj.run_function, async_obj)
      # dendrite_obj.subscribe('async', sync_obj.run_function, sync_obj)
      dendrite_obj.publish('async', ( -> async_obj.internal_var.should.be.equal(4) and temp_var.should.be.equal(0); done() ), 2 )
      temp_var = async_obj.internal_var # got value after |publish| but before message firig
  
  describe '#publishSync()', ->

    it 'just alias to #publish() and should work in some way', ->
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic)
      dendrite_obj.publish('one two four', 2, 6)
      huge_logic.internal_var.should.be.equal 132

  describe '#publishAsync()', ->

    it 'should fired up event with void call', (done) ->
      void_cb = ->
        callback_simple()
        result_simple.should.be.true
        done()

      dendrite_obj.subscribe 'callback_simple', void_cb
      dendrite_obj.publishAsync 'callback_simple'
    
     
    it 'should fired up event with args call', (done) ->
      args_cb = ( args... ) ->
        callback_with_args.apply @, args
        result_with_args.should.be.equal 12
        done()

      dendrite_obj.subscribe 'callback_with_args', args_cb
      dendrite_obj.publishAsync 'callback_with_args', 5, 7

      
    it 'should fired up some different events on one channel', (done) ->

      void_obj =
        result : false
        run : (topic) -> 
          # console.log "void top #{topic}"
          @result = true
          watchdog.step('void')

      args_obj =
        result : 0
        run : ( topic, a, b ) ->
          # console.log "args top #{topic}"
          @result = a + b
          watchdog.step('args')

      watchdog = 
        counter : 2
        step: (name) ->
          # console.log "name = #{name}"
          if ( @counter -= 1 ) is 0
            # console.log "zerroed!!"
            void_obj.result.should.be.true and args_obj.result.should.be.equal 42
            done()

      dendrite_obj.subscribe 'callback_channel', args_obj.run, args_obj
      dendrite_obj.subscribe 'callback_channel', void_obj.run, void_obj
      dendrite_obj.publishAsync 'callback_channel', 10, 32

    it 'should work truly async', (done) ->

      temp_var = 0

      args_cb = ( args... ) ->
        callback_with_args.apply @, args
        (result_with_args.should.be.equal 12 ) and ( temp_var.should.to.be.equal 10 )
        done()

      dendrite_obj.subscribe 'callback_with_args', args_cb
      dendrite_obj.publishAsync 'callback_with_args', 5, 7
      temp_var = 10    

  describe '#unsubscribe()', ->
    
    it 'should unsubscribe one named function', ->
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.unsubscribe('callback_channel', callback_simple)
      dendrite_obj.publish('callback_channel')    
      result_simple.should.not.be.true

    it 'should unsubscribe one named function ONLY and keep others', ->
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.subscribe('callback_channel', callback_with_args)
      dendrite_obj.unsubscribe('callback_channel', callback_simple)
      dendrite_obj.publish('callback_channel', 22, 43 )
      result_simple.should.not.be.true and result_with_args.should.be.equal 65
      
    it 'may not unsubscribe unnamed (un-referenced) function', ->
      tmp = false

      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.subscribe('callback_channel', -> tmp = true)
      dendrite_obj.unsubscribe('callback_channel', -> tmp = true)
      dendrite_obj.publish('callback_channel')
      result_simple.should.be.true and tmp.should.be.true

    it 'should unsubscribe unnamed (un-referenced) function when handle used', ->
      tmp = false

      dendrite_obj.subscribe('callback_channel', callback_simple)
      handle = dendrite_obj.subscribe('callback_channel', -> tmp = true)
      dendrite_obj.unsubscribe(handle)
      dendrite_obj.publish('callback_channel')
      result_simple.should.be.true and tmp.should.be.false
    
    it 'should silent and working on after un-existents function unsubscribe', ->
      dendrite_obj.subscribe('callback_channel', callback_simple)
      dendrite_obj.unsubscribe('callback_channel', callback_with_args)
      dendrite_obj.publish('callback_channel')
      result_simple.should.be.true
      
    it 'should unsubscribe all binded event on some different chanel if callback undefined', ->
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic)
      dendrite_obj.unsubscribe('one two four')
      dendrite_obj.publish('one two three four', 2, 6)
      huge_logic.internal_var.should.be.equal 400
      
    it 'should unsubscribe some binded event on some different chanel if callback exists', ->
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic)
      dendrite_obj.unsubscribe('one two three', huge_logic.test_function, huge_logic)
      dendrite_obj.publish('one two three four', 2, 6)
      huge_logic.internal_var.should.be.equal 44
    
    it 'should unsubscribe subscriptions ONLY if context matched', ->
      dendrite_obj.subscribe('one two three four', huge_logic.test_function, huge_logic)
      dendrite_obj.unsubscribe('one two three', huge_logic.test_function, {})
      dendrite_obj.publish('one two', 2, 6)
      huge_logic.internal_var.should.be.equal 88
    
    it 'should prevent unsubscribe while publishing ', ->
      dendrite_obj = new Dendrite verbose : 'error'
      handle = dendrite_obj.subscribe('callback_channel', callback_simple)
      # its internal thing, but we are must use it to simulate situation
      dendrite_obj._publishingInc()
      dendrite_obj.unsubscribe(handle)
      dendrite_obj.publish('callback_channel', 'test') # must fired up event
      result_simple.should.be.true

    it 'should resume unsubscribing after publishing ', ->
      dendrite_obj = new Dendrite verbose : 'error'
      handle = dendrite_obj.subscribe('callback_channel', callback_simple)
      # its internal thing, but we are must use it to simulate situation
      dendrite_obj._publishingInc()
      dendrite_obj.unsubscribe(handle)
      dendrite_obj._publishingDec()
      dendrite_obj.publish('callback_channel', 'test') # must fired up event
      # yes, we are force re-init variable
      result_simple = false
      # and another one time!
      dendrite_obj.publish('callback_channel', 'test')
      result_simple.should.not.be.true


