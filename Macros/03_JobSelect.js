// 788
var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.3.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MRJobSelect.js"));

var localConfigObject = null;
setMRPath("MRJobList");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

init();

var jobsObj = initMRObject(MR.MR_JOBS_FILE);

var selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJob(jobsObj.districts, selections, !JOBSELECT_LOG, "HighestEnergyJobRatio.csv",JOBSELECT.SORTING.RATIO);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.STAMINA),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJob(jobsObj.districts, selections, !JOBSELECT_LOG, "HighestStaminaJobRatio.csv", JOBSELECT.SORTING.RATIO);
selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEY, JOBSELECT.FILTER.YES),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "HighestMoneyRatio.csv", JOBSELECT.SORTING.MONEY);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 100),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "EnergyRange.csv", JOBSELECT.SORTING.RATIO, JOBSELECT.SORTING.DESCENDING);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 100),
    addFilter(JOBSELECT.SELECTTYPES.EXPRANGE, JOBSELECT.FILTER.YES, 358),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "ExpEnergyRange.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.STAMINA),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 100),
    addFilter(JOBSELECT.SELECTTYPES.EXPRANGE, JOBSELECT.FILTER.YES, 358),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "ExpStaminaRange.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

/* Find The Best Job For the amount of energy I Have at this moment */
selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 32),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "CurrentEnergyBestJobRatio.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

/* Find The Best Job For the amount of Stamina I Have at this moment */
selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.STAMINA),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 48),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
//getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "CurrentStaminaBestJobRatio.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEY, JOBSELECT.FILTER.YES),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.DISTRICT, JOBSELECT.FILTER.YES, "1"),
    addFilter(JOBSELECT.SELECTTYPES.CHAPTER, JOBSELECT.FILTER.YES, 1, 4),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "BestMoneyEnergyJobForDistrict1Chapter1To4.csv", JOBSELECT.SORTING.MONEY, JOBSELECT.SORTING.DESCENDING);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.EXPRANGE, JOBSELECT.FILTER.YES, 0, 1000),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "BestJobForNotLevelingUp.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

selections = [  addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
    addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
    addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 2000),
    addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
];
getJobs(jobsObj.districts, selections, !JOBSELECT_LOG, "BestJobForLevelingUp.csv", JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);

alert ("done");

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
