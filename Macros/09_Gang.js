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

var localConfigObject = null;
setMRPath("MRGangInfo");
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
//extractGangInfo();
//var tmp = extractProfileFighterName("<h2 style=\"margin: 10px 0px; outline: 1px solid blue;\" class=\"ellipsis\">Kimie</h2>");
//alert(tmp);
//checkIfFriend();

function startScript(){
        try {
            startMafiaReloaded();
            getGangInfo("8281861");
        }
        catch (ex) {
            if (ex instanceof UserCancelError) {
                writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
                logV2(INFO, "CANCEL", ex.message);
                if (ex.name != USER_CANCEL) {
                    alert(ex.message);
                }
                // do nothing
            }
            else {
                logError(ex);
            }
        }
}

function getGangInfo(gangId){

    logV2(INFO, "GANGINFO", "Get gang Info: " + gangId);
    if (goToGangPage(gangId) == SUCCESS){
        extractGangInfo();
    }
}

function processFightLine(txt, pageType){
    var id = extractFighterId(txt);
    var object = null;
    if (id != null){
        var name = null;
        if (pageType == PAGE_TYPE.FIGHT){
            name = extractProfileFighterName(txt).substring(0, 100);
        }
        else {
            name = extractFighterName(txt).substring(0, 100);
        }
        var level = extractLevelFromString(txt);
        var object = getFighterObject(id, name, level);
        var gangObj = extractGangInformation(txt);
        object.gangId = gangObj.id;
        object.gangName = gangObj.name;
        object.lastChecked = formatDateToYYYYMMDDHHMISS();
        if (isAllyGang(friendObj.gangs, object.gangId)) {
            logV2(INFO, "FIGHT", "Prefiltered: Is Ally Gang");
            logObj(INFO, "FIGHT", object);
            object = null;
        }
    }
    else {
        // skipping line / Red Rival or Other Non-Real Player
    }
    return object;
}

function isFriend(text){
    var regExp = ">You cannot attack<br>your friends</span>(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return true;
    }
    return false;

}

function isFighter(text){
    var regExp = ">Attack</a>(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return true;
    }
    return false;

}

function extractGangInfo(){
    var retCode = -1;
    var counter = 1;
    // to speed up search on fighters, create indexed array
    var fighterArrayObj = {};
    fighterObj.fighters.forEach( function (fighter)
    {
        fighterArrayObj[fighter.id] = fighter;
    });
    var save = false;
    do {
        addMacroSetting("POS", counter.toString());
        retCode = playMacro(FIGHT_FOLDER, "88_ExtractGangMember.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var txt = getLastExtract(1, "Gang Line", "Gang Line");
            if (!isNullOrBlank(txt)){
                var fightObj = processFightLine(txt, PAGE_TYPE.PROFILE);
                if (fightObj != null) {
                    if (isFriend(txt)) {
                        if (findFighter(friendObj.fighters, fightObj.id)) {
                            logV2(INFO, "GANGINFO", "FRIEND but already in friend list: " + fightObj.id + " " + fightObj.name);
                        }
                        else {
                            logV2(INFO, "GANGINFO", "Add Friend: " + fightObj.id + " " + fightObj.name);
                            friendObj.fighters.push(fightObj);
                            save = true;
                        }
                    }
                    else if (isFighter(txt)) {
                        if (findIndexedArray(fighterArrayObj, fightObj.id)){
                            logV2(INFO, "GANGINFO", "Already added: " + fightObj.id + " " + fightObj.name);
                        }
                        else if (findFighter(fightersToExclude.fighters, fightObj.id)) {
                            logV2(INFO, "GANGINFO", "Excluded Player: " + fightObj.id + " " + fightObj.name);
                        }
                        else if (findFighter(friendObj.fighters, fightObj.id)) {
                            logV2(INFO, "GANGINFO", "NOT FOUND BUT FRIEND: " + fightObj.id + " " + fightObj.name);
                            friendObj.fighters.push(fightObj);
                            save = true;
                        }
                        else {
                            logV2(INFO, "GANGINFO", "Adding Player " + fightObj.id + " " + fightObj.name);
                            fighterObj.fighters.push(fightObj);
                            logObj(INFO, "GANGINFO", fightObj);
                            save = true;
                        }
                    }
                    else {
                        logV2(INFO, "GANGINFO", "Can't Add player " + fightObj.id + " " + fightObj.name);
                    }
                }
            }
            else {
                retCode = -1;
            }
        }
        counter++;
    }
    while (retCode == SUCCESS);
    if (save) {
        logV2(INFO, "GANGINFO", "Updating files");
        writeMRObject(friendObj, MR.MR_FRIENDS_FILE);
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
        logV2(INFO, "GANGINFO", "Finished Updating files");
    }
}

function removeItemFromArray(file, id){
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

function goToGangPage(gangId){
    addMacroSetting("ID", gangId);
    var retCode = playMacro(FIGHT_FOLDER, "87_GangPage.iim", MACRO_INFO_LOGGING);
    if (retCode != SUCCESS) {
        logV2 (INFO, "GANGINFO", "Problem going to Gang Page");
    }
    return retCode;
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
