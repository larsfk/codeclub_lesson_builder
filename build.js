var Metalsmith  = require('metalsmith'),
    templates   = require('metalsmith-templates'),
    _collections = require('metalsmith-collections'),
    setMetadata = require('metalsmith-filemetadata'),
    filepath    = require('metalsmith-filepath'),
    pandoc      = require('metalsmith-pandoc'),
    ignore      = require('metalsmith-ignore'),
    relative    = require('metalsmith-relative'),
    define      = require('metalsmith-define'),
    marked      = require('marked'), // for md strings in YAML header
    path        = require('path');


/*
 * Configuration variables
 */
lessonRoot = '..';
builderRoot = path.basename(__dirname);
collections = ['computercraft', 'python', 'scratch', 'web'];


/*
* functions
*/
function playlistId(name){
  // replace chars in playlist-name, so that it can be used as id or class
  name = name.replace(/ /g, '_');
  name = name.replace(/[,.-?]/g, '');
  return name;
}


/*
 * setup objects
 */
var metadataOptions = [
  // template for lessons
  { pattern: path.join('*', '**', '*.md'),
    metadata: { template: 'lesson.jade' }},
  // template for scratch lessons
  { pattern: path.join('scratch', '**', '*.md'),
    metadata: { template: 'scratch.jade' }},
];

var ignoreOptions = [
  path.join('**', 'README.md'),
];

var collectionOptions = {};
collections.forEach(function(collection){
  var tmp = {};
  tmp.pattern = path.join(collection, '**', '*.md');
  tmp.sortBy = 'link';
  collectionOptions[collection] = tmp;
});

var defineOptions = {
  playlistId: playlistId,
  marked: marked
};

var templateOptions = {
  engine: 'jade',
  directory: path.join(builderRoot, 'templates'),
};


/*
 * export build as function which takes callback
 */
module.exports = function build(callback){
  Metalsmith(lessonRoot)
  .use(ignore(ignoreOptions))
  // set template for exercises
  .use(setMetadata(metadataOptions))
  // add file.link metadata (for sorting)
  // TODO: better way to sort files?
  .use(filepath())
  // add relative(path) for use in templates
  .use(relative())
  // create collections for index scaffolding
  .use(_collections(collectionOptions))
  // convert to html
  .use(pandoc({
    to: 'html5',
    args: ['--section-divs', '--smart']
  }))
  // add file.link metadata (now files are .html)
  .use(filepath())
  // globals for use in templates
  .use(define(defineOptions))
  // apply templates
  .use(templates(templateOptions))
  //build
  .clean(false) // do not delete files - allows for separate tasks in gulp
  .destination('build')
  .build(function(err){
    if (err) console.log(err);
    // callback when build is done
    callback(err);
  });
};
