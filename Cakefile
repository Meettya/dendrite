###
This Cakefile for dendrite suport
###

fs                = require 'fs'
path              = require 'path'
{spawn, exec}     = require 'child_process'
Clinch            = require 'clinch'
UglifyJS          = require 'uglify-js'

# its our packer - one for all
packer = new Clinch

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

# this function will create package on the fly
clinch_on_the_fly = (cb) ->
  
  pack_config = 
    bundle : 
      Dendrite : "#{__dirname}"
    replacement :
      lodash : path.join __dirname, "web_modules", "lodash"

  packer.buldPackage pack_config, cb

# this function will create test package on the fly
clinch_test_on_the_fly = (cb) ->
  
  pack_config = 
    package_name : 'test_suite'
    inject : off # nothing to inject here
    bundle : 
      dendrite_test : path.join __dirname, "test", "dendrite-test"
    replacement :
      lodash : path.join __dirname, "web_modules", "lodash"

  packer.buldPackage pack_config, cb

minimize_code = (in_code) ->
  result = UglifyJS.minify in_code, fromString: true
  result.code

build_jade = (work_dir, src_dir) ->
  files = fs.readdirSync "#{work_dir}/#{src_dir}"
  files = ("#{work_dir}/#{src_dir}/" + file for file in files when file.match(/\.jade$/))
  jade ['--pretty', '--no-debug', '--out', "#{work_dir}"].concat(files), ->
    log ' -> build html from jade for browser done', green

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

task 'build_browser_example', 'build browser example pages', build_browser_example = (cb) ->
  build_jade 'examples_browser', 'src' 
  cb() if typeof cb is 'function'

task 'build_test_browser_page', 'build test html for browser', build_test_browser_html = (cb) ->
  build_jade 'test_browser', 'src' 
  cb() if typeof cb is 'function'

task 'build_browser_comp_js', 'build browser-compatibility module with clinch', build_browser_comp_js = (cb) ->
  my_res_filename = __dirname + '/browser/dendrite.js'
  my_minify_res_filename = __dirname + '/browser/dendrite.min.js'

  clinch_on_the_fly (err, data) ->
    if err
      log "Builder, err: #{err}", red
    else
      fs.writeFile my_res_filename, data, 'utf8', (err) ->
        throw err if err?
        log ' -> lib compiled', green

      fs.writeFile my_minify_res_filename, minimize_code(data), 'utf8', (err) ->
        throw err if err?
        log ' -> minify lib compiled', green 

  cb() if typeof cb is 'function'  	
   
task 'build_test_browser_js', 'build test js for browser', build_test_browser_js = (cb) ->
  my_res_filename = __dirname + '/test_browser/js/dendrite-test.js'

  clinch_test_on_the_fly (err, data) ->
    if err
      log "Builder, err: #{err}", red
    else
      fs.writeFile my_res_filename, data, 'utf8', (err) ->
        throw err if err?
        log ' -> test suite compiled', green   

  cb() if typeof cb is 'function'

task 'build_test_browser', 'build test browser suite', ->
  build_browser_comp_js ->
    build_test_browser_html ->
      build_test_browser_js ->
        log ' -> build test browser suite start', green