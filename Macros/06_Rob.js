var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Robbing");
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "ROBBING";
var MACRO_FOLDER = "MR/Rob";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 8000;
var FIRST_ATTACK = true;


var counter = 0;

var retCode = initRob();
if (retCode == 1){
	startRobbing();	
}
else {
	alert("Robbing not found!");
}


function initRob(){
	logV2(INFO, CATEGORY, "Init Robbing");
	var retCode = simpleMacroPlayFolder("10_Rob_Init.iim", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Init Robbing status: " + retCode);
	return retCode;
}

function startRobbing(){
	var stamina = getStamina();
	do {
		if (checkStartButton() == 1){
			selectRobbing();
		}
		else if (checkEscapeButton() == 1){
			escapeRobbing();
		}
		else if (checkCollectButton() == 1){
			collectRobbing();
		}
		else if (checkSearchButton() == 1){
			rob();
			stamina = getStamina();
		}	
		else {
			stamina = 0;
			alert("Robbing finished");
		}
	}
	while (stamina > MIN_STAMINA);
}

function rob(){
	logV2(INFO, CATEGORY, "Rob");
	var retCode = simpleMacroPlayFolder("11_Rob_Search", MACRO_FOLDER);
}

function checkEscapeButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=controller\\=rob\\&action\\=escape]");
	logV2(INFO, CATEGORY, "checkEscapeButton: " + oSpan.length);
	// <a href="#" class="ajax_request css_button white spaced disabled">Escape</a>
	// <a href="#" class="ajax_request css_button white spaced" data-params="controller=rob&amp;action=escape">Escape</a>
	
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}


function checkCollectButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=controller\\=rob\\&action\\=collect]");
	logV2(INFO, CATEGORY, "checkCollectButton: " + oSpan.length);
	//<a href="#" class="ajax_request css_button white spaced" data-params="controller=rob&amp;action=collect&amp;bank=1">Collect &amp; Bank</a>
	
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkSearchButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=controller\\=rob\\&action\\=search]");
	logV2(INFO, CATEGORY, "checkSearchButton: " + oSpan.length);
	//<a href="#" class="ajax_request css_button white spaced" data-params="controller=rob&amp;action=search"><span class="stamina ibtn"></span>Search</a>
	
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkStartButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=controller\\=rob\\&action\\=start]");
	logV2(INFO, CATEGORY, "checkStartButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}


function escapeRobbing(){
	logV2(INFO, CATEGORY, "Escape Robbing");
	var retCode = simpleMacroPlayFolder("12_Rob_Escape.iim", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Escape Robbing status: " + retCode);
	return retCode;
}

function selectRobbing(){
	logV2(INFO, CATEGORY, "Select Robbing");
	var retCode = simpleMacroPlayFolder("14_Rob_Start.iim", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Select Robbing status: " + retCode);
	return retCode;
}

function collectRobbing(){
	logV2(INFO, CATEGORY, "Collect Robbing");
	var retCode = simpleMacroPlayFolder("13_Rob_Collect.iim", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "collectRobbing status: " + retCode);
	return retCode;
}

function getStamina(){
	var oSpan = window.content.document.querySelectorAll("span[class*=stamina]");
	var stamina = 0;
	if (oSpan.length >= 1){
		var staminaInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check stamina: " + staminaInfo);
		var items = staminaInfo.split("/");
		if (items.length == 2){
			stamina = items[0].replace(",", "");
			stamina = Number(stamina);
			logV2(INFO, CATEGORY, "stamina: " + stamina);
		}
	}
	return stamina;
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

function getRegistrySetting(branch, key){
	var wrk = Components.classes["@mozilla.org/windows-registry-key;1"]
                    .createInstance(Components.interfaces.nsIWindowsRegKey);
	var id = null;
	try {
		wrk.open(wrk.ROOT_KEY_CURRENT_USER,
			branch,
			wrk.ACCESS_READ);
		id = wrk.readStringValue(key);
	}
	catch (err) {
	}
	wrk.close();
	return id;
}

function getOneDrivePath(){
	var id = getRegistrySetting("SOFTWARE\\Microsoft\\OneDrive", "UserFolder");
	if (id == null){
		id = getRegistrySetting("SOFTWARE\\Microsoft\\SkyDrive", "UserFolder");
	}
	if (id == null){
		var errorMsg = "OneDrive Not Installed on this computer. Please Install it to use this script!";
		alert(errorMsg);
		throw errorMsg;
	}
	return id;
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
