var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
var FRAME="0";
LOG_FILE = new LogFile(LOG_DIR, "MRJobs");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var CONSTANTS = Object.freeze({
    "EXECUTE" : {
		"REPEAT": "REPEAT",
		"COMPLETE": "COMPLETE",
	}
});

init();
var JOB_FOLDER = "MR/Jobs";
var COMMON_FOLDER = "MR/Common";

var jobsObj = initObject(MR_JOBS_FILE);
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0};

enableMacroPlaySimulation();

	var listOfJobs = jobsObj.activeJobs;
    try {
		do {
            doJobs(listOfJobs);
            waitV2("5");
        }
        while (true);
	 }
	 catch (ex) {
        logError(ex);
        logV2(INFO, "SUMMARY", "Jobs Completed: " + globalSettings.jobsCompleted);
		logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
	}

function doJobs(listOfJobs){
    listOfJobs.forEach( function (jobItem)
    {
        // maybe not necessary, is checked when job is executed successfully
        checkIfLevelUp();
        processJob(jobItem);
    });
}

function processJob(jobItem){

    var retCode = playMacro(JOB_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
        var district = findDistrict(jobItem);
        if (district == null) {
           logV2(INFO, "JOB", "Problem Finding District " + jobItem.districtId);
           return;
        }
        retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (jobItem.chapter != null){
                retCode = playMacro(JOB_FOLDER, "04_Job_Chapter.iim", MACRO_INFO_LOGGING);
                if (retCode != null){
                    logV2(INFO, "JOB", "Problem Selecting chapter");
                    return;
                }
            }
            if (jobItem.energy == null || jobItem.exp == null){
                retCode = playMacro(JOB_FOLDER, "03_Job_Energy.iim", MACRO_INFO_LOGGING);
                // Get Energy + Experience
                if (retCode == SUCCESS) {
                    jobItem.energy = parseInt(getLastExtract(1, "Energy Job", "100"));
                    jobItem.exp = parseInt(getLastExtract(2, "Experience Job", "400"));
                }
                else {
                    logV2(INFO, "JOB", "Problem Getting Energy Info");
                    return;
                }
            }
            logJob(jobItem);
            switch (jobItem.type) {
                case CONSTANTS.EXECUTE.REPEAT:
                    repeatJob(jobItem);
                    break;
                case CONSTANTS.EXECUTE.COMPLETE:
                    completeJob(jobItem);
                    break;
            }
        }
        else {
            logV2(INFO, "JOB", "Problem Selecting District");
        }
    }
    else {
        logV2(INFO, "JOB", "Problem Job Page");
    }
}

function repeatJob(jobItem){
    var repeat = true;
    if (jobItem.total == null){
        jobItem.total = 0;
    }
    if (jobItem.number == null){
        jobItem.number = 0;
    }
    if (jobItem.total > 0 && jobItem.number >= jobItem.total){
        logV2(INFO, "JOB", "Nr Of Times Exceeded: " + jobItem.number + "/" + jobItem.total);
        return;
    }
    while (repeat){
        if (jobItem.total == 0 || jobItem.number < jobItem.total) {
            repeat = executeJob(jobItem);
            if (repeat) {
                jobItem.number++;
                if (jobItem.total > 0) {
                    logV2(INFO, "JOB", "Nr of times executed: " + jobItem.number + "/" + jobItem.total);
                }
            }
        }
        else {
            repeat = false;
        }
    }
}

function completeJob(jobItem){
    var repeat = true;
    if (jobItem.completed == null || !jobItem.completed) {
        while (repeat) {
            var complete = getPercentCompleted();
            if (complete < 100) {
                repeat = executeJob(jobItem);
            }
            else {
                logV2(INFO, "JOB", "Completed");
                jobItem.completed = true;
                repeat = false;
            }
        }
    }
    else {
        logV2(INFO, "JOB", "Job Already Completed");
    }
}

function logJob(jobItem){
    logV2(INFO, "JOB", "DistrictId: " + jobItem.districtId);
    if (jobItem.chapter != null) {
        logV2(INFO, "JOB", "Chapter: " + jobItem.chapter);
    }
    logV2(INFO, "JOB", "Id: " + jobItem.jobId);
}

function executeJob(jobItem){
    var energy = getEnergy();
    var success = false;
    if (energy > jobItem.energy) {
        if (executeMacroJob(jobItem) != SUCCESS) {
            logV2(INFO, "JOB", "Problem Executing Job");
            logV2(INFO, "JOB", "District: " + jobItem.district);
            if (jobItem.chapter != null) {
                logV2(INFO, "JOB", "Chapter: " + jobItem.chapter);
            }
            logV2(INFO, "JOB", "Id: " + jobItem.id);
            success = false;
        }
        else {
            success = true;
        }
    }
    else {
        logV2(INFO, "JOB", "Not Enough energy to do job. Needed: " + jobItem.energy + " / Left: " + energy);
        success = false;
    }
    return success;
}

function executeMacroJob(jobItem){
    var retCode = playMacro(JOB_FOLDER, "04_Job_Start.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        checkSaldo();
        checkIfLevelUp();
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
	var retCode = playMacro(COMMON_FOLDER, "12_GetLevel.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		var msg = getLastExtract(1, "Level", "281").toUpperCase();
		msg = msg.replace("LEVEL ", "");
		var level = parseInt(msg);
		if (globalSettings.currentLevel == 0) {
			globalSettings.currentLevel = level;
		}
		else if (level > globalSettings.currentLevel){
			logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
			var ret = closePopup();
			if (ret == SUCCESS){
				logV2(INFO, "LEVELUP", "Dialog Box Closed");
			}
			globalSettings.currentLevel = level;
		}
	}
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
}

function getEnergy(){
	playMacro(JOB_FOLDER, "10_GetEnergy.iim", MACRO_INFO_LOGGING);
	var energyInfo = getLastExtract(1, "Energy Left", "500/900");
	logV2(INFO, "ENERGY", "energy = " + energyInfo);
	if (!isNullOrBlank(energyInfo)){
		var tmp = energyInfo.split("/");
		var energy = parseInt(tmp[0]);
		return energy;
	}
	return 0;
}

function getPercentCompleted(){
    playMacro(JOB_FOLDER, "11_PercentCompleted.iim", MACRO_INFO_LOGGING);
    var percentInfo = getLastExtract(1, "Percent Completed", "50%");
    logV2(INFO, "JOB", "%completed = " + percentInfo);
    if (!isNullOrBlank(percentInfo)){
        percentInfo = percentInfo.replace("%", "");
        var energy = parseInt(percentInfo);
        return percentInfo;
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
		var saldo = parseInt(saldoInfo.replace("$", ""));
		return saldo;
	}
	return 0;
}

function getStatusObject(l){
	return {"status":null, 
	        "totalStamina":0,
			"iced": 0
		   };
}

function closePopup(){
	playMacro(FIGHT_FOLDER, "02_Close_Popup.iim", MACRO_INFO_LOGGING);
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
