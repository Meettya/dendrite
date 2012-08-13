fs                = require 'fs'
CoffeeScript      = require 'coffee-script'
{spawn, exec}     = require 'child_process'
Stitch            = require 'stitch'


# ANSI Terminal Colors.
enableColors = no
unless process.platform is 'win32'
  enableColors = not process.env.NODE_DISABLE_COLORS

bold = red = green = reset = ''
if enableColors
  bold  = '\x1B[0;1m'
  red   = '\x1B[0;31m'
  green = '\x1B[0;32m'
  reset = '\x1B[0m'

# Log a message with a color.
log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')

# Run a CoffeeScript through our node/coffee interpreter.
run = (args, cb) ->
  proc =         spawn 'node', ['./node_modules/.bin/coffee'].concat(args)
  proc.stderr.on 'data', (buffer) -> log buffer.toString(), red
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

# Run a mocha tests
run_test = (args, cb) ->
  proc =         spawn 'node', ['./node_modules/.bin/mocha'].concat(args)
  proc.stderr.on 'data', (buffer) -> log buffer.toString(), red
  proc.stdout.on 'data', (buffer) -> console.log  buffer.toString()
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'  

jade = (args, cb) ->
  proc = spawn 'jade', args
  proc.stderr.on 'data', (buffer) -> log buffer.toString(), red
  # proc.stdout.on 'data', (buffer) -> console.log  buffer.toString()
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'  

task 'build', 'build module from source', build = (cb) ->
  files = fs.readdirSync 'src'
  files = ('src/' + file for file in files when file.match(/\.coffee$/))
  run ['-c', '-o', 'lib/'].concat(files), ->
    log ' -> build done', green
  cb() if typeof cb is 'function'
  
task 'test', 'test builded module', ->
  build ->
    test_file = 'test/dendrite-test.coffee'
    run_test test_file, -> log ' -> all tests passed :)', green

task 'build_test_browser_page', 'build test html for browser', build_test_browser_html = (cb) ->
  files = fs.readdirSync 'test_browser/src'
  files = ('test_browser/src/' + file for file in files when file.match(/\.jade$/))
  jade ['--pretty', '--no-debug', '--out', 'test_browser'].concat(files), ->
    log ' -> build test html for browser done', green
  cb() if typeof cb is 'function'

task 'build_browser_comp_js', 'build browser-compatibility module with stitch', build_browser_comp_js = (cb) ->
  my_res_filename = __dirname + '/test_browser/js/dendrite.js'
  my_package = Stitch.createPackage(
    paths: [ __dirname + '/src']
  )
  my_package.compile (err, source) ->
  	fs.writeFile my_res_filename, source, encoding='utf8', (err) ->
  		throw err if err?
  		log ' -> lib compiled', green
  cb() if typeof cb is 'function'
   
task 'build_test_browser_js', 'build test js for browser', build_test_browser_js = (cb) ->
  files = fs.readdirSync 'test'
  files = ('test/' + file for file in files when file.match(/\.coffee$/))
  run ['-c', '-o', 'test_browser/js/'].concat(files), ->
    log ' -> build test js for browser done', green
  cb() if typeof cb is 'function'

task 'build_test_browser', 'build test browser suite', ->
  build_browser_comp_js ->
    build_test_browser_html ->
      build_test_browser_js ->
        log ' -> build test browser suite start', green