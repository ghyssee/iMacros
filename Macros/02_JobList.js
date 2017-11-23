// 788
var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.3.js"));
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

var jobsObj = initObject(MR_JOBS_FILE);
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0,
                      "lastDistrict": null, "lastChapter": null,
                     };

startList();

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
        "JOBTYPE": 5
    },
    "SORTING" : {
        "MONEY" : "moneyRatio",
        "RATIO": "ratio"
    }
});

var selectObj = {
    "EVENT" : 1,
    "MONEY": 2,
    "CONSUMABLECOST": 3,
    "HIGHESTRATIO": 4,
    "HIGHESTMONEY": 5
}

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
//getJob(jobsObj.districts, selections, "HighestMoneyRatio.csv", CONSTANTS.SORTING.MONEY);
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


function logJob(job, title, sorting){
    logV2(INFO, "JOB", title);
    logV2(INFO, "JOB", "ID: " + job.id);
    logV2(INFO, "JOB", "Name: " + job.description);
    logV2(INFO, "JOB", "District: " + job.districtId + " - " + job.districtName);
    logV2(INFO, "JOB", "Chapter: " + job.chapter);
    logV2(INFO, "JOB", "Type: " + job.type);
    logV2(INFO, "JOB", "Energy: " + job.energy);
    logV2(INFO, "JOB", "Experience: " + job.exp);
    logV2(INFO, "JOB", "Money: " + job.money);
    logV2(INFO, "JOB", "Money Ratio: " + job.moneyRatio);
    logV2(INFO, "JOB", "Ratio: " + job.ratio);
}

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

function addFilter(type, value){
    var selectType = {"type": type, "value": value};
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
        }
    }
    return valid;
}


function getJob(districts, filters, file, sorting){
    var foundJob = null;
    var selectedJobs = [];

    for (var i=0; i < districts.length; i++){
        var district = districts[i];
        for (var j=0; j < district.jobs.length; j++){
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
    selectedJobs.sort(function(a, b) {
        return b[sorting] - a[sorting];
    });
    logV2(INFO, "SORTED", "Sorted...");
    logV2(INFO, "SORTED", "-----------------------------------------------------------------------------");
    logV2(INFO, "TST", JSON.stringify(selectedJobs));
    file = DATASOURCE_DIR + file;
    deleteFile(file);
    for (var i=0; i < selectedJobs.length; i++){
        writeObjectToCSV(selectedJobs[i], file);
    }
    logV2(INFO, "TST", "Result written to: " + file);
    return foundJob;

}

function getRatio(job){
    var ratio = job.exp / job.energy;
    return ratio;
}

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


function startList() {
    try {
        var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            // district 1

            /*
            for (var i=1; i <= 10; i++) {
                startChapter("1", i.toString());
            }*/

            // district 2
            for (var i=11; i <= 20; i++) {
                startChapter("2", i.toString());
            }
            writeObject(jobsObj, MR_JOBS_FILE);
        }
        else
            {
                logV2(INFO, "JOBLIST", "Problem Starting Mafia Wars");
            }
    }
    catch (ex) {
            logError(ex);
        }

}
    function extractStar(starInfo){
        // <div class="job_star bronze_star" style="outline: 1px solid blue;"></div>
        var regExp = /job_star (.*)\" style/;
        var matches = starInfo.match(regExp);
        if (matches != null && matches.length > 0){
            var star = matches[matches.length-1];
            return star.trim().toLowerCase();
        }
        logV2(ERROR, "JOBLIST", "problem Extracting Star: " + starInfo);
        return starInfo;
}

    function getChapterInfo(districtId, chapter){
        var chapterObj = {"id": chapter, "name": null, "star": null};
        var retCode = playMacro(JOB_FOLDER, "13_ChapterInfo.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS){
            var starInfo = getLastExtract(1, "Star Ranking", "silver_star").toLowerCase();
            chapterObj.star = extractStar(starInfo);
            chapterObj.name = getLastExtract(2, "Chapter Name", "BlaBla");
            if (isNullOrBlank(chapterObj.star)){
                logV2(INFO, "JOBLIST", "Problem extracting Star Ranking");
            }
        }
        else {
            logV2(INFO, "JOBLIST", "Problem Getting Star Ranking");
        }
        return chapterObj;
    }

    function addOrUpdateChapter(districtId, chapterObj){
        var district = findDistrict(jobsObj.districts, districtId);
        if (district == null){
            throw new Error ("District Not Found: " + districtId);
        }
        var found = -1;
        for (var i=0; i < district.chapters.length; i++){
            var foundChapterObj = district.chapters[i];
            if (foundChapterObj.id == chapterObj.id){
                found = i;
            }
        }
        if (found == -1){
            logV2(INFO, "JOBLIST", "Add Chapter: " + districtId + "/" + chapterObj.id);
            district.chapters.push(chapterObj);
        }
        else {
            logV2(INFO, "JOBLIST", "Update Chapter: " + districtId + "/" + chapterObj.id);
            district.chapters[found] = chapterObj;
        }
    }

    function startChapter(districtId, chapter){

        try {
            var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS) {
                addMacroSetting("DISTRICT", districtId);
                retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
                if (retCode == SUCCESS) {
                    addMacroSetting("DISTRICT", districtId);
                    addMacroSetting("CHAPTER", chapter);
                    retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
                    if (retCode == SUCCESS){
                        var chapterObj = getChapterInfo(districtId, chapter);
                        logV2(INFO, "CHAPTER", JSON.stringify(chapterObj));
                        addOrUpdateChapter(districtId, chapterObj);
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
        catch (ex) {
            logError(ex);
            logV2(INFO, "SUMMARY", "Jobs Completed: " + globalSettings.jobsCompleted);
            logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
        }
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


                addMacroSetting("ID", counter.toString());
                retCode = playMacro(JOB_FOLDER, "21_Joblist_Cost_Consumable.iim", MACRO_INFO_LOGGING);
                if (retCode == SUCCESS){
                    txt = getLastExtract(1, "CONSUMABLECOST", "<div style=\"width: 145px; outline: 1px solid blue;\"><span class=\"energy\">156</span>&nbsp;<img src=\"https://d2swil18r7bmmr.cloudfront.net/img/items/200/travel_bag.png\" style=\"width:40px;height:40px;vertical-align:middle;\" class=\"item\" data-id=\"80\"></div>");
                    if (!isNullOrBlank(txt)){
                        jobObj.consumableCost = containsConsumable(txt);
                        txt = getLastExtract(2, "CONSUMABLE OR LOOT", "<div style=\"outline: 1px solid blue;\"><div style=\"display:table;\"><div style=\"display:table-cell;vertical-align:middle;text-align:center;\"><span class=\"experience\">283</span></div><div style=\"display:table-cell;vertical-align:middle;text-align:center;\">&nbsp;<span class=\"cash\">$100</span>&nbsp;<span class=\"loot item\" data-id=\"81\"></span></div></div></div>");
                        jobObj.consumable = containsConsumable(txt);
                        jobObj.loot = containsLoot(txt);
                    }
                }
                logV2(INFO, "JOBLIST", "consumableCost: " + jobObj.consumableCost);
                logV2(INFO, "JOBLIST", "consumable: " + jobObj.consumable);
                logV2(INFO, "JOBLIST", "Loot: " + jobObj.loot);
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
    //var jobObj = initObject(MR_JOBS_FILE);
        var district = findDistrict(jobsObj.districts, districtId);
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
    }

    function getJobObject(){
        var obj = { "id": null,
                    "chapter": null,
                    "type": "ENERGY",
                    "description": null,
                    "loot": false,
                    "consumableCost": false,
                    "consumable": false,
                    "money": 0
        }
        return obj;
    }

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
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

function convertFighterObj(){
    var fightObj = initObject(MR_FIGHTERS_FILE);
    newFighters = [];
    fightObj.fighters.forEach( function (fighter) {
        var newObj = getFighterObject();
        for (var key in fighter) {
            var value = fighter[key];
            newObj[key] = value;
        }
        newFighters.push(newObj);
    });
    fightObj.fighters = newFighters;
    MR_FIGHTERS_FILE.file += ".NEW";
    writeObject(fightObj, MR_FIGHTERS_FILE);
}

function getFighterObject(){
    return {"id":null, "name":null, "level": null, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null,
        "iced": 0
    };
}

function containsConsumable(text){
    return contains(text.toUpperCase(), " CLASS=\"ITEM");
}

function containsLoot(text){
    return contains(text.toUpperCase(), "SPAN CLASS=\"LOOT ITEM\"");
}
