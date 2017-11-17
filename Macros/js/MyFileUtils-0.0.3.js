/** MyFileUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
var INFO = 0; var ERROR = 1; WARNING = 2; DEBUG = 3;

Components.utils.import("resource://gre/modules/FileUtils.jsm");

function createDirectory(tmpdir) {
        var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        directory.initWithPath(tmpdir);
        if (directory.exists() === false) {
            directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 420);
        }
		directory = null;
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
		file = null; outputStream = null;
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
	file = null; foStream = null; converter = null;
}

function writeFile2(fileName, data, overwrite) {
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
	file = null; foStream = null; converter = null;
}

function ConfigFile(path, file){
	this.path = path;
	this.file = file;
	this.fullPath = function() { return this.path + this.file};
}

function LogFile(path, file, nodeId){
	this.path = path;
	this.file = file;
	this.nodeId = nodeId == null ? "" : nodeId + ".";
	this.fullPath = function() { return this.path + "log." + this.file + "." + this.nodeId + getDateYYYYMMDD() + ".txt"};

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
		newDir = null; oldFile = null;
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
		newDir = null; oldFile = null;
        return true;
}

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		var fileExist = file.exists();
		file = null;
        return fileExist;
}

function deleteFile(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		var ok = false;
		if (file.exists()){
			try {
				file.remove(false);
				ok = true;
			} catch (err) {
				ok = false;
			}
		}
		file = null;
		return ok;
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
	istream = null;	file = null;
	return lines;
}

function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file.fullPath(), jstr, true);
}

function initObject(obj, arrayOfObjects){
	var fileName = typeof obj === "string" ? obj : obj.fullPath();
	logV2(INFO, "INIT", "Initializing object from file " + fileName);
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

function displayObj(obj){
	var jstr = JSON.stringify(obj, null, "   ");
	alert (jstr);
}


function logObj(obj){
	var jstr = JSON.stringify(obj, null, "   ");
	logV2(DEBUG, "OBJECT", jstr);
}

function writeLineToCSV(filename, data, seperator){
   if (data == null || data.length == 0) return -1;
   var line = "";
   var sep = seperator == null ? ";" : seperator;
   for (i=0; i < data.length; i++){
	   line+= ((i > 0) ? sep: "") + data[i];
   }
   line+= "\r\n";
    writeFile2(filename, line);
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

function logV2(type, id, outputText, logFile){
	var currentTime = formatDateYYYYMMDDHHMISS();
	switch (type) {
		case ERROR:
			log("Profile = " + id, ERROR_LOG);
			log(currentTime + " " + "ERROR: " + outputText, ERROR_LOG);
			break;
		case WARNING:
			log(currentTime + " " + "WARN: Profile: " + id + " - " + outputText, logFile);
			break;
		case INFO:
			log(currentTime + " " + "INFO: Profile: " + id + " - " + outputText, logFile);
			break;
		case DEBUG:
			if (LOG_DEBUG){
				log(currentTime + " " + "DEBUG: Profile: " + id + " - " + outputText, logFile);
			}
			break;
		default:
			log(outputText, logFile);
			break;
   }
}

function log(outputText, logObj) {
        //var filename = LOG_DIR + "log." + getDateYYYYMMDD() + ".txt";
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
	var logFile = null;
	//try {
		logFile = logObj == null ? null : logObj.fullPath();
	//}
	//catch (error){
		//alert(logObj);
	//}
	var tmpLogFile = LOG_FILE.fullPath();
	if (logFile != null && logFile.trim() != ""){
		tmpLogFile = logFile;
	}
	file.initWithPath(tmpLogFile);
	if (file.exists() === false) {
		file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
	}
	var outputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	outputStream.init(file, 0x04 | 0x10, 420, 0);
	if (outputText != null){
		outputStream.write(outputText, outputText.length);
	}
	var newline = "\r\n";
	outputStream.write(newline, newline.length);
	outputStream.close();
	outputStream = null; file = null;
	return true;
}

function getFirefoxProfilePath(){
	var file = FileUtils.getDir("ProfD", []);
	var filePath = file.path;
	file = null;
	return (filePath);
}