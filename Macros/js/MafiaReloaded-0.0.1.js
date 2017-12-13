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

var MR_PROFILE_ERIC = 1;
var MR_PROFILE_MALIN = 2;

var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

var MR = Object.freeze({
    "MR_FIGHTERS_EXCLUDE_FILE" : "FightersToExclude.json",
    "MR_FRIENDS_FILE": "Friends.json",
    "MR_FIGHTERS_FILE": "Fighters.json",
    "MR_JOBS_FILE": "Jobs.json",
    "MR_CONFIG_FILE": "MafiaReloaded.json",
    "MR_HOMEFEED_FILE": "Homefeed.json",
    "MR_ASSASSIN_FILE": "Assassin-a-Nator.json"
    }
);


function getMRFile(fileId){
    return new ConfigFile(MR_DIR, fileId);
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
