var path = require('path')
var fs = require('fs');

const validColNames = [
  'NameID',
  'NameIDParam',
  'SkillExplanationID',
  'SkillExplanationIDParam',
  'JobName',
  'TabNameID',
  'TierName',
  'ItemGainText'
  ];

const itemColNames = [
  'NameID',
  'NameIDParam',
  'SkillExplanationID',
  'SkillExplanationIDParam',
  'JobName',
  'TierName',
  'DescriptionID',
  'DescriptionIDParam',
  ];

const DntReader = require('./utils/dntreader');

module.exports = function getStrings(sourceDir) {
  if(!sourceDir) {
    console.error("arg1: path to uistring.xml, arg2: path to dnt files, arg3: output folder");
  }
  else {
    var uiStringFile = path.join(sourceDir, 'uistring.json');
    
    var stringifiedData = fs.readFileSync(uiStringFile);
    var uistrings = JSON.parse(stringifiedData);
    var newUiStrings = {};
    
    if(!outputFolder) {
      outputFolder = sourceDir;
    }
    
    walkSync(sourceDir, function(filePath, stat) {

      try {
        var fileName = path.basename(filePath, '.json');
        
        var reader = null;
        if(isAFileWeCareAbout(fileName)) {
          reader = readFile(filePath);
          
          var colNames = getRelaventColumnNames(reader, fileName);
          if(colNames.length) {
            // console.log('extracting ', colNames.length, ' columns from ', fileName, colNames);

            for(var i=0;i<reader.numRows;++i) {
              
              for(var j=0;j<colNames.length;++j) {
                var val = reader.getValue(i, colNames[j]);
                processValue(val.toString(), colNames[j]);
              }
            }
          }
        }
      }
      catch(ex) {
        console.log('unable to find strings in file', filePath, ex);
      }
    });
    
    outputFile(newUiStrings, outputFolder + '/' + 'uistring.optimised.lzjson', outputFolder + '/' + 'uistring.optimised.json');
  }

  function isAFileWeCareAbout(fileName) {

    const requiredSubStrings = [
      'itemtable',
      'appellationtable',
      'jobtable',
      // 'skillleveltable_',
      'skilltable_',
      'exchange',
      'vehicletable',
      'shoptable'
    ];

    const badSubStrings = [
      'optimised',
      'uistring',
      'all-',
      'maze'
    ];

    for (const s of badSubStrings) {
      if (fileName.indexOf(s) >= 0) {
        return false;
      }
    }

    for (const s of requiredSubStrings) {
      if (fileName.indexOf(s) >= 0) {
        return true;
      }
    }
    return false;
  }

  function processValue(val, colName) {
    if(val && val.length > 0) {
      if(colName.indexOf('Param') >= 0) {
        var splitVals = val.split(',');
        for(var k=0;k<splitVals.length;++k) {
          if(splitVals[k].indexOf('{') == 0) {
            
            var splitVal = splitVals[k].replace('{', '').replace('}', '');
            if(splitVal in uistrings) {
              newUiStrings[splitVal] = uistrings[splitVal];
            }
          }
        }
      } else {
        if(val in uistrings) {
          newUiStrings[val] = uistrings[val];
        }
      }
    }
  }

  function getRelaventColumnNames(reader, fileName) {
    var retVal = [];
    if(fileName.indexOf('itemtable') == -1) {
      for(var i=0;i<validColNames.length;++i) {
        for(var j=0;j<reader.columnNames.length;++j) {
          if(validColNames[i] == reader.columnNames[j]) {
            retVal.push(validColNames[i]);
          } 
        }
      }
    } else {
      for(var i=0;i<itemColNames.length;++i) {
        for(var j=0;j<reader.columnNames.length;++j) {
          if(itemColNames[i] == reader.columnNames[j]) {
            retVal.push(itemColNames[i]);
          }
        }
      }
    }
    
    return retVal;
  }

  function outputFile(data, fileName, jsonFileName) {
    try
    {
      var dataString = JSON.stringify(data);
      fs.writeFileSync(jsonFileName, dataString);
      // var cdata = LZString.compressToUTF16(dataString);
      
      dataString = null;
      // fs.writeFileSync(fileName, cdata);
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
      dntReader.processJsonFile(data.toString(), filePath);
    }
    return dntReader;
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
}