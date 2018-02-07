var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MRJobSelect.js"));

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
        "PROBLEM": 5
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
                      "lastDistrict": null, "lastChapter": null, "lowestEnergy": null, "lowestStamina": null
                     };

//enableMacroPlaySimulation();
start();

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
            }
            if (configMRObj.crimeEvent.joinedCrimes){
                helpCrimeEvent();
                clearDistrict();
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
                wait = checkExperience();
            }
            if (wait) {
                checkSkillTokens();
                checkDailyLink();
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

function doJobs(listOfJobs){
    var wait = true;
    var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var obj = extractEnergyStamina();
        for (var i = 0; i < listOfJobs.length; i++) {
            if (checkIfLevelUp()) {
                //obj = extractEnergyStamina();
                logV2(INFO, "JOB", "DoJob Level Up");
                wait = false;
                break;
            }
            var jobItem = listOfJobs[i];
            if (jobItem.job.type == STAMINA && !jobsObj.staminaJobs){
                // skip stamina jobs
                logV2(INFO, "JOB", "Skipping stamina job " + jobItem.job.id);
                continue;
            }
            obj = extractEnergyStamina();
            var status = processJob(jobItem, obj);
            if (status == CONSTANTS.STATUS.LEVELUP) {
                wait = false;
                break;
            }
            else if (status == CONSTANTS.STATUS.OK) {
                wait = false;
                i--;
            }
            else if (status == CONSTANTS.STATUS.SKIP) {
                wait = true;
            }
            else if (status == CONSTANTS.STATUS.PROBLEM) {
                logV2(WARNING, "JOB", "Problem executing job : skip rest of jobs and try again");
                makeScreenShot("MRJobDoJobsExecuteProblem");
                wait = false;
                break;
            }
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem with job page");
        makeScreenShot("MRJobInit");
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

function extractEnergyStamina(){
    var obj = {"energy": 0, "stamina": 0};
    obj.energy = getEnergy();
    obj.stamina = getStamina();
    return obj;
}


function getEnergyOrStamina(jobType, energyStaminaObj){
    var total = 0;
    if (jobType == STAMINA){
        total = energyStaminaObj.stamina;
    }
    else {
        total = energyStaminaObj.energy;
    }
    return total;
}

function checkIfEnoughEnerygOrStamina(jobItem, energyStaminaObj){
    var status = CONSTANTS.STATUS.OK;
    var total = getEnergyOrStamina(jobItem.job.type, energyStaminaObj)
    logV2(INFO, "JOB", "Entering checkIfEnoughEnerygOrStamina - Total = " + total);
    if (checkIfLevelUp()){
        logV2(INFO, "JOB", "checkIfEnoughEnerygOrStamina: Level Up");
        status = CONSTANTS.STATUS.LEVELUP;
    }
    else if (total < jobItem.job.energy) {
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
        logV2(INFO, "SPECIAL: 16_DistrictSelectEvent.iim");
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
    makeScreenShot("MRIsDistrictSelected");
    return false;
}

function isChapterSelected(jobItem){
    addMacroSetting("DISTRICT", jobItem.districtId);
    var chapter = jobItem.job.chapter;
    var districtId = jobItem.districtId;
    addMacroSetting("CHAPTER", chapter);
    var retCode = playMacro(JOB_FOLDER, "14_ChapterSelect.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var selectInfo = getLastExtract(1, "Chapter Selected", "<a href=\"#\" class=\"ajax_request tab_button selected\" style=\"padding: 6px 2px; outline: 1px solid blue;\" data-params=\"controller=job&amp;action=hip&amp;loc=2&amp;tab=19\">Chapter 9</a>");
        if (!isNullOrBlank(selectInfo)) {
            selectInfo = selectInfo.toLowerCase();
            if (contains(selectInfo, "tab_button selected")) {
                logV2(INFO, "JOB", "Right Chapter Selected: " + districtId + "/" + chapter);
                return true;
            }
        }
        else {
            logV2(WARNING, "JOB", "selectInfo: " + selectInfo);
            makeScreenShot("MRChapterExtractSelectInfoProbleù");
        }
    }
    logV2(WARNING, "JOB", "Problem getting selected chapter");
    makeScreenShot("MRChapterSelectProblem");
    return false;
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
        if (globalSettings.lastChapter != null && globalSettings.lastChapter == jobItem.job.chapter && !isChapterSelected(jobItem)){
            logV2(INFO, "JOB", "GoToChapter: Resetting Chapter Info");
            clearDistrict();
        }
        if (globalSettings.lastChapter == null || globalSettings.lastChapter != jobItem.job.chapter) {
            logV2(INFO, "JOB", "Old District: " + globalSettings.lastChapter);
            logV2(INFO, "JOB", "Travelling to chapter " + jobItem.job.chapter);
            addMacroSetting("DISTRICT", jobItem.districtId);
            addMacroSetting("CHAPTER", jobItem.job.chapter);
            retCode = playMacro(JOB_FOLDER, "05_Job_Chapter.iim", MACRO_INFO_LOGGING);
            if (retCode != SUCCESS) {
                logV2(INFO, "JOB", "Problem Selecting chapter");
                makeScreenShot("MRJobsChapterSelect");
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

function processJob(jobItem, energyObj){

    var exit = false;
    var status = CONSTANTS.STATUS.OK;
    //var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
	//if (retCode == SUCCESS) {
        if (!jobItem.ok) {
            logV2(WARNING, "JOB", "Problem with Job " + jobItem.jobId);
            globalSettings.lastChapter = null;
            globalSettings.lastDistrict = null;
           return CONSTANTS.STATUS.SKIP;
        }
        validJob = isValidJob(jobItem);
        if (validJob.error){
            status = CONSTANTS.STATUS.PROBLEM;
            jobItem.ok = false; // skip job in next run
            return status;
        }
        if (validJob.valid) {
            var status = checkIfEnoughEnerygOrStamina(jobItem, energyObj);
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
            status = testJob(jobItem);
            logV2(INFO, "JOB", "Job Status: " + status);
        }
        else {
            logV2(WARNING, "JOB", "Problem Selecting District");
            makeScreenShot("MRJobDistrictSelectProblem");
            status = CONSTANTS.STATUS.PROBLEM;
        }
    //}
    //else {
    //    logV2(INFO, "JOB", "Problem Job Page");
    //}
    return status;
}

function clearDistrict(){
    globalSettings.lastDistrict = null;
    globalSettings.lastChapter = null;
}

function testJob(jobItem){
    var status = CONSTANTS.STATUS.OK;
    if (jobItem.percentCompleted == null || jobItem.percentCompleted == -1){
        logV2(WARNING, "JOB", "Skip This Job for now. There was a problem going to the right chapter");
        status = CONSTANTS.STATUS.PROBLEM;
    }
    else {
        var valid = executeJob(jobItem);
        if (valid) {
            jobItem.update = true;
            jobItem.numberOfTimesExecuted++;
            globalSettings.lastDistrict = jobItem.districtId;
            globalSettings.lastChapter = jobItem.job.chapter;
        }
        else {
            status = CONSTANTS.STATUS.PROBLEM;
        }
    }
    return status;

}

function isValidJob(jobItem){
    logV2(INFO, "JOB", "Entering isValidJob");
    validJob = {"valid": false, "error": false};
    if (jobItem.percentCompleted == null || jobItem.percentCompleted == -1) {
        jobItem.percentCompleted = getPercentCompleted(jobItem);
    }
    switch (jobItem.type) {
        case CONSTANTS.EXECUTE.REPEAT:
            if (jobItem.total > 0 && jobItem.numberOfTimesExecuted >= jobItem.total){
                logV2(INFO, "JOB", "Nr Of Times Exceeded: " + jobItem.numberOfTimesExecuted + "/" + jobItem.total);
            }
            else {
                validJob.valid = true;
            }
            break;
        case CONSTANTS.EXECUTE.COMPLETE:
            if (jobItem.percentCompleted == -1){
                validJob.error = true;
                validJob.valid = false;
            }
            else if (jobItem.percentCompleted < 100) {
                validJob.valid = true;
            }
            break;
    }
    logV2(INFO, "JOB", "Job " + jobItem.jobId + " valid: " + JSON.stringify(validJob));
    logV2(INFO, "JOB", "Percent Completed: " + jobItem.percentCompleted);
    return validJob;
}

function logJob(jobItem){
    logV2(INFO, "JOB", "DistrictId: " + jobItem.districtId);
    if (jobItem.job.chapter !== null) {
        logV2(INFO, "JOB", "Chapter: " + jobItem.job.chapter);
    }
    logV2(INFO, "JOB", "Id: " + jobItem.jobId);
}

function executeJob(jobItem){
    var success = false;
    if (executeMacroJob(jobItem.job.id, jobItem.district.event, jobItem.job.chapter) !== SUCCESS) {
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
        logV2(INFO, "JOB", "Complete After: " + completeAfter);
        logV2(INFO, "JOB", "jobItem.percentCompleted: " + jobItem.percentCompleted);
        if ((completeAfter === 100) && (jobItem.percentCompleted < 100)){
            logV2(INFO, "JOB", "Close Popup For Skill Point");
            closePopup();
        }
        jobItem.percentCompleted = completeAfter;
        globalSettings.money += checkSaldo();
        success = true;

    }
    return success;
}

function executeMacroJob(jobId, districtEvent, chapter) {
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

function getStaminaJob(){
    var retCode = playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
        logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
        if (!isNullOrBlank(staminaInfo)) {
            staminaInfo = staminaInfo.replace(/,/g, '');
            var tmp = removeComma(staminaInfo);
            tmp = staminaInfo.split("/");
            var stamina = parseInt(tmp[0]);
            return stamina;
        }
        else {
            logV2(WARNING, "STAMINA", "Problem Extracting Stamina");
            makeScreenShot("MRJobStaminaExtractStaminaProblem");
        }
    }
    else {
        logV2(WARNING, "STAMINA", "Problem Getting Stamina");
        makeScreenShot("MRJobStaminaGetStaminaProblem");
    }
    return 0;
}

function getEnergy(){
	var retCode = playMacro(JOB_FOLDER, "10_GetEnergy.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
        var energyInfo = getLastExtract(1, "Energy Left", "500/900");
        logV2(INFO, "ENERGY", "energy = " + energyInfo);
        if (!isNullOrBlank(energyInfo)) {
            energyInfo = removeComma(energyInfo);
            var tmp = energyInfo.split("/");
            var energy = parseInt(tmp[0]);
            return energy;
        }
        else {
            logV2(WARNING, "ENERGY", "Problem Extracting Energy");
            makeScreenShot("MRJobEnergyExtractEenergyProblem");
        }
    }
    else {
        logV2(WARNING, "ENERGY", "Problem Getting Energy");
        makeScreenShot("MRJobEnergyGetEnergyProblem");
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
            var percentCompleted = parseInt(percentInfo);
            return parseInt(percentCompleted);
        }
        else {
            clearDistrict();
            logV2(WARNING, "JOB", "Problem Extracting Percent Completed");
            makeScreenShot("MRJobPercentCompletedExtractProblem");
            return -1;
        }
    }
    else {
        clearDistrict();
        logV2(WARNING, "JOB", "Problem getting Percent Completed");
        makeScreenShot("MRJobPercentCompletedProblem");
        return -1;
    }
    return 100;
}

function collectCrimeEvent(crimeObj){
    var retCode = playMacro(JOB_FOLDER, "35_CrimeEvent_Collect.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        makeScreenShot("MRCollectCrimeEvent");
        closePopupByText("Crime Complete");
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
        var energyObj = extractEnergyStamina();
        energy = getEnergyOrStamina(job.type, energyObj);
    }
}

function selectCrimeEvent(activeJob){
    var started = false;
    if (configMRObj.crimeEvent.startNewCrime) {
        addMacroSetting("POSITION", (activeJob.position - 1).toString());
        retCode = playMacro(JOB_FOLDER, "31_CrimeEvent_SelectJob.iim", MACRO_INFO_LOGGING);
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
        /*
        if (isNullOrBlank(msg)){
            msg = getLastExtract(2, "Crime Event Status", "The crime is complete! Collect your reward.");
        }

        if (isNullOrBlank(msg)){
            msg = getLastExtract(3, "Crime Event Status", "You have already started 25 crimes. It would be unwise to attract too much attention.");
        }*/
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
            var energyObj = extractEnergyStamina();
            var energy = getEnergyOrStamina(activeJob.type, energyObj);
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
        var energyObj = extractEnergyStamina();
        var energy = getEnergyOrStamina(activeJob.type, energyObj);
        var energyNeeded = activeJob.energyOrStamina;
        if (energyNeeded <= energy) {
            var retCode = playMacro(JOB_FOLDER, "30_CrimeEvent_Init.iim", MACRO_INFO_LOGGING);
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
    //var txt = "</div>56% Complete<br><a href=\"#\" class=\"ajax_request";
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
    var retCode = playMacro(JOB_FOLDER, "40_StoryEvent_Init.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        if (configMRObj.storyEvent.restart){
            restartStory();
        }
        doStoryChoice("story1");
        status = doStoryTask("story1");
        if (status == CONSTANTS.STORY.DONE){
            doStoryChoice("story2");
            status = doStoryTask("story2");
        }
        if (status == CONSTANTS.STORY.DONE){
            doStoryChoice("story3");
            status = doStoryTask("story3");
        }
        if (status == CONSTANTS.STORY.DONE){
            doStoryChoice("story4");
            status = doStoryTask("story4");
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem Init Story Event");
        makeScreenShot("MRJobStoryEventInitStoryProblem");
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

function doStoryChoice(story){
    var nodeObj = configMRObj.storyEvent[story].node1;
    var status = CONSTANTS.STORY.DONE;
    logV2(INFO, "STORY", "NODE: " + JSON.stringify(nodeObj));
    if (!nodeObj.started) {
        logV2(INFO, "STORY", "Story Choice: " + story);
        logV2(INFO, "STORY", "Node ID: " + nodeObj.id);
        addMacroSetting("NODE", nodeObj.id);
        addMacroSetting("ID", nodeObj.EnergyId);
        retCode = playMacro(JOB_FOLDER, "41_StoryEvent_ChoiceExtract.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var msg = getLastExtract(1, "Story Extract", "Search");
            logV2(INFO, "STORY", "Msg: " + msg);
            if (!isNullOrBlank(msg)) {
                addMacroSetting("NODE", nodeObj.id);
                addMacroSetting("ID", nodeObj.EnergyId);
                retCode = playMacro(JOB_FOLDER, "42_StoryEvent_Choice.iim", MACRO_INFO_LOGGING);
                updateStory2(story, "node1", "started", true);
            }
            else {
                status = CONSTANTS.STORY.PROBLEM;
            }
        }
        else {
            logV2(WARNING, "JOB", "Problem Starting Story " + story + " node " + nodeObj.id);
            makeScreenShot("MRJobStoryEventStartStoryProblem");
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
    var energyStaminaObj = extractEnergyStamina();
    var energy = getEnergyOrStamina(storyObj.type, energyStaminaObj);
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
                energyStaminaObj = extractEnergyStamina();
                energy = getEnergyOrStamina("ENERGY", energyStaminaObj);
                percentCompleted = extractPercentCompleted("STORY", storyObj.id, storyObj.node2.id);
                if (percentCompleted == 100) {
                    closePopup();
                    updateStory(story, "completed", true);
                    status = CONSTANTS.STORY.DONE;
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
    for (var i=0; i < configMRObj.skillPoints.skills.length; i++){
        var skillObj = configMRObj.skillPoints.skills[i];
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


function closePopupByText(text){
    addMacroSetting("TEXT", text);
    var retCode = playMacro(COMMON_FOLDER, "03_ClosePopupText.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
}

function checkDailyLink(){

    var strDate = getDateYYYYMMDD();
    var lastTimeExecuted = configMRObj.dailyLink.lastTimeExecuted;
    if (lastTimeExecuted == null || lastTimeExecuted < strDate){

        var settingsObj = initObject(MR_SETTINGS_FILE);
        if (lastTimeExecuted == null || settingsObj.dailyLink.date > lastTimeExecuted) {
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

function repeatMoneyJob(jobObj, energyObj, exp){
    var levelUp = false;
    while (jobObj.job.energy <= energyObj.energy && exp < configMRObj.jobs.levelUpExp){
        //var retCode = executeMacroJob(jobObj.id, jobObj.districtId, districtObj.event);
        var status = processJob(jobObj, energyObj);
        energyObj = extractEnergyStamina();
        logV2(INFO, "MONEYJOB", "MoneyJob Status: " + status);
        if (checkIfLevelUp()){
            levelUp = true;
            break;
        }
        exp = getExperience();
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

function checkExperience(){
    dummyBank();
    var wait = true;
    var exp = getExperience();
    var energyObj = extractEnergyStamina();
    if (exp > 0 && exp < configMRObj.jobs.levelUpExp && energyObj.energy >= configMRObj.jobs.levelUpMinEnergy){
        logV2(INFO, "JOBS", "Check For Money Jobs");
        // check for money energy job
        var filters = [
            addFilter(JOBSELECT.SELECTTYPES.EVENT, JOBSELECT.FILTER.NO),
            addFilter(JOBSELECT.SELECTTYPES.MONEYCOST, JOBSELECT.FILTER.NO),
            addFilter(JOBSELECT.SELECTTYPES.JOBTYPE, JOBSELECT.FILTER.ENERGY),
            addFilter(JOBSELECT.SELECTTYPES.ENERGYRANGE, JOBSELECT.FILTER.YES, 0, energyObj.energy),
            addFilter(JOBSELECT.SELECTTYPES.MONEY, JOBSELECT.FILTER.YES),
            addFilter(JOBSELECT.SELECTTYPES.MONEYRATIO, JOBSELECT.FILTER.YES, 50),
            addFilter(JOBSELECT.SELECTTYPES.CONSUMABLECOST, JOBSELECT.FILTER.NO)
        ];
        var jobs = getJobs(jobsObj.districts, filters, !JOBSELECT_LOG, null, JOBSELECT.SORTING.EXP, JOBSELECT.SORTING.DESCENDING);
        var levelUp = false;
        logV2(INFO, "JOBS", "Money Jobs; " + jobs.length);
        var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            for (var i=0; i < jobs.length; i++){
                var jobObj = jobs[i];
                if (jobObj.energy <= energyObj.energy){
                    logV2(INFO, "JOBS", "Money Job; " + JSON.stringify(jobObj));
                    var activeJobObj = getJobTaskObject(jobObj.districtId, jobObj.id, jobObj.type);
                    activeJobObj.type = "REPEAT";
                    fillDistrictInfo(activeJobObj);
                    if (activeJobObj.district != null) {
                        levelUp = repeatMoneyJob(activeJobObj, energyObj, exp);
                        logV2(INFO, "JOBS", "energyObj; " + JSON.stringify(energyObj));
                        if (levelUp){
                            logV2(INFO, "MONEYJOB", "Leveled Up. Skipping rest of Money Jobs");
                            wait = false;
                            break;
                        }
                    }
                    else {
                        logV2(WARNING, "JOBS", "DistrictId not found for job: " + JSON.stringify(jobObj));
                    }
                }
                energyObj = extractEnergyStamina();
            }
        }
        else {
            logV2(WARNING, "MONEYJOB", "Problem With Init Job");
        }
    }
    return wait;
}