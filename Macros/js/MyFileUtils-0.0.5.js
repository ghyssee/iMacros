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
Components.utils.import("resource://gre/modules/NetUtil.jsm");

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
        if (file.exists() == false) {
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

function writeFileWrapper(fileName, data, overwrite){
    var counter = 0;
    var success = false;
    do {
        counter++;
        try {
            writeFile(fileName, data, overwrite);
            success = true;
        }
        catch (ex) {
            if (ex.name == "NS_ERROR_FILE_IS_LOCKED") {
                logV2(WARNING, "WRITE", "File was locked: " + fileName);
                logV2(WARNING, "WRITE", "Retries; " + counter);
                if (counter >= 5) {
                    throw ("Problem writing to file: " + fileName);
                }
                else {
                    sleep(1000);
                }
            }
        }
    }
    while (!success && counter < 5);
}

function writeFile(fileName, data, overwrite) {
		// file is nsIFile, data is a string
	// file is nsIFile, data is a string

	// You can also optionally pass a flags parameter here. It defaults to
	// FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
	var flag = FileUtils.MODE_APPEND;
	var file = new FileUtils.File(fileName);
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
    createInstance(Components.interfaces.nsIFileOutputStream);

    if (overwrite){
        foStream.init(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE, 0666, 0);
    }
    else {
        foStream.init(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND, 0666, 0);
    }
    var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
        .createInstance(Components.interfaces.nsIConverterOutputStream);

    os.init(foStream, null, 0, 0x0000);

    os.writeString(data);
    os.close();
}

function writeFilepp(fileName, data, overwrite) {
    // file is nsIFile, data is a string
    // file is nsIFile, data is a string

    // You can also optionally pass a flags parameter here. It defaults to
    // FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    var flag = FileUtils.MODE_APPEND;
    var file = new FileUtils.File(fileName);
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
    createInstance(Components.interfaces.nsIFileOutputStream);

    if (overwrite){
        foStream.init(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE, 0666, 0);
    }
    else {
        foStream.init(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND, 0666, 0);
    }
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var istream = converter.convertToInputStream(data);

    // The last argument (the callback) is optional.
    NetUtil.asyncCopy(istream, foStream, function(status) {
        if (!Components.isSuccessCode(status)) {
            // Handle error!
            throw new Error ("Problem writing to file " + fileName);
        }
        istream.close();
        fostream.flush();
        foStream.close();


        // Data has been written to the file.
    });
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
	var utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].
	getService(Components.interfaces.nsIUTF8ConverterService);
	do {
	   hasmore = istream.readLine(line);
		var data = utf8Converter.convertURISpecToUTF8 (line.value, "UTF-8");
	  lines.push(data);
	} while(hasmore);
	istream.close();
	istream = null;	file = null;
	return lines;
}

function readFileOld(filename){
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
    writeFileWrapper(file.fullPath(), jstr, true);
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
   //line+= "\r\n";
   save(filename, line);
}

function writeObjectToCSV(object, file){
	var vals = [];
	var headers = [];
	var firstLine = false;
	if (!fileExists(file)){
		firstLine = true;
	}
	for(var key in object) {
		//if (Object.prototype.hasOwnProperty.call(object, key)) {
			if (firstLine){
				headers.push(key);
			}
			vals.push(object[key]);
		//}
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

function logHeader(type, id, outputText, token, logFile){
    if (typeof(token) == 'undefined' || token == null) {
    	token = "=";
    }
	log(token.repeat(100));
	logV2(type, id, outputText, logFile);
    log(token.repeat(100));
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

function logError(ex){
    //logV2(INFO, "ERROR", "Filename: " + ex.fileName);
    logV2(INFO, "ERROR", "Line Number: " + ex.lineNumber);
    logV2(INFO, "ERROR", "Name       : " + ex.name);
    logV2(INFO, "ERROR", "Message    : " + ex.message);
    //logV2(INFO, "ERROR", "Stack    : " + ex.stack);
}
