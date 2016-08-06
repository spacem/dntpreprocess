var path = require('path')
var fs = require('fs');
var LZString = require('lz-string');
var colsToLoad = require('./colsToLoad.js');
var itemTypes = require('./itemTypes.js');

eval(fs.readFileSync('../dntviewer/simplerreader.js', 'utf8'));
eval(fs.readFileSync('../dntviewer/dntreader.js', 'utf8'));

var sourceDir = process.argv[2];
var outputFolder = process.argv[3];

var colsToLoadLookup = null;

try {
  if(!sourceDir || !outputFolder) {
    console.log("arg1: path to dnt files, arg2: output folder");
  }
  else {
    
    // first process everything as lzjson
    console.log('outputting lz files');
    walkSync(sourceDir, function(filePath, stat) {
        
      var fileName = path.basename(filePath, '.dnt');
      var outputFileName = outputFolder + '/' + fileName + '.lzjson'
      
      if(filePath.indexOf('.dnt') == filePath.length - 4 &&
        !fileExists(outputFileName)
        ) {
        
        var data = readFile(filePath);
        if(data.length == 0) {
        }
        else {
          var dntReader = new DntReader();
          var buf = toArrayBuffer(data);
          data = null;
          dntReader.processFile(buf, filePath);
          buf = null;
          
          writeFileFromReader(dntReader, outputFileName);
          dntReader = null;
        }
      }
    });
    
    var potentialsToUse = {};
    var enchantmentsToUse = {};
    
    // now output itemtables and build up list of items that were skipped
    console.log('outputting item files');
    walkSync(sourceDir, function(filePath, stat) {
        
      var fileName = path.basename(filePath, '.dnt');
      if(!isItemFile(fileName + '.dnt')) {
        return;
      }
      
      var optimisedFileName = outputFolder + '/' + fileName + '.optimised.lzjson'
      
      if(filePath.indexOf('.dnt') == filePath.length - 4) {
        
        var data = readFile(filePath);
        if(data.length == 0) {
        }
        else {
          var dntReader = new DntReader();
          dntReader.colsToLoad = getColsToLoad(fileName + '.dnt');
          if(!dntReader.colsToLoad) {
            dntReader.colsToLoad = null;
          }
          var buf = toArrayBuffer(data);
          data = null;
          dntReader.processFile(buf, filePath);
          buf = null;
          
          var filtered = filterItemData(fileName + '.dnt', dntReader);
          // console.log(' filtered ' + dntReader.numRows + ' rows');
          for(var i=0;i<dntReader.numRows;++i) {
            enchantmentsToUse[dntReader.getValue(i, 'EnchantID')] = true;
            potentialsToUse[dntReader.getValue(i, 'TypeParam1')] = true;
          }
          
          if((filtered || dntReader.colsToLoad) && !fileExists(optimisedFileName)) {
            writeFileFromReader(dntReader, optimisedFileName);
          }
          dntReader = null;
        }
      }
    });
    
    // finally output other files
    console.log('outputting optimised files');
    walkSync(sourceDir, function(filePath, stat) {
        
      var fileName = path.basename(filePath, '.dnt');
      if(isItemFile(fileName + '.dnt')) {
        return;
      }
      
      var optimisedFileName = outputFolder + '/' + fileName + '.optimised.lzjson'
      
      if(filePath.indexOf('.dnt') == filePath.length - 4 &&
        !fileExists(optimisedFileName)
        ) {
        
        var data = readFile(filePath);
        if(data.length == 0) {
        }
        else {
          var dntReader = new DntReader();
          dntReader.colsToLoad = getColsToLoad(fileName + '.dnt');
          if(!dntReader.colsToLoad) {
            dntReader.colsToLoad = null;
          }
          var buf = toArrayBuffer(data);
          data = null;
          dntReader.processFile(buf, filePath);
          buf = null;
          
          if(!filterData(fileName + '.dnt', dntReader, potentialsToUse, enchantmentsToUse) && !dntReader.colsToLoad) {
            return;
          }
          
          writeFileFromReader(dntReader, optimisedFileName);
          dntReader = null;
        }
      }
    });
  }
}
catch(ex) {
  console.log('--- ERROR --- ');
  console.log(ex.stack);
}


function writeFileFromReader(dntReader, outputFileName) {
  var dataString = JSON.stringify(dntReader);
  var cdata = LZString.compressToUTF16(dataString);
  
  dataString = null;
  outputFile(cdata, outputFileName);
  cdata = null;
}

function toArrayBuffer(b) {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function getColsToLoad(fileName) {
  if(colsToLoadLookup == null) {
    colsToLoadLookup = {};
    for(var i=0;i<itemTypes.length;++i) {
      var t = itemTypes[i];
      if(t.mainDnt) {
        colsToLoadLookup[t.mainDnt] = colsToLoad.mainDnt;
      }
      if(t.partsDnt) {
        colsToLoadLookup[t.partsDnt] = colsToLoad.partsDnt;
      }
      if(t.weaponDnt) {
        colsToLoadLookup[t.weaponDnt] = colsToLoad.weaponDnt;
      }
      if(t.enchantDnt) {
        colsToLoadLookup[t.enchantDnt] = colsToLoad.enchantDnt;
      }
      if(t.potentialDnt) {
        colsToLoadLookup[t.potentialDnt] = colsToLoad.potentialDnt;
      }
      if(t.sparkDnt) {
        colsToLoadLookup[t.sparkDnt] = colsToLoad.sparkDnt;
      }
      if(t.setDnt) {
        colsToLoadLookup[t.setDnt] = colsToLoad.setDnt;
      }
      if(t.gemDnt) {
        colsToLoadLookup[t.gemDnt] = colsToLoad.gemDnt;
      }
    }
  }
  
  return colsToLoadLookup[fileName];
}

function canRemoveStats(fileName) {
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.potentialDnt == fileName) {
      return true;
    }
    else if(t.enchantDnt == fileName) {
      return true;
    }
  }
  
  return false;
}

function getMinLevel(fileName) {
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.mainDnt == fileName && 'minLevel' in t) {
      // console.log('got min level');
      return t.minLevel;
    }
  }
  
  return null;
}

function getMinRank(fileName) {
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.mainDnt == fileName && 'minRank' in t) {
      // console.log('got min rank');
      return t.minRank;
    }
  }
  
  return null;
}

function isPartsFile(fileName) {
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.partsDnt == fileName) {
      return true;
    }
    else if(t.weaponDnt == fileName) {
      return true;
    }
  }
  
  return false;
}

function isItemFile(fileName) {
  
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.mainDnt == fileName) {
      return true;
    }
  }
  
  return false;
}

function isEnchantFile(fileName) {
  
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.enchantDnt == fileName) {
      return true;
    }
  }
  
  return false;
}

function isPotentialFile(fileName) {
  
  for(var i=0;i<itemTypes.length;++i) {
    var t = itemTypes[i];
    
    if(t.potentialDnt == fileName) {
      return true;
    }
  }
  
  return false;
}

function filterData(fileName, data, potentialsToUse, enchantmentsToUse) {
  
  var newData = [];
  if(isPartsFile(fileName)) {
    
    for(var i=0;i<data.numRows;++i) {
      
      var dSetId = data.getValue(i, 'SetItemID');
      if(dSetId > 0) {
        newData.push(data.data[i]);
      }
    }
  }
  else if(canRemoveStats(fileName)) {
    
    for(var i=0;i<data.numRows;++i) {
      var newRow = [];
      
      for(var c=0;c<data.numColumns;++c) {
        if(data.columnNames[c] == 'State1') {
          break;
        }
        else {
          newRow[c] = data.data[i][c];
        }
      }
      
      for(var s=1;s<=10;++s) {
        var dState = data.getValue(i, 'State' + s);
        if(dState == -1) {
          break;
        }
        else {
          newRow.push(dState);
          var value = data.getValue(i, 'State' + s + 'Value');
          newRow.push(Math.round(value*10000)/10000);
        }
      }
      
      if(isEnchantFile(fileName)) {
        var id = data.getValue(i, 'EnchantID');
        if(id in enchantmentsToUse) {
          newData.push(data.data[i]);
        }
      }
      else if(isPotentialFile(fileName)) {
        var id = data.getValue(i, 'PotentialID');
        if(id in potentialsToUse) {
          newData.push(newRow);
        }
      }
    }
  }

  if(newData.length > 0) {
    data.data = newData;
    data.numRows = newData.length;
    return true;
  }
  else {
    return false;
  }
}

function filterItemData(fileName, data) {
  
  var newData = [];
  var minLevel = getMinLevel(fileName);
  var minRank = getMinRank(fileName);
  if(minLevel != null) {
    // console.log('filtering to ' + minLevel);
    
    for(var i=0;i<data.numRows;++i) {
      
      var dType = data.getValue(i, 'Type');
      var dLevelLimit = data.getValue(i, 'LevelLimit');
      var dRank = data.getValue(i, 'Rank');
      
      // skip certain types like pouches, res scrolls, etc
      if(dType != 8 &&
        dType != 29 &&
        dType != 114 &&
        dType != 79 &&
        dType != 174 &&
        dType != 130 &&
        dType != 24 &&
        dType != 182 &&
        dType != 78 &&
        dType != 20 &&
        dType != 46 &&
        dType != 9 &&
        dLevelLimit >= minLevel &&
        dRank >= minRank) {

        var dState1_GenProb = data.getValue(i, 'State1_GenProb');
        var dStateValue1 = data.getValue(i, 'StateValue1');
        var dTypeParam1 = data.getValue(i, 'TypeParam1');
          
        // skip items with no data
        if(dState1_GenProb > 0 || dStateValue1 > 0 || dTypeParam1 > 0) {
          newData.push(data.data[i]);
        }
      }
    }
  }

  if(newData.length > 0) {
    data.data = newData;
    data.numRows = newData.length;
    return true;
  }
  else {
    return false;
  }
}

function outputFile(data, fileName) {
  try
  {
    // console.log('writing file: ' + fileName);
    // console.log('should be ' + data.length * 2 + 'bytes');
    fs.writeFileSync(fileName, data);
  }
  catch(ex) {
    console.log('--- ERROR --- ');
    console.log('--- ERROR --- ');
    console.log('--- ERROR --- ');
    console.log(ex);
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath);
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

function fileExists(path) {

  try  {
    return fs.statSync(path).isFile();
  }
  catch (e) {

    if (e.code == 'ENOENT') { // no such file or directory. File really does not exist
      // console.log("File does not exist.");
      return false;
    }

    console.log("Exception fs.statSync (" + path + "): " + e);
    throw e; // something else went wrong, we don't have rights, ...
  }
}