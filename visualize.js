#!/usr/bin/env node

'use strict';

var fs = require('fs')
  , path = require('path')
  , htmlTmpl = fs.readFileSync(path.join(__dirname, 'visualize.html'), 'utf8')
  , log = require('npmlog')

function byIdThenDirection(a, b) {
  var aid = parseInt(a.id)
    , bid = parseInt(b.id)

  if (aid < bid) return -1;

  if (aid === bid && a.direction === '=>') return -1;
  return 1;
}

var file = process.argv[2];
if (!file) return console.log('Usage: crdp-visualize ./path-to-file.json')

file = path.resolve(file);

var src        = fs.readFileSync(file, 'utf8')
  , json       = '[\n' + src.slice(0, -2) + ']'
  , obj        = JSON.parse(json)
  , sorted     = obj.sort(byIdThenDirection)
  , sortedJSON = JSON.stringify(sorted)
  , outfile    = file + '.html'

var html = htmlTmpl
  .replace(/{{ROOT}}/g, __dirname)
  .replace(/{{JSONMESSAGES}}/g, sortedJSON)


fs.writeFileSync(outfile, html, 'utf8')

log.info('crdp-visualize', 'Successfully wrote html visualiztion to "./%s"', path.relative(process.cwd(), outfile))
