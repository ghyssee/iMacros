var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight-0.0.4.js"));

// 182-11 = 171
var localConfigObject = null;
setMRPath("MRFight");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

init();

var fightersToExclude = initMRObject(MR.MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initMRObject(MR.MR_FRIENDS_FILE);
var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var settingsObj = initObject(getMRRootFile(MR.MR_SETTINGS_FILE));
var profileObj = initObject(MR_PROFILE_FILE);

var globalSettings = {"maxLevel": 20000, "iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0, "stolenIces": 0,
                      "skippedHealth": 0, "maxHealed": 0, "heals": 0, "stopOnLevelUp": false, "expReached": false,
                        "forceHealing": false, "profile": getProfileObject((getProfile())),
                      "boss": {"attacks": 0}};
startScript();
//test();

//CheckHomefeedWhileWaiting();
//var retCode = initAndCheckScript(FIGHT_FOLDER, "20_Extract_Start.iim", "23_Fight_Test.iim", "fight list", "INITFIGHT", "Init Fight List");

function test(){
    addMacroSetting("pos", "10", ENABLE_LOGGING);
    var retCode = playMacro(FIGHT_FOLDER, "21_ExtractV2.iim", MACRO_INFO_LOGGING);
    var tmp = getLastExtract(1, "Gang", "data-params=\"controller=gang&amp;action=view&amp;id=3985490\">*TBC*</a>");
    alert(tmp);
    var gangObj = extractIdNameFromString(tmp, "GANG");
    alert(JSON.stringify(gangObj));
    var level = extractLevelFromString(tmp);
    alert("LVL: " + level);
    var id = extractIdFromString(tmp);
    alert("ID:" + id);
    var name = extractFighterNameFromString(tmp);
    alert("NAME:" + name);

}

function testFightList(){
    var array = [];
    var object = getFighterObject("10211065573218554", "Walter White", 100);
    var foundPlayer = getFighter(fighterObj.fighters, object.id);
    logObj(INFO, "TST", foundPlayer);
    if (foundPlayer != null){
        alert(isAlreadyKilledToday(foundPlayer));
    }
}
function testUppdate(){
    var object = getFighterObject("111", "XXX", 100);
    object.gangId = "0";
    object.gangName = "GANG";
    object = addFighterV2(fighterObj, object);
    updateIces(object);
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    object = getFighterObject("111", "XXX", 100);
    object = addFighterV2(fighterObj, object);
    updateIces(object);
    //writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
}

function testIces(){
    var fighter = fighterObj.fighters[0];
    logObj(INFO, "TST", fighter);
    updateIces(fighter);
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
}

function startScript(){
    try {
        startMafiaReloaded();
        globalSettings.currentLevel = getLevel();

        logV2(INFO, "LEVEL", "Starting Level: " + globalSettings.currentLevel);
        do  {
            dummyBank();
            checkMiniHomeFeed(profileObj, globalSettings.profile.id, friendObj, fightersToExclude, fighterObj);
            checkForStopFighting("fight", configMRObj.jobs.optimization);
            if (globalSettings.stopOnLevelUp){
                logV2(INFO, "FIGHT", "You Leveled Up and setting stopOnLevelUp is enabled");
                waitV2("60");
            }
            else if (globalSettings.expReached){
                // check again, possibly leveled up
                var msg = "Experience Limit reached";
                logV2(INFO, "FIGHT", msg);
                var exp = getExperience();
                iimDisplay(msg);
                if (exp > configMRObj.global.stopWhenExpBelow){
                    globalSettings.expReached = false;
                    iimDisplay("");
                    continue;
                }
                else {
                    waitV2("60");
                    iimdisplay("");
                }
            }
            else {
                // if (health is 0, don't check for underAttack, it's already checked
                var status = performExperienceCheck(configMRObj, globalSettings);
                if (status == FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED) {
                    continue;
                }
                waitTillEnoughStamina();
                setTempSetting(globalSettings.profile.id, "fight", "busyFighting", true);
                globalSettings.forceHealing = true;
                status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                configMRObj = initMRObject(MR.MR_CONFIG_FILE);
                if (configMRObj.boss.active) {
                    status = startFightBoss();
                    logV2(INFO, "BOSSFIGHT", "Status: " + status);
                }
                if (continueFighting(status)) {
                    status = fight();
                    logV2(INFO, "FIGHT", "Updating statistics");
                    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
                }
                setTempSetting(globalSettings.profile.id, "fight", "busyFighting", false);
            }
            CheckHomefeedWhileWaiting();
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            logV2(INFO, "CANCEL", ex.message);
            if (ex.name != USER_CANCEL){
                alert(ex.message);
            }
            // do nothing
        }
        else {
            logError(ex);
        }
        setTempSetting(globalSettings.profile.id, "fight", "busyFighting", false);
        logV2(INFO, "SUMMARY", "Total Iced: " + globalSettings.iced);
        logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
        logV2(INFO, "SUMMARY", "Nr Of Attacks: " + globalSettings.nrOfAttacks);
        logV2(INFO, "SUMMARY", "Stolen Ices: " + globalSettings.stolenIces);
        logV2(INFO, "SUMMARY", "Skipped Health: " + globalSettings.skippedHealth);
        logV2(INFO, "SUMMARY", "Max Healed: " + globalSettings.maxHealed);
        logV2(INFO, "SUMMARY", "Heals: " + globalSettings.heals);
    }
}

function CheckHomefeedWhileWaiting(){
    logV2(INFO, "HOMEFEED", "Check Homefeed While Waiting...");
    var homefeedLines = getHomefeedLines();
    logV2(INFO, "HOMEFEED", "Check: " + homefeedLines);
    processHomefeed(homefeedLines);
}

function startFightBoss(){
    logV2(INFO, "BOSS", "Start Boss Fight");
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (configMRObj.boss.defeatedOn !== null){
        var bossStartTime = formatStringYYYYMMDDHHMISSToDate(configMRObj.boss.defeatedOn);
        var currDate = new Date();
        logV2(INFO, "BOSS", "bossStartTime: " + bossStartTime);
        logV2(INFO, "BOSS", "currDate: " + currDate);
        if (bossStartTime < currDate) {
            status = fightBoss();
        }
        else {
            logV2(INFO, "BOSS", "Start Time is at: " + bossStartTime);
	    }
	}
	else {
	    status = fightBoss();
	}
	return status;

}


function fightBoss(){
    var retCode = initAndCheckScript(FIGHT_FOLDER, "70_Boss_Start.iim", "84_Boss_Start_Test.iim", "boss fights", "INITBOSS", "Init Boss");
    var bossObj = getBossObj();
    if (retCode == SUCCESS) {
        bossObj = evaluateBossMessage();
        logV2(INFO, "BOSS", "Status: " + bossObj.status);
        switch (bossObj.status){
            case FIGHTERCONSTANTS.ATTACKSTATUS.OK:
                bossObj.status = attackBoss();
                break;
            case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM:
                break;
            case FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA:
                break;
            case FIGHTERCONSTANTS.ATTACKSTATUS.BOSSDEFATED:
                break;
            default:
                break;
        }
    }//
    else {
        logV2(INFO, "BOSS", "Problem Starting Boss Fight");
        bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    return bossObj.status;
}

function evaluateBossResult(){
    var retCode = playMacro(FIGHT_FOLDER, "75_Boss_Attack_Result.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var msg = getLastExtract(1, "Boss Attack Result", 'You WON the fight');
        if (!isNullOrBlank(msg)) {
            logV2(DEBUG, "BOSS", "Boss Result: " + msg);
            msg = msg.toUpperCase();
            if (msg.startsWith('YOU WON THE FIGHT')) {
            }
            else if (msg.startsWith("You DO NOT FEEL HEALTHY")) {
            }
        }
        else {
            logV2(WARNING, "BOSS", "Problem Extracting Boss Msg");
        }
    }
    else {
        logV2(WARNING, "BOSS", "Problem Getting Boss Result");
    }
}

function performBossAttack(staminaObj, bossHealth){
    var pummel = false;
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (configMRObj.boss.pummel){
        var staminaRequired = Math.ceil(staminaObj.total * 0.2);
        logV2(DEBUG, "PUMMEL", "Stamina Required: " + staminaRequired);
        logV2(DEBUG, "PUMMEL", "Stamina Left: " + staminaObj.leftOver);
        if (staminaObj.leftOver >= staminaRequired){
            var healthObj = getHealthObj();
            var healthRequired = Math.ceil(healthObj.total * 0.5);
            if (healthObj.leftOver > healthRequired) {
                if (checkForExperienceLimit()){
                    var expRequired = Math.ceil(staminaRequired * 4.5);
                    var exp = getExperience();
                    exp = exp - expRequired;
                    logV2(INFO, "PUMMEL", "expRequired: " + expRequired);
                    logV2(INFO, "PUMMEL", "Calculated exp Left: " + exp);
                    pummel = (exp >= configMRObj.global.stopWhenExpBelow);
                }
                else {
                    pummel = true;
                }
            }
            else {
                logV2(INFO, "PUMMEL", "Not Enough health for pummel attack:" + healthObj.leftOver);
            }
        }
        else {
            logV2(INFO, "PUMMEL", "Not Enough stamina for pummel attack: " + staminaObj.leftOver);
        }
    }
    var retCode = SUCCESS;
    // disable pummel if stopWhenHealthBelow is on and bossHealth is low
    if (pummel) {
        logV2(INFO, "PUMMEL", "BossHealth: " + configMRObj.boss.stopWhenHealthBelow + "/" + bossHealth);
        if (configMRObj.boss.stopWhenHealthBelow > 0 && bossHealth < 100000) {
            logV2(INFO, "PUMMEL", "Pummel disabled. stopWhenHealthBelow enabled and BossHealth is low");
            pummel = false;
        }
    }
    checkForStopFighting("fight", configMRObj.jobs.optimization);
    if (pummel) {
        logV2(INFO, "PUMMEL", "Pummel Attack activated");
        retCode = playMacro(FIGHT_FOLDER, "76_Boss_Pummel.iim", MACRO_INFO_LOGGING);
    }
    else {
        retCode = playMacro(FIGHT_FOLDER, "74_Boss_Attack.iim", MACRO_INFO_LOGGING);
    }
    if (retCode == SUCCESS){
        status = performExperienceCheck(configMRObj, globalSettings);
    }
    else {
        status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    return status;
}

// MOD 17/11
function attackBoss(){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    var bossHealth = -1;
    var retCode = 0;
    var AUTOHEAL = true;
    retCode = initAndCheckScript(FIGHT_FOLDER, "73_Boss_StartAttack.iim", "77_Boss_StartAttack_Test.iim", "pummel",
        "INITATTACKBOSS", "Init Attack Boss");
    //retCode = playMacro(FIGHT_FOLDER, "73_Boss_StartAttack.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        bossHealth = getBossHealth();
        while(bossHealth > 0 && bossHealth > configMRObj.boss.stopWhenHealthBelow) {
            var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
            if (staminaObj.leftOver >= 5) {
                var healthObj = performHealthCheck("ATTACKBOSS", AUTOHEAL, staminaObj.leftOver);
                if (refreshAfterHealing(healthObj)){
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.REFRESH;
                    break;
                }
                if (continueFightingAfterHealthCheck(healthObj)) {
                    var status  = performBossAttack(staminaObj, bossHealth);
                    if (status == FIGHTERCONSTANTS.ATTACKSTATUS.OK || status == FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED) {
                        bossHealth = getBossHealth();
                        if (bossHealth == 0) {
                            logV2(INFO, "BOSS", "Boss is dead!!!");
                            break;
                        }
                        else if (bossHealth < 0) {
                            break;
                        }
                        else {
                            evaluateBossResult();
                        }
                        globalSettings.boss.attacks++;
                        // MOD 15/11
                        if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp) {
                            status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                            break;
                        }
                    }
                    else {
                        logV2(WARNING, "BOSS", "Problem With Attacking boss");
                        status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
                        break;
                    }
                }
                else {
                    logV2(INFO, "BOSS", "Not Enough Health  After Healing");
                }
            }
            else if (staminaObj.leftOver == -1) {
                logV2(INFO, "BOSS", "Stamina Limit Reached");
                status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                break;
            }
            else {
                logV2(INFO, "BOSS", "Not Enough Stamina");
                status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                break;
            }
        }
        if (bossHealth > 0 && bossHealth <= configMRObj.boss.stopWhenHealthBelow){
            logV2(INFO, "BOSS", "Boss Health is lower than stopWhenHealthBelow: " + bossHealth + "/" + configMRObj.boss.stopWhenHealthBelow);
        }
    }
    else {
        logV2(INFO, "BOSS", "Problem With Start Attacking boss");
        status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    return status;
}

function getBossHealth(){
    logV2(DEBUG, "FIGHT", "Checking Boss Health");
    var health = -1;
    retCode = playMacro(FIGHT_FOLDER, "72_Boss_Health", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var healthMsg = getLastExtract(1, "Boss Health", "27,356/34,775");
        if (!isNullOrBlank(healthMsg)) {
			healthMsg = healthMsg.replace(/,/g, '');
			var list = healthMsg.split('/');
            logV2(INFO, "BOSS", "Boss Health: " + healthMsg);
            if (list != null && list.length == 2) {
                health = parseInt(list[0]);
            }
            else {
                logV2(WARNING, "BOSS", "Problem Parsing health");
            }
        }
        else {
            logV2(WARNING, "BOSS", "Problem Extracting health");
        }
    }
    else {
        logV2(WARNING, "BOSS", "Problem Getting Boss Health");
    }
    return health;
}

function getBossObj(){
    return{"status": FIGHTERCONSTANTS.ATTACKSTATUS.UNKNOWN};
}


function evaluateBossMessage() {
    var retCode = playMacro(FIGHT_FOLDER, "71_Boss_Message.iim", MACRO_INFO_LOGGING);
    var bossObj = getBossObj;
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Boss Message", "There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.");
        if (!isNullOrBlank(msg)){
            msg = msg.toUpperCase();
            if (msg.indexOf("THERE ARE NO BOSSES AVAILABLE") !== -1){
                logV2(INFO, "BOSS", "Boss Message: " + msg);
                var regExp = /BACK IN ([0-9]{1,2}) HOURS?, ([0-9]{1,2}) MINUTES?/;
                var matches = msg.match(regExp);
                if (matches != null && matches.length > 1){
                    var minutes = matches[2];
                    var hours = matches[1];
                    bossObj.status = 0;
                    date = new Date();
                    date = dateAdd(date, parseInt(minutes), 'minutes');
                    date = dateAdd(date, parseInt(hours), 'hours');
                    logV2(INFO, "Minutes: " + minutes);
                    logV2(INFO, "hours: " + hours);
                    var formattedDate = formatDateToYYYYMMDDHHMISS(date);
                    //var newD = formatStringYYYYMMDDHHMISSToDate(formattedDate);
                    configMRObj.boss.defeatedOn = formattedDate;
                    writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
					bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.BOSSALREADYDEAD;
                }
                else {
					bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
					logV2(INFO, "BOSS", "No Time Found");
                }
            }
            else if (msg.startsWith(settingsObj.boss.bossName.toUpperCase())) {
                bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
            	logV2(INFO, "BOSS", "BOSS AVAILABLE ???");
            }
        }
        else {
			bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
            logV2(WARNING, "BOSS", "Problem Extracting Boss Message");
        }
    }
    else {
		bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
        logV2(WARNING, "BOSS", "Problem Getting Boss Message");
    }
    return bossObj;
}

function continueFighting(status){
    var cont = false;
    if (status == FIGHTERCONSTANTS.ATTACKSTATUS.OK){
        cont = true;
    }
    logV2(INFO, "FIGHT", "continueFighting: " + cont + " / Status = " + status);
    return cont;
}

function attackRivals(){
    var rival = 0;
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (configMRObj.fight.rivals) {
        do {
            rival = extractRivalMobster();
            if (rival > 0) {
                var fighter = getFighterObject("RIVAL", "RIVAL " + rival, "0");
                var list = [fighter];
                var rivalType = FIGHTERCONSTANTS.FIGHTERTPE.RIVAL;
                if (rival == 9999){
                    rivalType = FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY;
                }
                status = processList(list, rivalType);
                logV2(INFO, "FIGHT", "Status: " + status);
                if (!continueFighting(status)) {
                    logV2(INFO, "FIGHT", "Exit Fight V1...");
                    exitLoop = true;
                    break;
                }
            }
        }
        while (rival > 0);
    }
    return status;
}

function attackFightList2(){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                status = startProfileAttack();
    logV2(INFO, "FIGHT", "Status: " + status);
    return status;
}

function attackFightList(){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    var fighters = getFightList();
    if (configMRObj.fight.fightList) {
        var filteredFightersList = filterFightList(fighters);
        var minFightList = configMRObj.fight.minLengthOfFightList == null ? 2 : configMRObj.fight.minLengthOfFightList;
        logV2(INFO, "FIGHT", "Min Fighters on Fight List: " + minFightList);
        if (filteredFightersList.length >= minFightList) {
            logV2(INFO, "FIGHT", "Normal Fighters - Profile Attack");
            status = startNormalAttack(filteredFightersList);
        }
        else {
            status = homeFeedAttack();
            if (continueFighting(status)) {
                status = startProfileAttack();
            }
            if (continueFighting(status)) {
                status = startProfileAttackRecentlyIced();
            }
        }
    }
    logV2(INFO, "FIGHT", "Status: " + status);
    return status;
}

function fight(){
	
	var exitLoop = false;
	var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
	do {
        configMRObj = initMRObject(MR.MR_CONFIG_FILE);
        status = attackRivals();
		if (continueFighting(status)) {
            status = attackFightList();
            if (!continueFighting(status)){
                logV2(INFO, "FIGHT", "Exit Fight V2...");
                exitLoop = true;
                break;
            }
        }
        else {
            logV2(INFO, "FIGHT", "Exit Fight V3...");
            exitLoop = true;
            break;
        }
	}
	while (!exitLoop);
	return status;
}

function processList(list, fighterType){
	var refresh = false;
	var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
	for (var i=0; i < list.length; i++){
		var arrayItem = list[i];
	    if (!arrayItem.skip){
			logV2(INFO, "FIGHT", "Fighting Player " + arrayItem.id + " - " + arrayItem.name);
			var statusObj = attack(arrayItem, fighterType);

			switch (statusObj.status) {
                case FIGHTERCONSTANTS.ATTACKSTATUS.OK :
                    // do nothing, continue with next fighter
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM :
                    logV2(INFO, "FIGHT", "Problem With Fightlist. Refreshing...");
                    refresh = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA :
                    logV2(INFO, "FIGHT", "Out Of Stamina. Exiting processList");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                    //waitTillEnoughStamina();
                    refresh = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT :
                    logV2(INFO, "FIGHT", "Stamina Limit Reached");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                    refresh = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                    logV2(INFO, "FIGHT", "AutoHeal Disabled");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    refresh = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED :
                    logV2(INFO, "FIGHT", "Exp Reached");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED;
                    refresh = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP :
                    logV2(INFO, "FIGHT", "Stop On Level Up");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                    refresh = true;
                    break;
            }
		}
		else {
			logV2(INFO, "FIGHT", "Skipping Stronger Opponent: " + arrayItem.id);
}
		if (refresh) break;
	};
    logV2(INFO, "FIGHT", "ProcessList Return Status: " + status);
	return status;
}

function waitTillEnoughStamina(){
	var maxStamina = 200;
    var stamina = 0;
    var energy = 0;
    var total = 0;
    var minStamina = configMRObj.fight.minStaminaToHeal;
    do {
	    // refreshing stats (health / exp / stamina / energy)
        dummyBank();
		var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
		stamina = staminaObj.leftOver;
		if (stamina == -1){
		    // Stamina Below specified value
        }
        else {
            energy = getEnergy();
            var health = getHealth();
            total = stamina + energy;
            var exp = getExperience();
            if (exp > 0) {
                var staminaNeeded = exp / (4.4);
                logV2(INFO, "WAIT", "Stamina Needed: " + staminaNeeded);
                logV2(INFO, "WAIT", "Total (Energy + Stamina available): " + total);
                logV2(INFO, "WAIT", "Stamina: " + stamina);
                logV2(INFO, "WAIT", "maxStamina: " + maxStamina);
                // maxStamina = Math.min(maxStamina, staminaNeeded);
                if (total >= staminaNeeded && stamina > configMRObj.fight.minStaminaToFightForLevelUp && (stamina >= minStamina || exp < 300)) {
                    logV2(INFO, "WAIT", "Enough Stamina to level up");
                    // force healing
                    if (health == 0) {
                        if (heal()) {
                            logV2(INFO, "WAIT", "Force Healing");
                            globalSettings.heals++;
                        }
                    }
                    break;
                }
                else if (stamina >= configMRObj.fight.minStaminaToFight) {
                    logV2(INFO, "WAIT", "Enough Stamina to start fighting again");
                    break;
                }
                else if (health > 0 && stamina > 20) {
                    logV2(INFO, "WAIT", "Enough Health to fight");
                    break;
                }
            }
            else {
                logV2(WARNING, "WAIT", "Problem getting experience");
            }
        }
        waitV2("60");
	}
	while (true);
    logV2(INFO, "WAIT", "Leaving wait");
}

function extractRivalMobster(){
	logV2(INFO, "FIGHT", "Rival Mobsters");
    var mob = 0;
	var retCode = 0;
	var retCode = goToFightPage();
	if (retCode == SUCCESS) {
        if (configMRObj.fight.wiseguy){
            retCode = playMacro(FIGHT_FOLDER, "24_Extract_WiseGuy.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS) {
                var msg = getLastExtract(1, "Wiseguy");
                if (!isNullOrBlank(msg)) {
                    logV2(INFO, "FIGHT", "Wiseguy found");
                    return 9999;
                }
            }
            else {
                logV2(WARNING, "FIGHT", "Problem extracting wiseguy");
            }
        }
        retCode = playMacro(FIGHT_FOLDER, "22_Extract_Rival.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var msg = getLastExtract(1, "Rival", "20 / 20");
            logV2(INFO, "FIGHT", "MSG: " + msg);
            msg = msg.toUpperCase().replace("RIVAL MOBSTERS ALIVE: ", "");
            msg = msg.replace("/ 20", "").trim();
            logV2(INFO, "FIGHT", "MSG PROCESSED: " + msg);
            mob = parseInt(msg);
        }
        else {
            logV2(WARNING, "FIGHT", "Problem extracting rival mobster info");
        }
    }
    else {
        logV2(WARNING, "FIGHT", "Problem going to fight page");
    }
	return mob;
}

function getFightHealthStatus(healthObj){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (!healthObj.continueFighting){
        status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
    }
    else if (healthObj.refresh){
        status = FIGHTERCONSTANTS.ATTACKSTATUS.REFRESH;
    }
    return status;
}

function attack(fighter, fighterType){
	logV2(INFO, "FIGHT", "Attacking " + fighter.id);
	// ADD 15/11
    var statusObj = getStatusObject();
	//fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
	var retCode = SUCCESS;
	if (fighterType != FIGHTERCONSTANTS.FIGHTERTPE.PROFILE && fighterType != FIGHTERCONSTANTS.FIGHTERTPE.NORMALPROFILE
        && fighterType != FIGHTERCONSTANTS.FIGHTERTPE.RIVAL && fighterType != FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY) {
        retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
    }
    var healthObj = performHealthCheck("ATTACK", configMRObj.fight.autoHeal);
	if (!continueFightingAfterHealthCheck(healthObj)){
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOHEALTH;
        return statusObj;
    }
    else if (refreshAfterHealing(healthObj)){
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.REFRESH;
        return statusObj;
    }
    logV2(INFO, "FIGHT", "fighterType: " + fighterType);
    msg = performAttackInit(fighterType);
	statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
	if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
    }
	else if (!isNullOrBlank(msg)){
			var status = evaluateAttackMessage(msg);
			switch (status){
                case FIGHTERCONSTANTS.OPPONENT.NOHEALTH:
                    logV2(INFO, "FIGHT", "No Health. Just skip this player and continue with next");
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOHEALTH;
                    break;
			    case FIGHTERCONSTANTS.OPPONENT.FRIEND :
					logV2(INFO, "FIGHT", "Add Friend: " + fighter.id);
					fighter.skip = true;
					addFriend(fighter);
					if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.PROFILE){
						removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
                        logV2(INFO, "FIGHT", "Remove Fighter + Add Friend: " + fighter.id);
					}
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					break;
				case FIGHTERCONSTANTS.OPPONENT.WON :
					// ADD 15/11
				    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.NORMALPROFILE){
						fighter = addFighterV2(fighterObj, fighter);
					}
                    addValueToProperty(fighter, "alive", 1);
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
					var attackStatusObj = attackTillDeath(fighter, fighterType);
                    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                    }
					else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA){
					   // no stamina
						statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
					}
                    else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT){
                        // no stamina
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                    }
                    else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED){
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    }
                    else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED){
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED;
                    }
                    else {
						// continue with next player
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					}
                    // ADD 15/11
                    updateStatistics2(fighter, fighterType);
					break;
				case FIGHTERCONSTANTS.OPPONENT.DEAD :
                    addValueToProperty(fighter, "dead", 1);
					logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					globalSettings.stolenIces++;
                    // ADD 15/11
                    updateStatistics2(fighter, fighterType);
					break;
				case FIGHTERCONSTANTS.OPPONENT.LOST :
                    // MOD 15/11
				    getVictimHealth(fighter, profileObj);
					logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
					addStrongerOpponent(fighter);
                    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.PROFILE){
                        removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
                        logV2(INFO, "FIGHT", "Remove Fighter + Add Stronger Opponent: " + fighter.id);
                    }
					fighter.skip = true;
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					break;
				default :
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
					logV2(INFO, "FIGHT", "Attack First Time Problem");
					break;
			}
		}
		else {
			logV2(INFO, "FIGHT", "Problem getting status for Fighter: " + fighter.id);
			statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
		}
	return statusObj;
}

function attackTillDeath(fighter, fighterType){
	logV2(INFO, "ATTACK", "AttackTillIced Figther " + fighter.id);
	var alive = true;
	var retCode = 0;
	var previousHealth = 1000;
	var nrOfAttacks = 0;
	var statusObj = getStatusObject();
	var firstAttack = true;
	var nrOfHeals = 0;
	var originalHealth = 0;
	var health = 0;
	var victimHealed;
	var bigHealthAttacks = 0;
    var staminaCost = 0;
    checkForStopFighting("fight", configMRObj.jobs.optimization);
	do {
        victimHealed = false;
	    if (health > -1){
			if (firstAttack) {
				originalHealth = health;
				// MOD 15/11
                health = getVictimHealth(fighter, profileObj);
			}
			if (previousHealth < health){
                nrOfHeals++;
                logV2(INFO, "ATTACK", "Victim healed: " + fighter.id + " " + nrOfHeals + " time(s)");
				originalHealth = health;
				previousHealth = health;
                victimHealed = true;
                bigHealthAttacks = 0;
                if (isStaminaCostTooHigh(health, staminaCost)){
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINACOSTHIGH;
                    break;
                }
			}
			var victimIsDeath = false;
			if (health == 0){
				// check if attack button available (if health is 0, he can still be alive)
				if (checkForAttackButton()){
                    logV2(INFO, "ATTACK", "Victim is not dead yet. Continue Attacking...");
                    victimIsDeath = false;
                    alive = true;
				}
				else {
                    logV2(INFO, "ATTACK", "Victim is dead: " + fighter.id);
                    alive = false;
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    victimIsDeath = true;
                    break;
                }
			}
			if (!victimIsDeath) {
				var deltaHealth = 0;
				if (!firstAttack){
					deltaHealth = previousHealth-health;
					logV2(DEBUG, "ATTACK", "Victim Health changed: " + deltaHealth);
				}
				previousHealth = health;
				if (health > 100){
                    logV2(INFO, "ATTACK", "Victim has too much health: " + health);
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    break;
                }
				else if (nrOfAttacks > configMRObj.fight.maxNumberOfAttacks && health > configMRObj.fight.attackTillDiedHealth){
					logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (nrOfHeals > configMRObj.fight.numberOfHealsLimit && health > configMRObj.fight.attackTillDiedHealth){
					logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
					globalSettings.maxHealed++;
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (health >= configMRObj.fight.attackTillDiedHealth && !firstAttack && !victimHealed &&
                         deltaHealth < 2 && health > configMRObj.fight.attackTillDiedBigHealth &&
                         (originalHealth - health) <= configMRObj.fight.deltaBigHealth &&
                         bigHealthAttacks > configMRObj.fight.maxNumberOfAttacksBigHealth){
					logV2(INFO, "ATTACK", "Victim has too much health. Skipping...");
                    logV2(INFO, "ATTACK", "Delta Health: " + deltaHealth);
					logV2(INFO, "ATTACK", "Orignal Health: " + originalHealth);
					logV2(INFO, "ATTACK", "Current Health: " + health);
                    logV2(INFO, "ATTACK", "Big Health Attacks: " + bigHealthAttacks);
					globalSettings.skippedHealth++;
					statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
					fighter.bigHealth = true;
					break;
				}
				else {
					// MOD 15/11
                    var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, STOP_SCRIPT);
                    var stamina = staminaObj.leftOver;
                    if (stamina == -1){
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                        logV2(INFO, "ATTACK", "Stamina Limit Reached");
                        break;
                    }
                    else if (stamina < 5){
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        break;
                    }
                    var healthObj = performHealthCheck("ATTACKTILLDEATH", configMRObj.fight.autoHeal, stamina);
				    if (!continueFightingAfterHealthCheck(healthObj)) {
				        continue;
                    }
                    else if (refreshAfterHealing(healthObj)) {
				        alive = false;
				        break;
                    }
                    var attackStatus = performAttack(health, fighterType, fighter);
					statusObj.totalStamina += 5;
					nrOfAttacks++;
                    bigHealthAttacks++;
                    health = getVictimHealth(fighter, profileObj);
                    if (health > configMRObj.fight.attackTillDiedHealth) {
                        globalSettings.money += checkSaldo();
                    }
                    // MOD 15/11
					var exitAttack = false;
					switch (attackStatus){
                        case FIGHTERCONSTANTS.ATTACKSTATUS.OK:
                            if (health > 0 && firstAttack){
                                if (fighterType != FIGHTERCONSTANTS.FIGHTERTPE.RIVAL && fighterType != FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY){
                                    // get stamina cost
                                    staminaCost = getStaminaCost();
                                    if (isStaminaCostTooHigh(health, staminaCost)){
                                        logV2(INFO, "ATTACK", "Stamina Cost too high. Skipping Player");
                                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINACOSTHIGH;
                                        exitAttack = true;
                                        break;
                                    }
                                }
                            }
                            firstAttack = false;
                            break;
                        case FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED:
                            statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED;
                            exitAttack = true;
                            break;
                        case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM:
                            statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
                            exitAttack = true;
                            break;
                    }
                    if (exitAttack){
					    break;
                    }
				}
			}
		}
		else {
			// Problem with script
			statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
            logV2(INFO, "ATTACK", "Problem Attack Till Death");
			return statusObj;
		}
	}
	while (alive);
	logV2(INFO, "ATTACK", "Attack Figther Finished.");
	logV2(INFO, "ATTACK", "Total Stamina used: " + statusObj.totalStamina);
	logV2(INFO, "ATTACK", "Total Attacks: " + nrOfAttacks);
	globalSettings.nrOfAttacks += nrOfAttacks;
	return statusObj;
}

function isStaminaCostTooHigh(health, staminaCost){
    return (configMRObj.fight.staminaCost > 0 && staminaCost > configMRObj.fight.staminaCost && health > configMRObj.fight.staminaCostHealth);
}

function checkIfLevelUp(){
	var level = getLevel();
	var levelUp = false;
    if (globalSettings.currentLevel === 0) {
        globalSettings.currentLevel = level;
    }
    else if (level > globalSettings.currentLevel){
        levelUp = true;
        globalSettings.stopOnLevelUp = configMRObj.fight.stopOnLevelUp;
        logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
        var ret = closePopup();
        if (ret == SUCCESS){
            logV2(INFO, "LEVELUP", "Dialog Box Closed");
        }
        globalSettings.currentLevel = level;
    }
	return levelUp;
}

function addFriend(fighter){
    if (!findFighter(friendObj.fighters, fighter.id)){
    	friendObj.fighters.push(fighter);
        writeMRObject(friendObj, MR.MR_FRIENDS_FILE);
    }
}

function addStrongerOpponent(fighter){
    if (!findFighter(fightersToExclude.fighters, fighter.id)){
    	fightersToExclude.fighters.push(fighter);
        writeMRObject(fightersToExclude, MR.MR_FIGHTERS_EXCLUDE_FILE);
    }
}

function evaluateAttackMessage(msg){
	logV2(INFO, "ATTACK", "Msg = " + msg);
	if (isNullOrBlank(msg)){
		return FIGHTERCONSTANTS.OPPONENT.UNKNOWN;
	}
	msg= msg.toUpperCase();
	if (msg.startsWith("YOU LOST")){
		return FIGHTERCONSTANTS.OPPONENT.LOST;
	}
	else if (msg.startsWith("YOU WON")){
		return FIGHTERCONSTANTS.OPPONENT.WON;
	}
	else if (msg.startsWith("YOU CANNOT ATTACK YOUR FRIEND")){
		return FIGHTERCONSTANTS.OPPONENT.FRIEND;
	}
	else if (msg.startsWith("IT LOOKS LIKE")){
		return FIGHTERCONSTANTS.OPPONENT.DEAD;
	}
    else if (msg.startsWith("YOU DO NOT FEEL HEALTHY")){
        return FIGHTERCONSTANTS.OPPONENT.NOHEALTH;
    }
	else {
		return FIGHTERCONSTANTS.OPPONENT.UNKNOWN;
	}
}

function getFightList(){
	logV2(INFO, "FIGHTLIST", "Getting Fight List Info");
	var list = [];
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	logV2(INFO, "FIGHTLIST", "Extract_Start Return Code: " + retCode);
	if (retCode == SUCCESS){
		for (var i=1; i<= configMRObj.fight.listLength; i++){
			addMacroSetting("pos", i.toString(), ENABLE_LOGGING);
			var retCode = playMacro(FIGHT_FOLDER, "21_ExtractV2.iim", MACRO_INFO_LOGGING);
			if (retCode == SUCCESS){
			    var txt = getLastExtract(1, "Fight Line", "Fight Line")
				var id = extractIdFromString(txt);
				var name = extractFighterNameFromString(txt).substring(0,100);;
				var level = extractLevelFromString(txt);
				var object = getFighterObject(id, name, level);
				// MOD 15/11
				var gangObj = extractIdNameFromString(txt);
                object.gangId = gangObj.id;
                object.gangName = gangObj.name;
                object.lastChecked = formatDateToYYYYMMDDHHMISS();
                if (isAllyGang(friendObj.gangs, object.gangId)) {
                    logV2(INFO, "FIGHT", "Prefiltered: Is Ally Gang");
                    logObj(INFO, "FIGHT", object);
                }
                else {
                    list.push(object);
                }
			}
			else {
				// ignore this line on the fight list
				logV2(INFO, "FIGHTLIST", "Last Line reached: " + i);
				break;
			}
		}
	}
	else {
        logV2(WARNING, "FIGHTLIST", "Problem With Starting Fight List. Retcode= " + retCode);
	}
	return list;
}

function getStatusObject(){
	return {"status":null, 
	        "totalStamina":0,
			"iced": 0
		   };
}

function isAlreadyKilledToday(player){
    var killedToday = false;
    var strDate = getDateYYYYMMDD();
    if (propertyExistAndNotNull(player, "lastIced")){
        if (player.lastIced.substr(0, 8) == strDate) {
            if (valueNotNullAndGreaterThan(player.icesOfTheDay, configMRObj.fight.maxKillsDay-1)) {
                logV2(INFO, "CHECK", "Player already killed today: " + player.id + " / " + player.icesOfTheDay);
                killedToday = true;
            }
        }
    }
    if (!killedToday){
        if (propertyExistAndNotNull(player, "lastIced")){
            var currDate = new Date();
            currDate = dateAdd(currDate, -30, 'minutes');
            var formattedDate = formatDateToYYYYMMDDHHMISS(currDate);
//        logV2(INFO, "CHECK", "formatttedDate: " + formattedDate);
//        logV2(INFO, "CHECK", "player.lastIced: " + player.lastIced);
            if (formattedDate < player.lastIced){
                logV2(INFO, "CHECK", "Player recently iced: " + formattedDate + "/" + player.lastIced);
                killedToday = true;
            }
        }
        else if (propertyExistAndNotNull(player, "lastAttacked")){
            var currDate = new Date();
            currDate = dateAdd(currDate, -5, 'minutes');
            var formattedDate = formatDateToYYYYMMDDHHMISS(currDate);
//        logV2(INFO, "CHECK", "formatttedDate: " + formattedDate);
//        logV2(INFO, "CHECK", "player.lastAttacked: " + player.lastAttacked);
            if (formattedDate < player.lastAttacked){
                logV2(INFO, "CHECK", "Player recently attacked: " + formattedDate + "/" + player.lastAttacked);
                killedToday = true;
            }
        }
    }
    return killedToday;
}

function filterFightList(fightList){
    filteredList = [];
    var maxLevel = globalSettings.currentLevel === 0 ? globalSettings.maxLevel : (globalSettings.currentLevel + configMRObj.fight.maxAttackLevels);
    logV2(INFO, "FIGHTLIST", "Max Level: " + maxLevel);
    if (fightList != null && fightList.length > 0){
        fightList.forEach( function (fighter)
        {
            var foundFighter = getFighter(fighterObj.fighters, fighter.id);
            if (foundFighter != null) {
                if (isAlreadyKilledToday(foundFighter)){
                    return;
                }
            }
            if (findFighter(fightersToExclude.fighters, fighter.id)){
                logV2(INFO, "FIGHTLIST", "Excluded Fighter Found: " + fighter.id);
            }
            else if (findFighter(friendObj.fighters, fighter.id)) {
                logV2(INFO, "FIGHTLIST", "Friend Found: " + fighter.id);
            }
            else if (fighter.level > maxLevel) {
                logV2(INFO, "FIGHTLIST", "High Level: " + fighter.id + " / Level: " + fighter.level);
            }
            else if (isAllyGang(friendObj.gangs, fighter.gangId)){
                logV2(INFO, "FIGHTLIST", "Friendly Gang Found: " + fighter.gangId + " / " + fighter.gangName + " / Fighter ID: " + fighter.id);
            }
            else {
                filteredList.push(fighter);
            }
        });
    }
    logV2(INFO, "FIGHTLIST", "Filtered Fightlist count: " + filteredList.length);
    return filteredList;
}

function extractLevelFromString(text){
	text = removeComma(text);
    var regExp = "</a> Level (.*)<";
	var matches = text.match(regExp);
	if (matches != null && matches.length > 0){
		var level = matches[matches.length-1];
		level = parseInt(level);
		return level;
	}
	return text;
}


function extractIdFromString(text){
    var regExp = "CLASS=\"PRO\" DATA-ID=\"" + "([0-9]{1,30})\">";
    //var regExp = /id=([0-9]{1,30})"/;
    text = text.toUpperCase();
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractFighterNameFromString(text){
    var regExp = "class=\"pro\" data-id=\"" + "(?:[0-9]{1,20})\">([^<]*)<\/a>(?:.*)";
    //var regExp = /id=([0-9]{1,30})"/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
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

function removeItemFromArray(file, id){
	logV2(INFO, "FIGHT", "Save Current Fighters List");
    writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    waitV2("1");
    var obj= initMRObject(file);
    var index = -1;
	for (var i=0; i < obj.fighters.length; i++){
		var item = obj.fighters[i];
		if (item.id == id){
			index = i;
			break;
		}
	}
	if (index >= 0){
        obj.fighters.splice(index, 1);
        writeMRObject(obj, file);
        fighterObj = initMRObject(file);
	}
	return index > -1;
}

function startNormalAttack(fighters){
    logV2(INFO, "FIGHT", "Start Fight List Using Profile Page");
    status = profileAttack(fighters, FIGHTERCONSTANTS.FIGHTERTPE.NORMALPROFILE);
    return status;
}

function homeFeedAttack(){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    // script assassin-a-nator is the master for checking the attackers of your mini account
    var checkMini = getOverwrittenSetting(null, "homefeed", "checkMini", configMRObj.homefeed.checkMini);
    if (checkMini) {
        checkMiniHomeFeed(profileObj, globalSettings.profile.id, friendObj, fightersToExclude, fighterObj);
    }
    if (!configMRObj.homefeed.attack){
        logV2(INFO, "FIGHT", "Homefeed Attack disabled");
        status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    }
    else if (getTempSetting(null, "fight", "homefeedAttack") == false){
        logV2(INFO, "FIGHT", "Homefeed Attack temporary disabled");
        status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    }
    else {
        logHeader(INFO, "FIGHT", "Homefeed Attack", "*");
        var list = [];
        fighterObj.fighters.forEach(function (fighter) {
            if (fighter.hasOwnProperty("homefeed") && fighter.homefeed != null) {
                list.push(fighter);
            }
        });

        // sort list by most recent first
        list.sort(function (a, b) {
            return strcmp(b.homefeed, a.homefeed);
        });
        list = list.slice(0, configMRObj.homefeed.attackSize);
        list.forEach(function (fighter) {
            logV2(INFO, "FIGHT", fighter.id + ": " + fighter.homefeed);
        });

        logV2(INFO, "FIGHT", "Nr of Homefeed Fighters Found: " + list.length);
        var status = profileAttack(list, FIGHTERCONSTANTS.FIGHTERTPE.PROFILE);
    }
    return status;
}

function startProfileAttack(){
    logHeader(INFO, "FIGHT", "Profile Attack", "*");
    var nr = fighterObj.fighters.length;
    var profileAttackLength = configMRObj.fight.profileAttackSize;
    logV2(INFO, "FIGHT", "Range Max:" + (nr - profileAttackLength));
    logV2(INFO, "FIGHT", "Total:" + nr);
    var start = randomIntFromInterval(0, nr - profileAttackLength);
    var max = Math.min(start+profileAttackLength, nr-1);
    logV2(INFO, "FIGHT", "Random Start Position: " + start);
    logV2(INFO, "FIGHT", "Random End Position: " + max);
    var newArray = fighterObj.fighters.slice(start, max);
    status = profileAttack(newArray, FIGHTERCONSTANTS.FIGHTERTPE.PROFILE);
    return status;
}

function startProfileAttackRecentlyIced(){
    logHeader(INFO, "FIGHT", "Start Profile Attack From Recently Iced Players", "*");
    var nr = fighterObj.fighters.length;
    var profileAttackLength = 100;
    logV2(INFO, "FIGHT", "Range Max:" + (nr - profileAttackLength));
    logV2(INFO, "FIGHT", "Total:" + nr);
    var start = randomIntFromInterval(0, nr - profileAttackLength);
    var max = Math.min(start+profileAttackLength, nr-1);
    logV2(INFO, "FIGHT", "Random Start Position: " + start);
    logV2(INFO, "FIGHT", "Random End Position: " + max);
    var newArray = fighterObj.fighters.slice(start, max);
    var iceDate = new Date();
    iceDate = dateAdd(iceDate, -5, "days");
    var strIceDate = formatDateToYYYYMMDDHHMISS(iceDate);
    logV2(INFO, "FIGHT", "Recently Iced Start Date: " + strIceDate);
    var filteredArray = [];
    newArray.forEach(function (fighter){
        if (fighter.hasOwnProperty("lastIced") && fighter.lastIced >= strIceDate){
            filteredArray.push(fighter);
        }
    });
    status = profileAttack(filteredArray, FIGHTERCONSTANTS.FIGHTERTPE.PROFILE);
    return status;
}

function extractPlayerName(text){
    var regExp = "</a>(.*)</h2>";
    var name = text;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        name = matches[matches.length-1];
    }
    else {
        // <h2 style=\"margin: 10px 0px; outline: 1px solid blue;\" class=\"ellipsis\">Jocelyn brown</h2>"
        regExp = "h2 style=(?:.*)>(.*)</h2>";
        matches = text.match(regExp);
        if (matches != null && matches.length > 0){
            name = matches[matches.length-1];
        }    }
    return name.trim();
}

function checkForPlayerinfoToUpdate(fighter){
    var currDate = new Date();
    var chk = false;
    currDate = dateAdd(currDate, -1, "months");
    var strDate = formatDateToYYYYMMDDHHMISS(currDate);
    if (propertyExistAndNotNull(fighter, "lastChecked")){
        if (fighter.lastChecked <= strDate){
            chk = true;
        }
        else {
            logV2(INFO, "FIGHT", "Player Info is up to date: " + fighter.id);
        }
    }
    else {
        chk = true;
    }
    logV2(INFO, "FIGHT", "checkForPlayerinfoToUpdate: " + chk);
    return chk;
}

function extractFighterinfo(fighter){
    logV2(INFO, "FIGHT", "Update info for fighter " + fighter.id);
    var retCode = playMacro(FIGHT_FOLDER, "85_Profile_GetInfo.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var lvlInfo = getLastExtract(1, "Level", "1,126");

        var xtraInfo = getLastExtract(2, "Fighter Info", "");
        if (!isNullOrBlank(lvlInfo)){
            lvlInfo = removeComma(lvlInfo);
            var level = parseInt(lvlInfo);
            var pl = extractFighterNameFromString(xtraInfo);
            if (level > 0){
                fighter.level = level;
                var gangObj = extractIdNameFromString(xtraInfo, "GANG");
                fighter.gangId = gangObj.id;
                fighter.gangName = gangObj.name;
                fighter.name = pl;
                fighter.lastChecked = formatDateToYYYYMMDDHHMISS();
            }
            else {
                logV2(WARNING, "FIGHT", "Problem converting level for player " + fighter.id);
            }
        }
        else {
            logV2(WARNING, "FIGHT", "Problem extracting level for player " + fighter.id);
        }
    }
    else {
        logV2(WARNING, "FIGHT", "Problem updating player " + fighter.id);
    }
}

function filterProfile(array){
    var filteredArray = [];
    for (var i=0; i < array.length; i++) {
        var item = array[i];
        if (isAlreadyKilledToday(item)) {
        }
        else if (item.level > 0 && item.level < configMRObj.fight.minLevel && !checkForPlayerinfoToUpdate(item)){
            logV2(INFO, "FIGHT", "Low Level: " + item.id + "(Level: " + item.level + ")");
        }
        else {
            filteredArray.push(item);
        }
    }
    return filteredArray;
}

function profileAttack(array, fighterType){
    var exitLoop = false;
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (!configMRObj.fight.profileAttack){
        return status;
    }
    var filteredArray = filterProfile(array);
    logV2(INFO, "FIGHT", "Profile Fighting: Nr Of Players: " + filteredArray.length);
    for (var i=0; i < filteredArray.length; i++) {
        var arrayItem = filteredArray[i];
        if (arrayItem.skip){
            continue;
        }
        logV2(INFO, "PROFILE", JSON.stringify(arrayItem));
        if (isAllyGang(friendObj.gangs, arrayItem.gangId)){
            logV2(INFO, "FIGHT", "Profile Fighting: Friendly Gang Found for player " + arrayItem.id + " - " + arrayItem.name);
            continue;
        }
        addMacroSetting("ID", arrayItem.id);
        var retCode = playMacro(FIGHT_FOLDER, "80_Profile_Attack_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.PROFILE){
                if (checkForPlayerinfoToUpdate(arrayItem)) {
                    extractFighterinfo(arrayItem);
                };
            }
            logV2(INFO, "FIGHT", "Profile Fighting Player " + arrayItem.id + " - " + arrayItem.name);
            var statusObj = attack(arrayItem, fighterType);
            switch (statusObj.status) {
                case FIGHTERCONSTANTS.ATTACKSTATUS.OK :
                    // do nothing, continue with next fighter
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED :
                    exitLoop = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM :
                    logV2(INFO, "FIGHT", "Problem With Player. Skipping...");
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA :
                    logV2(INFO, "FIGHT", "Out Of Stamina. Exiting Profile Fighters List");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                    exitLoop = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT :
                    logV2(INFO, "FIGHT", "Stamina Limit. Exiting Profile Fighters List");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                    exitLoop = true;
                    break;
                case FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                    logV2(INFO, "FIGHT", "AutoHeal Disabled. Exit Profile Fighters List");
                    status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    exitLoop = true;
                    break;
            }
        }
        else {
            logV2(INFO, "WARNING", "Profile Attack Init Problem");
        }
        if (exitLoop) break;
    }
    // reload fighters list (because it's possible that fighters were removed => friend / stronger opponent
    logV2(INFO, "FIGHT", "Reloading players list");
    fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
    return status;
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function performHealthCheck(message, autoHeal, stamina){

    var healthObj = {"refresh": false, "continueFighting": false, "message": message, autoHeal: false, "health": -1};
    autoHeal = typeof autoHeal !== 'undefined' ? autoHeal : configMRObj.fight.autoHeal;
    autoHeal = getOverwrittenSetting(null, "fight", "fightAutoHeal", autoHeal);
    iimDisplay("autoHeal: " + autoHeal);
    if (typeof stamina == 'undefined'){
        var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
        stamina = staminaObj.leftOver;
    }
    var tries = 0;
    dummyBank();
    var health = getHealth();
    healthObj.autoHeal = autoHeal;
    if (autoHeal) {
        while (health < configMRObj.fight.heal) {
            if (!globalSettings.forceHealing) {
                if (health == 0) {
                    if (homefeedCheck()){
                        healthObj.refresh = true;
                    }
                }
            }
            if (stamina >= configMRObj.fight.minStaminaToHeal) {
                logV2(INFO, "HEAL", "health: " + health);
                heal();
            }
            else {
                logV2(INFO, "HEAL", "Not Enough Stamina To Heal");
                break;
            }
            tries++;
            if (tries > 2){
                logV2(INFO, "HEAL", "Retries: " + tries);
                //waitV2("0.5");
            }
            dummyBank();
            health = getHealth();
        }
        if (health > configMRObj.fight.heal){
            globalSettings.heals++;
        }
    }
    else {
        var tries = 0;
        while (health == 0) {
            dummyBank();
            waitV2("0.5");
            health = getHealth();
            tries++;
            if (health == 0) {
                if (tries == 1) {
                    if (homefeedCheck()) {
                        healthObj.refresh = true;
                    }
                }
                waitV2("10");
                logV2(INFO, "HEAL", "Autoheal disabled & Health is still zero");
            }
        }
    }
    if (health > 0){
        healthObj.continueFighting = true;
    }
    globalSettings.forceHealing = false;
    healthObj.health = health;
    logObj(INFO, "HEALTH", healthObj);
    return healthObj;
}

function getHomefeedLines(){
    return getOverwrittenSetting(null, "homefeed", "processLines", configMRObj.homefeed.processLines);
}

function homefeedCheck(){
    var processHomefeedLines = getHomefeedLines();
    var checked = false;
    if (processHomefeed(processHomefeedLines)){
        checked = true;
    }
    var bullied = underAttack(configMRObj, processHomefeedLines);
    if (!bullied) {
        logV2(INFO, "HOMEFEEDCHECK", "Killed. Waiting 60 seconds to heal again");
        waitV2("60");
    }
    logV2(INFO, "HOMEFEEDCHECK", "checked: " + checked);
    return checked;
}

function updateStatistics2(fighter, fighterType){
    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.RIVAL || fighterType == FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY){
        // no stats for rival mobsters
        return;
    }
    logObj(INFO, "STATS", fighter);
    //writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    updateFighter(fighter);
}

function updateFighter(player){
    // reload fighther obj, possible that process field was updated by another script
    fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var obj = fighterObj.fighters[i];
        if (obj.id == player.id){
            fighterObj.fighters[i] = player;
            writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            logV2(INFO, "UPDATE", "Player Info Saved");
            found = true;
            break;
        }
    }
    if (!found){
        logV2(INFO, "UPDATE", "Player Info Not Saved: " + JSON.stringify(player));
    }
}

function goToFightPage(){
    var retCode = initAndCheckScript(FIGHT_FOLDER, "20_Extract_Start.iim", "23_Fight_Test.iim", "fight list", "INITFIGHT", "Init Fight List");
    return retCode;
}

function extractTime(msg, unit, plural){
    var regExp = " ([0-9]{1,2}) " + unit + plural + "?";
    logHeader(INFO, "TST", unit, "*");
    logObj(INFO, "TST", regExp);
    var matches = msg.match(regExp);
    logObj(INFO, "TST", matches);
    var intUnit = 0;
    if (matches != null && matches.length > 1){
        intUnit = parseInt(matches[1]);
    }
    return intUnit;
}

function evaluateBossMessage() {
    var retCode = playMacro(FIGHT_FOLDER, "71_Boss_Message.iim", MACRO_INFO_LOGGING);
    var bossObj = getBossObj;
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Boss Message", "There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.");
        if (!isNullOrBlank(msg)){
            msg = msg.toUpperCase();
            if (msg.indexOf("THERE ARE NO BOSSES AVAILABLE") !== -1){
                logV2(INFO, "BOSS", "Boss Message: " + msg);
                var minutes = extractTime(msg, "MINUTE", "S");
                var hours = extractTime(msg, "HOUR", "S");
                var seconds = extractTime(msg, "SECOND", "S");
                logV2(INFO, "BOSS", "hours: " + hours);
                logV2(INFO, "BOSS", "minutes: " + minutes);
                logV2(INFO, "BOSS", "seconds: " + seconds);
                bossObj.status = 0;
                date = new Date();
                date = dateAdd(date, hours, 'hours');
                date = dateAdd(date, minutes, 'minutes');
                date = dateAdd(date, seconds, 'seconds');
                var formattedDate = formatDateToYYYYMMDDHHMISS(date);
                configMRObj.boss.defeatedOn = formattedDate;
                writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
                bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.BOSSALREADYDEAD;
            }
            else if (msg.startsWith(settingsObj.boss.bossName.toUpperCase())) {
                bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                logV2(INFO, "BOSS", "BOSS AVAILABLE ???");
            }
        }
        else {
            bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
            logV2(WARNING, "BOSS", "Problem Extracting Boss Message");
        }
    }
    else {
        bossObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
        logV2(WARNING, "BOSS", "Problem Getting Boss Message");
    }
    return bossObj;
}
