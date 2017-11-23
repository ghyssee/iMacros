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

init();
var JOB_FOLDER = "MR/Jobs";
var COMMON_FOLDER = "MR/Common";

var jobsObj = initObject(MR_JOBS_FILE);

//var job = getHighestPayloadJob(jobsObj.districts);
//logJob(job, "Job With Highest Money Ratio");

//job = getHighestRatio(jobsObj.districts);
//logJob(job, "Job With Highest Ratio");
/*
var retCode = playMacro(JOB_FOLDER, "20_Joblist_Info.iim", MACRO_INFO_LOGGING);
var txt = getLastExtract(1);
logV2(INFO, "TST", txt);

//var jobId = "<span id=\"job-mastery-81\" style=\"width: 100%; outline: 1px solid blue;\"><span>100% Complete</span></span>";
alert(extractJobId(jobId));
*/
//convertFighterObj();

var CONSTANTS = Object.freeze({
    "FILTER" : {
        "YES": 0,
        "NO": 1,
        "WHATEVER" : 2,
        "ENERGY" : "ENERGY",
        "STAMINA": "STAMINA"
    },
    "SELECTTYPES" : {
        "EVENT" : 1,
        "MONEY": 2,
        "MONEYCOST": 3,
        "CONSUMABLECOST": 4,
        "JOBTYPE": 5,
        "ENERGYRANGE": 6,
        "EXPRANGE": 7,
        "DISTRICT": 8,
        "CHAPTER": 9
    },
    "SORTING" : {
        "MONEY" : "moneyRatio",
        "RATIO": "ratio",
        "ENERGY": "energy",
        "EXP": "exp",
        "ASCENDING": 1,
        "DESCENDING": 2
    }
});

var selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.ENERGY),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJob(jobsObj.districts, selections, "HighestEnergyJobRatio.csv",CONSTANTS.SORTING.RATIO);

selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.STAMINA),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJob(jobsObj.districts, selections, "HighestStaminaJobRatio.csv", CONSTANTS.SORTING.RATIO);
selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEY, CONSTANTS.FILTER.YES),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "HighestMoneyRatio.csv", CONSTANTS.SORTING.MONEY);

selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.ENERGY),
    addFilter(CONSTANTS.SELECTTYPES.ENERGYRANGE, CONSTANTS.FILTER.YES, 0, 100),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "EnergyRange.csv", CONSTANTS.SORTING.RATIO, CONSTANTS.SORTING.DESCENDING);

selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.ENERGY),
    addFilter(CONSTANTS.SELECTTYPES.ENERGYRANGE, CONSTANTS.FILTER.YES, 0, 100),
    addFilter(CONSTANTS.SELECTTYPES.EXPRANGE, CONSTANTS.FILTER.YES, 358),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "ExpEnergyRange.csv", CONSTANTS.SORTING.EXP, CONSTANTS.SORTING.DESCENDING);

selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.STAMINA),
    addFilter(CONSTANTS.SELECTTYPES.ENERGYRANGE, CONSTANTS.FILTER.YES, 0, 100),
    addFilter(CONSTANTS.SELECTTYPES.EXPRANGE, CONSTANTS.FILTER.YES, 358),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "ExpStaminaRange.csv", CONSTANTS.SORTING.EXP, CONSTANTS.SORTING.DESCENDING);

/* Find The Best Job For the amount of energy I Have at this moment */
selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.ENERGY),
    addFilter(CONSTANTS.SELECTTYPES.ENERGYRANGE, CONSTANTS.FILTER.YES, 0, 32),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "CurrentEnergyBestJobRatio.csv", CONSTANTS.SORTING.EXP, CONSTANTS.SORTING.DESCENDING);

/* Find The Best Job For the amount of Stamina I Have at this moment */
selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEYCOST, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.STAMINA),
    addFilter(CONSTANTS.SELECTTYPES.ENERGYRANGE, CONSTANTS.FILTER.YES, 0, 48),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, "CurrentStaminaBestJobRatio.csv", CONSTANTS.SORTING.EXP, CONSTANTS.SORTING.DESCENDING);

selections = [  addFilter(CONSTANTS.SELECTTYPES.EVENT, CONSTANTS.FILTER.NO),
    addFilter(CONSTANTS.SELECTTYPES.MONEY, CONSTANTS.FILTER.YES),
    addFilter(CONSTANTS.SELECTTYPES.JOBTYPE, CONSTANTS.FILTER.ENERGY),
    addFilter(CONSTANTS.SELECTTYPES.DISTRICT, CONSTANTS.FILTER.YES, "1"),
    addFilter(CONSTANTS.SELECTTYPES.CHAPTER, CONSTANTS.FILTER.YES, 1, 4),
    addFilter(CONSTANTS.SELECTTYPES.CONSUMABLECOST, CONSTANTS.FILTER.NO)
];
getJobs(jobsObj.districts, selections, "BestEnergyMoneyJobForDistrict1Chapter1_4.csv", CONSTANTS.SORTING.MONEY, CONSTANTS.SORTING.DESCENDING);

/*
EVENT: YES / NO / WHATEVER
MONEY: YES / NO / WHATEVER
RATIO: YES / NO / WHATEVER
switch selecttype
    case EVENT:
        if WHATEVER || (district.event && YES)
            => job is selectable
    case MONEY:
        if WHATEVER || (job.money >0 && YES)
            => job is selectable
    case CONSUMABLE:
        if WHATEVER || (job.consumableCost && YES)
            => job is selectable

after that, sort on highest money or ratio
*/

function logJob2(job, title, selectable){
    logV2(INFO, "JOB", title);
    logV2(INFO, "JOB", "ID: " + job.id);
    logV2(INFO, "JOB", "Name: " + job.description);
    logV2(INFO, "JOB", "District: " + job.districtId + " - " + job.districtName);
    logV2(INFO, "JOB", "Chapter: " + job.chapter);
    logV2(INFO, "JOB", "Type: " + job.type);
    logV2(INFO, "JOB", "Energy: " + job.energy);
    logV2(INFO, "JOB", "Experience: " + job.exp);
    logV2(INFO, "JOB", "Money: " + job.money);
    logV2(INFO, "JOB", "Selectable: " + selectable);
    logV2(INFO, "JOB", "Money Ratio: " + job.moneyRatio);
    logV2(INFO, "JOB", "Ratio: " + job.ratio);
    logV2(INFO, "JOB", "============================================================================");
}

function getMoneyRatio(job){
    var ratio = job.money / job.energy;
    return ratio;
}

function addFilter(type, value, min, max){
    var selectType = {"type": type, "value": value, "min": min, "max": max};
    return selectType;
}

function convertBooleanToFilterType(value){
    if (value){
        return CONSTANTS.FILTER.YES;
    }
    else {
        return CONSTANTS.FILTER.NO;
    }
}

function isJobSelectable(filters, district, job){
    var valid = true;
    for (var i=0; i < filters.length; i++){
        var typeObj = filters[i];
        // 338-164=  error line start: 174
        switch (typeObj.type) {
            case CONSTANTS.SELECTTYPES.EVENT:
                if (typeObj.value == CONSTANTS.FILTER.WHATEVER || convertBooleanToFilterType(district.event) == typeObj.value){
                    //alert("NO EVENT");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.MONEY:
                if (typeObj.value == CONSTANTS.FILTER.WHATEVER || convertBooleanToFilterType(job.money > 0) == typeObj.value){
                    //alert("MONEY");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.MONEYCOST:
                if (typeObj.value == CONSTANTS.FILTER.WHATEVER || (convertBooleanToFilterType(job.money < 0) == typeObj.value)){
                 //   alert("COSTS NO MONEY");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.CONSUMABLECOST:
                if (typeObj.value == CONSTANTS.FILTER.WHATEVER || (convertBooleanToFilterType(job.consumableCost) == typeObj.value)){
                   // alert("COSTS NO CONSUMABLE");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.JOBTYPE:
                if (typeObj.value == CONSTANTS.FILTER.WHATEVER || job.type == typeObj.value){
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.ENERGYRANGE:
                if ((typeObj.value == CONSTANTS.FILTER.WHATEVER || typeObj.value == CONSTANTS.FILTER.YES)
                    && job.energy >= typeObj.min && isMaxRange(job.energy, typeObj.max) //job.energy <= typeObj.max
                   )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.EXPRANGE:
                if ((typeObj.value == CONSTANTS.FILTER.WHATEVER || typeObj.value == CONSTANTS.FILTER.YES)
                    && job.exp >= typeObj.min && isMaxRange(job.exp, typeObj.max)
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.DISTRICT:
                if ((typeObj.value == CONSTANTS.FILTER.WHATEVER || typeObj.value == CONSTANTS.FILTER.YES)
                    && district.id == typeObj.min
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case CONSTANTS.SELECTTYPES.CHAPTER:
                logV2(INFO, "RANGE", "Chapter: " + typeObj.min);
                logV2(INFO, "RANGE", "Chapter: " + typeObj.max);
                logV2(INFO, "RANGE", "Chapter Job: " + job.chapter);
                var chapter = parseInt(job.chapter);
                if ((typeObj.value == CONSTANTS.FILTER.WHATEVER || typeObj.value == CONSTANTS.FILTER.YES)
                    && chapter >= typeObj.min && isMaxRange(chapter, typeObj.max)
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
        }
    }
    return valid;
}

function isMaxRange(value, maxRange){
    var valid = false;
    if (isUndefined(maxRange)){
        valid = true;
    }
    else if (maxRange == null){
        valid = true;
    }
    else {
        valid = (value <= maxRange);
    }
    return valid;
}

function getJobs(districts, filters, file, sorting, order){
    var selectedJobs = [];
    if (isUndefined(order)){
        order = CONSTANTS.SORTING.DESCENDING;
    }
    var length = districts.length;
    for (var i=0; i < length; i++){
        var district = districts[i];
        var nrOfJobs = district.jobs.length;
        for (var j=0; j < nrOfJobs; j++){
            var job = district.jobs[j];
            var test = isJobSelectable(filters, district, job);
            job.ratio = getRatio(job);
            job.moneyRatio = getMoneyRatio(job);
            job.districtId = district.id;
            job.districtName = district.description;
            logJob2(job, "SELECTABLE", test);
            if (test) {
                selectedJobs.push(job);
            }
        }
    }
    switch (order) {
        case CONSTANTS.SORTING.DESCENDING:
            selectedJobs.sort(function(a, b) {
                return b[sorting] - a[sorting];
            });
            break;
        case CONSTANTS.SORTING.ASCENDING:
            selectedJobs.sort(function(a, b) {
                return a[sorting] - b[sorting];
            });
            break;
    }
    logV2(INFO, "SORTED", "Sorted...");
    logV2(INFO, "SORTED", "-----------------------------------------------------------------------------");
    logV2(INFO, "TST", JSON.stringify(selectedJobs));
    file = DATASOURCE_DIR + file;
    if (file != null) {
        deleteFile(file);
        for (var i = 0; i < selectedJobs.length; i++) {
            writeObjectToCSV(selectedJobs[i], file);
        }
        logV2(INFO, "TST", "Result written to: " + file);
    }
    return selectedJobs;

}

function getRatio(job){
    var ratio = job.exp / job.energy;
    return ratio;
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
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
