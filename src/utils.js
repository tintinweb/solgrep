/**
 * @author github.com/tintinweb
 * @license MIT
 * */


const fs = require('fs');
const path = require('path');


const getAllDirFiles = function (dirPath, isIncluded, arrayOfFiles) {
    let files = fs.readdirSync(dirPath)
    isIncluded = isIncluded || function() {return true};
    arrayOfFiles = arrayOfFiles || []

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


module.exports = {
    getAllDirFiles,
    sortObjByValue
}