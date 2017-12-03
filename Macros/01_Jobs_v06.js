var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded.js"));

var localConfigObject = null;
var SUCCESS = 1;
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
    }
});
init();
var JOB_FOLDER = "MR/Jobs";
var COMMON_FOLDER = "MR/Common";
var FIGHT_FOLDER = "MR/Fight";

var jobsObj = initMRObject(MR.MR_JOBS_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var globalSettings = {"jobsCompleted": 0, "money": 0, "currentLevel": 0,
                      "lastDistrict": null, "lastChapter": null, "lowestEnergy": null, "lowestStamina": null
                     };

//enableMacroPlaySimulation();
start();

function start() {

    var listOfJobs = getListOfEnabledJobs(jobsObj.activeJobs);
    try {
        var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var newJobs = initJobs(listOfJobs);
            do {
                if (configMRObj.crimeEvent.enabled){
                    startCrimeEvent();
                    clearDistrict();
                }
                if (configMRObj.crimeEvent.joinedCrimes){
                    helpCrimeEvent();
                    clearDistrict();
                }
                var wait = doJobs(newJobs);
                if (wait) {
                    waitV2("60");
                }
            }
            while (true);
        }
        else {
            logV2(INFO, "JOB", "Problem Starting Mafia Wars");
        }
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
                obj = extractEnergyStamina();
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
            var status = processJob(jobItem, obj);
            if (status == CONSTANTS.STATUS.LEVELUP) {
                wait = false;
                break;
            }
            else if (status == CONSTANTS.STATUS.OK) {
                obj = extractEnergyStamina();
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
        if (item.id == jobItem.id){
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
                    district.jobs.forEach(function (v) {
                        if (v.chapter == jobItem.chapter) {
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


function getEnergyOrStamina(jobItem, energyStaminaObj){
    var total = 0;
    if (jobItem.job.type == STAMINA){
        total = energyStaminaObj.stamina;
    }
    else {
        total = energyStaminaObj.energy;
    }
    return total;
}

function checkIfEnoughEnerygOrStamina(total, jobItem){
    var status = CONSTANTS.STATUS.OK;
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
    var retCode = playMacro(JOB_FOLDER, "15_DistrictSelect.iim", MACRO_INFO_LOGGING);
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
           return status;
        }
        validJob = isValidJob(jobItem);
        if (validJob.error){
            status = CONSTANTS.STATUS.PROBLEM;
            return status;
        }
        if (validJob.valid) {
            var energy = getEnergyOrStamina(jobItem, energyObj);
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
        logV2(INFO, "JOB", "Complete After: " + completeAfter);
        logV2(INFO, "JOB", "jobItem.percentCompleted: " + jobItem.percentCompleted);
        if ((completeAfter === 100) && (jobItem.percentCompleted < 100)){
            logV2(INFO, "JOB", "Close Popup For Skill Point");
            closePopup();
        }
        jobItem.percentCompleted = completeAfter;
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

function checkIfLevelUp(){
	var leveledUp = false;
	var level = getLevel();
	if (level > 0){
		if (level > globalSettings.currentLevel){
            leveledUp = true;
		    logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
			var ret = closePopup();
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

function getStamina(){
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
	var retCode = playMacro(COMMON_FOLDER, "11_GetSaldo.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
        var saldoInfo = getLastExtract(1, "Saldo", "$500");
        //var saldoInfo = prompt("Saldo", "500");
        logV2(INFO, "BANK", "saldoInfo = " + saldoInfo);
        if (!isNullOrBlank(saldoInfo)) {
            saldoInfo = removeComma(saldoInfo);
            var saldo = parseInt(saldoInfo.replace("$", ""));
            return saldo;
        }
        else {
            logV2(WARNING, "JOB", "Problem Extracting Saldo");
            makeScreenShot("MRJobExtractSaldoProblem");
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem getting Saldo");
        makeScreenShot("MRJobGetSaldoProblem");
    }
	return 0;
}

function closePopup(){
	return playMacro(COMMON_FOLDER, "02_ClosePopup.iim", MACRO_INFO_LOGGING);
}

function collectCrimeEvent(){
    var retCode = playMacro(JOB_FOLDER, "35_CrimeEvent_Collect.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        closePopup();
        checkSaldo();
        logV2(INFO, "JOB", "Crime Event Collected");
    }
}

function doCrimeJob(job, energy, energyNeeded){
    while (energyNeeded <= energy ){
        logV2(INFO, "JOB", "Energy/Stamina Needed: " + energyNeeded + " / Energy/Stamina Available: " + energy);
        addMacroSetting("POSITION", configMRObj.activeJob.position);
        var energyObj = extractEnergyStamina();
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
        energy = getEnergyOrStamina(energyObj);
    }
}

function selectCrimeEvent(){
    var started = false;
    if (configMRObj.crimeEvent.startNewCrime) {
        var crimeJob = configMRObj.activeJob.position;
        addMacroSetting("POSITION", (crimeJob - 1).toString());
        retCode = playMacro(JOB_FOLDER, "31_CrimeEvent_SelectJob.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            logV2(INFO, "JOB", "Crime Job Selected: " + crimeJob);
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

function evaluateCrimeEvent(joinedCrime){
    var started = false;
    var retCode = playMacro(JOB_FOLDER, "36_CrimeEvent_Status.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Crime Event Status", "The crime is complete! Collect your reward.");
        if (isNullOrBlank(msg)){
            msg = getLastExtract(2, "Crime Event Status", "The crime is complete! Collect your reward.");
        }
        if (isNullOrBlank(msg)){
            msg = getLastExtract(3, "Crime Event Status", "You have already started 25 crimes. It would be unwise to attract too much attention.");
        }
        logV2(INFO, "CRIME EVENT", "Crime Event Status: " + msg);
        if (!isNullOrBlank(msg)){
            msg = msg.toUpperCase();
            if (msg.startsWith("WAIT")) {
                logV2(INFO, "CRIME EVENT", "Wait for others to finish");
            }
            else if (msg.startsWith("THE CRIME IS COMPLETE")){
                logV2(INFO, "CRIME EVENT", "Status: Collect");
                collectCrimeEvent();
                if (!joinedCrime) {
                    started = selectCrimeEvent();
                }
            }
            else if (msg.startsWith("CHOOSE A TASK")){
                logV2(INFO, "CRIME EVENT", "Status: Choose Task");
                started = selectCrimeEvent();
            }
            else if (msg.startsWith("FILL")){
                logV2(INFO, "CRIME EVENT", "Status: Empty Task needs to be filled in");
                started = false;
            }
            else if (msg.startsWith("FINISH")){
                started = true;
            }
            else if (msg.startsWith("YOU HAVE ALREADY STARTED")){
                started = false;
                configMRObj = initMRObject(MR.MR_CONFIG_FILE)
                configMRObj.crimeEvent.enabled=false;
                writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
            }
            else {
                logV2(WARNING, "CRIME EVENT", "Unknown status");
                makeScreenShot("MRJobCrimeEventUnknownStatus");
            }
        }
        else {
            logV2(WARNING, "CRIME EVENT", "Problem Extracting Crime Event Status");
            makeScreenShot("MRJobCrimeEventExtractStatusProblem");
        }
    }
    else {
        logV2(WARNING, "CRIME EVENT", "Problem Getting Crime Event Status");
        makeScreenShot("MrJobCrimeEventStatusProblem");
    }
    logV2(INFO, "CRIME EVENT", "New Crime Started: " + started);
    return started;
}

function findActiveCrimeJob(position){
    for (var i=0; i < configMRObj.crimeJobs.length; i++){
        var crimeJob = configMRObj.crimeJobs[i];
        if (crimeJob.position == position){
            return crimeJob;
        }
    }
    return null;
}

function extractCrimeEventJob(text) {

    var regExp = /&(?:amp;)?task=([0-9])\"/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var job = matches[matches.length-1];
        job = parseInt(job);
        logV2(INFO, "JOBLIST", "CrimeEvent Help Job: " + job);
        return job;
    }
    return -1;
}

function helpCrimeEvent(){
    logV2(INFO, "JOB", "Help Crime Event");
    var retCode = playMacro(JOB_FOLDER, "37_CrimeEvent_Help_Init.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        retCode = playMacro(JOB_FOLDER, "38_CrimeEvent_Help_Find.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var msg = getLastExtract(1, "CrimeEvent Help Find", "&task=1");
            var position = extractCrimeEventJob(msg);
            if (position == -1){
                logV2(WARNING, "JOB", "No CrimeEvent Help Job Found: " + msg);
                evaluateCrimeEvent(true);
            }
            else {
                position++;
                configMRObj.activeJob = findActiveCrimeJob(position);
                if (configMRObj.activeJob == null) {
                    logV2(WARNING, "JOB", "Problem Finding Crime Job " + position);
                    return;
                }
                logV2(INFO, "JOB", "Crime Event Job: " + position);
                var job = {"job": {"type": configMRObj.activeJob.type}};
                var energy = getEnergyOrStamina(job);
                var energyNeeded = configMRObj.activeJob.energyOrStamina;
                if (energyNeeded <= energy) {
                    if (evaluateCrimeEvent(true)) {
                        doCrimeJob(job, energy, energyNeeded);
                    }
                }
                else {
                    logV2(INFO, "JOB", "Not Enough Energy/Stamina For Crime Job. EnergyOrStamina Needed: " + energyNeeded + "/" + energy);
                }
            }
        }
    }
    else {
        logV2(WARNING, "JOB", "Problem Initializing Crime Event");
        makeScreenShot("MRJobCrimeEventHelpInitProblem");
    }
    logV2(INFO, "JOB", "---------------------------------------------------------------");
}

function startCrimeEvent(){
    logV2(INFO, "JOB", "Start Crime Event");
    var position = configMRObj.crimeEvent.position;
    configMRObj.activeJob = findActiveCrimeJob(position);
    if (configMRObj.activeJob == null){
        logV2(WARNING, "JOB", "Problem Finding Crime Job " + position);
        return;
    }
    logV2(INFO, "JOB", "Crime Event Job: " + position);
    var job = {"job" : {"type": configMRObj.activeJob.type}};
    var energy = getEnergyOrStamina(job);
    var energyNeeded = configMRObj.activeJob.energyOrStamina;
    if (energyNeeded <= energy) {
        var retCode = playMacro(JOB_FOLDER, "30_CrimeEvent_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (evaluateCrimeEvent(false)) {
                doCrimeJob(job, energy, energyNeeded);
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
