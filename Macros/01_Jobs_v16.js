var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.2.js"));
eval(readScript(MACROS_PATH + "\\js\\MRJobSelect.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));

//xxx : 180-9 = 171

var localConfigObject = null;
setMRPath("MRJobs");
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
        "PROBLEM": 4
    }
});
init();

var jobsObj = initMRObject(MR.MR_JOBS_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var settingsObj = initObject(getMRRootFile(MR.MR_SETTINGS_FILE));
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0,
                      "lastDistrict": null, "lastChapter": null, "lowestEnergy": null, "lowestStamina": null,
                      "resources": null, "profileId": getProfile()
                     };

//enableMacroPlaySimulation();
start();
//startStoryEvent();

//test();

function test(){
    var exp = getExperience();
    var collectObj = {"nrOfLevelUpJobsExecuted": 0};
    var listOfJobs = getListOfEnabledJobs(jobsObj.activeJobs);
    var newJobs = initJobs(listOfJobs);
    //doJobsWithoutLevelUp(newJobs, collectObj, exp);
    doLevelUpJob();

}

function start() {

    try {
        var listOfJobs = getListOfEnabledJobs(jobsObj.activeJobs);
        startMafiaReloaded();
        globalSettings.currentLevel = getLevel();
        var newJobs = initJobs(listOfJobs);
        do {
            logV2(INFO, "JOB", "DummyBanking");
            dummyBank();
            checkIfLevelUp();
            if (configMRObj.crimeEvent.enabled){
                startCrimeEvent();
                clearDistrict();
                if (configMRObj.crimeEvent.help){
                    helpCrimeEvent();
                    clearDistrict();
                }
            }
            if (configMRObj.storyEvent.enabled){
                clearDistrict();
                startStoryEvent();
            }
            var wait = true;
            if (configMRObj.jobs.money){
                var moneyJobs = getMoneyJobs();
                wait = doJobs(moneyJobs);
            }
            else {
                wait = doJobs(newJobs);
            }
            if (wait) {
                wait = doJobsWhenExperienceLow();
            }
            if (wait) {
                checkSkillTokens();
                checkDailyLink();
                //checkForCollectBonus(newJobs);
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
}

function getListOfEnabledJobs(listOfJobs) {
    jobList = [];
    listOfJobs.forEach(function (jobItem) {
        if (jobItem.enabled) {
            jobList.push(jobItem);
        }
    });
    return jobList;
}

function initJob(){
    var retCode = -1;
    var counter = 0;
    do {
        counter++;
        retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            // check if Init Screen is realy selected
            retCode = playMacro(JOB_FOLDER, "08_Job_Init_Test.iim", MACRO_INFO_LOGGING);
            var testDistrict = getLastExtract(1, "District", "Downtown");
            if (isNullOrBlank(testDistrict)){
                logV2(WARNING, "INITJOB", "Problem with init Job. TestDistrict is empty");
                retCode = -1;
            }
            else if (testDistrict.toLowerCase() != "downtown"){
                logV2(WARNING, "INITJOB", "Problem with init Job. TestDistrict is: " + testDistrict);
                retCode = -1;
            }
        }
        if (retCode != SUCCESS){
            logV2(WARNING, "INITJOB", "Retries: " + counter);
        }
    }
    while (retCode != SUCCESS && counter < 10);
    return retCode;
}

function doJobs(listOfJobs){
    var wait = true;
    logV2(INFO, "JOB", "Init Job");
    var retCode = initJob();
    if (retCode == SUCCESS) {
        var resourceObj = getResources();
        var exitLoop = false;
        for (var i = 0; i < listOfJobs.length; i++) {
            /*
            if (checkIfLevelUp()) {
                //obj = extractEnergyStamina();
                logV2(INFO, "JOB", "Level Up. Skipping rest of jobs");
                wait = false;
                break;
            }*/
            var jobItem = listOfJobs[i];
            if (jobItem.job.type == STAMINA && !jobsObj.staminaJobs) {
                // skip stamina jobs
                logV2(INFO, "JOB", "Skipping stamina job " + jobItem.job.id);
                continue;
            }
            var status = processJob(jobItem, resourceObj);
            switch (status) {
                case CONSTANTS.STATUS.LEVELUP:
                    logV2(INFO, "JOB", "Level Up After Job was executed");
                    wait = false;
                    exitLoop = true;
                    break;
                case CONSTANTS.STATUS.OK:
                    // do the same job again
                    wait = false;
                    resourceObj = getResources();
                    i--;
                    break;
                case CONSTANTS.STATUS.SKIP:
                    break;
                case CONSTANTS.STATUS.NOT_ENOUGH:
                    break;
                case CONSTANTS.STATUS.PROBLEM:
                    logV2(WARNING, "JOB", "Problem executing job : skip rest of jobs and try again");
                    makeScreenShot("MRJobDoJobsExecuteProblem");
                    wait = false;
                    exitLoop = true;
                    break;
                default:
                    logV2(WARNING, "JOB", "Unknown Status: " + status);
                    break;
            }
            if (exitLoop){
                break;
            }
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem with job page");
        makeScreenShot("MRJobInitProblem");
    }
    checkForUdpates(listOfJobs);
    logV2(INFO, "JOB", "Wait: " + wait);
    return wait;
}

function checkForUdpates(listOfJobs){
    // check if anything to update
    logV2(INFO, "JOB", "Check If Anything to update...");
    listOfJobs.forEach( function (jobItem) {
        if (jobItem.update){
            updateJobItem(jobItem);
            jobItem.update = false;
        }

    });
}

function updateJobItem(jobItem){
    var obj = initMRObject(MR.MR_JOBS_FILE);
    var save = false;
    obj.activeJobs.forEach( function (item) {
        if (item.id != null && item.id == jobItem.id){
            logV2(INFO, "JOB", "Update Job " + item.id + ": " + "numberOfTimesExecuted: " + item.numberOfTimesExecuted);
            item.numberOfTimesExecuted = jobItem.numberOfTimesExecuted;
            save = true;
        }
    });
    if (save){
        writeMRObject(obj, MR.MR_JOBS_FILE);
    }
}

function getJobTaskObject(districtId, jobId, type){
    var obj = {
        districtId: districtId,
        jobId: jobId,
        type: type,
        chapter: null,
        total: 0,
        numberOfTimesExecuted : 0,
        enabled: true,
        percentCompleted: null,
        minRange: 0,
        maxRange: 0
    }
    return obj;
}

function initJobs(listOfJobs){
    var newJobs = [];
    listOfJobs.forEach( function (jobItem) {
        if (jobItem.type == "CHAPTER") {
            if (jobItem.chapter != null) {
                var district = findDistrict(jobItem);
                if (district == null) {
                    logV2(WARNING, "JOB", "Problem Finding District " + jobItem.districtId);
                }
                else {
                    //logV2(INFO, "JOBS", "Dis: " + JSON.stringify(district));
                    district.jobs.forEach(function (v) {
                        if (district.event || v.chapter == jobItem.chapter) {
                            var jobTask = getJobTaskObject(jobItem.districtId, v.id, "COMPLETE");
                            newJobs.push(jobTask);
                        }
                    });
                }
            }
            else {
                logV2(INFO, "JOBS", "Chapter not filled in for type " + jobItem.type);
            }
        }
        else {
            newJobs.push(jobItem);
        }
    });

    newJobs.forEach( function (jobItem) {
        fillDistrictInfo(jobItem);
        if (jobItem.total == null){
            jobItem.total = 0;
        }
        if (jobItem.numberOfTimesExecuted == null){
            jobItem.numberOfTimesExecuted = 0;
        }
        jobItem.update = false;
        jobItem.percentCompleted = null;
        jobItem.completed = false;
        jobItem.ok = true;
        logV2(INFO, "JOB", JSON.stringify(jobItem));
        if (jobItem.job.type == "ENERGY") {
            if (globalSettings.lowestEnergy == null || globalSettings.lowestEnergy >= jobItem.job.energy) {
                globalSettings.lowestEnergy = jobItem.job.energy;
            }
        }
        if (jobItem.job.type == "STAMINA") {
            if (globalSettings.lowestStamina == null || globalSettings.lowestStamina >= jobItem.job.energy) {
                globalSettings.lowestStamina = jobItem.job.energy;
            }
        }
    });
    logV2(INFO, "JOB", "Lowest Energy Job: " + globalSettings.lowestEnergy);
    logV2(INFO, "JOB", "Lowest Stamina Job: " + globalSettings.lowestStamina);
    logV2(INFO, "JOB", "Job Initialization done");
    return newJobs;
}

function fillDistrictInfo(jobItem){
    if (typeof jobItem.ok == "undefined"){
        jobItem.ok = false;
        var district = findDistrict(jobItem);
        if (district == null) {
            logV2(WARNING, "JOB", "Problem Finding District " + jobItem.districtId);
        }
        else {
            var myDistrict = {"name": district.description, "event": district.event};
            jobItem.district = myDistrict;
            var job = findJob(jobItem.jobId, district);
            if (job == null){
                logV2(WARNING, "JOB", "Problem Finding Job " + jobItem.jobId);
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

function checkIfEnoughEnerygOrStamina(jobItem, resourceObj){
    var status = CONSTANTS.STATUS.OK;
    var total = getEnergyOrStamina(jobItem.job.type, resourceObj);
    logV2(INFO, "JOB", "Entering checkIfEnoughEnerygOrStamina - Total = " + total);
    if (total < jobItem.job.energy) {
        logV2(INFO, "JOB", "Not Enough energy/stamina to do job. Needed: " + jobItem.job.energy + " / Left: " + total);
        status = CONSTANTS.STATUS.NOT_ENOUGH;
    }
    logV2(INFO, "STATUS", "status = " + status);
    return status;

}

function isDistrictSelected(jobItem){
    var districtId = jobItem.districtId;
    addMacroSetting("DISTRICT", districtId);
    var retCode = SUCCESS;
    if (jobItem.district.event){
        retCode = playMacro(JOB_FOLDER, "16_DistrictSelectEvent.iim", MACRO_INFO_LOGGING);
    }
    else {
        retCode = playMacro(JOB_FOLDER, "15_DistrictSelect.iim", MACRO_INFO_LOGGING);
    }
    if (retCode == SUCCESS){
        var selectInfo = getLastExtract(1, "District Selected", "<a href=\"#\" class=\"ajax_request h2_btn selected\" data-params=\"controller=job&amp;action=hip&amp;loc=2\" style=\"outline: 1px solid blue;\">The Getaway</a>");
        if (!isNullOrBlank(selectInfo)) {
            selectInfo = selectInfo.toLowerCase();
            if (contains(selectInfo, "btn selected")) {
                logV2(INFO, "JOB", "Right District Selected: " + districtId);
                return true;
            }
        }
        else {
             logV2(WARNING, "JOB", "selectInfo: " + selectInfo);
        }
    }
    logV2(WARNING, "JOB", "Problem getting selected district");
    return false;
}

function isChapterSelected(jobItem){
    var chapter = jobItem.job.chapter;
    var districtId = jobItem.districtId;
    addMacroSetting("DISTRICT", districtId);
    addMacroSetting("CHAPTER", chapter);
    var retCode = playMacro(JOB_FOLDER, "14_ChapterSelect.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var selectInfo = getLastExtract(1, "Chapter Selected", "<a href=\"#\" class=\"ajax_request tab_button selected\" style=\"padding: 6px 2px; outline: 1px solid blue;\" data-params=\"controller=job&amp;action=hip&amp;loc=2&amp;tab=19\">Chapter 9</a>");
        if (!isNullOrBlank(selectInfo)) {
            selectInfo = selectInfo.toLowerCase();
            if (contains(selectInfo, "tab_button selected")) {
                logV2(INFO, "JOB", "Wright Chapter Selected: " + districtId + "/" + chapter);
                return true;
            }
        }
        else {
            logV2(WARNING, "JOB", "selectInfo: " + selectInfo);
            makeScreenShot("MRChapterExtractSelectInfoProbleù");
        }
    }
    logV2(WARNING, "JOB", "Problem getting selected chapter");
    return false;
}

function performDistrict(jobItem){
    var retCode = -1;
    var counter = 0;
    var ok = false;
    var district = jobItem.districtId;
    logV2(INFO, "JOB", "Old District: " + globalSettings.lastDistrict);
    logV2(INFO, "JOB", "Travelling to district " + district);
    do {
        counter++;
        if (counter > 1){
            logV2(INFO, "JOB", "Travel District Retries: " + counter);
        }
        if (jobItem.district.event) {
            retCode = playMacro(JOB_FOLDER, "06_Job_DistrictEvent.iim", MACRO_INFO_LOGGING);
        }
        else {
            addMacroSetting("DISTRICT", jobItem.districtId);
            retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
        }
        if (retCode == SUCCESS) {
            if (isDistrictSelected(jobItem)) {
                globalSettings.lastDistrict = district;
                ok = true;
            }
        }
        else {
            logV2(WARNING, "JOB", "Problem with travelling to district " + district + " / Counter = " + counter);
            ok = true;
        }
    }
    while (!ok && counter < 10);
    return retCode;
}

function goToDistrict(jobItem){
    var retCode = -1;
    if (globalSettings.lastDistrict != null && globalSettings.lastDistrict == jobItem.districtId && !isDistrictSelected(jobItem)){
        logV2(INFO, "JOB", "goToDistrict: Resetting District Info");
        clearDistrict();
    }
    if (globalSettings.lastDistrict == null || globalSettings.lastDistrict != jobItem.districtId) {
        logV2(INFO, "JOB", "Old District: " + globalSettings.lastDistrict);
        logV2(INFO, "JOB", "Travelling to district " + jobItem.districtId);
        retCode = performDistrict(jobItem);
    }
    else {
        logV2(INFO, "JOB", "No Travelling. Active District is: " + jobItem.districtId);
        retCode = SUCCESS;
    }
    return retCode;
}

function performChapter(jobItem){
    var retCode = -1;
    var counter = 0;
    var ok = false;
    logV2(INFO, "JOB", "Old Chapter: " + globalSettings.lastChapter);
    logV2(INFO, "JOB", "Travelling to chapter " + jobItem.job.chapter);
    do {
        counter++;
        if (counter > 1){
            logV2(INFO, "JOB", "Travel Chapter Retries: " + counter);
        }
        addMacroSetting("DISTRICT", jobItem.districtId);
        addMacroSetting("CHAPTER", jobItem.job.chapter);
        retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
        if (retCode != SUCCESS) {
            logV2(INFO, "JOB", "Problem Selecting chapter");
            makeScreenShot("MRJobsChapterSelect");
            ok = true;
        }
        else {
            if (isChapterSelected(jobItem)) {
                globalSettings.lastChapter = jobItem.job.chapter;
                ok = true;
            }
        }
    }
    while (!ok && counter < 10);
    return retCode;
}

function goToChapter(jobItem){
    var retCode = -1;
    if (jobItem.job.chapter !== null){
        if (globalSettings.lastChapter != null && globalSettings.lastChapter == jobItem.job.chapter && !isChapterSelected(jobItem)){
            logV2(INFO, "JOB", "GoToChapter: Resetting Chapter Info");
            clearDistrict();
        }
        if (globalSettings.lastChapter == null || globalSettings.lastChapter != jobItem.job.chapter) {
            retCode = performChapter(jobItem);
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

function processJob(jobItem, resourceObj){

    if (!jobItem.ok) {
        logV2(WARNING, "JOB", "Problem with Job " + jobItem.jobId);
        clearDistrict();
        return CONSTANTS.STATUS.SKIP;
    }
    var status = isValidJob(jobItem, resourceObj);
    if (status == CONSTANTS.STATUS.OK){
        status = travel(jobItem);
        if (status === CONSTANTS.STATUS.OK) {
            logJob(jobItem);
            status = validateAndExecuteJob(jobItem);
            logV2(INFO, "JOB", "Job Status: " + status);
        }
        else {
            status = CONSTANTS.STATUS.PROBLEM;
        }
    }
    else {
        logV2(INFO, "JOB", "Job Not Valid: " + jobItem.districtId + "/" + jobItem.jobId);
        logV2(INFO, "JOB", "STATUS: " + status);
    }
    return status;
}

function clearDistrict(){
    globalSettings.lastDistrict = null;
    globalSettings.lastChapter = null;
}

function validateAndExecuteJob(jobItem){
    var status = CONSTANTS.STATUS.OK;
    if (jobItem.percentCompleted == null || jobItem.percentCompleted == -1) {
        jobItem.percentCompleted = getPercentCompleted(jobItem);
    }
    if (jobItem.percentCompleted == -1){
        logV2(WARNING, "JOB", "Skip This Job for now. There was a problem going to the right chapter");
        status = CONSTANTS.STATUS.PROBLEM;
    }
    else if (isJobCompleted(jobItem)){
        logV2(INFO, "JOB", "Job is already Completed");
        status = CONSTANTS.STATUS.SKIP;
    }
    else {
        var valid = executeJob(jobItem);
        if (valid) {
            status = CONSTANTS.STATUS.OK;
            jobItem.update = true;
            jobItem.numberOfTimesExecuted++;
            globalSettings.lastDistrict = jobItem.districtId;
            globalSettings.lastChapter = jobItem.job.chapter;
            if (checkIfLevelUp()){
                logV2(INFO, "JOB", "executeJob: Level Up");
                status = CONSTANTS.STATUS.LEVELUP;
            }
        }
        else {
            status = CONSTANTS.STATUS.PROBLEM;
        }
    }
    return status;

}

function isRangeDefined(jobItem){
    var defined = jobItem.minRange > 0 || jobItem.maxRange > 0;
    return defined;
}

function isJobCompleted(jobItem){
    var completed = false;
    if (jobItem.type == CONSTANTS.EXECUTE.COMPLETE){
        if (jobItem.percentCompleted == null || jobItem.percentCompleted == -1){
            // state is uncertain, skip the job for now
            completed = true;
        }
        else if (jobItem.percentCompleted == 100) {
            completed = true;
        }
    }
    return completed;
}

function isValidJob(jobItem, resourceObj){
    var category = "VALIDJOB";
    logV2(INFO, category, "Entering isValidJob");
    var validJobStatus = CONSTANTS.STATUS.UNKNOWN;
    if (!settingsObj.global.eventEnabled && jobItem.district.event){
        logV2(INFO, "VALIDJOB", "Event is disabled");
        validJobStatus = CONSTANTS.STATUS.SKIP;
        return validJobStatus;
    }
    if (isRangeDefined(jobItem)){
        logV2(INFO, category, "Range is defined for this job");
        var resource = getEnergyOrStamina(jobItem.job.type, resourceObj);
        logV2(INFO, category, "Energy/Stamina left: " + resource);
        logObj(INFO, category, jobItem);
        if (resource >= jobItem.minRange && resource <= jobItem.maxRange){
            logV2(INFO, "JOB", "Job is within Range: " + jobItem.minRange + " - " + jobItem.maxRange);
        }
        else {
            logV2(INFO, "JOB", "Energy/Stamina are not in the range: " + resource + " / Range: " + jobItem.minRange + " - " + jobItem.maxRange);
            validJobStatus = CONSTANTS.STATUS.SKIP;
            return validJobStatus;
        }
    }
    switch (jobItem.type){
        case CONSTANTS.EXECUTE.REPEAT:
            if (jobItem.total > 0 && jobItem.numberOfTimesExecuted >= jobItem.total){
                logV2(INFO, category, "Nr Of Times Exceeded: " + jobItem.numberOfTimesExecuted + "/" + jobItem.total);
                validJobStatus = CONSTANTS.STATUS.SKIP;
            }
            else {
                validJobStatus = CONSTANTS.STATUS.OK;
            }
            break;
        case CONSTANTS.EXECUTE.COMPLETE:
            if (jobItem.percentCompleted != null && jobItem.percentCompleted == 100){
                logV2(INFO, category, "Job is already completed");
                validJobStatus = CONSTANTS.STATUS.SKIP;
            }
            else {
                validJobStatus = CONSTANTS.STATUS.OK;
            }
            break;
    }
    if (validJobStatus == CONSTANTS.STATUS.OK) {
        validJobStatus = checkIfEnoughEnerygOrStamina(jobItem, resourceObj);
    }
    logV2(INFO, category, "Job " + jobItem.jobId + " validJobStatus: " + validJobStatus);
    return validJobStatus;
}

function logJob(jobItem){
    var line = "DistrictId: " + jobItem.districtId;
    if (jobItem.job.chapter !== null) {
        line += " / Chapter: " + jobItem.job.chapter;
    }
    if (jobItem.district.event) {
        line += " / Event: Yes";
    }
    line += " / Id: " + jobItem.job.id;
    line += " / Energy: " + jobItem.job.energy;
    line += " / Exp: " + jobItem.job.exp;
    logHeader(INFO, "JOB", line);
}

function executeJob(jobItem){
    var success = false;
    if (performJob(jobItem.job.id, jobItem.district.event, jobItem.job.chapter) !== SUCCESS) {
        logV2(INFO, "JOB", "Problem Executing Job");
        logV2(INFO, "JOB", "District: " + jobItem.district);
        if (jobItem.job.chapter != null) {
            logV2(INFO, "JOB", "Chapter: " + jobItem.job.chapter);
        }
        logV2(INFO, "JOB", "Id: " + jobItem.job.id);
        success = false;
    }
    else {
        if (jobItem.percentCompleted < 100) {
            var completeAfter = getPercentCompleted(jobItem);
            logV2(INFO, "JOB", "Complete After: " + completeAfter);
            logV2(INFO, "JOB", "jobItem.percentCompleted: " + jobItem.percentCompleted);
            if ((completeAfter === 100) && (jobItem.percentCompleted < 100)) {
                logV2(INFO, "JOB", "Close Popup For Skill Point");
                closePopup();
            }
            jobItem.percentCompleted = completeAfter;
        }
        globalSettings.money += checkSaldo();
        success = true;
    }
    return success;
}

function performJob(jobId, districtEvent, chapter) {
    addMacroSetting("ID", jobId);
    var retCode = 0;
    if (districtEvent) {
        retCode = playMacro(JOB_FOLDER, "07_Job_StartEvent.iim", MACRO_INFO_LOGGING);
    }
    else {
        addMacroSetting("CHAPTER", chapter);
        retCode = playMacro(JOB_FOLDER, "04_Job_Start.iim", MACRO_INFO_LOGGING);
    }
    if (retCode === SUCCESS){
        globalSettings.money += checkSaldo();
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
	var level = getLevel();
	if (level > 0){
		if (level > globalSettings.currentLevel){
            leveledUp = true;
		    logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
			var ret = closePopupByText("Level Up");
			if (ret === SUCCESS){
				logV2(INFO, "LEVELUP", "Dialog Box Closed");
			}
			globalSettings.currentLevel = level;
		}
	}
	else {
        logV2(WARNING, "LEVELUP", "Problem Getting Level");
        makeScreenShot("MRJobGetLevelProblem");
    }
	return leveledUp;
}

function getPercentCompleted(jobItem){
    var percent = 100;
    addMacroSetting("ID", jobItem.jobId);
    var retCode = playMacro(JOB_FOLDER, "11_PercentCompleted.iim", MACRO_INFO_LOGGING);
    if (retCode === SUCCESS) {
        var percentInfo = getLastExtract(1, "Percent Completed", "50%");
        logV2(INFO, "JOB", "%completed = " + percentInfo);
        if (!isNullOrBlank(percentInfo)) {
            percentInfo = percentInfo.replace("%", "").toUpperCase();
            percentInfo = percentInfo.replace(" COMPLETE", "");
            var percentCompleted = parseInt(percentInfo);
            percent = parseInt(percentCompleted);
        }
        else {
            clearDistrict();
            logV2(WARNING, "JOB", "Problem Extracting Percent Completed");
            makeScreenShot("MRJobPercentCompletedExtractProblem");
            percent = -1;
        }
    }
    else {
        clearDistrict();
        logV2(WARNING, "JOB", "Problem getting Percent Completed");
        makeScreenShot("MRJobPercentCompletedProblem");
        percent = -1;
    }
    return percent;
}

function collectCrimeEvent(crimeObj){
    var retCode = playMacro(JOB_FOLDER, "35_CrimeEvent_Collect.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        makeScreenShot("MRCollectCrimeEvent");
        closePopupByTextV2(settingsObj.crimeJobPopup);
        globalSettings.money += checkSaldo();
        crimeObj.collected = true;
        logV2(INFO, "JOB", "Crime Event Collected");
    }
    else {
        logV2(WARNING, "CRIMEEVENT", "Problem collecting crime event");
    }
}

function doCrimeJob(crimeJobNr, job, energy, energyNeeded){
    while (energyNeeded <= energy ){
        logV2(INFO, "JOB", "Energy/Stamina Needed: " + energyNeeded + " / Energy/Stamina Available: " + energy);
        var jobTaskPos = (crimeJobNr-1)*4 + job.position;
        logV2(INFO, "JOB", "jobTaskPos: " + jobTaskPos);
        addMacroSetting("POSITION", jobTaskPos.toString());
        var retCode = playMacro(JOB_FOLDER, "32_CrimeEvent_PercentCompleted.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var msg = getLastExtract(1, "CrimeEvent Percent Completed", "</div>56% Complete<br><a href=\"#\" class=\"ajax_request");
            if (!isNullOrBlank(msg)){
                percent= getCrimeEventPercentCompleted(msg);
                if (percent < 100){
                    retCode = playMacro(JOB_FOLDER, "33_CrimeEvent_Start.iim", MACRO_INFO_LOGGING);
                    if (retCode == SUCCESS){
                        logV2(INFO, "JOB", "Crime Event: Job Executed");
                        checkIfLevelUp();
                    }
                    else {
                        logV2(WARNING, "JOB", "Crime Event: Problem Executing job");
                        makeScreenShot("MRJobCrimeEventExecuteProblem");
                    }
                }
                else {
                    logV2(INFO, "JOB", "Crime Event: DONE");
                    break;
                }
            }
            else {
                logV2(WARNING, "JOB", "Problem Extracting Percent Completed");
                makeScreenShot("MRJobCrimeEventExtractPercentCompletedProblem");
            }
        }
        else {
            logV2(WARNING, "JOB", "Problem Starting Job Crime Event");
            makeScreenShot("MRJobCrimeEventStartProblem");
        }
        energy = getEnergyOrStamina(job.type, getResources());
    }
}

function selectCrimeEvent(activeJob){
    var started = false;
    if (configMRObj.crimeEvent.startNewCrime) {
        addMacroSetting("POSITION", (activeJob.position - 1).toString());
        var retCode = initAndCheckScript(JOB_FOLDER, "31_CrimeEvent_SelectJob.iim", "27_CrimeEvent_SelectJob_Test.iim",
            "0% complete", "CRIMES", "Crime Event Select Crime Init");
        if (retCode == SUCCESS) {
            logV2(INFO, "JOB", "Crime Job Selected: " + activeJob.position);
            started = true;
        }
        else {
            logV2(WARNING, "JOB", "Problem Selecting Crime Event");
            makeScreenShot("MRJobCrimeEventSelectProblem");
        }
    }
    else {
        logV2(INFO, "JOB", "Starting new crime is disabled");
    }
    return started;
}

function getCrimeEventObject(){
    var obj = { started: false,
        collected: false,
        exist: false,
        position: 0,
        error: false,
    };
    return obj;
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

function startHelpCrimeEvent(pos){
    logV2(INFO, "HELPCRIME", "Crime Event Help Job Number: " + pos);
    addMacroSetting("pos", pos.toString());
    retCode = playMacro(JOB_FOLDER, "38_CrimeEvent_Help_Find.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "CrimeEvent Help Find", "&task=1");
        var position = extractCrimeEventJob(msg);
        if (position == -1) {
            logV2(WARNING, "JOB", "No CrimeEvent Help Job Found: " + msg);
        }
        else {
            position++;
            var activeJob = findActiveCrimeJob(position);
            if (activeJob == null) {
                logV2(WARNING, "JOB", "Problem Finding Crime Job " + position);
                return;
            }
            logV2(INFO, "JOB", "Crime Event Help Job: " + position);
            var resourceObj = getResources();
            var energy = getEnergyOrStamina(activeJob.type, resourceObj);
            var energyNeeded = activeJob.energyOrStamina;
            if (energyNeeded <= energy) {
               doCrimeJob(pos, activeJob, energy, energyNeeded);
            }
            else {
                logV2(INFO, "JOB", "Not Enough Energy/Stamina For Crime Job. EnergyOrStamina Needed: " + energyNeeded + "/" + energy);
            }
        }
    }

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

function findActiveCrimeJob(position){
    for (var i=0; i < settingsObj.crimeJobs.length; i++){
        var crimeJob = settingsObj.crimeJobs[i];
        if (crimeJob.position == position){
            return crimeJob;
        }
    }
    return null;
}

function startCrimeEvent(){
    logV2(INFO, "JOB", "Start Crime Event");
    var position = configMRObj.crimeEvent.position;
    logV2(INFO, "JOB", "Crime Event Job: " + position);
    var activeJob = findActiveCrimeJob(position);
    if (activeJob != null) {
        var resourceObj = getResources();
        var energy = getEnergyOrStamina(activeJob.type, resourceObj);
        var energyNeeded = activeJob.energyOrStamina;
        if (energyNeeded <= energy) {
            //var retCode = playMacro(JOB_FOLDER, "30_CrimeEvent_Init.iim", MACRO_INFO_LOGGING);
            var retCode = initAndCheckScript(JOB_FOLDER, "30_CrimeEvent_Init.iim", "29_CrimeEvent_Init_Test.iim",
                                             "your crimes", "CRIMES", "Crime Event Init");
            if (retCode == SUCCESS) {
                crimeObj = evaluateCrimeEvent(1, activeJob, false);
                if (crimeObj.started) {
                    doCrimeJob(1, activeJob, energy, energyNeeded);
                }
            }
            else {
                logV2(WARNING, "JOB", "Problem Initializing Crime Event");
                makeScreenShot("MRJobCrimeEventStartCrimeEventInitProblem");
            }
        }
        else {
            logV2(INFO, "JOB", "Not Enough Energy/Stamina For Crime Job. EnergyOrStamina Needed: " + energyNeeded + "/" + energy);
        }
        logV2(INFO, "JOB", "---------------------------------------------------------------");
    }
    else {
        logV2(WARNING, "JOB", "Problem Finding Crime Job " + position);
    }
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

function restartStory(){
    var obj = initMRObject(MR.MR_CONFIG_FILE);
    for (var i = 1; i <= 4; i++) {
        var story = "story" + i;
        obj.storyEvent[story].completed = false;
        obj.storyEvent[story].node1.started = false;
    }
    obj.storyEvent.restart = false;
    configMRObj = obj;
    writeMRObject(obj, MR.MR_CONFIG_FILE);
}

function startStoryEvent(){
    logV2(INFO, "JOB", "Start Story Event");
    var retCode = initAndCheckScript(COMMON_FOLDER, "30_Home.iim", "33_Home_Test.iim","feed", "STORY", "init Home");
    if (retCode == SUCCESS) {
        var paramsArray = [];
        paramsArray.push(getParamObj("TITLE", settingsObj.story.title));
        retCode = initAndCheckScriptParameters(JOB_FOLDER, "40_StoryEvent_Init.iim", null, "47_StoryEvent_Init_Test.iim", paramsArray, "*", "STORY", "init Story");
        //playMacro(JOB_FOLDER, "40_StoryEvent_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (configMRObj.storyEvent.restart) {
                restartStory();
            }
            doStoryChoice("story1");
            status = doStoryTask("story1");
            if (status == CONSTANTS.STORY.DONE) {
                doStoryChoice("story2");
                status = doStoryTask("story2");
            }
            if (status == CONSTANTS.STORY.DONE) {
                doStoryChoice("story3");
                status = doStoryTask("story3");
            }
            if (status == CONSTANTS.STORY.DONE) {
                doStoryChoice("story4");
                status = doStoryTask("story4");
            }
        }
        else {
            logV2(WARNING, "JOB", "Problem Init Story Event");
            makeScreenShot("MRJobStoryEventInitStoryProblem");
        }
    }
    else {
        logV2(WARNING, "STORY", "Problem Going to home page");
    }
    logV2(INFO, "JOB", "---------------------------------------------------------------");
}

function getStoryTypeId(type){
    for (var i=0; i < configMRObj.storyEvent.types.length; i++){
        var typeObj = configMRObj.storyEvent.types[i];
        if (typeObj.type == type){
            logV2(INFO, "STORY", "Type Found: " + JSON.stringify(typeObj));
            return typeObj.id;
        }
    }
    return null;
}

function getParamObj(id, value){
    var paramObj = {"id": id, "value": value};
    return paramObj;
}

function doStoryChoice(story){
    var nodeObj = configMRObj.storyEvent[story].node1;
    var status = CONSTANTS.STORY.DONE;
    logV2(INFO, "STORY", "NODE: " + JSON.stringify(nodeObj));
    if (!nodeObj.started) {
        logV2(INFO, "STORY", "Story Choice: " + story);
        logV2(INFO, "STORY", "Node ID: " + nodeObj.id);
        //addMacroSetting("NODE", nodeObj.id);
        //addMacroSetting("ID", nodeObj.EnergyId);
        var paramArray1 = [];
        paramArray1.push(getParamObj("NODE", nodeObj.id));
        paramArray1.push(getParamObj("ID", nodeObj.EnergyId));
        var paramArray = [];
        paramArray.push(getParamObj("STORY", configMRObj.storyEvent[story].id));
        paramArray.push(getParamObj("NODE", configMRObj.storyEvent[story].node2.id));
        logObj(INFO, "TST", paramArray);
        retCode = initAndCheckScriptParameters(JOB_FOLDER, "42_StoryEvent_Choice.iim", paramArray1, "48_StoryEvent_ChoiceExtract_Test.iim", paramArray,
            "*", "STORY", "Choice");
        if (retCode == SUCCESS) {
            //addMacroSetting("NODE", nodeObj.id);
            //addMacroSetting("ID", nodeObj.EnergyId);
            //retCode = playMacro(JOB_FOLDER, "42_StoryEvent_Choice.iim", MACRO_INFO_LOGGING);
            updateStory2(story, "node1", "started", true);
        }
        else {
            logV2(WARNING, "JOB", "Problem Starting Story " + story + " node " + nodeObj.id);
            status = CONSTANTS.STORY.PROBLEM;
            //makeScreenShot("MRJobStoryEventStartStoryProblem");
        }
    }
    return status;
}

function extractPercentCompleted(category, storyId, nodeId) {
    logV2(INFO, "STORY", "Story:" + storyId);
    logV2(INFO, "STORY", "Node:" + nodeId);
    addMacroSetting("STORY", storyId);
    addMacroSetting("NODE", nodeId);
    var retCode = playMacro(JOB_FOLDER, "45_StoryEvent_PercentCompleted.iim", MACRO_INFO_LOGGING);
    var percentInfo = getLastExtract(1, "Percent Completed", "50%");
    logV2(INFO, category, "Extract %completed = " + percentInfo);
    if (!isNullOrBlank(percentInfo)) {
        percentInfo = percentInfo.replace("%", "").toUpperCase();
        percentInfo = percentInfo.replace(" COMPLETE", "");
        var percentCompleted = parseInt(percentInfo);
        return parseInt(percentCompleted);
    }
    else {
        logV2(WARNING, category, "Problem Extracting Percent Completed");
        makeScreenShot("MR" + category + "PercentCompletedExtractProblem");
        return -1;
    }
}

function getStoryEnergy(storyId, nodeId){
    var energy = -1;
    logV2(INFO, "STORY", "Story:" + storyId);
    logV2(INFO, "STORY", "Node:" + nodeId);
    addMacroSetting("STORY", storyId);
    addMacroSetting("NODE", nodeId);
    var retCode = playMacro(JOB_FOLDER, "46_StoryEvent_Energy.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "STORY", "30");
        if (!isNullOrBlank(msg)){
            energy = parseInt(msg);
        }
        else {
            logV2(WARNING, "STORY", "Problem Extracting Story Energy");
            makeScreenShot("MRExtractStoryEnergyProblem");
        }
    }
    else {
        logV2(WARNING, "STORY", "Problem Story Energy");
        makeScreenShot("MRStoryEnergyProblem");
    }
    return energy;
}

function checkStoryFinished(){
    var retCode = playMacro(JOB_FOLDER, "49_StoryEvent_Completed.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var txt = getLastExtract(1, "Play Again", "Play Again");
        if (!isNullOrBlank(txt) && txt.toLowerCase() == settingsObj.story.playAgain.toLowerCase()) {
            logV2(INFO, "STORY", "Restart story");
            retCode = initAndCheckScript(JOB_FOLDER, "51_StoryEvent_PlayAgain.iim", "52_StoryEvent_PlayAgain_Test.iim", "Investigate", "STORY", "Restart");
            if (retCode == SUCCESS) {
                closePopupByText("Replay Story");
                restartStory();
            }
        }
        else {
            logV2(WARNING, "STORY", "Problem clicking Play Again Button");
        }
    }
    else {
            logV2(INFO, "STORY", "Story can not be restarted");
    }
}

function doStoryTask(story){
    logV2(INFO, "STORY", "doStoryTask: " + story);
    var storyObj = configMRObj.storyEvent[story];
    logV2(INFO, "STORY", "NODE: " + JSON.stringify(storyObj));
    if (storyObj.completed){
        return CONSTANTS.STORY.DONE;
    }
    var status = CONSTANTS.STORY.PROBLEM;
    var retCode = -1;
    var energyJob = getStoryEnergy(storyObj.id, storyObj.node2.id);
    if (energyJob == -1){
        return CONSTANTS.STORY.PROBLEM;
    }
    logV2(INFO, "STORY", "Energy For Story Job: " + energyJob);
    var resourceObj = getResources();
    var energy = getEnergyOrStamina(storyObj.type, resourceObj);
    logV2(INFO, "STORY", "Energy Available: " + energy);
    var percentCompleted = extractPercentCompleted("STORY", storyObj.id, storyObj.node2.id);
    if (percentCompleted == 100) {
        updateStory(story, "completed", true);
        return CONSTANTS.STORY.DONE;
    }
    while (energyJob <= energy && percentCompleted < 100){
            //if (percentCompleted == -1) {
            //    break;
            //}
            addMacroSetting("NODE", storyObj.node2.id);
            retCode = playMacro(JOB_FOLDER, "44_StoryEvent_Task.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS){
                checkIfLevelUp();
                resourceObj = getResources();
                energy = getEnergyOrStamina("ENERGY", resourceObj);
                percentCompleted = extractPercentCompleted("STORY", storyObj.id, storyObj.node2.id);
                if (percentCompleted == 100) {
                    closePopup();
                    updateStory(story, "completed", true);
                    status = CONSTANTS.STORY.DONE;
                }
                else if (story == "4" && isNullOrBlank(percentCompleted)){
                    checkStoryFinished();
                }
            }
            else {
                logV2(WARNING, "JOB", "Problem executing Story Task");
                makeScreenShot("MRJobStoryTaskProblem");
            }
            if (energy < energyJob){
                status = CONSTANTS.STORY.NOENERGY;
            }
    }
    return status;
}

function updateStory2(story, node, property, value){
    logV2(INFO, "STORY", "Saving " + story);
    var object = initMRObject(MR.MR_CONFIG_FILE);
    object.storyEvent[story][node][property] = value;
    configMRObj.storyEvent[story][node][property] = value;
    writeMRObject(object, MR.MR_CONFIG_FILE);
}

function updateStory(story, property, value){
    logV2(INFO, "STORY", "Saving " + property + " / Value: " + value);
    var object = initMRObject(MR.MR_CONFIG_FILE);
    object.storyEvent[story][property] = value;
    configMRObj.storyEvent[story][property] = value;
    writeMRObject(object, MR.MR_CONFIG_FILE);
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

function getSkillTokens(){
    var tokens = -1;
    var retCode = playMacro(COMMON_FOLDER, "40_GetSkillPoints.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "Skill Points", "5 Skill Tokens");
        logV2(INFO, "JOB", "Msg = " + msg);
        msg = msg.toLowerCase();
        msg = msg.replace(" skill tokens", "");
        tokens = parseInt(msg);
    }
    else {
            logV2(WARNING, "JOB", "Problem Getting Skill Points");
        }
    return tokens;
}

function checkSkillTokens(){
    if (configMRObj.skillPoints.enabled) {
        logV2(INFO, "JOB", "Check Skill Tokens");
        var tokens = getSkillTokens();
        if (tokens > 4) {
            assignSkillTokens(tokens);
            clearDistrict();
        }
    }
}

function getSkillAction(){
    for (var i=0; i < settingsObj.skills.length; i++){
        var skillObj = settingsObj.skills[i];
        if (skillObj.id == configMRObj.skillPoints.skill){
            return skillObj;
        }
    }
    return null;
}

function doSkill(skillObj, tokens){
    logV2(INFO, "SKILL", "Skill Token: " + JSON.stringify(skillObj));
    while (tokens > 4){
        addMacroSetting("ACTION", skillObj.action);
        var retCode = playMacro(COMMON_FOLDER, "42_SkillPointsAssign.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS){
            tokens = getSkillTokens();
        }
        else {
            logV2(WARNING, "JOB", "Problem spending skill tokens");
            break;
        }
    }
}

function assignSkillTokens(tokens){
    var retCode = playMacro(COMMON_FOLDER, "41_Profile_Start.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var skillObj = getSkillAction();
        if (skillObj != null){
            doSkill(skillObj, tokens);
        }
        else {
            logV2(WARNING, "JOB", "Problem Getting Skill Type");
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem Going To Profile Page");
    }

}

function checkDailyLink(){

    var strDate = getDateYYYYMMDD();
    var lastTimeExecuted = configMRObj.dailyLink.lastTimeExecuted;
    if (lastTimeExecuted == null || lastTimeExecuted < strDate){

        var settingsObj = initObject(MR_SETTINGS_FILE);
        if (lastTimeExecuted == null || settingsObj.dailyLink.date > lastTimeExecuted || settingsObj.dailyLink.link != configMRObj.dailyLink.link) {
            logV2(INFO, "DAILYLINK", "Start Dailylink");
            addMacroSetting("URL", settingsObj.dailyLink.link);
            var retCode = playMacro(MACRO_COMMON_FOLDER, "01_GoTo.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS){
                logV2(INFO, "DAILYLINK", "Update lastTimeExecuted to " + settingsObj.dailyLink.date);
                configMRObj = initMRObject(MR.MR_CONFIG_FILE);
                configMRObj.dailyLink.lastTimeExecuted = settingsObj.dailyLink.date;
                configMRObj.dailyLink.link = settingsObj.dailyLink.link;
                writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
                waitV2("1");
                makeMRScreenshot("MRDailyLink");
                logV2(INFO, "DAILYLINK", "End Dailylink");
            }
            else {
                logV2(WARNING, "DAILYLINK", "Problem With Dailylink");
            }
            closeTab();
        }
    }
}

function repeatMoneyJob(jobObj, resourceObj){
    var levelUp = false;
    var exp = resourceObj.exp;
    while (jobObj.job.energy <= resourceObj.energyObj.left && exp < configMRObj.jobs.levelUpExp){
        var status = processJob(jobObj, resourceObj);
        resourceObj = getResources();
        logV2(INFO, "MONEYJOB", "MoneyJob Status: " + status);
        if (checkIfLevelUp() || status == CONSTANTS.STATUS.LEVELUP){
            levelUp = true;
            break;
        }
        exp = resourceObj.exp;
    }
    return levelUp;
}

function getMoneyJobs(){
    var filters = [
        addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
        addFilter(JOBSELECT.SELECTTYPES.MONEY, JOBSELECT.FILTER.YES),
        addFilter(JOBSELECT.SELECTTYPES.MONEYRATIO, JOBSELECT.FILTER.YES, 50),
        addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
    ];
    var jobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.MONEY, JOBSELECT.SORTING.DESCENDING);
    var moneyJobs = [];
    if (jobs.length == 0){
        logV2(WARNING, "MONEYJOBS", "No Money Jobs Found");
    }
    else {
        for (var i=0; i < jobs.length; i++){
            var jobObj = jobs[i];
            var activeJobObj = getJobTaskObject(jobObj.districtId, jobObj.id, jobObj.type);
            activeJobObj.enabled = true;
            activeJobObj.type = "REPEAT";
            fillDistrictInfo(activeJobObj);
            moneyJobs.push(activeJobObj);
        }
    }
    return initJobs(moneyJobs);
}

function processJobsWhenLowOnExperience(jobs, resourceObj){
    var wait = true;
    var levelUp = false;
    for (var i=0; i < jobs.length; i++){
        var jobObj = jobs[i];
        if (jobObj.energy <= resourceObj.energyObj.left){
            logV2(INFO, "JOBS", "Money Job; " + JSON.stringify(jobObj));
            var activeJobObj = getJobTaskObject(jobObj.districtId, jobObj.id, jobObj.type);
            activeJobObj.type = "REPEAT";
            fillDistrictInfo(activeJobObj);
            if (activeJobObj.district != null) {
                levelUp = repeatMoneyJob(activeJobObj, resourceObj);
                if (levelUp){
                    logV2(INFO, "LOWEXP", "Leveled Up. Skipping rest of Money Jobs");
                    wait = false;
                    break;
                }
            }
            else {
                logV2(WARNING, "JOBS", "DistrictId not found for job: " + JSON.stringify(jobObj));
            }
        }
        resourceObj = getResources();
    }
    return wait;
}

function doJobsWhenExperienceLow(){
    dummyBank();
    var wait = true;
    var resourceObj = getResources();
    var exp = resourceObj.exp;
    if (exp > 0 && exp < configMRObj.jobs.levelUpExp && resourceObj.energyObj.left >= configMRObj.jobs.levelUpMinEnergy){
        logHeader(INFO, "JOBS", "Low Experience Jobs", "*");
        // check for money energy job
        var filters = [
            addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
            addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
            addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
            addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, resourceObj.energyObj.left),
            addFilter(JOBSELECT.SELECTTYPES.MONEY, JOBSELECT.FILTER.YES),
            addFilter(JOBSELECT.SELECTTYPES.MONEYRATIO, JOBSELECT.FILTER.YES, 50),
            addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
        ];
        var jobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);
        logV2(INFO, "JOBS", "Money Jobs; " + jobs.length);
        var retCode = initJob();
        if (retCode == SUCCESS) {
            wait = processJobsWhenLowOnExperience(jobs, resourceObj);
        }
        else {
            logV2(WARNING, "MONEYJOB", "Problem With Init Job");
        }
    }
    return wait;
}

function getCollectDate(){
    var LIMIT1 = 65 // 01:05
    var LIMIT2 = 785 // 13:05
    var currentDate = new Date();
    currentDate.setSeconds(0);
    var calcMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    var limitDate = currentDate;
    if (calcMinutes < LIMIT1){
        limitDate = dateAdd(limitDate, -1, "days");
        limitDate = dateAdd(limitDate, LIMIT2-calcMinutes, "minutes");
    }
    else if (calcMinutes >= LIMIT1 && calcMinutes < LIMIT2){
        limitDate = dateAdd(limitDate, LIMIT1-calcMinutes, "minutes");
    }
    else {
        limitDate = dateAdd(limitDate, LIMIT2-calcMinutes, "minutes");
    }
    logV2(INFO, "COLLECT", "Collect Date: " + limitDate);
    return getDateYYYYMMDDHHMI(limitDate);
}

function checkAlreadyCollectedEnergyRefill(){
    var readyToCollect = false;
    var collectEnergyObj = configMRObj.bonus.energy;
    if (collectEnergyObj.enabled){
        readyToCollect = (collectEnergyObj.refill != getCollectDate());
    }
    logV2(INFO, "COLLECT", "Already Collected: " + readyToCollect);
    return readyToCollect;
}

function checkForCollectBonus(newJobs){

    if (!checkAlreadyCollectedEnergyRefill()) {
        var resourceObj = getResources();
        var exp = resourceObj.exp;
        var expCalc = (resourceObj.energyObj.left * 4.50) + (resourceObj.staminaObj.left * 4.40);
        var expRest = exp - expCalc;
        logV2(INFO, "COLLECT", "Calculated Rest Experience: " + expRest);
        if (expRest > 3000) {
            setTempSetting(globalSettings.profileId, "fight", "stopFighting", true);
            setTempSetting(globalSettings.profileId, "assassin-a-nator", "stopFighting", true);
            logV2(INFO, "COLLECT", "Calculated Rest Experience: " + expRest);
            var busyFighting1 = getTempSetting(null, "fight", "busyFighting");
            var busyFighting2 = getTempSetting(null, "assassin-a-nator", "busyFighting");
            logV2(INFO, "COLLECT", "Busy Fighting: " + busyFighting1);
            logV2(INFO, "COLLECT", "Busy Assassin-a-nator: " + busyFighting2);
            if (!busyFighting1 && !busyFighting2) {
                // fight script + assasssin-a-nator is not busy fighting
                var collected = collectBonus();
                if (collected) {
                    var collectObj = {"nrOfLevelUpJobsExecuted": 0};
                    var retCode = initJob();
                    if (retCode == SUCCESS) {
                        //doJobsWithoutLevelUp(newJobs, collectObj, exp);
                        //doLevelUpJob();
                    }
                    else {
                        logV2(WARNING, "COLLECT", "Problem With init Job");
                    }
                    setTempSetting(globalSettings.profileId, "fight", "stopFighting", false);
                    setTempSetting(globalSettings.profileId, "assassin-a-nator", "stopFighting", false);
                }
                else {
                    logV2(WARNING, "COLLECT", "Could Not Collect");
                }
            }
        }
        else {
            setTempSetting(globalSettings.profileId, "fight", "stopFighting", false);
            setTempSetting(globalSettings.profileId, "assassin-a-nator", "stopFighting", false);
        }
    }
}

function doScheduledJobs(newJobs, collectObj){
    logHeader(INFO, "COLLECT", "doScheduledJobs", "*");
    for (var i=0; i < newJobs.length; i++){
        var activeJobObj = newJobs[i];
        var resourceObj = getResources();
        var status = isValidJob(activeJobObj, resourceObj);
        if (status == CONSTANTS.STATUS.OK){
           // skip jobs of type complete
            if (activeJobObj.type != "COMPLETE") {
                repeatSingleJob(collectObj, activeJobObj);
            }
        }
    }

}

function doJobsWithoutLevelUp(newJobs, collectObj, exp){
    doScheduledJobs(newJobs, collectObj);
    logHeader(INFO, "COLLECT", "doJobsWithoutLevelUp", "*");
    var filters = [
        addFilter(JOBSELECT.SELECTTYPES.EVENT, filterEvent()),
        addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
        addFilter(JOBSELECT.SELECTTYPES.MONEYRATIO, JOBSELECT.FILTER.YES, 50),
        addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.EXPRANGE, JOBSELECT.FILTER.YES, 0, exp)
    ];
    var moneyJobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.MONEY, JOBSELECT.SORTING.DESCENDING);
    logV2(INFO, "COLLECTMONEYJOBS", "Moneyjobs found: " + moneyJobs.length);
    // low Energy Jobs to get a low as possible Experience Left
    filters = [
        addFilter(JOBSELECT.SELECTTYPES.EVENT, filterEvent()),
        addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
        addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO),
        addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, 50)
    ];
    var lowEnergyJobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);
    var jobs = moneyJobs.concat(lowEnergyJobs);
    for (var i=0; i < jobs.length; i++) {
        logV2(INFO, "COLLECT", JSON.stringify(jobs[i]));
    }
    logV2(INFO, "COLLECT", "Total Jobs Found: " + jobs.length);
    for (var i=0; i < jobs.length; i++){
        var jobObj = jobs[i];
        var activeJobObj = getJobTaskObject(jobObj.districtId, jobObj.id, jobObj.type);
        activeJobObj.enabled = true;
        activeJobObj.type = "REPEAT";
        fillDistrictInfo(activeJobObj);
        if (activeJobObj.ok){
            repeatSingleJob(collectObj, activeJobObj);
        }
    }
    logV2(INFO, "COLLECT", "nrOfLevelUpJobsExecuted: " + collectObj.nrOfLevelUpJobsExecuted);
    logHeader(INFO, "COLLECT", "Experience Left: " + getExperience());
}

function collectBonus() {
    var collected = false;
    var counter = 0;
    do {
        counter++;
        if (counter > 1) {
            logV2(WARNING, "COLLECT", "Collect Bonus Retries: " + counter);
        }
        addMacroSetting("COLLECT", "gid");
        addMacroSetting("RESOURCE", "0");
        var retCode = playMacro(JOB_FOLDER, "50_CollectBonus.iim", MACRO_INFO_LOGGING);
        logV2(INFO, "COLLECT", "collectBonus retCode: " + retCode);
        makeScreenShot("MRJobCollectBonus");
        if (retCode == SUCCESS) {
            var resourceObj = getResources();
            if (resourceObj.energyObj.total > 0 && resourceObj.energyObj.left == resourceObj.energyObj.total) {
                collected = true;
            }
        }
    }
    while (!collected && counter < 5);
    return collected;
}

function travel(jobItem){
    var status = CONSTANTS.STATUS.SKIP;
    var retCode = goToDistrict(jobItem);
    if (retCode === SUCCESS) {
        retCode = goToChapter(jobItem);
        if (retCode != SUCCESS) {
            clearDistrict();
            status = CONSTANTS.STATUS.SKIP;
            logV2(WARNING, "COLLECT", "Problem Selecting Chapter");
        }
        else {
            status = CONSTANTS.STATUS.OK;
        }
    }
    else {
        clearDistrict();
        logV2(WARNING, "COLLECT", "Problem Selecting District");
        makeScreenShot("MRJobDistrictSelectProblem");
        status = CONSTANTS.STATUS.SKIP;
    }
    return status;
}

function repeatSingleJob(collectObj, jobItem){

    if (!checkExpLevelUpJob(jobItem)){
        return CONSTANTS.STATUS.SKIP;
    }
    var status = travel(jobItem);
    if (status == CONSTANTS.STATUS.OK){
        logJob(jobItem);
        if (isJobCompleted(jobItem)){
            logV2(INFO, "COLLECT", "Job already completed");
            return CONSTANTS.STATUS.SKIP;
        }
        var counter = 1;
        while (checkExpLevelUpJob(jobItem)){
            var resourceObj = getResources();
            logV2(INFO, "COLLECT", "Count: " + counter++);
            var status = checkIfEnoughEnerygOrStamina(jobItem, resourceObj);
            if (status == CONSTANTS.STATUS.OK) {
                status = performSingleJob(jobItem);
                if (checkIfLevelUp()){
                    status = CONSTANTS.STATUS.LEVELUP;
                }
            }
            if (status != CONSTANTS.STATUS.OK){
                logV2(WARNING, "COLLECT", "Wrong status: " + status);
                break;
            }
            else {
                collectObj.nrOfLevelUpJobsExecuted++;
            }
        }
    }
    if (status == CONSTANTS.STATUS.LEVELUP) {
        logV2(WARNING, "COLLECT", "Level Up. This should never occur!!!");
    }
    return status;
}

function checkExpLevelUpJob(jobItem){
    var exp = getExperience();
    logV2(INFO, "COLLECT", "Exp: " + exp);
    var expLeft = exp - jobItem.job.exp;
    logV2(INFO, "COLLECT", "expLeft: " + expLeft);
    var expGreaterThan0 = (expLeft > 0);
    return expGreaterThan0;
}

function performSingleJob(jobItem){
    logV2(INFO, "COLLECT", "Perform Single Job" + NEWLINE);
    var retCode = performJob(jobItem.job.id, jobItem.district.event, jobItem.job.chapter);
    var status = CONSTANTS.STATUS.OK;
    if (retCode != SUCCESS){
        logV2(INFO, "COLLECT", "Job NOT Executed");
        status = CONSTANTS.STATUS.PROBLEM;
    }
    else {
        logV2(INFO, "COLLECT", "Job Executed");
        globalSettings.money += checkSaldo();
        if (jobItem.type == "COMPLETE"){
            jobItem.percentCompleted = getPercentCompleted(jobItem);
        }
    }
    return status;
}

function filterEvent(){
    var event = settingsObj.global.eventEnabled ? JOBSELECT.FILTER.WHATEVER : JOBSELECT.FILTER.NO;
    return event;
}

function doLevelUpJob(){
    var resourceObj = getResources();
    var exp = resourceObj.exp;
    logHeader(INFO, "COLLECTLEVELUPJOB", "doLevelUpJob", "*");
    logV2(INFO, "COLLECTLEVELUPJOB", "Exp: " + exp);
    logV2(INFO, "COLLECTLEVELUPJOB", "Energy Left: " + resourceObj.energyObj.left);
    var filters = [
        addFilter(JOBSELECT.SELECTTYPES.EVENT, filterEvent()),
        addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
        addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, resourceObj.energyObj.left)
    ];
    var jobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);
    logV2(INFO, "COLLECT", "Total Jobs Found: " + jobs.length);
    if (jobs.length > 0){
        for (var i=0; i < jobs.length; i++) {
            var jobObj = jobs[i];
                var activeJobObj = getJobTaskObject(jobObj.districtId, jobObj.id, jobObj.type);
                activeJobObj.enabled = true;
                activeJobObj.type = "REPEAT";
                fillDistrictInfo(activeJobObj);
                var status = checkIfEnoughEnerygOrStamina(activeJobObj, resourceObj);
                if (status == CONSTANTS.STATUS.OK) {
                    status = travel(activeJobObj);
                    if (status == CONSTANTS.STATUS.OK) {
                        makeScreenShot("MRJobCollectBeforeLevelUp");
                        logJob(activeJobObj);
                        status = performSingleJob(activeJobObj);
                        if (status == CONSTANTS.STATUS.OK) {
                            if (checkIfLevelUp()) {
                                makeScreenShot("MRJobCollectAfterLevelUp");
                                break;
                            }
                            else {
                                logV2(INFO, "COLLECT", "Level Up Job Executed but not leveled up. This Should never occur");
                                resourceObj = getResources();
                            }
                        }
                    }
                }
                if (status == CONSTANTS.STATUS.LEVELUP){
                    logV2(INFO, "COLLECT", "Leveled Up. This should never occur");
                }
            }
    }
    else {
        logV2(WARNING, "COLLECT", "Level Up Job: No Jobs Found");
    }
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
