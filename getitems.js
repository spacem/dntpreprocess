var path = require('path')
var fs = require('fs');
var LZString = require('lz-string');

eval(fs.readFileSync('../dntviewer/simplerreader.js', 'utf8'));
eval(fs.readFileSync('../dntviewer/dntreader.js', 'utf8'));

var sourceDir = process.argv[2];
var dnFolder = process.argv[3];
var oldVersionFolder = process.argv[4];
console.log('source dir:' + sourceDir);
console.log('dn dir:' + dnFolder);
console.log('old ver dir:' + oldVersionFolder);

var currentVersion = readCurrentVerison(dnFolder);
console.log('current Version:' + currentVersion);

var previousItemFileName = getPreviousItemFileName(oldVersionFolder, currentVersion);
if(fs.existsSync(previousItemFileName + '.lzjson')) {
  previousItemFileName = previousItemFileName + '.lzjson';
}
else if(fs.existsSync(previousItemFileName + '.json')) {
  previousItemFileName = previousItemFileName + '.json';
} 
else {
  previousItemFileName = null;
}
console.log('previous version fileName:' + previousItemFileName);

if(previousItemFileName) {
  var oldItemReader = readFile(previousItemFileName);
  var oldItemVersions = {};
  for(var i=0;i<oldItemReader.numRows;++i) {
    var id = oldItemReader.getValue(i, 'id');
    var version = oldItemReader.getValue(i, 'version');
    oldItemVersions[id] = version;
  }
}

oldItemReader = null;

var itemDntReader = new DntReader();
itemDntReader.columnNames = [
  'id',
  'NameID',
  'NameIDParam',
  'Rank',
  'IconImageIndex',
  'Type',
  'LevelLimit',
  'fileName',
  'version',
  ];
itemDntReader.numColumns = itemDntReader.columnNames.length;
itemDntReader.data = [];


if(!sourceDir) {
  console.log("arg1: path to dnt files, arg2: output folder");
}
else {
  outputFolder = sourceDir;
  
  walkSync(sourceDir, function(filePath, stat) {
      
    var fileName = path.basename(filePath, '.json');
    
    var reader = null;
    if(fileName.indexOf('optimised') < 0 && fileName.indexOf('table') > 0) {
	
	try {
	  reader = readFile(filePath);
      if(reader.numRows > 0 && 
	  'NameID' in reader.columnIndexes && 
	  'Type' in reader.columnIndexes && 
	  'IconImageIndex' in reader.columnIndexes) {

		  for(var i=0;i<reader.numRows;++i) {

        var id = reader.getValue(i, 'id');

        var version = null;
        if(oldItemVersions) {
          if(id in oldItemVersions) {
            version = oldItemVersions[id];
          }
          else {
            version = currentVersion;
          }
        }
			
        itemDntReader.data.push([
          id,
          reader.getValue(i, 'NameID'),
          reader.getValue(i, 'NameIDParam'),
          reader.getValue(i, 'Rank'),
          reader.getValue(i, 'IconImageIndex'),
          reader.getValue(i, 'Type'),
          reader.getValue(i, 'LevelLimit'),
          fileName,
          version
        ]);
		  }
	  }
	}
	catch(ex) {
		console.log(ex);
	}
    }
  });
  
  itemDntReader.numRows = itemDntReader.data.length;
  outputFile(itemDntReader, outputFolder + '/' + 'all-items.lzjson', outputFolder + '/' + 'all-items.json');

  if (!fs.existsSync(oldVersionFolder)) {
      fs.mkdirSync(oldVersionFolder);
  }

  var versionDir = path.join(oldVersionFolder, currentVersion);
  if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir);
  }

  outputFile(itemDntReader, path.join(versionDir, 'all-items.lzjson'), path.join(versionDir, 'all-items.json'));
}

function outputFile(data, fileName, jsonFileName) {
  try
  {
    var dataString = JSON.stringify(data);
    fs.writeFileSync(jsonFileName, dataString);
    // var cdata = LZString.compressToUTF16(dataString);
    
    // dataString = null;
    // fs.writeFileSync(fileName, cdata);
    console.log('written ' + jsonFileName);
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
  
    if(filePath.indexOf('.lzjson') >= 0) {
      dntReader.processLzFile(data.toString(), filePath, dntReader);
    } else {
      dntReader.processJsonFile(data.toString(), filePath, dntReader);
    }

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

function readCurrentVerison(dnFolder) {
    var versionFileContents = fs.readFileSync(path.join(dnFolder, 'Version.cfg'), 'utf8');
    var splitVersion = versionFileContents.split('\n');
    return splitVersion[0].split(' ')[1].trim();
}

function getPreviousItemFileName(oldVersionFolder, currentVersion) {
  if(!fs.existsSync(oldVersionFolder)) {
    return;
  }

  var folders = fs.readdirSync(oldVersionFolder);
  var previousVersion = 0;
  folders.forEach(function(folder) {
      if(folder != currentVersion && Number(folder) > previousVersion) {
          previousVersion = Number(folder);
      }
  });
  return path.join(oldVersionFolder, previousVersion.toString(), 'all-items');
}