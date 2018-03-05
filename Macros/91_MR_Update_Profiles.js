var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));

var localConfigObject = null;
var SUCCESS = 1;
LOG_FILE = new LogFile(LOG_DIR, "MRUpdateProfiles");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

init();
var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var UPDATE_DATE = "20180305";

var tmp = "<a href=\"#\" class=\"ajax_request tag\" data-params=\"controller=gang&amp;action=view&amp;id=7107146\" style=\"outline: 1px solid blue;\">HHH</a>";
startScript();

function startScript(){
    try {
        startProfileUpdate();
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            //writeObject(fighterObj, MR_FIGHTERS_FILE);
            // do nothing
        }
        else {
            logError(ex);
        }
    }
}


function init(){
		
	localConfigObject = initObject(LOCAL_CONFIG_JSON_FILE);
	localConfigObject.global.oneDriveInstallDir = ONEDRIVEPATH + "\\";

	var oneDrivePath = localConfigObject.global.oneDriveInstallDir;
	var IMACROS_CONFIG_DIR = "\\iMacros\\config\\";
	
	if (!isNullOrBlank(oneDrivePath)){
		if (localConfigObject.global.config == "ONEDRIVE"){
			CONFIG_ONEDRIVE_DIR = oneDrivePath + IMACROS_CONFIG_DIR; 
			CONFIG_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting Config file to " + CONFIG_JSON_FILE.fullPath());
			PROFILE_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting Profiles file to " + PROFILE_JSON_FILE.fullPath());
			SCRIPT_ONEDRIVE_DIR.path = oneDrivePath + "\\";
			logV2(INFO, "INIT", "OneDrive Datasource Path = " + SCRIPT_ONEDRIVE_DIR.fullPath());
		}
	}
		validateDirectory(LOG_DIR);
}

function validateDirectory(directoryName){
	if (!fileExists(directoryName)){
		var errorMsg = "Directory does not exist: " + directoryName;
		alert(errorMsg);
		logV2(ERROR, "ERROR", errorMsg);
		throw new Error(errorMsg);
	}
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

function startProfileUpdate(){
    logV2(INFO, "FIGHT", "Update Profiles");
    var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
    var length = fighterObj.fighters.length;
    var save = false;
    var cnt=0;
    var currDate = getDateYYYYMMDD();
    fighterObj.fighters.forEach(function (fighter)
    {
        if (propertyExistAndNotNull(fighter, "lastUpdatedOn")){
            if (fighter.lastUpdatedOn >= UPDATE_DATE){
                return; // skip this element
            }
        }
        cnt++;
        logV2(INFO, "PROFILE", cnt + "/" + length);
        if (fighter.gangId == null) {
            addMacroSetting("ID", fighter.id);
            var retCode = playMacro(FIGHT_FOLDER, "82_Profile_Update_Init.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS) {
                retCode = playMacro(FIGHT_FOLDER, "83_Profile_Update_Gang.iim", MACRO_INFO_LOGGING);
                if (retCode == SUCCESS) {
                    logV2(INFO, "PROFILE", "Fighter: " + fighter.id + "/" + fighter.name);
                    var gangName = getLastExtract(1);
                    if (isNullOrBlank(gangName)){
                        logV2(INFO, "PROFILE", "No Gang Found...");
                    }
                    else {
                        var msg = getLastExtract(2);
                        fighter.lastUpdatedOn = currDate;
                        fighter.gangId = extractGangIdFromString(msg);
                        fighter.gangName = gangName;
                        logV2(INFO, "PROFILE", "Gang: " + fighter.gangId + "/" + fighter.gangName);
                        save = true;
                    }
                }
                else {
                    logV2(INFO, "PROFILE", "Problem Getting gang info for id " + fighter.id);
                }
            }
            else {
                logV2(INFO, "FIGHT", "Problem Init Profiles : ");
            }
        }
        if (cnt > 20){
            return;
        }
    });
    if (save){
        writeObject(fighterObj, MR_FIGHTERS_FILE);
    }
    // reload fighters list
    logV2(INFO, "FIGHT", "Update Profiles Finished");

    return;
}

function updateGangInfo(fighterObj, fighter){
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var fighterItem = fighterObj.fighters[i];
        if (fighterItem.id == fighter.id){
            logV2(INFO, "FIGHT", "Updating Gang Info for " + fighter.id);
            fighterItem.gangId = fighter.gangId;
            fighterItem.gangName = fighter.gangName;
            found = true;
            logV2(INFO, "FIGHT", JSON.stringify(fighterItem));
            break;
        }
    }
    if (!found){
        logV2(INFO, "FIGHT", "Problem Updating gang info for " + fighter.id);
    }
}

function getFighterObject(id, name, level){
    return {"id":id, "name":name, "level": level, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null,
        "iced": 0
    };
}


function extractGangFromString (text){
    var gangObj = {id:null, name:null};
    text = text.toUpperCase();
    logV2(INFO, "GANG", "MSG= " + text);
    if (contains(text, "CONTROLLER=GANG")){
        gangObj.id = extractGangIdFromString(text);
        gangObj.name = extractGangNameFromString(text);
    }
    return gangObj;
}

function extractGangIdFromString(text){
    var regExp = /CONTROLLER=GANG&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=([0-9]{1,20})\"/;
    text=text.toUpperCase();
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractGangNameFromString(text){
    var regExp = /CONTROLLER=GANG&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=(?:[0-9]{1,20})\"/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}
