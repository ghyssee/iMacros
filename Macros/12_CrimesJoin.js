var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.2.js"));
eval(readScript(MACROS_PATH + "\\js\\MRJobSelect.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\underscore-min.js"));

//xxx : 180-9 = 171

var NEWLINE = "\n";
var JOBCONSTANTS = Object.freeze({
    "ROBBING": {
        "CHOOSE_PROPERTY": 0,
        "START": 1,
        "SUCCESSFUL": 2,
        "NOSTAMINA": 3,
        "COLLECT": 4,
        "FINISHED": 5,
        "END": 6,
        "PROBLEM": -1
    }
});

var localConfigObject = null;
setMRPath("MRCrimes");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var STAMINA = "STAMINA";

var CONSTANTS = Object.freeze({
    "EXECUTE" : {
        "REPEAT": "REPEAT",
        "COMPLETE": "COMPLETE",
    },
    "STATUS" : {
        "OK": 1,
        "NOT_ENOUGH": 2,
        "LEVELUP": 3,
        "SKIP": 4,
        "PROBLEM": 5,
        "UNKNOWN": -1
    },
    "STORY" : {
        "DONE": 1,
        "NOENERGY": 2,
        "SKIP": 3,
        "PROBLEM": 4,
        "RESTART": 5
    }
});
init();

var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var settingsObj = initObject(getMRRootFile(MR.MR_SETTINGS_FILE));
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0,
                      "lastDistrict": null, "lastChapter": null, "lowestEnergy": null, "lowestStamina": null,
                      "resources": null, "profileId": getProfile(),
                      "robbingStaminaCost": null,
                      "optimization": false
                     };

//start();
var crimeType = promptCrimes();
logV2(INFO, "CRIMES", crimeType);
if (crimeType != null){
	start(crimeType);
	configMRObj.crimeEvent.lastCrimeType = crimeType;
	writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
}

function start(crimeType) {

    var retCode = -1;
	try {
        //startMafiaReloaded();
		retCode = initCrimes();
		if (retCode == SUCCESS){
			do {
				var wait = false;
				joinCrimeEvent(crimeType);
				waitV2("1");
			}
			while (true);
		}
    }
    catch (ex) {
        logError(ex);
        logV2(INFO, "SUMMARY", "Jobs Completed: " + globalSettings.jobsCompleted);
        logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
    }
}

function initCrimes(){
    var retCode = initAndCheckScript(CRIMES_FOLDER, "Crimes_CollectInit.iim", "Crimes_CollectInit_Test.iim", "Global Crimes", "INITCOLLECTCRIME", "Init Collect Crimes");
    return retCode;
}

function joinCrimeEvent(crimeType){
    
    var stamina = false;
	var energy = false;
	var macro = "Crimes_Join1.iim";
	if (crimeType.contains("S")){
		addMacroSetting("POS1", "3");
		if (crimeType.contains("2")) {
			addMacroSetting("POS2", "2");
			macro = "Crimes_Join2.iim";
		}
		stamina = true;
	}
    else if (crimeType.contains("E")){
		addMacroSetting("POS1", "1");
		if (crimeType.contains("2")) {
			addMacroSetting("POS2", "0");
			macro = "Crimes_Join2.iim";
		}
		energy = true;
	}
	var retCode = playMacro(CRIMES_FOLDER, macro, MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        logV2(INFO, "JOB", "Crime Event Joined");
    }
    else {
        logV2(WARNING, "CRIMEEVENT", "Problem joining crime event");
    }
	
	
	return retCode;
}

	
function promptCrimes(){
	var TITLE = "Crimes" + NEWLINE + "-".repeat(100) + NEWLINE.repeat(2);
	var msg = "E = ENERGY" + NEWLINE;
	msg += "S = STAMINA" + NEWLINE;
	msg += "2 = Try for joing 2 crimes" + NEWLINE;
	msg += NEWLINE;
	var crimeType = configMRObj.crimeEvent.lastCrimeType;
	var exit = false;
	do {
		var inputTxt = prompt(TITLE + msg, crimeType);
		if (inputTxt != null){
			if (inputTxt != ""){
				if (inputTxt.contains("E") || inputTxt.contains("S")){
					crimeType = inputTxt;
					exit = true;
				}
			}
		}
		else {
			crimeType = null;
			exit = true;
		}
	}
	while (!exit);
	return crimeType;
}

function evaluateCrimeEvent(pos, activeJob, joinedCrime){
    var crimeObj = getCrimeEventObject();
    crimeObj.started = false;
    crimeObj.position = pos;
    addMacroSetting("pos", pos.toString());
    var retCode = playMacro(JOB_FOLDER, "36_CrimeEvent_Status.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Crime Event Status", "The crime is complete! Collect your reward.");
        logV2(INFO, "CRIME EVENT", "Crime Event Status: " + msg);
        if (!isNullOrBlank(msg)){
            crimeObj.exist = true;
            msg = msg.toUpperCase();
            if (contains(msg, "WAIT")) {
                crimeObj.exist = true;
                crimeObj.started = false;
                logV2(INFO, "CRIME EVENT", "Wait for others to finish");
            }
            else if (contains(msg, "THE CRIME IS COMPLETE")){
                crimeObj.exist = true;
                logV2(INFO, "CRIME EVENT", "Status: Collect");
                collectCrimeEvent(crimeObj);
                if (!joinedCrime) {
                    crimeObj.started = selectCrimeEvent(activeJob);
                }
            }
            else if (contains(msg, "CHOOSE A TASK")){
                crimeObj.exist = true;
                logV2(INFO, "CRIME EVENT", "Status: Choose Task");
                if (!joinedCrime) {
                    crimeObj.started = selectCrimeEvent(activeJob);
                }
                else {
                    crimeObj.started = false;
                    logV2(WARNING, "CRIME EVENT", "Joined Crime: Choose a Task: Not Supported");
                }
            }
            else if (contains(msg, "FILL")){
                logV2(INFO, "CRIME EVENT", "Status: Empty Task needs to be filled in");
                crimeObj.started = false;
                crimeObj.exist = true;
            }
            else if (contains(msg, "YOU HAVE NOT JOINED")){
                crimeObj.started = false;
                crimeObj.exist = false;
            }
            else if (contains(msg, "ACHIEVEMENT UNLOCKED")){
                closePopup();
                crimeObj.started = false;
                crimeObj.exist = false;
            }
            else if (contains(msg, "FINISH")){
                logV2(INFO, "CRIME EVENT", msg);
                crimeObj.started = true;
            }
            else if (contains(msg, "YOU HAVE ALREADY STARTED")){
                logV2(INFO, "CRIME EVENT", msg);
                crimeObj.started = false;
                crimeObj.exist = false;
                //configMRObj = initMRObject(MR.MR_CONFIG_FILE)
                //configMRObj.crimeEvent.enabled=false;
                //writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
            }
            else {
                crimeObj.started = false;
                crimeObj.error = true;
                crimeObj.exist = false;
                logV2(WARNING, "CRIME EVENT", "Unknown status");
                makeScreenShot("MRJobCrimeEventUnknownStatus");
            }
        }
        else {
            logV2(INFO, "CRIME EVENT", "Max. Help Crime Events Reached: " + pos-1);
            crimeObj.exist = false;
            //makeScreenShot("MRJobCrimeEventExtractStatusProblem");
        }
    }
    else {
        crimeObj.started = false;
        crimeObj.error = true;
        crimeObj.exist = false;
        logV2(WARNING, "CRIME EVENT", "Problem Getting Crime Event Status");
        makeScreenShot("MrJobCrimeEventStatusProblem");
    }
    logV2(INFO, "CRIME EVENT", "New Crime Started: " + JSON.stringify(crimeObj));
    return crimeObj;
}

function extractCrimeEventJob(text) {

    var regExp = /&(?:amp;)?task=([0-9])\"/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var job = matches[matches.length-1];
        job = parseInt(job);
        return job;
    }
    return -1;
}


function helpCrimeEvent(){
    logV2(INFO, "JOB", "Help Crime Event");
    var retCode = playMacro(JOB_FOLDER, "37_CrimeEvent_Help_Init.iim", MACRO_INFO_LOGGING);
    var retCode = initAndCheckScript(JOB_FOLDER, "37_CrimeEvent_Help_Init.iim", "28_CrimeEvent_Help_Init_Test.iim",
        "crimes joined", "CRIMES", "Crime Event Help Init");
    var exit = true;
    var pos = 1;
    if (retCode == SUCCESS) {
        do {
            crimeObj = evaluateCrimeEvent(pos, null, true);
            if (crimeObj.error) {
                logV2(INFO, "CRIMEHELP", "Error");
                exit = true;
            }
            else if (crimeObj.collected) {
                logV2(INFO, "CRIMEHELP", "COLLECTED");
                exit = false;
            }
            else if (!crimeObj.exist) {
                logV2(INFO, "CRIMEHELP", "MAX REACHED");
                exit = true;
            }
            else if (crimeObj.started) {
                logV2(INFO, "CRIMEHELP", "START " + crimeObj.position);
                startHelpCrimeEvent(pos);
                pos++;
                exit = false;
            }
            else if (crimeObj.exist){
                logV2(INFO, "CRIMEHELP", "SKIP " + crimeObj.position);
                pos++;
                exit = false;
            }
            else {
                exit = true;
                logV2(INFO, "JOB", "Help Crime Event: No crimes started");
            }
        }
        while (!exit);
    }
    else {
        logV2(WARNING, "JOB", "Problem Initializing Crime Event");
        makeScreenShot("MRJobCrimeEventHelpInitProblem");
    }
    logV2(INFO, "JOB", "---------------------------------------------------------------");
}

function getCrimeEventPercentCompleted(text){
    var regExp = /">([0-9]{1,3})% Complete/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var percent = matches[matches.length-1];
        percent = parseInt(percent);
        logV2(INFO, "JOBLIST", "CrimeEvent Percent Completed: " + percent);
        return percent;
    }
    else {
        logV2(WARNING, "JOBLIST", "Problem Finding CrimeEvent Percent Completed");
        makeScreenShot("MRJobCrimeEventPercentCompletedProblem");
    }
    return 100;
}


function goToHomePage(){
    var retCode = initAndCheckScript(COMMON_FOLDER, "30_Home.iim", "33_Home_Test.iim","feed", "STORY", "init Home");
    if (retCode != SUCCESS) {
            logV2(WARNING, "HOME", "Problem Going to home page");
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


function getResources(){
    var resourceObj = {"energyObj": null, "staminaObj": null, "exp": -1};
    var retCode = playMacro(COMMON_FOLDER, "14_GetResources.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        resourceObj.energyObj = extractEnergy(getLastExtract(1, "1000/5000", "1000"));
        resourceObj.staminaObj = extractStamina(getLastExtract(2, "1000/4000", "800"));
        resourceObj.exp = extractExperience(getLastExtract(3, "17,170 to level", "17170"));
    }
    else {
        logV2(WARNING, "RESOURCE", "Problem Getting Resources");
    }
    return resourceObj;
}

function extractEnergy(energyInfo){
    var energyObj = {"left": -1, "total": -1};
    if (!isNullOrBlank(energyInfo)) {
        logV2(INFO, "ENERGY", "energy = " + energyInfo);
        if (!isNullOrBlank(energyInfo)) {
            energyInfo = removeComma(energyInfo);
            var tmp = energyInfo.split("/");
            energyObj.left = parseInt(tmp[0]);
            energyObj.total = parseInt(tmp[1]);
            return energyObj;
        }
        else {
            logV2(WARNING, "ENERGY", "Problem Extracting Energy");
        }
    }
    else {
        logV2(WARNING, "ENERGY", "Problem Getting Energy");
    }
    return -1;
}

function extractStamina(staminaInfo) {
    var staminaObj = {"left": -1, "total": -1};
    if (!isNullOrBlank(staminaInfo)) {
        logV2(INFO, "ENERGY", "Stamina = " + staminaInfo);
        if (!isNullOrBlank(staminaInfo)) {
            staminaInfo = removeComma(staminaInfo);
            var tmp = staminaInfo.split("/");
            staminaObj.left = parseInt(tmp[0]);
            staminaObj.total = parseInt(tmp[1]);
            return staminaObj;
        }
        else {
            logV2(WARNING, "STAMINA", "Problem Extracting Stamina");
        }
    }
    else {
        logV2(WARNING, "STAMINA", "Problem Getting Stamina");
    }
    return staminaObj;
}

function getEnergyOrStamina(jobType, resourceObj){
    var total = 0;
    if (jobType == STAMINA){
        total = resourceObj.staminaObj.left;
    }
    else {
        total = resourceObj.energyObj.left;
    }
    return total;
}
