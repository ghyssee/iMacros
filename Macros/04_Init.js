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

init();
setProfile();
setNode();
setAssassinProfile();
setAssassinAutoHeal();
checkMRProperties(MR.MR_CONFIG_FILE);
checkMRProperties(MR.MR_TEMP_SETTINGS_FILE);

function checkMRProperties(configFileCode){
    var initFile = new ConfigFile(MR_DIR + 'INIT\\', configFileCode);
    logV2(INFO, "INIT", "Check Following File For All Profiles: " + initFile.fullPath());
    var obj = initObject(initFile);
    var profileObj = initObject(MR_PROFILE_FILE);
    profileObj.list.forEach(function (item) {
        var profilerFile = new ConfigFile(MR_DIR + item.id + '\\', configFileCode);
        var profilerObj = initObject(profilerFile);
        logV2(INFO, "INIT", "Profile:" + item.name);
        var save = check(obj, profilerObj);
        if (save){
            logV2(INFO, "INIT", "Update File: " + JSON.stringify(profilerObj));
            writeObject(profilerObj, profilerFile);
        }
    });
    //setMRPathProfile("INIT","MRInit");
}

function check(obj, profilerObj){
    var save = false;
    if (hasProperties(obj)) {
        var arrayOfKeys = Object.getOwnPropertyNames(obj);
        arrayOfKeys.forEach(function (key) {
            //logV2(INFO, "INIT", "Key: " + key);
            if (hasProperties(obj[key])) {
                //logV2(INFO, "INIT", "Sub Properties: " + key);
                if (!profilerObj.hasOwnProperty(key)){
                    logV2(INFO, "INIT", "Property With Children does not exist: " + key);
                    profilerObj[key] = obj[key];
                    save = true;
                }
                save = check(obj[key], profilerObj[key]) || save;
            }
            else if (profilerObj.hasOwnProperty(key)){
                //logV2(INFO, "INIT", "Property OK: " + key);
            }
            else {
                logV2(INFO, "INIT", "Property does not exist: " + key);
                profilerObj[key] = obj[key];
                save = true;
            }
        });
    }
    return save;
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

function setAssassinProfile(){
    logV2(INFO, "INIT", "Mafia Reloaded Set Assassin Profile");
    var profile = getFirefoxSetting(MR_BRANCH,  MR_ASSASSIN_PROFILE_KEY);
    if (isNullOrBlank(profile)){
        profile = "";
    }
    var inputTxt = prompt("Set Assassin Profile ID", profile);
    if (inputTxt == null) {
        // cancel pressed
    }
    else {
        profile = inputTxt;
        changeFirefoxSetting(MR_BRANCH, MR_ASSASSIN_PROFILE_KEY, profile);
        logV2(INFO, "INIT", "Set Assassin Profile to " + profile);
    }
}

function setNode(){
    logV2(INFO, "INIT", "Setting Node");
    var node = getFirefoxSetting(MR_BRANCH,  MR_NODE);
    if (isNullOrBlank(node)){
        node = "";
    }
    var inputTxt = prompt("Set Node", node);
    if (inputTxt == null) {
        // cancel pressed
    }
    else {
        node = inputTxt;
        changeFirefoxSetting(MR_BRANCH, MR_NODE, node);
        logV2(INFO, "INIT", "Set Node to " + node);
    }
}

function setAssassinAutoHeal(){
    logV2(INFO, "INIT", "Mafia Reloaded Set Assassin Profile");
    var autoHeal = getFirefoxSetting(MR_BRANCH_ASSASSIN,  MR_ASSASSIN_AUTOHEAL);
    if (isNullOrBlank(autoHeal)){
        autoHeal = "";
    }
    var clear = false;
    var inputTxt = prompt("Set AutoHeal (Allowed Values: true, false. Any other value will clear this setting", autoHeal);
    if (inputTxt == null) {
        // cancel pressed
    }
    else {
        inputTxt = inputTxt.toLowerCase();
        switch (inputTxt) {
            case "true":
                autoHeal = true;
                break;
            case "false":
                autoHeal = false;
                break;
            default :
                var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(MR_BRANCH_ASSASSIN);
                prefs.clearUserPref(MR_ASSASSIN_AUTOHEAL);
                clear = true;
                //autoHeal = null;
                break;
        }
        if (!clear) {
            changeFirefoxSetting(MR_BRANCH_ASSASSIN, MR_ASSASSIN_AUTOHEAL, autoHeal);
        }
        logV2(INFO, "INIT", "Set AutoHeal to " + autoHeal);
    }
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
