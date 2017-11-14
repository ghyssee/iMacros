// 788
var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\\MyConstants-0.0.3.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
LOG_FILE = new LogFile(LOG_DIR, "MRJobList");
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
startList();
/*
var retCode = playMacro(JOB_FOLDER, "20_Joblist_Info.iim", MACRO_INFO_LOGGING);
var txt = getLastExtract(1);
logV2(INFO, "TST", txt);

//var jobId = "<span id=\"job-mastery-81\" style=\"width: 100%; outline: 1px solid blue;\"><span>100% Complete</span></span>";
alert(extractJobId(jobId));
*/
//alert(JSON.stringify(splitItemCash("246 $1,000")));
//var jobName = extractJobName("Create a diversion at passport control100% Complete");
//alert(jobName);

function extractJobName(text){
    text = text.replace(/[0-9]{1,3}% Complete$/, '');
    return text;
}

function extractJobId(text){
    var regExp = /job-mastery-([0-9]{1,10})\" style/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var level = matches[matches.length-1];
        return level;
    }
    return text;
}

function splitItemCash(text){
    text = removeComma(text.trim());
    var obj = {"value1" : null, "value2": null};
    var splitArray = text.split("$");
    if (splitArray.length == 1){
        obj.value1 = parseInt(splitArray[0]);
        obj.value2 = null;
    }
    if (splitArray.length == 2){
        obj.value1 = parseInt(splitArray[0]);
        obj.value2 = parseInt(splitArray[1]);
    }
    return obj;
}

    function startList(){

        var districtId = 2;
        var chapter = 11

        try {
            //var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
            var retCode = SUCCESS;
            if (retCode == SUCCESS){
                var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
                if (retCode == SUCCESS) {
                    addMacroSetting("DISTRICT", districtId);
                    retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
                    if (retCode == SUCCESS) {
                        addMacroSetting("DISTRICT", districtId);
                        addMacroSetting("CHAPTER", chapter);
                        retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
                        if (retCode == SUCCESS){
                            extractJobs(districtId, chapter);
                        }
                        else {
                            logV2(INFO, "JOBLIST", "Problem selecting chapter: " + chapter);
                        }
                    }
                    else {
                        logV2(INFO, "JOBLIST", "Problem Selecting district: " + districtId);
                    }
                }
                else {
                    logV2(INFO, "JOBLIST", "Problem With Init Job");
                }
            }
            else {
                logV2(INFO, "JOBLIST", "Problem Starting Mafia Wars");
            }
        }
        catch (ex) {
            logError(ex);
            logV2(INFO, "SUMMARY", "Jobs Completed: " + globalSettings.jobsCompleted);
            logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
        }
    }

    function contains(text, search){
        return (text.indexOf(search) >= 0);
    }

    function extractJobType(text){
        if (contains(text.toUpperCase(), "STAMINA")){
            return "STAMINA";
        }
        else {
            return "ENERGY";
        }
    }

    function extractJobs(districtId, chapter){
        var retCode = SUCCESS;
        var counter = 1;
        var jobs = []
        do {
            var jobObj = getJobObject();
            jobObj.chapter = chapter;
            addMacroSetting("ID", counter.toString());
            retCode = playMacro(JOB_FOLDER, "20_Joblist_Info.iim", MACRO_INFO_LOGGING);
            var txt = getLastExtract(1);
            if (!isNullOrBlank(txt)){
                logV2(INFO, "JOBLIST", "Jobname: " + txt);
                jobObj.description = extractJobName(txt);
                // job type
                txt = getLastExtract(2);
                jobObj.type = extractJobType(txt);
                // energy
                txt = getLastExtract(3);
                var tmpObj = splitItemCash(txt);
                jobObj.energy = tmpObj.value1;
                if (tmpObj.value2 != null){
                    jobObj.money = -tmpObj.value2;
                }
                // exp
                txt = getLastExtract(4);
                var tmpObj = splitItemCash(txt);
                jobObj.exp = tmpObj.value1;
                if (tmpObj.value2 != null){
                    jobObj.money = tmpObj.value2;
                }
                // job id
                txt = getLastExtract(5);
                jobObj.id = extractJobId(txt);
                logV2(INFO, "JOBLIST", "Extracted Jobname: " + jobObj.description);
                logV2(INFO, "JOBLIST", "Energy: " + jobObj.energy);
                logV2(INFO, "JOBLIST", "Type: " + jobObj.type);
                logV2(INFO, "JOBLIST", "Money: " + jobObj.money);
                logV2(INFO, "JOBLIST", "Exp: " + jobObj.exp);
                logV2(INFO, "JOBLIST", "Id: " + jobObj.id);
                jobs.push(jobObj);
            }
            else {
                retCode = -1;
            }
            counter++;
        }
        while (retCode == SUCCESS);
        if (jobs.length > 0){
            updateJobs(districtId, chapter, jobs);
        }
        else {
            alert("Problem Getting Job List: No Jobs Found");
        }


    }

function findDistrict(districts, districtId){
    var district = null;
    districts.forEach( function (districtItem)
    {
        if (districtItem.id == districtId){
            district = districtItem;
            return;
        }
    });
    return district;
}

function findJob(jobs, jobId){
    var index = -1;
    for(var i=0; i < jobs.length; i++){
        var job = jobs[i];
        if (job.id == jobId){
            return i;
        }
    }
    return index;
}

    function updateJobs(districtId, chapter, jobs){
    logV2(INFO, "JOBLIST", "Entering updateJobs");
    var jobObj = initObject(MR_JOBS_FILE);
        var district = findDistrict(jobObj.districts, districtId);
        if (district == null){
            throw new Error ("District Not Found: " + districtId);
        }
        logV2(INFO, "JOBLIST", "District found: " + districtId);
        logV2(INFO, "JOBLIST", "Nr Of Jobs found:" + jobs.length);
        for (var i=0; i < jobs.length; i++){
            var jobItem = jobs[i];
            logV2(INFO, "JOBLIST", "Job: " + jobItem.id);
            var index = findJob(district.jobs, jobItem.id);
            if (index == -1){
                district.jobs.push(jobItem);
                logV2(INFO, "JOBLIST", "Add Job: " + jobItem.id + " - " + jobItem.description);
            }
            else {
                district.jobs[index] = jobItem;
                logV2(INFO, "JOBLIST", "Update Job: " + jobItem.id + " - " + jobItem.description);
            }
        }
        //MR_JOBS_FILE.file += ".NEW";
        writeObject(jobObj, MR_JOBS_FILE);
    }

    function getJobObject(){
        var obj = { "id": null,
                    "chapter": null,
                    "type": "ENERGY",
                    "description": null,
                    "loot": false,
                    "consumable": false,
                    "money": 0
        }
        return obj;
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

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
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
