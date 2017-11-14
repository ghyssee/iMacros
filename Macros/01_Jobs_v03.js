var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\\MyConstants-0.0.3.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
LOG_FILE = new LogFile(LOG_DIR, "MRJobs");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var CONSTANTS = Object.freeze({
    "EXECUTE" : {
        "REPEAT": "REPEAT",
        "COMPLETE": "COMPLETE",
    },
    "STATUS" : {
        "OK": 1,
        "NOT_ENOUGH": 2,
        "LEVELUP": 3,
        "SKIP": 4
    }
});
init();
var JOB_FOLDER = "MR/Jobs";
var COMMON_FOLDER = "MR/Common";
var FIGHT_FOLDER = "MR/Fight";

var jobsObj = initObject(MR_JOBS_FILE);
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0,
                      "lastDistrict": null, "lastChapter": null,
                     };

//enableMacroPlaySimulation();

	var listOfJobs = getListOfEnabledJobs(jobsObj.activeJobs);
    try {
        var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        initJobs(listOfJobs);
		do {
            var wait = doJobs(listOfJobs);
            clearDistrict();
            if (wait) {
                waitV2("60");
            }
        }
        while (true);
	 }
	 catch (ex) {
        logError(ex);
        logV2(INFO, "SUMMARY", "Jobs Completed: " + globalSettings.jobsCompleted);
		logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
	}

	function getListOfEnabledJobs(listOfJobs){
        jobList = [];
        listOfJobs.forEach( function (jobItem)
        {
            if (jobItem.enabled){
                jobList.push(jobItem);
            }
        });
        return jobList;
    }

function doJobs(listOfJobs){
    var wait = true;
    for (var i=0; i < listOfJobs.length; i++){
        // maybe not necessary, is checked when job is executed successfully
        var jobItem = listOfJobs[i];
        if (checkIfLevelUp()){
            logV2(INFO, "JOB", "DoJob Level Up");
            wait = false;
            break;
        }
        var status = processJob(jobItem);
        if (status == CONSTANTS.STATUS.LEVELUP){
            wait = false;
            break;
        }
        else if (status == CONSTANTS.STATUS.OK){
            wait = false;
            i--;
        }
        else if (status == CONSTANTS.STATUS.SKIP){
            wait = true;
        }
    }
    logV2(INFO, "JOB", "Wait: " + wait);
    return wait;
}

function initJobs(listOfJobs){
    listOfJobs.forEach( function (jobItem)
    {
        fillDistrictInfo(jobItem);
    });
    listOfJobs.forEach( function (jobItem) {

        if (jobItem.total == null){
            jobItem.total = 0;
        }
        if (jobItem.number == null){
            jobItem.number = 0;
        }
        jobItem.ok = false;
        var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (jobItem.district.event) {
                retCode = playMacro(JOB_FOLDER, "06_Job_DistrictEvent.iim", MACRO_INFO_LOGGING);
            }
            else {
                addMacroSetting("DISTRICT", jobItem.districtId);
                retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
            }
            if (retCode === SUCCESS) {
                if (jobItem.job.chapter !== null) {
                    addMacroSetting("DISTRICT", jobItem.districtId);
                    addMacroSetting("CHAPTER", jobItem.job.chapter);
                    retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
                    if (retCode != SUCCESS) {
                        logV2(INFO, "JOB", "Problem Selecting chapter");
                        return;
                    }
                }
                fillJobInfo(jobItem);
            }
            else {
                logV2(INFO, "JOB", "Problem Selecting District");
            }
        }
        else {
            logV2(INFO, "JOB", "Problem Job Page");
        }
    });
    listOfJobs.forEach( function (jobItem)
    {
        logV2(INFO, "JOB", JSON.stringify(jobItem));
    });
    logV2(INFO, "JOB", "Job Initialization done");
}

function fillJobInfo(jobItem){
    addMacroSetting("ID", jobItem.jobId);
    jobItem.chapter = null;
    jobItem.ok = false;
    retCode = playMacro(JOB_FOLDER, "03_Job_Energy.iim", MACRO_INFO_LOGGING);
    // Get Energy + Experience
    if (retCode === SUCCESS) {
        var extraInfo = {"energyOrStamina": 0, "exp": 0};
        extraInfo.energyOrStamina = parseInt(getLastExtract(1, "Energy Job", "100"));
        extraInfo.exp = parseInt(getLastExtract(2, "Experience Job", "400"));
        jobItem.extraInfo = extraInfo;
        jobItem.ok = true;
    }
    else {
        logV2(INFO, "JOB", "Problem Getting Energy Info");
        jobItem.ok = false;
    }
}

function fillDistrictInfo(jobItem){
    if (typeof jobItem.ok == "undefined"){
        jobItem.ok = false;
        var district = findDistrict(jobItem);
        if (district == null) {
            logV2(INFO, "JOB", "Problem Finding District " + jobItem.districtId);
        }
        else {
            var myDistrict = {"name": district.description, "event": district.event};
            jobItem.district = myDistrict;
            var job = findJob(jobItem.jobId, district);
            if (job == null){
                logV2(INFO, "JOB", "Problem Finding Job " + jobItem.jobId);
            }
            else {
                jobItem.ok = true;
                jobItem.job = job;
            }
        }
    }
    return;
}

function findJob(jobId, district){
    var job = null;
    district.jobs.forEach( function (jobItem)
    {
        if (jobId === jobItem.id){
            job = jobItem;
            return;
        }
    });
    return job;
}

function getEnergyOrStamina(jobItem){
    var total = 0;
    if (jobItem.job.type == "STAMINA"){
        total = getStamina();
    }
    else {
        total = getEnergy();
    }
    return total;
}

function checkIfEnoughEnerygOrStamina(total, jobItem){
    var status = CONSTANTS.STATUS.OK;
    logV2(INFO, "JOB", "Entering checkIfEnoughEnerygOrStamina");
    if (checkIfLevelUp()){
        logV2(INFO, "JOB", "checkIfEnoughEnerygOrStamina: Level Up");
        status = CONSTANTS.STATUS.LEVELUP;
    }
    else if (total < jobItem.extraInfo.energyOrStamina) {
        logV2(INFO, "JOB", "Not Enough energy/stamina to do job. Needed: " + jobItem.extraInfo.energyOrStamina + " / Left: " + total);
        status = CONSTANTS.STATUS.NOT_ENOUGH;
    }
    logV2(INFO, "STATUS", "status = " + status);
    return status;

}

function goToDistrict(jobItem){
    var retCode = -1;
    if (globalSettings.lastDistrict == null || globalSettings.lastDistrict != jobItem.districtId) {
        logV2(INFO, "JOB", "Travelling to district " + jobItem.districtId);
        if (jobItem.district.event) {
            retCode = playMacro(JOB_FOLDER, "06_Job_DistrictEvent.iim", MACRO_INFO_LOGGING);
        }
        else {
            addMacroSetting("DISTRICT", jobItem.districtId);
            retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
        }
        if (retCode == SUCCESS){
            globalSettings.lastDistrict = jobItem.districtId;
        }
    }
    else {
        logV2(INFO, "JOB", "Active District: " + jobItem.districtId);
        retCode = SUCCESS;
    }
    return retCode;
}

function goToChapter(jobItem){
    var retCode = -1;
    if (jobItem.job.chapter !== null){
        if (globalSettings.lastChapter == null || globalSettings.lastChapter != jobItem.job.chapter) {
            logV2(INFO, "JOB", "Travelling to chapter " + jobItem.job.chapter);
            addMacroSetting("DISTRICT", jobItem.districtId);
            addMacroSetting("CHAPTER", jobItem.job.chapter);
            retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
            if (retCode != SUCCESS) {
                logV2(INFO, "JOB", "Problem Selecting chapter");
            }
            else {
                globalSettings.lastChapter = jobItem.job.chapter;
            }
        }
        else {
            logV2(INFO, "JOB", "Active Chapter: " + jobItem.job.chapter);
            retCode = SUCCESS;
        }
    }
    else {
        retCode = SUCCESS;
    }
    return retCode;
}

function processJob(jobItem){

    var exit = false;
    var status = CONSTANTS.STATUS.OK;
    var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
        if (!jobItem.ok) {
            logV2(INFO, "JOB", "Problem with Job " + jobItem.jobId);
            globalSettings.lastChapter = null;
            globalSettings.lastDistrict = null;
           return status;
        }
        var energy = getEnergyOrStamina(jobItem);
        validJob = isValidJob(jobItem);
        if (validJob) {
            var energy = getEnergyOrStamina(jobItem);
            var status = checkIfEnoughEnerygOrStamina(energy, jobItem);
            if (status != CONSTANTS.STATUS.OK) {
                return status;
            }

        }
        else {
                logV2(INFO, "JOB", "Job Not Valid: " + jobItem.districtId + "/" + jobItem.jobId);
                status = CONSTANTS.STATUS.SKIP;
                return status;
            }
        var success = false;
        retCode = goToDistrict(jobItem);
        if (retCode === SUCCESS) {
            retCode = goToChapter(jobItem);
            if (retCode != SUCCESS){
                clearDistrict();
                status = CONSTANTS.STATUS.SKIP;
                return status;
            }
            logJob(jobItem);
            testJob(jobItem);
            logV2(INFO, "JOB", "Job Status: " + status);
        }
        else {
            logV2(INFO, "JOB", "Problem Selecting District");
        }
    }
    else {
        logV2(INFO, "JOB", "Problem Job Page");
    }
    return status;
}

function clearDistrict(){
    globalSettings.lastDistrict = null;
    globalSettings.lastChapter = null;
}

function testJob(jobItem){
        var complete = getPercentCompleted(jobItem);
        var valid = executeJob(jobItem, complete);
        if (valid) {
            jobItem.number++;
            globalSettings.lastDistrict = jobItem.districtId;
            globalSettings.lastChapter = jobItem.job.chapter;
        }
}

function isValidJob(jobItem){
    logV2(INFO, "JOB", "Entering isValidJob");
    validJob = false;
    switch (jobItem.type) {
        case CONSTANTS.EXECUTE.REPEAT:
            if (jobItem.total > 0 && jobItem.number >= jobItem.total){
                logV2(INFO, "JOB", "Nr Of Times Exceeded: " + jobItem.number + "/" + jobItem.total);
            }
            else {
                validJob = true;
            }
            break;
        case CONSTANTS.EXECUTE.COMPLETE:
            if (jobItem.completed == null || !jobItem.completed) {
                var complete = getPercentCompleted(jobItem);
                if (complete < 100) {
                    validJob = true;
                }
                else {
                    jobItem.completed = true;
                }
            }
            break;
    }
    logV2(INFO, "JOB", "Job " + jobItem.jobId + " valid: " + validJob);
    return validJob;
}

function logJob(jobItem){
    logV2(INFO, "JOB", "DistrictId: " + jobItem.districtId);
    if (jobItem.job.chapter !== null) {
        logV2(INFO, "JOB", "Chapter: " + jobItem.job.chapter);
    }
    logV2(INFO, "JOB", "Id: " + jobItem.jobId);
}

function executeJob(jobItem, completed){
    var success = false;
    if (executeMacroJob(jobItem) !== SUCCESS) {
        logV2(INFO, "JOB", "Problem Executing Job");
        logV2(INFO, "JOB", "District: " + jobItem.district);
        if (jobItem.job.chapter != null) {
            logV2(INFO, "JOB", "Chapter: " + jobItem.job.chapter);
        }
        logV2(INFO, "JOB", "Id: " + jobItem.job.id);
        success = false;
    }
    else {
        var completeAfter = getPercentCompleted(jobItem);
        //logV2(INFO, "JOB", "Completed: " + completed + " / " + completeAfter);
        logV2(INFO, "JOB", "CompleteAfter: " + (completeAfter === 100));
        //logV2(INFO, "JOB", "completed: " + (completed < 100));
        if ((completeAfter === 100) && (completed < 100)){
            logV2(INFO, "JOB", "Close Popup For Skill Point");
            closePopup();
        }
        checkSaldo();
        success = true;

    }
    return success;
}

function executeMacroJob(jobItem) {
    addMacroSetting("ID", jobItem.jobId);
    var retCode = 0;
    if (jobItem.district.event) {
        retCode = playMacro(JOB_FOLDER, "07_Job_StartEvent.iim", MACRO_INFO_LOGGING);
    }
    else {
        addMacroSetting("CHAPTER", jobItem.job.chapter);
        retCode = playMacro(JOB_FOLDER, "04_Job_Start.iim", MACRO_INFO_LOGGING);
    }
    if (retCode === SUCCESS){
        checkSaldo();
        globalSettings.jobsCompleted++;
    }
    return retCode;
}

function findDistrict(jobItem){
    var district = null;
    jobsObj.districts.forEach( function (districtItem)
    {
        if (districtItem.id === jobItem.districtId){
            district = districtItem;
            return;
        }
    });
    return district;
}

function checkIfLevelUp(){
	var leveledUp = false;
    var retCode = playMacro(COMMON_FOLDER, "12_GetLevel.iim", MACRO_INFO_LOGGING);
	if (retCode === SUCCESS){
		var msg = getLastExtract(1, "Level", "281").toUpperCase();
		msg = msg.replace("LEVEL ", "");
		var level = parseInt(msg);
		if (globalSettings.currentLevel == 0) {
			globalSettings.currentLevel = level;
		}
		else if (level > globalSettings.currentLevel){
            leveledUp = true;
		    logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
			var ret = closePopup();
			if (ret === SUCCESS){
				logV2(INFO, "LEVELUP", "Dialog Box Closed");
			}
			globalSettings.currentLevel = level;
		}
	}
	return leveledUp;
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
}

function getStamina(){
    playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
    var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
    logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
    if (!isNullOrBlank(staminaInfo)){
        staminaInfo = staminaInfo.replace(/,/g, '');
        var tmp = staminaInfo.split("/");
        var stamina = parseInt(tmp[0]);
        return stamina;
    }
    return 0;
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

function getPercentCompleted(jobItem){
    goToDistrict(jobItem);
    goToChapter(jobItem);
    addMacroSetting("ID", jobItem.jobId);
    var retCode = playMacro(JOB_FOLDER, "11_PercentCompleted.iim", MACRO_INFO_LOGGING);
    if (retCode === SUCCESS) {
        var percentInfo = getLastExtract(1, "Percent Completed", "50%");
        logV2(INFO, "JOB", "%completed = " + percentInfo);
        if (!isNullOrBlank(percentInfo)) {
            percentInfo = percentInfo.replace("%", "").toUpperCase();
            percentInfo = percentInfo.replace(" COMPLETE", "");
            return parseInt(percentInfo);
        }
        else {
            clearDistrict();
            logV2(INFO, "JOB", "Problem Extracting Percent Completed");
        }
    }
    else {
        clearDistrict();
        logV2(INFO, "JOB", "Problem getting Percent Completed");
    }
    return 100;
}

function checkSaldo(){
	logV2(INFO, "SALDO", "Get Saldo");
	var saldo = 0;
	saldo = getSaldo();
	if (saldo > 10){
		bank(saldo);
	}
}

function bank(saldo){
	playMacro(COMMON_FOLDER, "10_Bank.iim", MACRO_INFO_LOGGING);
	logV2(INFO, "BANK", "Banking " + saldo);
	globalSettings.money += saldo;
}

function getSaldo(){
	playMacro(COMMON_FOLDER, "11_GetSaldo.iim", MACRO_INFO_LOGGING);
	var saldoInfo = getLastExtract(1, "Saldo", "$500");
	//var saldoInfo = prompt("Saldo", "500");
	logV2(INFO, "BANK", "saldoInfo = " + saldoInfo);
	if (!isNullOrBlank(saldoInfo)){
	    saldoInfo = removeComma(saldoInfo);
	    var saldo = parseInt(saldoInfo.replace("$", ""));
		return saldo;
	}
	return 0;
}

function closePopup(){
	playMacro(COMMON_FOLDER, "02_ClosePopup.iim", MACRO_INFO_LOGGING);
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
