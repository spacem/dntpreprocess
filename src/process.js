const path = require('path');
const processUiString = require('./process-uistring');
const dntpreprocess = require('./dntpreprocess');
const getItems = require('./getitems');
const getStrings = require('./getstrings');

const sourceDir = process.argv[2];
const outputFolder = process.argv[3];

console.log('source dir:' + sourceDir);
console.log('output folder:' + outputFolder);

const dntFolder = path.join(sourceDir, 'resource', 'ext');
const stringsFile = path.join(sourceDir, 'resource', 'uistring', 'uistring.xml');

console.log('> pre-processing dnt files');
dntpreprocess(dntFolder, outputFolder);

console.log('> converting ui string to json');
processUiString(stringsFile, path.join(outputFolder, 'uistring.json'));

console.log('> building item.json');
getItems(outputFolder);

console.log('> optimising strings');
getStrings(outputFolder);
