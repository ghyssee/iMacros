/** MyUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
var DATATYPE_STRING = "string";
var DATATYPE_INT    = "number";
var DATATYPE_BOOLEAN= "boolean";
var NODE_ID = getNodeId();
 
Date.prototype.getDOY = function () {
	var onejan = new Date(this.getFullYear(), 0, 1);
	return Math.ceil((this - onejan) / 86400000);
}

String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
      if (count & 1) result += pattern;
      count >>>= 1, pattern += pattern;
    }
    return result + pattern;
  };

 
function endsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

function randomNumber (from, to){
   var upper = to - from+1;
   var random = Math.floor((Math.random()*upper))+from;
   return random;
}

function getDateYYYYMMDD(){
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2));
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

function getDateYYYYMMDDHHMISS(){
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2) + pad(hours,2) + pad(minutes,2) + pad(seconds,2));
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

function getCurrentYear(){
	var currentTime = new Date();
	var year = currentTime.getFullYear();
	return year;
}

function getCurrentMonth(){
	var currentTime = new Date();
	var month = pad(currentTime.getMonth()+1, 2);
	return month;
}

function formatDateMMDDYYYY(){
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	return ("" + pad(curr_month,2) + pad(curr_date,2) + curr_year);
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
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


function replaceAll(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function convertToNumber (sNumber, defaultNumber) {
 if (sNumber == null) return defaultNumber;
 if (isNaN(sNumber)) return defaultNumber;
 return parseInt(sNumber);
}

function encodeBase64(input) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	input = _utf8_encode(input);

	while (i < input.length) {

		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output +
		_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
		_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	}
	return output;
}

function _utf8_encode (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++) {

		var c = string.charCodeAt(n);

		if (c < 128) {
			utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}

	}
	return utftext;
}


function changeFirefoxSetting(branch, key, value){
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);
	var type = typeof(value);
	switch (type) {
		case DATATYPE_STRING:
			prefs.setCharPref(key, value);
			break;
		case DATATYPE_INT:
			prefs.setIntPref(key, value);
			break;
		case DATATYPE_BOOLEAN:
			prefs.setBoolPref(key, value);
			break;
	}
}

function getNodeId(){
	var value = getFirefoxSetting("eric.imacros.",  "nodeId");
	if (value != null){
		return value;
	}
	return "";
}

function getFirefoxSetting(branch, key, type){
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);
	if (isNullOrBlank(type)){
		type = DATATYPE_STRING;
	}
	var value = null;
	try {
		switch (type) {
			case DATATYPE_STRING:
				value = prefs.getCharPref(key, Components.interfaces.nsISupportsString);
				break;
			case DATATYPE_INT:
				value = prefs.getIntPref(key, Components.interfaces.nsISupportsString);
				break;
			case DATATYPE_BOOLEAN:
				value = prefs.getBoolPref(key, Components.interfaces.nsISupportsString);
				break;
		}
	}
	catch (err) { } // key not found
	return value;
}


function changeFirefoxSettingOld(branch, key, value){
var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);
prefs.setCharPref(key, value);
}

function getFirefoxSettingOld(branch, key){
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);
	var value = null;
	try {
		value = prefs.getCharPref(key, Components.interfaces.nsISupportsString);
	}
	catch (err) { }
	return value;
}

function splitLine(line, seperator){
	   var fields = null;
	   if (line != null && line != ""){
		   fields = line.split(seperator);
	   }
	   return fields;
}
function convertStringToBoolean(strBool){
	if (strBool != null){
		if (strBool.toUpperCase() == 'TRUE' || strBool.toUpperCase() == 'ENABLE' || strBool == "1"){
			return true;
		}
	}
	return false;
}

function getExtension(path) {
    var basename = path.split(/[\\/]/).pop(),  // extract file name from full path ...
                                               // (supports `\\` and `/` separators)
    pos = basename.lastIndexOf(".");           // get last position of `.`
    if (basename === "" || pos < 1)            // if file name is empty or ...
        return "";                             //  `.` not found (-1) or comes first (0)
    return basename.slice(pos + 1);            // extract extension ignoring `.`
}

function getUniqueFileName(sourceDir, filename){

	var seperator = "\\";
	if (endsWith(sourceDir, "\\") || endsWith(sourceDir, "/")){
		seperator = ""; 
	}
	var origFileName = filename.replace(/(.*)\.[^.]+$/, "$1");
	var origExt = getExtension(filename);
	var uniqueFileName = filename;
	var i=0;
	var ext = "";
	while (fileExists(sourceDir + seperator  + uniqueFileName) && i < 1000){
		ext = pad(i.toString(), 3);
		i++;
		uniqueFileName = origFileName + "." + ext + "." + origExt;
	}
	if (i >= 1000) {
		return null;
	}
	return uniqueFileName;
}


function removePathFromFileName(fullPath){
	if (!isNullOrBlank(fullPath)){
		return fullPath.split('\\').pop().split('/').pop();
	}
	return fullPath;
}

function getTab()
{
	//var doc = window.opener.gBrowser.contentDocument; //Gets the current document.
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
		   .getService(Components.interfaces.nsIWindowMediator);
	var mainWindow = wm.getMostRecentWindow("navigator:browser");
	var doc = mainWindow.gBrowser.contentDocument; 
	var tab = null;
	var targetBrowserIndex = mainWindow.gBrowser.getBrowserIndexForDocument(doc);
	if (targetBrowserIndex != -1)
	tab = mainWindow.gBrowser.tabContainer.childNodes[targetBrowserIndex];
	else
	return(null);
	//return(tab.linkedPanel);
	return targetBrowserIndex+1;
}