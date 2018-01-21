var ORIG_MR_DIR =  ONEDRIVE_DIR + "Config\\MR\\";
var MR_DIR =  ONEDRIVE_DIR + "Config\\MR\\";
var MR_BRANCH = "mafiareloaded.";
var MR_PROFILE_KEY = "profile";
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

var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

var MR = Object.freeze({
    "MR_FIGHTERS_EXCLUDE_FILE" : "FightersToExclude.json",
    "MR_FRIENDS_FILE": "Friends.json",
    "MR_FIGHTERS_FILE": "Fighters.json",
    "MR_JOBS_FILE": "Jobs.json",
    "MR_SETTINGS_FILE": "Settings.json",
    "MR_CONFIG_FILE": "MafiaReloaded.json",
    "MR_HOMEFEED_FILE": "Homefeed.json",
    "MR_ASSASSIN_FILE": "Assassin-a-Nator.json",
    "MR_TEMP_SETTINGS_FILE" : "TempSettings.json"
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

function initMRObject(fileId){
    var file = getMRFile(fileId);
    return initObject(file);
}

function writeMRObject(object, fileId){
    var file = getMRFile(fileId);
    writeObject(object, file);
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
    logV2(INFO, "BANK", "Banking " + saldo);
}
function getSaldo(){
    var retCode = playMacro(COMMON_FOLDER, "11_GetSaldo.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var saldoInfo = getLastExtract(1, "Saldo", "$500");
        logV2(INFO, "BANK", "saldoInfo = " + saldoInfo);
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

function extractExperience(text){
    text = text.toUpperCase().replace(/,/g, "");
    var regExp = /(?:.*)[0-9]{1,10} \((.*) TO LEVEL/; //5,886 (1,264 to level)
    var matches = text.match(regExp);
    var exp = 0;
    if (matches != null && matches.length > 0){
        exp = parseInt(matches[matches.length-1]);
    }
    return exp;

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

function getStaminaForFighting(limit){
    var stamina = getStaminaObj();
    if (limit > 0 && stamina.leftOver <= limit){
        throw new UserCancelError("Stamina Limit Reached. Limit is " + limit + ", Stamina Left is " + stamina.leftOver);
    }
    return stamina;
}

function getStaminaObj(){
    playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
    var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
    var staminaObj = {"leftOver": 0, "total": 0};
    logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
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
    logV2(INFO, "ENERGY", "energy = " + energyInfo);
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