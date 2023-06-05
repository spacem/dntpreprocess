var fs = require('fs');
const { DOMParser } = require('@xmldom/xmldom')

module.exports = function processUiString(inputFile, outputFile) {
  const xmlFile = fs.readFileSync(inputFile);
  const translations = process(xmlFile.toString());
  var jsonTranslations = JSON.stringify(translations);
  fs.writeFileSync(outputFile, jsonTranslations);
}

function process(xmlFileAsString) {
  const data = {};
  var numItems = 0;
  
  var parser = new DOMParser();
  var xmlData = parser.parseFromString(xmlFileAsString, "text/xml");
  var elements = xmlData.getElementsByTagName("message");
  
  for(var m=0;m<elements.length;++m) {
    var text = elements[m].textContent;
    var mid = elements[m].getAttribute("mid");
    data[mid] = text.replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/#r/g, '')
      .replace(/#Y/g, '')
      .replace(/#y/g, '')
      .replace(/#w/g, '')
      .replace(/#j/g, '')
      .replace(/#s/g, '')
      .replace(/#h/g, '')
      .replace(/#j/g, '')
      .replace(/#v/g, '')
      .replace(/#g/g, '');
    numItems++;
  }
  
  console.log('loaded ' + numItems + ' translations');
  return data;
}
