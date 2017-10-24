/** MyFileUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
var INFO = 0; var ERROR = 1; WARNING = 2;

Components.utils.import("resource://gre/modules/FileUtils.jsm");

function createDirectory(tmpdir) {
        var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        directory.initWithPath(tmpdir);
        if (directory.exists() === false) {
            directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 420);
        }
        return true;
}

function save(saveFile, outputText) {
        var filename = saveFile;
	    var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(filename);
        if (file.exists() === false) {
            file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
        }
        var outputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
        outputStream.init(file, 0x04 | 0x10, 420, 0);
        outputStream.write(outputText, outputText.length);
		var newline = "\r\n";
        outputStream.write(newline, newline.length);
        outputStream.close();
        return true;
}

function writeFile(fileName, data, overwrite) {
	// file is nsIFile, data is a string
	var file = new FileUtils.File(fileName);
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
				   createInstance(Components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	if (overwrite){
		foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	}
	else {
		foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0); 
	}

	// if you are sure there will never ever be any non-ascii text in data you can 
	// also call foStream.write(data, data.length) directly
	var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
					createInstance(Components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, "UTF-8", 0, 0);
	converter.writeString(data);
	converter.close(); // this closes foStream
}

function ConfigFile(path, file){
	this.path = path;
	this.file = file;
	this.fullPath = function() { return this.path + this.file};
}

function renameFile(oldFileName, destDir, newFileName) {
		if (!fileExists(oldFileName)){
		   return false;
		}
		
		var newDir = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        var oldFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		
        newDir.initWithPath(destDir);
		createDirectory(destDir);
        oldFile.initWithPath(oldFileName);
		oldFile.moveTo(newDir, newFileName);
        return true;
}

function copyFile(oldFileName, destDir, newFileName) {
		if (!fileExists(oldFileName)){
		   return false;
		}
		var newDir = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        var oldFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        newDir.initWithPath(destDir);
		createDirectory(destDir);
        oldFile.initWithPath(oldFileName);
		oldFile.copyTo(newDir, newFileName);
        return true;
}

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function deleteFile(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		if (file.exists()){
			try {
				file.remove(false);
			} catch (err) {
				return false;
			}
			return true;
		}
		return false;
}

function readFile(filename){
	// open an input stream from file
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	// read lines into array
	var line = {}, lines = [], hasmore;
	do {
	  hasmore = istream.readLine(line);
	  lines.push(line.value);
	} while(hasmore);
	istream.close();
	return lines;
}

function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file.fullPath(), jstr, true);
}

function initObject(obj, arrayOfObjects){
	var fileName = typeof obj === "string" ? obj : obj.fullPath();
	if (fileExists(fileName)){
		var lines = readFile(fileName);
		if (lines != null){
			if (lines.length == 1 && arrayOfObjects == null){
			   return JSON.parse(lines[0]);
			}
			else if (lines.length > 1 && arrayOfObjects == null){
				var jsonStr = "";
				for (var i=0; i < lines.length; i++){
					if (lines[i] != null && lines[i].trim() != ""){
						jsonStr = jsonStr + lines[i].trim();
					}
				}
				return JSON.parse(jsonStr);
			}
			else {
				for (var i=0; i < lines.length; i++){
					if (lines[i] != null && lines[i].trim() != ""){
						var profileObject = JSON.parse(lines[i]);
						arrayOfObjects.push(profileObject);
					}
				}
				return arrayOfObjects;
			}
		}
	}
	else {
		var errorMsg = "File " + fileName + " not found!";
		alert(errorMsg);
		throw new Error(errorMsg);
	}
}

function writeLineToCSV(filename, data, seperator){
   if (data == null || data.length == 0) return -1;
   var line = "";
   var sep = seperator == null ? ";" : seperator;
   for (i=0; i < data.length; i++){
	   line+= ((i > 0) ? sep: "") + data[i];
   }
   line+= "\r\n";
   writeFile(filename, line);
}

function writeObjectToCSV(object, file){
	var vals = [];
	var headers = [];
	var firstLine = false;
	if (!fileExists(file)){
		firstLine = true;
	}
	for(var key in object) {
		if (Object.prototype.hasOwnProperty.call(object, key)) {
			if (firstLine){
				headers.push(key);
			}
			vals.push(object[key]);
		}
	}
	if (firstLine) {
		writeLineToCSV(file, headers);
	}
	writeLineToCSV(file, vals);
	
}

function decodeBase64 (input) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	while (i < input.length) {

		enc1 = _keyStr.indexOf(input.charAt(i++));
		enc2 = _keyStr.indexOf(input.charAt(i++));
		enc3 = _keyStr.indexOf(input.charAt(i++));
		enc4 = _keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}

	}

	//output = _utf8_decode(output);

	return output;
}
