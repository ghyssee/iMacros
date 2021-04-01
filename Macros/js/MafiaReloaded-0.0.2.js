/* initAndCheckScript modified: add array of parameters for test screen */
var ORIG_MR_DIR =  ONEDRIVE_DIR + "Config\\MR\\";
var MR_DIR =  ONEDRIVE_DIR + "Config\\MR\\";

var MR_BRANCH = "mafiareloaded.";
var MR_PROFILE_KEY = "profile";
var MR_ASSASSIN_PROFILE_KEY = "assassinProfile";
var MR_BRANCH_ASSASSIN = MR_BRANCH + "assassin.";
var MR_ASSASSIN_AUTOHEAL = "autoHeal";
var MR_NODE = "node";

var MR_PROFILE_FILE = MR_DIR + "profile.json";
var MR_FIGHTERS_EXCLUDE_FILE = new ConfigFile(MR_DIR, "FightersToExclude.json");
var MR_FRIENDS_FILE = new ConfigFile(MR_DIR, "Friends.json");
var MR_FIGHTERS_FILE = new ConfigFile(MR_DIR, "Fighters.json");
var MR_JOBS_FILE = new ConfigFile(MR_DIR, "Jobs.json");
var MR_CONFIG_FILE = new ConfigFile(MR_DIR, "MafiaReloaded.json");
var MR_HOMEFEED_FILE = new ConfigFile(MR_DIR, "Homefeed.json");
var MR_PROFILE_FILE = new ConfigFile(MR_DIR, "profile.json");
var MR_ASSASSIN_FILE = new ConfigFile(MR_DIR, "Assassin-a-Nator.json");
var MR_SETTINGS_FILE = new ConfigFile(MR_DIR, "Settings.json");

var MR_PROFILE_ERIC = 1;
var MR_PROFILE_MALIN = 2;

var MR_PROFILE_ERIC_ID = "01";
var MR_PROFILE_MALIN_ID = "02";
var MR_PROFILE_JORIS_ID = "03";

var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

var STOP_SCRIPT = true;

var MR = Object.freeze({
    "MR_FIGHTERS_EXCLUDE_FILE" : "FightersToExclude.json",
    "MR_FRIENDS_FILE": "Friends.json",
    "MR_FIGHTERS_FILE": "Fighters.json",
    "MR_JOBS_FILE": "Jobs.json",
    "MR_SETTINGS_FILE": "Settings.json",
    "MR_CONFIG_FILE": "MafiaReloaded.json",
    "MR_HOMEFEED_FILE": "Homefeed.json",
    "MR_ASSASSIN_FILE": "Assassin-a-Nator.json",
    "MR_TEMP_SETTINGS_FILE" : "TempSettings.json",
    "MR_FIGHTLIST_FILE" : "Fightlist.json",
    "MR_KILLS_FILE": "Kills.json"
    }
);
var RESOURCE_TYPE = Object.freeze({
        "ENERGY" : "ENERGY",
        "STAMINA": "STAMINA"
    }
);


function getMRFile(fileId){
    return new ConfigFile(MR_DIR, fileId);
}

function getMRRootFile(fileId){
    return new ConfigFile(ORIG_MR_DIR, fileId);
}

function getMRFileByIndex(fileId, idx){
    var profile = getProfileByIndex(idx);
    if (profile != null){
        var file = new ConfigFile(ORIG_MR_DIR + profile.id + '\\', fileId);
        return file;
    }
    else {
        logV2(INFO, "INIT", "Profile not found for index " + idx);
    }
    return getMRFile(fileId);
}


function getMRFileById(fileId, profileId){
    var profile = getProfileObject(profileId);
    if (profile != null){
        var file = new ConfigFile(ORIG_MR_DIR + profile.id + '\\', fileId);
        return file;
    }
    else {
        logV2(WARNING, "INIT", "Profile not found for id " + profileId);
    }
    return getMRFile(fileId);
}

function findProfileByFighterIdCallBack(profile) {

    if (profile.fighterId == this){
        return profile;
    };
}

function findProfileByFighterId(profileObj, fighterId){
    var obj = profileObj.list.find(findProfileByFighterIdCallBack, fighterId);
    return obj;
}

function initMRObject(fileId){
    var file = getMRFile(fileId);
    return initObject(file);
}

function writeMRObject(object, fileId){
    var file = getMRFile(fileId);
    writeObject(object, file);
}

function writeMRFile(text, fileId, overwrite){
    var file = getMRFile(fileId);
    writeFileWrapper(file.fullPath(), text + NEWLINE, overwrite);
}

function LogFile(path, fileId){
    this.path = path;
    this.fileId = fileId;
    this.fullPath = function() { return this.path + "log." + this.fileId +  "." + getDateYYYYMMDD() + ".txt"};
}

function getProfile(){
    var profile = getFirefoxSetting(MR_BRANCH,  MR_PROFILE_KEY);
    return profile;
}

function getProfileByIndex(idx){
    var profiles = initObject(MR_PROFILE_FILE);
    if (idx >= 1 && idx <= profiles.list.length){
        return profiles.list[idx-1];
    }
    return null;
}


function getProfileObject(id){
    var profiles = initObject(MR_PROFILE_FILE);
    for (var i=0; i < profiles.list.length; i++){
        var profileObj = profiles.list[i];
        if (profileObj.id == id){
            return profileObj;
        }
    }
    return null;
}

function setMRPath(logFile){
    var profile = getProfile();
    setMRPathProfile(profile, logFile);
}

function setMRPathProfile(profile, logFile){
    if (!isNullOrBlank(profile)){
        MR_DIR = ORIG_MR_DIR + profile + "\\";
        LOG_DIR = ORIG_LOG_DIR + profile + "\\";
    }
    LOG_FILE = new LogFile(LOG_DIR, logFile);
    logV2(INFO, "INIT", "Set MR Path To " + MR_DIR);
}

function closePopup(){
    var retCode = playMacro(COMMON_FOLDER, "02_ClosePopup.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}

function closePopupByText(text){
    addMacroSetting("TEXT", text);
    var retCode = playMacro(COMMON_FOLDER, "03_ClosePopupText.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}

function closePopupByTextV2(text){
    addMacroSetting("TEXT", text);
    var retCode = playMacro(COMMON_FOLDER, "04_ClosePopupTextV2.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}
function checkSaldo(){
    logV2(DEBUG, "SALDO", "Get Saldo");
    var saldo = 0;
    saldo = getSaldo();
    if (saldo > 10){
        bank(saldo);
    }
    return saldo;
}

function dummyBank(){
    playMacro(COMMON_FOLDER, "10_Bank.iim", MACRO_INFO_LOGGING);
}

function bank(saldo){
    playMacro(COMMON_FOLDER, "10_Bank.iim", MACRO_INFO_LOGGING);
    if (saldo > 0) {
        logV2(INFO, "BANK", "Banking " + saldo);
    }
}
function getSaldo(){
    var retCode = playMacro(COMMON_FOLDER, "11_GetSaldo.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var saldoInfo = getLastExtract(1, "Saldo", "$500");
        logV2(DEBUG, "BANK", "saldoInfo = " + saldoInfo);
        if (!isNullOrBlank(saldoInfo)) {
            saldoInfo = removeComma(saldoInfo);
            var saldo = parseInt(saldoInfo.replace("$", ""));
            return saldo;
        }
        else {
            logV2(WARNING, "BANK", "Problem Extracting Saldo");
            makeScreenShot("MRExtractSaldoProblem");
        }
    }
    else {
        logV2(WARNING, "BANK", "Problem getting Saldo");
        makeScreenShot("MRGetSaldoProblem");
    }
    return 0;
}

function getLevel(){
    var level = 0;
    var retCode = playMacro(COMMON_FOLDER, "12_GetLevel.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "Level 300").toUpperCase();
        msg = msg.replace("LEVEL ", "");
        msg = removeComma(msg);
        level = parseInt(msg);
    }
    return level;
}

function startMafiaReloaded(){
    var retCode = SUCCESS;
    do {
        retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        if (retCode != SUCCESS){
            logV2(WARNING, "MRINIT", "There was a Problem starting MR... Retrying in 60 seconds.");
            waitV2("60");
        }
    }
    while (retCode != SUCCESS);
}

function makeMRScreenshot(file){
    var profile = getProfile();
    if (!isNullOrBlank(profile)) {
        file = profile + "_" + file;
    }
    makeScreenShot(file);
}

function getExperience(){
    logV2(INFO, "EXP", "Get Experience");
    ret = playMacro(COMMON_FOLDER, "13_GetExperience.iim", MACRO_INFO_LOGGING);
    var exp = 0;
    if (ret == SUCCESS){
        var msg = getLastExtract(1, "Experience Left", "5,886 (1,264 to level)");
        exp = extractExperience(msg);
        logV2(INFO, "EXP", "Experience Left: " + exp);
    }
    return exp;

}

function getStamina(){
    var stamina = getStaminaObj();
    return stamina.leftOver;
}

function getStaminaForFighting(limit, stopScript){
    var stamina = getStaminaObj();
    if (limit > 0 && stamina.leftOver <= limit){
        var msg = "Stamina Limit Reached. Limit is " + limit + ", Stamina Left is " + stamina.leftOver;
        if (stopScript) {
            alert(msg);
            throw new UserCancelError(msg);
        }
        else {
            logV2(INFO, "STAMINA", msg);
            stamina.leftOver = -1;
        }
    }
    return stamina;
}

function getStaminaObj(){
    playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
    var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
    var staminaObj = {"leftOver": 0, "total": 0};
    logV2(DEBUG, "STAMINA", "stamina = " + staminaInfo);
    if (!isNullOrBlank(staminaInfo)){
        staminaInfo = staminaInfo.replace(/,/g, '');
        var tmp = staminaInfo.split("/");
        staminaObj.leftOver = parseInt(tmp[0]);
        staminaObj.total = parseInt(tmp[1]);
    }
    return staminaObj;
}

function getEnergy(){
    var ret = playMacro(JOB_FOLDER, "10_GetEnergy.iim", MACRO_INFO_LOGGING);
    var energyInfo = getLastExtract(1, "Energy Left", "500/900");
    logV2(DEBUG, "ENERGY", "energy = " + energyInfo);
    if (!isNullOrBlank(energyInfo)){
        energyInfo = energyInfo.replace(/,/g, '');
        var tmp = energyInfo.split("/");
        var energy = parseInt(tmp[0]);
        return energy;
    }
    return 0;
}

function getTempSetting(tmpObj, category, property){
    if (tmpObj == null) {
        tmpObj = initMRObject(MR.MR_TEMP_SETTINGS_FILE);
    }
    if (tmpObj[category].hasOwnProperty(property)){
        return tmpObj[category][property];
    }
    return null;
}

function getOverwrittenSetting(tmpObj, category, property, originalValue){
    if (tmpObj == null) {
        tmpObj = initMRObject(MR.MR_TEMP_SETTINGS_FILE);
    }
    var tmpSetting = getTempSetting(tmpObj, category, property);
    if (tmpSetting == null){
        return originalValue;
    }
    return tmpSetting;
}

function setTempSetting(profileId, category, property, value){
    if (profileId == null){
        profileId = getProfile();
    }
    var file = getMRFileById(MR.MR_TEMP_SETTINGS_FILE, profileId);
    var tmpObj = initObject(file);
    tmpObj[category][property] = value;
    writeObject(tmpObj, file);
}

function extractExperience(expInfo) {
    if (!isNullOrBlank(expInfo)) {
        logV2(DEBUG, "EXPERIENCE", "Exp = " + expInfo);
        if (!isNullOrBlank(expInfo)) {
            expInfo = removeComma(expInfo).toUpperCase();
            var regExp = /(?:.*)[0-9]{1,10} \((.*) TO LEVEL/; //5,886 (1,264 to level)
            var matches = expInfo.match(regExp);
            var exp = -1;
            if (matches != null && matches.length > 0){
                exp = parseInt(matches[matches.length-1]);
                return exp;
            }
        }
        else {
            logV2(WARNING, "EXPERIENCE", "Problem Extracting Exp");
        }
    }
    else {
        logV2(WARNING, "STAMINA", "Problem Getting Exp");
    }
    return -1;
}

function initAndCheckScript(folder, initMacro, initTestMacro, testValue, category, logMessage, nrOfRetries){
    return initAndCheckScriptParameters(folder, initMacro, null, initTestMacro, null, testValue, category, logMessage, nrOfRetries);
}

function initAndCheckScriptParameters(folder, initMacro, listParameters, initTestMacro, listParametersTest, testValue, category, logMessage, nrOfRetries){
    var retCode = -1;
    var counter = 0;
    logV2(INFO, category, "Init: " + logMessage);
    nrOfRetries = typeof nrOfRetries !== 'undefined' ? nrOfRetries : 10;
    do {
        counter++;
        if (listParameters != null){
            for (var i=0; i < listParameters.length; i++){
                var paramObj = listParameters[i];
                logObj(INFO, category, paramObj);
                addMacroSetting(paramObj.id, paramObj.value);
            }
        }
        retCode = playMacro(folder, initMacro, MACRO_INFO_LOGGING);
        //retCode = SUCCESS;
        //if (retCode == SUCCESS) {
        // check if Init Screen is realy selected
        if (listParametersTest != null){
            for (var i=0; i < listParametersTest.length; i++){
                var paramObj = listParametersTest[i];
                logObj(INFO, category, paramObj);
                addMacroSetting(paramObj.id, paramObj.value);
            }
        }
        retCode = playMacro(folder, initTestMacro, MACRO_INFO_LOGGING);
        var _value = getLastExtract(1, "Test Value", "Test Value");
        logV2(WARNING, "_value: " + _value);
        if (isNull(_value)){
            logV2(WARNING, category, "Problem with " + logMessage + ". Value is null, but should be " + testValue);
            retCode = -1;
        }
        else if (testValue == '*'){
            logV2(INFO, category, _value);
            retCode = SUCCESS;
        }
        else if (_value.toLowerCase() != testValue.toLowerCase()){
            logV2(WARNING, category, "Problem with " + logMessage + ". Value is: " + " but should be: " + testValue);
            retCode = -1;
        }
        //}
        if (retCode != SUCCESS){
            logV2(WARNING, category, "Retries: " + counter);
        }
    }
    while (retCode != SUCCESS && counter < nrOfRetries);
    return retCode;
}


function getParamObj(id, value){
    var paramObj = {"id": id, "value": value};
    return paramObj;
}

function checkForExperienceLimit(){
    return (configMRObj.global.stopWhenExpBelow > 0);
}
