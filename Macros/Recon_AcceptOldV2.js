var MACROS_PATH = getMacrosPath();

var DATASOURCE_DIR = "C:\\My Programs\\iMacros\\Datasources\\";
var BASE_DIR = "C:\\My Programs\\iMacros\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var CONFIG_DIR  = BASE_DIR + "config\\";

var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log.RECON.ACCEPTOLD." + getDateYYYYMMDD() + ".txt";
var INFO = 0; var ERROR = 1; WARNING = 2;
var PREFIX = "Work/Atos/";
var SUCCESS = 1;
var ACCEPTOLD_FILE = DATASOURCE_DIR + "AcceptOldSearchValues.csv";

var searchByDay = true;

var RECON_OBJ = {
    "total": 0, 
	"values": [
	{"value1": "13/03/2014", "value2": "13/03/2014"},
	{"value1": "14/03/2014", "value2": "14/03/2014"},
	{"value1": "15/03/2014", "value2": "20/03/2014"},
	{"value1": "21/03/2014", "value2": "31/03/2014"},	
	{"value1": "01/04/2014", "value2": "08/04/2014"},
	{"value1": "09/04/2014", "value2": "15/04/2014"},
	{"value1": "16/04/2014", "value2": "22/04/2014"},
	{"value1": "23/04/2014", "value2": "30/04/2014"},	
	{"value1": "01/01/2010", "value2": "31/12/2010"},
	{"value1": "01/01/2011", "value2": "31/12/2011"},
	{"value1": "01/01/2012", "value2": "31/12/2012"},
	{"value1": "01/01/2013", "value2": "31/12/2013"},
	{"value1": "01/01/2015", "value2": "31/12/2015"},
	{"value1": "01/01/2016", "value2": "31/12/2016"},
	{"value1": "01/01/2017", "value2": "31/12/2017"},
	{"value1": "01/01/2018", "value2": "31/12/2018"},
	{"value1": "01/01/2019", "value2": "31/12/2019"},
	{"value1": "01/01/2020", "value2": "31/12/2020"},
	{"value1": "01/01/2014", "value2": "31/01/2014"},
	{"value1": "01/02/2014", "value2": "28/02/2014"},
	{"value1": "01/03/20146", "value2": "15/03/2014"},
	{"value1": "16/03/2014", "value2": "31/03/2014"},
	{"value1": "01/04/2014", "value2": "15/04/2014"},
	{"value1": "16/04/2014", "value2": "30/04/2014"},
	{"value1": "01/05/2014", "value2": "15/05/2014"},
	{"value1": "16/05/2014", "value2": "31/05/2014"},
	{"value1": "01/06/2014", "value2": "15/06/2014"},
	{"value1": "16/06/2014", "value2": "30/06/2014"},
	{"value1": "01/07/2014", "value2": "15/07/2014"},
	{"value1": "16/07/2014", "value2": "31/07/2014"},
	{"value1": "01/08/2014", "value2": "15/08/2014"},
	{"value1": "16/08/2014", "value2": "31/08/2014"},
	{"value1": "01/09/2014", "value2": "15/09/2014"},
	{"value1": "16/09/2014", "value2": "30/09/2014"},
	{"value1": "01/10/2014", "value2": "15/10/2014"},
	{"value1": "16/10/2014", "value2": "31/10/2014"},
	{"value1": "01/11/2014", "value2": "15/11/2014"},
	{"value1": "16/11/2014", "value2": "30/11/2014"},
	{"value1": "01/12/2014", "value2": "31/12/2014"}
	],
	"searchField1": "TXDATE*||from",
	"searchField2": "TXDATE*||to",
	"comment": "Accept old of 2021 transactions",
	"size": 300,
	"streamId": 58};
	// 449 = ADS Mercury
	// 56 = PCE TPPN selfservice transacties
	// 58 = Atos Worldline TPPN selfservice transacties (versus storting bankrekening ING voor tppnperiod afsluiting)

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
	

	
	initAcceptOld();
	/*
	var lines = readFileWrapper(ACCEPTOLD_FILE);
	lines.forEach(function (item, index) {
        logV2(INFO, "Processing: " + item);
        logV2(INFO, "=".repeat(100));
        logV2(INFO, "Search field: " + RECON_OBJ.value);
        logV2(INFO, "Stream Id: " + RECON_OBJ.streamId);
        processValue(RECON_OBJ.searchField1, RECON_OBJ.searchField2, item, RECON_OBJ.streamId.toString());
	});*/
	//processValue(RECON_OBJ.streamId.toString());
	
	if (!searchByDay){	
		RECON_OBJ.values.forEach(function (item) {
			logV2(INFO, "Processing Value1: " + item.value1);
			logV2(INFO, "Processing Value2: " + item.value2);
			logV2(INFO, "=".repeat(100));
			logV2(INFO, "Stream Id: " + RECON_OBJ.streamId);
			processValue(RECON_OBJ.searchField1, RECON_OBJ.searchField2, item, RECON_OBJ.streamId.toString());
		}); 
	}
	
	else {
		var startDate = new Date(2000, 00, 01);
		var endDate = new Date(2021, 11, 31);
		var days = daysBetween(startDate, endDate);
		logV2(INFO, "Days Between: " + days);
		
		for (i=0; i <= days; i++){
			var newDate =  new Date(startDate.getTime() + 86400000*i); // + 1 day in ms
			logV2(INFO, "Processing Date: " + newDate);
			logV2(INFO, "Formatted Date: " + getFormattedDateDDMMYYY(newDate));
			logV2(INFO, "=".repeat(100));
			var item = {"value1": getFormattedDateDDMMYYY(newDate), "value2": getFormattedDateDDMMYYY(newDate)};
			processValue(RECON_OBJ.searchField1, RECON_OBJ.searchField2, item, RECON_OBJ.streamId.toString());
		}
	}
	
	
	function initAcceptOld(){
        var retCode = iimPlay(PREFIX + "00_InitAcceptOld");
        if (retCode != SUCCESS) {
			logException("Problem initializing Accept Old");
		}
	}

    function processValue(searchField1, searchField2, item, streamId) {
        RECON_OBJ.total = 0;
		//var formatDate = getFormattedDateDDMMYYY(newDate);
        //iimSet("DATE", formatDate);
        iimSet("STREAM", streamId);
        var retCode = iimPlay(PREFIX + "01_Select_Stream");
        if (retCode == SUCCESS) {
            do {
                var found = doAcceptOld(searchField1, searchField2, item);
                if (found) {
                    logV2(INFO, "Number Of Times Confirmed: " + RECON_OBJ.total);
                }
                logV2(INFO, "Found: " + false);
            }
            while (found);
        }
        else {
                logException("Problem Selecting Stream");
        }
    }

function checkIfDataFound(){
    var found = false;
    logV2(INFO, "Entering checkIfDataFound");
    retCode = iimPlay(PREFIX + "10_Records_Found.iim");
    if (retCode == SUCCESS){
        var msg = getExtract(1);
        if (msg.toUpperCase().startsWith("GEEN DATA")){
            found = false;
        }
        else {
            found = true;
        }
    }
    else {
        logException("Problem Records Found");
    }
    logV2(INFO, "found: " + found);
    return found;
}

function doAcceptOld(searchField1, searchField2, item){
	logV2(INFO, "Accept Old");
	var dataFound = false;
    dataFound = checkIfDataFound();
    if (dataFound){
        logV2(INFO, "Data found. No need to search again");
        retCode = confirmAcceptOld(item);
    }
    else {
        iimSet("FIELD1", searchField1);
        iimSet("VALUE1", item.value1);
        iimSet("SIZE", RECON_OBJ.size);
		if (isNullOrBlank(searchField2)){
			retCode = iimPlay(PREFIX + "02_Search_Records_1");
		}
		else {
			iimSet("FIELD2", searchField2);
			iimSet("VALUE2", item.value2);
			retCode = iimPlay(PREFIX + "02_Search_Records_2");
		}
        if (retCode == SUCCESS) {
            dataFound = checkIfDataFound();
            if (!dataFound){
                logV2(INFO, "No data found");
            }
            else {
                //retCode = confirmAcceptOld(searchField, value);
            }
        }
	}
	return dataFound;
}

function logException(message){
    logV2(WARNING,message);
    throw new Error(message);
}

function confirmAcceptOld(item){
    var retCode = iimPlay(PREFIX + "03_Select_Records.iim");
	if (retCode == SUCCESS){
        iimSet("VALUE", RECON_OBJ.comment);
		logV2(INFO, RECON_OBJ.comment + ": " + item.value1 + " - " + item.value2);
		retCode = iimPlay(PREFIX + "04_Confirm.iim");
		if (retCode == SUCCESS) {
		  RECON_OBJ.total++;
		}
    	else {
            logException("Problem Confirm Accept Old");
		}
    }
    else {
        logException("Problem Selecting Records");
    }
    return retCode;
}

function getExtract(nr){
		var txt2 = iimGetLastExtract(nr);
		return txt2==null ? null : txt2.trim();
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

function daysBetween(startDate, endDate) {
    return Math.floor((endDate - startDate ) / 86400000); 
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

function getFormattedDateDDMMYYY(origDate){
//   var d1=new Date();
//   return d1.toString('yyyyMMdd');
   
	var curr_date = origDate.getDate();
	var curr_month = origDate.getMonth();
	curr_month++;
	var curr_year = origDate.getFullYear();
	return ("" + pad(curr_date,2) + "/" + pad(curr_month,2) + "/" + curr_year);
	   
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

function readScript(filename){

    // open an input stream from file
    var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);

    // read lines into array
    var script = "";
    var line = {}, lines = [], hasmore;
    do {
        hasmore = istream.readLine(line);
        script += line.value + "\r\n";
    } while(hasmore);

    istream.close();

    return script;

}

function getMacrosPath(){
    var value = getFirefoxSetting("extensions.imacros.",  "defsavepath");
    if (value == null){
        throw new Error("iMacros Probably not installed...");
    }
    return value;
}


function getFirefoxSetting(branch, key){

    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);

    var value = prefs.getCharPref(key, Components.interfaces.nsISupportsString);
    return value;
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


function readFileWrapper(fileName){
    var counter = 0;
    var success = false;
    var lines = [];
    do {
        counter++;
        try {
            lines = readFile(fileName);
            success = true;
        }
        catch (ex) {
            if (ex.name == "NS_ERROR_FILE_IS_LOCKED") {
                logV2(WARNING, "READ", "File was locked: " + fileName);
                logV2(WARNING, "READ", "Retries; " + counter);
                if (counter >= 5) {
                    throw ("Problem reading file: " + fileName);
                }
                else {
                    sleep(1000);
                }
            }
        }
    }
    while (!success && counter < 5);
    return lines;
}

