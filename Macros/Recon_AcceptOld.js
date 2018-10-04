﻿var DATASOURCE_DIR = "C:\\My Programs\\iMacros\\Datasources\\";
var BASE_DIR = "C:\\My Programs\\iMacros\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var CONFIG_DIR  = BASE_DIR + "config\\";

var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log.RECON.ACCEPTOLD." + getDateYYYYMMDD() + ".txt";
var INFO = 0; var ERROR = 1; WARNING = 2;
var TIMEOUT = 120;
var WRITE_FILE = false;
var PREFIX = "Work/Atos/"
var SUCCESS = 1;
var RECON_OBJ = {"total": 0, "TPPN": "3280", "size": 100};

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
	var TITLE = "Ultratop List" + NEWLINE + "-".repeat(100) + NEWLINE.repeat(2);
	logV2(INFO, "Start");
	logV2(INFO, "Total Confirmed: " + RECON_OBJ.total);
	var found = false;
	do {
        found = doAcceptOld(RECON_OBJ.TPPN);
        if (found){
        	logV2(INFO, "Number Of Times Accepted: " + RECON_OBJ.total);
        }
        if (RECON_OBJ.total > 3){
        	found = false;
		}
    }
    while (found);
	
function doAcceptOld(tppn){
	logV2(INFO, "Accept Old");
	var found = false;
	//iimSet("header", header.toString());
	var retCode = iimPlay(PREFIX + "01_Select_Stream");
	if (retCode == SUCCESS){
        iimSet("TPPN", tppn);
        iimSet("SIZE", RECON_OBJ.size);
        retCode = iimPlay(PREFIX + "02_Search_Records");
        if (retCode == SUCCESS){
            retCode = iimPlay(PREFIX + "10_Records_Found.iim");
            if (retCode == SUCCESS){
				var msg = getExtract(1);
				if (msg.startsWith("Geen data")){
                    logV2(INFO, "No data found");
				}
				else {
					found = true;
					retCode = confirmAcceptOld(tppn);
				}
            }
            else {
                logV2(WARNING, "Problem Records Found");
			}
		}
    	else {
            logV2(WARNING, "Problem Searching Records");
        }
	}
	else {
        logV2(WARNING, "Problem Selecting Stream");
	}
	return found;
}

function confirmAcceptOld(tppn){
    var retCode = iimPlay(PREFIX + "03_Select_Records.iim");
	if (retCode == SUCCESS){
        iimSet("TPPN", tppn);
		retCode = iimPlay(PREFIX + "04_Confirm.iim");
		if (retCode == SUCCESS) {
		  RECON_OBJ.total++;
		}
    	else {
			logV2(WARNING, "Problem Confirm Accept Old");
		}
    }
    else {
    	logV2(WARNING, "Problem Selecting Records");
    }
    return retCode;
}

function getExtract(nr){
		var txt2 = iimGetLastExtract(nr);
		return txt2==null ? null : txt2.trim();
}	

function getEmptyObj(){
		var obj = {description:"", sd:null, ed:null, minRange:null, maxRange:null, price:0,
		           value:null, priceElementDescription:null, fixed: null, quantityType: null,
				   valueType:null, calculationType: null
		          };
		return obj;
}

function addLine(file, obj){
	var line = null;
	for (var name in obj) {
		if (line == null){
			line = "";
		}
		else {
		   line += ";";
		}
		line += obj[name];
	}
	line += NEWLINE;
	writeFile(file, line, false);
}
	
function addHeader(file, obj){
	var line = null;
	for (var name in obj) {
		if (line == null){
			line = "";
		}
		else {
		   line += ";";
		}
		line += name;
	}
	line += NEWLINE;
	writeFile(file, line, false);
}
	
function getValue(macro, pos, header){
		logV2(INFO, "Pos = " + pos);
		logV2(INFO, "Header = " + header);
		iimSet("pos", pos.toString());
		iimSet("pos2", (pos-1).toString());
		iimSet("header", header.toString());
		var macroName = "PMT/" + macro + ".iim";
		retcode = iimPlay(macroName);
		var txt=iimGetLastExtract(1);
		logV2(INFO, "Macro: " + macroName + 
		      " / Txt: " + txt +
			  " / Retcode: " + retcode);
		
		return txt==null ? null : txt.trim();
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function htmlDecode(enitity){
	var decoded = enitity.replace(/&amp;/g, "&");
	decoded = decoded.replace(/&gt;/g, ">");
	decoded = decoded.replace(/&lt;/g, "<");
	decoded = decoded.replace(/&quot;/g, '"');
	decoded = decoded.replace(/'&#39;/g, "'");
	return decoded;
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
	do {
	  hasmore = istream.readLine(line);
	  lines.push(line.value);
	} while(hasmore);
	 
	istream.close();
	
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

