var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight-0.0.2.js"));

var localConfigObject = null;
setMRPath("MRAutoHeal");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

init();

var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var globalSettings = {"heals": 0, "autoHeal": true, "homefeed": true, "profileId": getProfile()};
logV2(INFO, "TEMP", "script: Fight - Disable Processing of Homefeed for the current Profile " + globalSettings.profileId);
setTempSetting(globalSettings.profileId, "homefeed", "processLines", false);
startScript();
setTempSetting(globalSettings.profileId, "homefeed", "processLines", null);

function startScript(){
    var maxHeals = 100;
    try {
        startMafiaReloaded();
        do  {
            dummyBank();
            if (checkHealth()){
                waitV2("10");
            }
            else {
                waitV2("2");
            }
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            // do nothing
        }
        else {
            logError(ex);
        }
    }
    logV2(INFO, "AUTOHEAL", "Nr Of Times Healed: " + globalSettings.heals);
}

function checkHealth(){
    var tries = 0;
    logV2(DEBUG, "AUTOHEAL", "Checking Health");
    //var tmpObj = initMRObject(MR.MR_TEMP_SETTINGS_FILE);
    var autoHeal = getOverwrittenSetting(null, "autoHeal", "autoHeal", globalSettings.autoHeal);
    logV2(INFO, "AUTOHEAL", "autoHeal: " + autoHeal);
    iimDisplay("autoHeal: " + autoHeal);
    if (!autoHeal){
        if (globalSettings.homefeed){
            globalSettings.homefeed = false;
            logV2(INFO, "TEMP", "script: Fight - Resetting Processing of homefeed for the current Profile " + globalSettings.profileId);
            setTempSetting(globalSettings.profileId, "homefeed", "processLines", null);
        }
        return true;
    }
    // Assasin-a-nator script is master for processing homefeed lines
    if (!globalSettings.homefeed){
        globalSettings.homefeed = true;
        logV2(INFO, "TEMP", "script: Fight - Disable Processing of Homefeed for the current Profile " + globalSettings.profileId);
        setTempSetting(globalSettings.profileId, "homefeed", "processLines", false);
    }
    var health = getHealth();
    var healed = false;
    while (health == 0) {
        heal();
        if (tries == 0 && health == 0){
            processHomefeed(globalSettings.homefeed);
            underAttack(configMRObj, true);
        }
        tries++;
        dummyBank();
        health = getHealth();
        if (health > 0){
            healed = true;
            globalSettings.heals++;
            logV2(INFO, "FIGHT", "Number Of Heals: " + globalSettings.heals);
        }
    }
    return healed;
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
