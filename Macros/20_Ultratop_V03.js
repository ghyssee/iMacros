var DATASOURCE_DIR = "C:\\My Programs\\iMacros\\Datasources\\";
var CONFIG_BASE = "iMacros\\config";
var BASE_DIR = "C:\\My Programs\\iMacros\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var CONFIG_DIR  = BASE_DIR + "config\\";
var CONFIG_INI = CONFIG_DIR + "config.ini";
var TMP_DIR = BASE_DIR + "tmp\\";
var ULTRATOP50_BASE = "ultratop/Top50/";

var LOCAL_CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "localconfig.json");
//var ULTRATOP_JSON_FILE = CONFIG_DIR + "ultratop.json";
var ULTRATOP_JSON_FILE = new ConfigFile(CONFIG_DIR, "UltratopConfig.json");
var ULTRATOP_MENU_FILE = new ConfigFile(CONFIG_DIR, "UltratopMenu.json");
var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log.ULTRATOP." + getDateYYYYMMDD() + ".txt";
var INFO = 0; var ERROR = 1; WARNING = 2;
var TIMEOUT = 30;
var WRITE_FILE = false;

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
	var display = "";
	var JANUARY=0; var FEBRUARY=1; var MARCH=2; var APRIL=3; var MAY=4; var JUNE=5; var JULY=6; var AUGUST=7; var SEPTEMBER=8; var OCTOBER=9; var NOVEMBER=10; var DECEMBER=11;
	var SATURDAY = 6;
	var MONTHNAMES = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];
	var NEWLINE = "\n";
	var TITLE = "Ultratop List" + NEWLINE + "-".repeat(100) + NEWLINE.repeat(2);
	
	var localConfigObject = initObject(LOCAL_CONFIG_JSON_FILE);
	alert(JSON.stringify(localConfigObject));
	ULTRATOP_JSON_FILE.path = localConfigObject.global.oneDriveInstallDir + "\\" + CONFIG_BASE + "\\";
	ULTRATOP_MENU_FILE.path = localConfigObject.global.oneDriveInstallDir + "\\" + CONFIG_BASE + "\\";
	var ultratopMenu = initObject(ULTRATOP_MENU_FILE);
	start(ultratopMenu);


	

	
function start(ultratopMenu){
	var m3uObj = initObject(ULTRATOP_JSON_FILE);
	msg = TITLE;
	for (var i=0; i < ultratopMenu.yearMenu.length; i++){
		msg += ultratopMenu.yearMenu[i].description + NEWLINE;
	}
	msg += NEWLINE;
	var curDate = new Date();
	// select year
	var year = selectYear(curDate, TITLE, ultratopMenu);
	var month = ""; var day = "";
	if (year != null){
		month = selectMonth(curDate, TITLE, ultratopMenu);
		if (month == null){
			// do nothing, cancel pressed
		}
		else if (month == "*"){
			for (var i=0; i < ultratopMenu.monthMenu.months.length; i++){
				var day = getFirstSaturDayOfMonth(year, i).getDate();
				var date = new Date(parseInt(year), i, parseInt(day));
				if (date <= curDate){
					processUltratop(ultratopMenu, m3uObj, year, i, day);
				}
				else {
					break;
				}
			}
		}
		else {
			day = selectDay(TITLE, year, month, ultratopMenu);
			if (day != null){
				processUltratop(ultratopMenu, m3uObj, year, month, day);
				// start the process;
			}
		}
	}
	
	if (WRITE_FILE){
		logV2(INFO, "Updating configuration file "+ ULTRATOP_JSON_FILE);
		var newFile = ULTRATOP_JSON_FILE.fullPath() + "." + getDateYYYYMMDDHHMI();
		if (fileExists(newFile)){
			deleteFile(newFile);
		}
		copyFile(ULTRATOP_JSON_FILE.fullPath(), getFileDirectory(ULTRATOP_JSON_FILE.path) + "\\", stripPath(newFile));
		writeObject(m3uObj, ULTRATOP_JSON_FILE);
	}
}

function checkTitle(text){
	var tmp = text.split("\n");
	if (tmp.length > 1){
		if (tmp[0].trim() != ""){
			var newTitle = tmp[0].trim().replace(/^\+ +/g, "");
			return newTitle;
		}
		else {
			return tmp[1].trim();
		}
	}
	return text;
}

function processUltratop(ultratopMenu, m3uObj, year, month, day){
	var date = new Date(year, month, day);
	var dateStr = getDateAsString(date);
	logV2(INFO, "Making ultratop list for date " + dateStr);
	makeUltratopList(ultratopMenu, date, m3uObj);
}	
	
function selectYear(curDate, title, ultratopMenu){
	var year = ultratopMenu.defaultYear;
	var msg = title;
	for (var i=0; i < ultratopMenu.yearMenu.length; i++){
		msg += ultratopMenu.yearMenu[i].description + NEWLINE;
	}
	msg += NEWLINE;
	var inputTxt = prompt(msg, year);
	if (inputTxt != null){
		if (inputTxt != ""){
			year = inputTxt;
		}
		ultratopMenu.defaultYear = year;
		writeObject(ultratopMenu, ULTRATOP_MENU_FILE);
	}
	else {
		return null;
	}
	return year;
}

function selectMonth(curDate, title, ultratopMenu){
	var month = "";
	var msg = title;
	
	for (var i=0; i < ultratopMenu.monthMenu.months.length; i++){
		if (ultratopMenu.monthMenu.months[i].number == curDate.getMonth()){
			month = ultratopMenu.monthMenu.months[i].id;
			break;
		}
	}
	
	msg += ultratopMenu.monthMenu.description + NEWLINE.repeat(2);
	for (var i=0; i < Math.round(ultratopMenu.monthMenu.months.length/2); i++){
		msg += ultratopMenu.monthMenu.months[i].id + " = " + ultratopMenu.monthMenu.months[i].description;
		if ( (i + 6) < ultratopMenu.monthMenu.months.length){
			msg += " ".repeat(10+ultratopMenu.monthMenu.months[i].spacing) + ultratopMenu.monthMenu.months[i+6].id + " = " + ultratopMenu.monthMenu.months[i+6].description;
		}
		msg += NEWLINE;
	}
	msg += NEWLINE;
	var inputTxt = prompt(msg, month);
	if (inputTxt == null){
		return null;
	}
	else if (inputTxt == "*"){
		return inputTxt;
	}
	else if (inputTxt == ""){
		return curDate.getMonth();
	}
	month = null;
	for (var i=0; i < ultratopMenu.monthMenu.months.length; i++){
		if (ultratopMenu.monthMenu.months[i].id == inputTxt){
			month = ultratopMenu.monthMenu.months[i].number;
			break;
		}
	}
	if (month == null){
		alert("Invalid Month selected: " + inputTxt);
	}
	return month;
}

function selectDay(title, year, month, ultratopMenu){
	msg = title;
	msg += "Year    = " + year + NEWLINE;
	msg += "Month = " + month + NEWLINE.repeat(2);
	for (var i=0; i < ultratopMenu.dayMenu.length; i++){
		msg += ultratopMenu.dayMenu[i].description + NEWLINE;
	}
	msg += NEWLINE;
	var day = "";
	var inputTxt = prompt(msg, day);
	if (inputTxt != null){
		if (inputTxt == ""){
			day = getFirstSaturDayOfMonth(year, month).getDate();
		}
		else {
			day = inputTxt;
		}
	}
	else {
		return null;
	}
	var validDate = new Date(year, month, day);
	if (validDate == null){
	}
	else if (validDate.getDay() != SATURDAY){
		alert(getBelgianDate(validDate) + ": This date is not a Saturday");
		return null;
	}
	return day;
}

	
function makeUltratopList(ultratopMenu, date, m3uObj){
	var dateStr = getDateAsString(date);
	var year = date.getFullYear().toString();
	logV2(INFO, "Date : " + dateStr); 
	logV2(INFO, "Year : " + year); 
	display = display + "Ultratop Date: " + dateStr + "\n";
	iimDisplay(display);
	log("-".repeat(100));
	var yearObj = checkYear(m3uObj, year);
	var monthObj = checkMonth(yearObj, dateStr);
	
	var filename = "Ultratop" + dateStr + ".txt";
	if (isNullOrBlank(monthObj.baseDir)){
	// month was not found
		// lookup month in ultratopMenu
		var monthName = "";
		for (var j=0; j < ultratopMenu.monthMenu.months.length; j++){
			if (ultratopMenu.monthMenu.months[j].number == date.getMonth()){
				monthName = ultratopMenu.monthMenu.months[j].description;
				break;
			}
		}
		monthObj.baseDir = "Ultratop 50 " + dateStr + " " + dateStr.substr(6,2) + " " + monthName + " " + dateStr.substr(0,4);
		monthObj.inputFile = "data/" + filename;
		WRITE_FILE = true;
	}
	getUltratopList(year, dateStr, OUTPUT_DIR + filename);
}

function checkYear(yearsObj, year){
	var found = false;
	var yearObj = null;
	for (var i=0; i < yearsObj.years.length; i++){
		var yearObj = yearsObj.years[i];
		if (yearObj.year == year){
			found = true;
			break;
		}
	}
	if (!found){
		var yearObj = {year: year,enabled: true, relativePathId: "2",filter: "Ultratop 50 " + year, m3uMonth: []}
		yearsObj.years.push(yearObj);
		yearsObj.years.sort(
				function (a, b) {
					return a.year.localeCompare(b.year);
				}
		   );
	}
	return yearObj;
}

function checkMonth(yearObj, id){
	var found = false;
	var monthObj = null;
	for (var j=0; j < yearObj.m3uMonth.length; j++){
	   monthObj = yearObj.m3uMonth[j];
	   if (monthObj.id == id){
	      found = true;
		  break;
	   }
	}
	if (!found){
	   monthObj = {id:id, baseDir:"",inputFile:"",enabled:true}
	   yearObj.m3uMonth.push(monthObj);
	   yearObj.m3uMonth.sort(
			function (a, b) {
				return a.id.localeCompare(b.id);
			}
	   );
	}
	return monthObj;
}
	
function getUltratopList(year, date, filename){
	
	var retcode = 0;
	var retries=0;
	
	do {
		iimSet("timeout", TIMEOUT);
		iimSet("year", year);
		iimSet("date", date);
		retcode = iimPlay(ULTRATOP50_BASE + "UltraTop_01_Load.iim");
		// page loading timeout
		if (retcode = -802){
			retcode = 1;
			//retries++;
			logV2(WARNING, "Page Loading Timeout. Consider it as page is loaded correctly..."); 
		}
	} while (retries < 5 && retcode != 1);
	
	deleteFile(filename);
	for (var i=1; i <= 50; i++){
		var songObject = getSong(i);
		writeFile(filename, songObject.position + " " + songObject.artist + " - " + songObject.title + "\r\n", false);
	}
}

function getFirstSaturDayOfMonth(year, month){
	var SATURDAY = 6;
	var date = new Date(year, month,1);
	for (var i=0; i < 7; i++){
		var the_day = date.getDay();
		if (the_day == SATURDAY){
			return date;
		}
		date.setDate(date.getDate() + 1);
	}
    return date; 
}

function getDateAsString(date){
	var curr_date = date.getDate();
	var curr_month = date.getMonth();
	curr_month++;
	var curr_year = date.getFullYear();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2));
}

function getBelgianDate(date){
	var curr_date = date.getDate();
	var curr_month = date.getMonth();
	curr_month++;
	var curr_year = date.getFullYear();
	return (pad(curr_date,2) + "/" + pad(curr_month,2) + "/" + curr_year);
}


function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function getSong(pos){
	// var songObject = initObject(CONFIG_DIR + "song.json");
	var songObject = {position:"", artist:"",title:""}
	//songObject.position = pos.toString().lpad("0", 2);
	iimSet("pos", (pos+1).toString());
	retcode = iimPlay(ULTRATOP50_BASE + "Ultratop_10_GetTrack.iim");
	if (retcode != 1){
		logV2(ERROR, "Problem Getting Track");
		throw new Error("Error Loading Track");
	}
	var txt=iimGetLastExtract(1);
	songObject.position = txt.trim().lpad("0", 2);
	
	iimSet("pos", pos.toString());
	retcode = iimPlay(ULTRATOP50_BASE + "Ultratop_20_GetArtist.iim");
	if (retcode != 1){
		logV2(ERROR, "Problem Getting Artist");
		throw new Error("Error Loading Artist");
	}
	var txt=iimGetLastExtract(1);
	songObject.artist = txt.trim();
	
	iimSet("pos", pos.toString());
	retcode = iimPlay(ULTRATOP50_BASE + "Ultratop_30_GetTitle.iim");
	if (retcode != 1){
		logV2(ERROR, "Problem Getting Title");
		throw new Error("Error Loading Title");
	}
	var txt=iimGetLastExtract(1);
	songObject.title = checkTitle(txt);
	
	return songObject;
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
			log(currentTime + " " + "ERROR: " + outputText, logFile);
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
   if (param != null && param != "#EANF" && param != ""){
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

