var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.2.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight-0.0.6.js"));
eval(readScript(MACROS_PATH + "\\js\\underscore-min.js"));

// 182-11 = 171

// Script to update player info from fighters / friends / fightersToExclude

var LOW_LEVEL = 400;
var localConfigObject = null;
setMRPath("MRCheckPlayers");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

init();

var fightersToExclude = initMRObject(MR.MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initMRObject(MR.MR_FRIENDS_FILE);
var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var profileObj = initObject(MR_PROFILE_FILE);

var globalSettings = {"maxLevel": 20000, "iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0, "stolenIces": 0,
    "skippedHealth": 0, "maxHealed": 0, "heals": 0, "stopOnLevelUp": false, "expReached": false,
    "forceHealing": false, "profile": getProfileObject((getProfile())),
    "boss": {"attacks": 0}};
startScript();
//var tmp = extractProfileFighterName("<h2 style=\"margin: 10px 0px; outline: 1px solid blue;\" class=\"ellipsis\">Kimie</h2>");
//alert(tmp);
//checkIfFriend();

function startScript(){
    var currDate = new Date();
    currDate = dateAdd(currDate, -5, "days");
    var currentTime = formatDateToYYYYMMDDHHMISS(currDate);
    logV2(INFO, "UPDATEFIGHTER", "Last Updated Time: " + currentTime);
    try {
        startMafiaReloaded();
            //dummyBank();
            checkFighters(fighterObj, currentTime);

    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            logV2(INFO, "CANCEL", ex.message);
            if (ex.name != USER_CANCEL){
                alert(ex.message);
            }
            // do nothing
        }
        else {
            logError(ex);
        }
    }
}

function checkFighters(obj, currentTime){
    var counter = 0;
    var i=0;
    var length = obj.fighters.length;
    for (var pos = length-1; pos>=0; pos--){
        fighter = obj.fighters[pos];
        i++;
        iimDisplay(i + "/" + length);
        if (updatePlayerInfo(fighter, currentTime)){
            counter++;
            if ((counter % 50) == 0){
                logV2(INFO, "UPDATEFIGHTER", "File Updated");
                writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            }
        }
    };
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
}

function updatePlayerInfo(fighter, currentTime){

    var updated = false;
    if (propertyExistAndNotNull(fighter, "lastChecked") && currentTime.substring(0,8) <= fighter.lastChecked.substring(0,8)){
        //logV2(INFO, "UPDATEPLAYER", "Skipping. Already updated today");
    }
    else {
        logV2(INFO, "UPDATEPLAYER", "Update Player Info: " + fighter.id);
        updated = true;
        goToProfilePage(fighter);
        if (checkIfFriend()){
            addFriend(fighter);
            removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
        }
        if (fighter.level <= LOW_LEVEL){
            logV2(INFO, "UPDATEPLAYER", "Remove Low Level Player: " + fighter.level);
            removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
        }
        logV2(INFO, "UPDATEPLAYER", "=".repeat(100));
    }
    return updated;
}

function addFriend(fighter){
    if (!findFighter(friendObj.fighters, fighter.id)){
        friendObj.fighters.push(fighter);
        writeMRObject(friendObj, MR.MR_FRIENDS_FILE);
    }
    else {
        logV2(INFO, "UPDATEPLAYER", fighter.id + ": Already a friend");
    }
}

function checkIfFriend(){
    var isFriend = false;
    var retCode = playMacro(FIGHT_FOLDER, "86_CheckIfFriend.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "Remove Friend");
        if (!isNullOrBlank(msg) && msg.toUpperCase() == "REMOVE FRIEND"){
            logV2(INFO, "UPDATEPLAYER", "This player is a friend");
            isFriend = true;
        }
    }
    return isFriend;
}

function removeItemFromArray(file, id){
    logV2(INFO, "FIGHT", "Save Current Fighters List");
    logV2(INFO, "FIGHT", "Remove id: " + id);
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    waitV2("1");
    var index = -1;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var item = fighterObj.fighters[i];
        if (item.id == id){
            index = i;
            break;
        }
    }
    if (index >= 0){
        fighterObj.fighters.splice(index, 1);
        writeMRObject(fighterObj, file);
    }
    return index > -1;
}

function removeItemFromArrayold(file, id){
    logV2(INFO, "FIGHT", "Save Current Fighters List");
    logV2(INFO, "FIGHT", "Remove id: " + id);
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    waitV2("1");
    var obj= initMRObject(file);
    var index = -1;
    for (var i=0; i < obj.fighters.length; i++){
        var item = obj.fighters[i];
        if (item.id == id){
            index = i;
            break;
        }
    }
    if (index >= 0){
        obj.fighters.splice(index, 1);
        writeMRObject(obj, file);
        fighterObj = initMRObject(file);
    }
    return index > -1;
}

function goToProfilePage(fighter){
    addMacroSetting("ID", fighter.id);

    var retCode = playMacro(FIGHT_FOLDER, "80_Profile_Attack_Init.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
       var retCode = extractFighterinfo(fighter);
       if (retCode == SUCCESS){
           logV2 (INFO, "UPDATEPLAYER", "Player Updated");
           logV2 (INFO, "UPDATEPLAYER", JSON.stringify(fighter));
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
