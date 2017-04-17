var path = require('path')
var fs = require('fs');
var LZString = require('lz-string');

eval(fs.readFileSync('../dntviewer/simplerreader.js', 'utf8'));
eval(fs.readFileSync('../dntviewer/dntreader.js', 'utf8'));
eval(fs.readFileSync('../dntviewer/dntranslations.js', 'utf8'));

var sourceDir = process.argv[2];
var outputFolder = process.argv[3];
console.log('source dir:' + sourceDir);

var itemDntReader = new DntReader();
itemDntReader.columnNames = [
  'id',
  'fileName',
  ];
itemDntReader.columnTypes = [3,1];
itemDntReader.numColumns = itemDntReader.columnNames.length;
itemDntReader.data = [];


if(!sourceDir) {
  console.log("arg1: path to dnt files, arg2: output folder");
}
else {
  if(!outputFolder) {
    outputFolder = sourceDir;
  }
  
  walkSync(sourceDir, function(filePath, stat) {
      
    var fileName = path.basename(filePath, '.lzjson');
    
    var reader = null;
    if(fileName.indexOf('table') > 0 && fileName.indexOf('optimised') < 0) {
      reader = readFile(filePath);
      for(var i=0;i<reader.numRows;++i) {        
        itemDntReader.data.push([
          reader.getValue(i, 'id'),
          fileName
        ]);
      }
    }
  });
  
  itemDntReader.numRows = itemDntReader.data.length;
  outputFile(itemDntReader, outputFolder + '/' + 'all-ids.lzjson');
}

function outputFile(data, fileName) {
  try
  {
    var dataString = JSON.stringify(data);
    var cdata = LZString.compressToUTF16(dataString);
    
    dataString = null;
    fs.writeFileSync(fileName, cdata);
    // console.log('written ' + fileName);
  }
  catch(ex) {
    console.log('--- ERROR --- ');
    console.log('--- ERROR --- ');
    console.log('--- ERROR --- ');
    console.log(ex);
  }
}

function readFile(filePath) {
  var data = fs.readFileSync(filePath);
  
  var dntReader = new DntReader();
  if(data.length > 0) {
  
    dntReader.processLzFile(data.toString(), filePath, dntReader);

//    var buf = toArrayBuffer(data);
    //dntReader.processFile(buf, filePath);
  }
  return dntReader;
}

function toArrayBuffer(b) {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function walkSync(currentDirPath, callback) {
    var fs = require('fs'),
        path = require('path');
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}
