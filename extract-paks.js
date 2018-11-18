

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

function walkSync(currentDirPath, callback) {
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

let fd;
let pos;

function readChunk(position, length) {
    var buffer = new Buffer(length);
    var bytesRead = fs.readSync(fd, buffer, 0, length, position);
    if(bytesRead != length) {
        console.error('this will be harder than I thought');
    }
    return buffer;
}

function readLong(position) {
    const buffer = readChunk(position, 4);
    pos += 4;
    return buffer.readUInt32LE(0);
}

function readString(position, len) {
    const buffer = readChunk(position, len);
    var zeroIndex = buffer.indexOf('\0');
    if(zeroIndex == -1) {
        zeroIndex = len;
    }
    pos += len;
    return buffer.toString('utf8', 0, zeroIndex);
}

const sourceDir = 'd:\\games\\DragonNestNA';
const destDir = 'C:\\tmp';
walkSync(sourceDir, function(filePath, stat) {
    if(filePath.indexOf('Resource') == -1 || filePath.indexOf('.pak') == -1) {
        return;
    }

    console.log('reading ', filePath);
    fd = fs.openSync(filePath, 'r');
    pos = 0x104;
    var numFiles = readLong(pos);
    console.log('found ' + numFiles + ' files');
    pos = readLong(pos);
    for(let i=0;i<numFiles;++i) {
        var fileName = readString(pos, 0x100);
        let zsize = readLong(pos);
        let size = readLong(pos);
        pos += 4; // skip zsize1
        let offset = readLong(pos);
        pos += 4; // skip unknown
        pos += 0x28;

        if(size > 0) {
            if(fileName.indexOf('.dnt') >= 0 || fileName.indexOf('uistring.xml') >= 0) {
                console.log('lets try extracting');
                console.log('File: ' + fileName + ' ' + (size/1024) + 'KB');

                let buffer;
                if(zsize > 0) {
                    buffer = zlib.inflateSync(readChunk(offset, zsize));
                }
                else {
                    buffer = readChunk(offset, size);
                }

                const pathChunks = fileName.split('\\');
                const fileOnlyName = pathChunks[pathChunks.length-1];
                var fileName = destDir + '\\' + fileOnlyName;
                fs.unlinkSync(fileName);
                const destFd = fs.openSync(destDir + '\\' + fileOnlyName, 'w');
                fs.writeSync(destFd, buffer, 0, buffer.length, 0);
                fs.closeSync(destFd);
            }
        }
    }
});