var DATASOURCE_DIR = "C:\\My Programs\\iMacros\\Datasources\\";
var BASE_DIR = "C:\\My Programs\\iMacros\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var CONFIG_DIR  = BASE_DIR + "config\\";

var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log.RECON.E2E." + getDateYYYYMMDD() + ".txt";
var INFO = 0; var ERROR = 1; WARNING = 2;
var PREFIX = "Work/e2ekeepsafes/";
var SUCCESS = 1;
var RECON_OBJ = {"total": 0, "tppns": ["3450"], "size": 200, "streamId": 57};
var E2E_OBJ = {"id": 0, "comment": null, "method": null};
var E2E_FILE = DATASOURCE_DIR + "e2e.csv";
var E2E_NEW_FILE = DATASOURCE_DIR + "e2eResult.csv";
var CONSTANTS = Object.freeze({
	"E2E_REC" : {
		"ID": 0,
		"COMMENT": 1,
		"METHOD": 2
	}
});
String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

String.prototype.repeat = function(times){
    var result="";
    var pattern=this;
    while (times > 0) {
        if (times&1)
            result+=pattern;
        times>>=1;
        pattern+=pattern;
    }
    return result;
};

Components.utils.import("resource://gre/modules/FileUtils.jsm");

	var retcode = 1;
	var NEWLINE = "\n";
    logV2(INFO, "*".repeat(100));
	logV2(INFO, "Start");
    logV2(INFO, "*".repeat(100));
	var found = false;

	deleteFile(E2E_NEW_FILE);
	var lines = readFile(E2E_FILE);
	var counter = 0;
	lines.forEach(function (line) {
		if (counter > 5){
			return;
		}
		else {
			counter++;
		}
		if (!isNullOrBlank(line)){
			var fields = addRecord(line);
			writeLineToCSV(E2E_NEW_FILE, fields, ";");
			//logV2(INFO, line);
			//logV2(INFO, "field 1:" + fields[CONSTANTS.E2E_REC.ID]);
			//logV2(INFO, "field 2:" + fields[CONSTANTS.E2E_REC.COMMENT]);
			//logV2(INFO, "field 3:" + fields[CONSTANTS.E2E_REC.METHOD]);
		}
	});


    function addRecord(line) {
		var fields = line.split(";");
        iimSet("METHOD", fields[CONSTANTS.E2E_REC.METHOD]);
		iimSet("ID", fields[CONSTANTS.E2E_REC.ID]);
		iimSet("COMMENT", fields[CONSTANTS.E2E_REC.COMMENT]);
        var retCode = iimPlay(PREFIX + "01_NewEntry.iim");
        if (retCode == SUCCESS) {
			logV2(INFO, "Adding " + fields[CONSTANTS.E2E_REC.ID]);
        	if (checkForError()) {
				logV2(INFO, "ERROR adding record");
				fields.push(getError());
			}
        	else {
				logV2(INFO, fields[CONSTANTS.E2E_REC.ID] + "Added");
				fields.push("OK");
			}
        }
        else {
        	logException("Problem adding record");
        }
        return fields;
    }

function getError(){
	var msg = "";
    	retCode = iimPlay(PREFIX + "03_GetError.iim");
	if (retCode == SUCCESS){
		msg = getExtract(1) + " : " + getExtract(2);
		logV2 (INFO, msg);
	}
	else {
		logV2(INFO, "Problem extracting error");
	}
	return msg;
}


function writeLineToCSV(filename, data, seperator){
	if (data == null || data.length == 0) return -1;
	var line = "";
	var sep = seperator == null ? ";" : seperator;
	for (i=0; i < data.length; i++){
		line+= ((i > 0) ? sep: "") + data[i];
	}
	//line+= "\r\n";
	save(filename, line, false);
}

function checkForError(){
    var error = false;
    retCode = iimPlay(PREFIX + "02_CheckError");
    if (retCode == SUCCESS){
    	error = true;
    }
    return error;
}


function logException(message){
    logV2(WARNING,message);
    throw new Error(message);
}


function getExtract(nr){
		var txt2 = iimGetLastExtract(nr);
		return txt2==null ? null : txt2.trim();
}


function save(fileName, data, overwrite) {
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
	os.writeString("\r\n");
	os.close();
}


function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file, jstr, true);
}

function renameFile(oldFileName, directory, newFileName) {
        var newDir = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        var oldFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);

        newDir.initWithPath(directory);
		createDirectory(directory);
        oldFile.initWithPath(oldFileName);
		oldFile.moveTo(newDir, newFileName);
        return true;
}

function getDateYYYYMMDD(){
//   var d1=new Date();
//   return d1.toString('yyyyMMdd');
   
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2));
	   
}

function pad(number, length) {
   
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;

}

function createDirectory(tmpdir) {
        var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        directory.initWithPath(tmpdir);
        if (directory.exists() === false) {
            directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 420);
        }
        return true;
}


function logV2(type, outputText, logFile){
	var currentTime = formatDateYYYYMMDDHHMISS();
	switch (type) {
		case ERROR:
			log(currentTime + " " + "ERROR: " + outputText, ERROR_LOG);
			break;
		case WARNING:
			log(currentTime + " " + "WARN: " + outputText, logFile);
			break;
		case INFO:
			log(currentTime + " " + "INFO: " + outputText, logFile);
			break;
		default:
			log(outputText, logFile);
			break;
   }
}

function log(outputText, logFile) {
        //var filename = LOG_DIR + "log." + getDateYYYYMMDD() + ".txt";
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
	var tmpLogFile = LOG_FILE;
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
        return true;
}

function formatDateYYYYMMDDHHMISS(){
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	return ("" + pad(curr_date,2) + "/" + pad(curr_month,2) + "/" + curr_year +  " " + pad(hours,2) + ":" + pad(minutes,2) + ":" + pad(seconds,2));
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

function deleteFile(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		if (file.exists()){
			file.remove(false);
			return true;
		}
		return false;
}

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function convertToNumber (sNumber, defaultNumber) {

 if (sNumber == null) return defaultNumber;
 if (isNaN(sNumber)) return defaultNumber;
 return parseInt(sNumber);
}

function initObject(fileNameObject, arrayOfObjects){
	
	var fileName = fileNameObject.fullPath();
	log("INFO: Processing JSON file " + fileName);
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

function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file.fullPath(), jstr, true);
}

function isNullOrBlank(param){
   if (param != null && param != "#EANF#" && param != ""){
      return false;
   }
   return true;
}

function isNumeric(param){
	if (param == null || isNaN(Number(param))){
		return false;
	}
	return true;
}

function getFileDirectory(filePath) {
  if (filePath.indexOf("/") == -1) { // windows
    return filePath.substring(0, filePath.lastIndexOf('\\'));
  } 
  else { // unix
    return filePath.substring(0, filePath.lastIndexOf('/'));
  }
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

function stripPath(filename){
	return filename.replace(/^.*(\\|\/|\:)/, '');
}

function getDateYYYYMMDDHHMI(){
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2) + pad(hours,2) + pad(minutes,2));
}

function ConfigFile(path, file){
	this.path = path;
	this.file = file;
	this.fullPath = function() { return this.path + this.file};
}

