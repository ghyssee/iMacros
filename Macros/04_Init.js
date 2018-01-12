// 788
var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));

var localConfigObject = null;
LOG_FILE = new LogFile(LOG_DIR, "MRInit");
var GLOBAL_SAVE = false;

init();
setProfile();
checkMRProperties();

function checkMRProperties(){
    var initFile = new ConfigFile(MR_DIR + 'INIT\\', MR.MR_CONFIG_FILE);
    logV2(INFO, "INIT", "Check MR Config File For All Profiles: " + initFile.fullPath());
    var obj = initObject(initFile);
    var profileObj = initObject(MR_PROFILE_FILE);
    profileObj.list.forEach(function (item) {
        var profilerFile = new ConfigFile(MR_DIR + (item.main ? '' : (item.id + '\\')), MR.MR_CONFIG_FILE);
        var profilerObj = initObject(profilerFile);
        logV2(INFO, "INIT", "Profile:" + item.name);
        check(obj, profilerObj);
        if (GLOBAL_SAVE){
            logV2(INFO, "INIT", "Update File: " + JSON.stringify(profilerObj));
            writeObject(profilerObj, profilerFile);
        }
    });
    //setMRPathProfile("INIT","MRInit");
}

function check(obj, profilerObj){
    if (hasProperties(obj)) {
        var arrayOfKeys = Object.getOwnPropertyNames(obj);
        arrayOfKeys.forEach(function (key) {
            //logV2(INFO, "INIT", "Key: " + key);
            if (hasProperties(obj[key])) {
                //logV2(INFO, "INIT", "Sub Properties: " + key);
                if (!profilerObj.hasOwnProperty(key)){
                    logV2(INFO, "INIT", "Property With Children does not exist: " + key);
                    profilerObj[key] = obj[key];
                    GLOBAL_SAVE = true;
                }
                check(obj[key], profilerObj[key]);
            }
            else if (profilerObj.hasOwnProperty(key)){
                //logV2(INFO, "INIT", "Property OK: " + key);
            }
            else {
                logV2(INFO, "INIT", "Property does not exist: " + key);
                profilerObj[key] = obj[key];
                GLOBAL_SAVE = true;
            }
        });
    }
}

function hasProperties(obj){
    if (obj != null && typeof obj == 'object') {
        //logV2(INFO, "INIT", "hasProperties: " + JSON.stringify(obj));
        var tmp = Object.getOwnPropertyNames(obj);
        //logV2(INFO, "INIT", "tmp: " + tmp.length);
        return tmp.length > 0;
    }
    return false;
}

function setProfile(){
    logV2(INFO, "INIT", "Mafia Reloaded Set Profile");
    var profile = getFirefoxSetting(MR_BRANCH,  MR_PROFILE_KEY);
    if (isNullOrBlank(profile)){
        profile = "";
    }
    var inputTxt = prompt("Set Profile", profile);
    if (inputTxt == null) {
        // cancel pressed
    }
    else {
        profile = inputTxt;
        changeFirefoxSetting(MR_BRANCH, MR_PROFILE_KEY, profile);
        logV2(INFO, "INIT", "Set Profile to " + profile);
        createDirectory(MR_DIR);
        validateDirectory(MR_DIR);
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
