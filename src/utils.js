/**
 * @author github.com/tintinweb
 * @license MIT
 * */


const fs = require('fs');
const path = require('path');


const getAllDirFiles = function (dirPath, isIncluded, arrayOfFiles) {
    isIncluded = isIncluded || function() {return true};
    arrayOfFiles = arrayOfFiles || []

    let files = [];
    if(fs.lstatSync(dirPath).isFile()){
        // single file
        if(isIncluded(dirPath)){
            arrayOfFiles.push(dirPath);
        }
        return arrayOfFiles;
    } else {
        files = fs.readdirSync(dirPath);
    } 
    

    files.forEach(function (file) {
        const f_full = path.join(dirPath, file);
        if (fs.statSync(f_full).isDirectory()) {
            arrayOfFiles = getAllDirFiles(f_full, isIncluded, arrayOfFiles)
        } else if(isIncluded(file)) {
            arrayOfFiles.push(f_full)
        }
    })

    return arrayOfFiles
}

function sortObjByValue(o) {
    return Object.entries(o)
    .sort(([,a],[,b]) => a-b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

function sortObjByArrayLength(o) {
    return Object.entries(o)
    .sort(([,a],[,b]) => a.length-b.length)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

function filterObjByValue(o, f) {
    return Object.entries(o)
    .filter(([,v]) => f(v))
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
}

module.exports = {
    getAllDirFiles,
    sortObjByValue,
    sortObjByArrayLength,
    filterObjByValue
}