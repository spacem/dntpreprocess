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
  'NameID',
  'NameIDParam',
  'Rank',
  'IconImageIndex',
  'Type',
  'LevelLimit',
  'fileName',
  ];
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
    if(fileName.indexOf('optimised') < 0 && fileName.indexOf('table') > 0) {
	
	try {
	  reader = readFile(filePath);
      if(reader.numRows > 0 && 
	  'NameID' in reader.columnIndexes && 
	  'Type' in reader.columnIndexes && 
	  'IconImageIndex' in reader.columnIndexes) {

		  for(var i=0;i<reader.numRows;++i) {
			
			itemDntReader.data.push([
			  reader.getValue(i, 'id'),
			  reader.getValue(i, 'NameID'),
			  reader.getValue(i, 'NameIDParam'),
			  reader.getValue(i, 'Rank'),
			  reader.getValue(i, 'IconImageIndex'),
			  reader.getValue(i, 'Type'),
			  reader.getValue(i, 'LevelLimit'),
			  fileName
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
  outputFile(itemDntReader, outputFolder + '/' + 'all-items.lzjson');
}

function outputFile(data, fileName) {
  try
  {
    var dataString = JSON.stringify(data);
    var cdata = LZString.compressToUTF16(dataString);
    
    dataString = null;
    fs.writeFileSync(fileName, cdata);
    console.log('written ' + fileName);
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

  
  // function to lookup some string value by its id
  // this will also work with values that have a number
  // of mids enclosed in curly brackets
function translate(value, data) {
  if(!data) {
    return value;
  }
  var result = "";
  
  if(value === 0 || value === "" || value === null) {
    result = value;
  }
  else if(value.toString().indexOf(',') > -1) {
    var values = value.toString().split(',');
    
    var results = []
    for(var v=0;v<values.length;++v) {
      var stripped = values[v].replace("{", "").replace("}", "");
      results.push(values[v].replace(stripped, translate(stripped, data)));
    }
    
    result = results.join(',');
  }
  else {
    result = data[value];
    if(typeof result === 'undefined') {
      if(typeof value === 'string') {
        if(value.indexOf('{') == 0) {
          var stripped = value.replace("{", "").replace("}", "");
          result = value.replace(stripped, translate(stripped, data));
        }
        else {
          result = value.toString();
        }
      }
      else {
        return value;
      }
    }
  }
  
  return result;
}