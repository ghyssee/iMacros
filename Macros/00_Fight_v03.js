var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
setMRPath("MRFight");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var CONSTANTS = Object.freeze({
    "OPPONENT" : {
		"UNKNOWN": 0,
		"FRIEND": 1,
		"WON" : 2,
		"LOST": 3,
		"DEAD": 4,
        "NOHEALTH": 5
	},
	"ATTACKSTATUS" : {
        "OK" : 0,
        "PROBLEM": -1,
        "NOSTAMINA": 2,
        "BOSSDEFATED": 1,
        "BOSSALREADYDEAD": 3,
        "HEALINGDISABLED": 4,
        "UNKNOWN": 5,
        "STOPONLEVELUP": 6
    },
    "FIGHTERTPE" : {
        "NORMAL" : 0,
        "RIVAL" : 1,
        "PROFILE": 2,
        "NORMALPROFILE": 3
    }
});

init();
var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

var fightersToExclude = initMRObject(MR.MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initMRObject(MR.MR_FRIENDS_FILE);
var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var globalSettings = {"maxLevel": 20000, "iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0, "stolenIces": 0,
                      "skippedHealth": 0, "maxHealed": 0, "heals": 0, "stopOnLevelUp": false,
                        "forceHealing": false,
                      "boss": {"attacks": 0}};
startScript();

function startScript(){
    try {
        var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        globalSettings.currentLevel = getLevel();
        logV2(INFO, "LEVEL", "Starting Level: " + globalSettings.currentLevel);
        do  {
            if (globalSettings.stopOnLevelUp){
                logV2(INFO, "FIGHT", "You Leveled Up and setting stopOnLevelUp is enabled");
                waitV2("60");
            }
            else {
                waitTillEnoughStamina();
                // if (health is 0, don't check for underAttack, it's already checked
                globalSettings.forceHealing = true;
                var status = CONSTANTS.ATTACKSTATUS.OK;
                configMRObj = initMRObject(MR.MR_CONFIG_FILE);
                if (configMRObj.boss.active) {
                    status = startFightBoss();
                    logV2(INFO, "BOSSFIGHT", "Status: " + status);
                }
                if (continueFighting(status)) {
                    if (checkHealth(configMRObj.fight.autoHeal)) {
                        fight();
                        logV2(INFO, "FIGHT", "Updating statistics");
                        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
                    }
                    else {
                        logV2(INFO, "FIGHT", "AutoHeal Disabled. Waiting till enough health again if autoheal disabled or stamina if minimum stamina has reached");
                    }
                }
            }
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            // do nothing
        }
        else {
            logError(ex);
        }
        logV2(INFO, "SUMMARY", "Total Iced: " + globalSettings.iced);
        logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
        logV2(INFO, "SUMMARY", "Nr Of Attacks: " + globalSettings.nrOfAttacks);
        logV2(INFO, "SUMMARY", "Stolen Ices: " + globalSettings.stolenIces);
        logV2(INFO, "SUMMARY", "Skipped Health: " + globalSettings.skippedHealth);
        logV2(INFO, "SUMMARY", "Max Healed: " + globalSettings.maxHealed);
        logV2(INFO, "SUMMARY", "Heals: " + globalSettings.heals);
    }
}

function startFightBoss(){
    logV2(INFO, "BOSS", "Start Boss Fight");
    var status = CONSTANTS.ATTACKSTATUS.OK;
    if (configMRObj.boss.defeatedOn !== null){
        var bossStartTime = formatStringYYYYMMDDHHMISSToDate(configMRObj.boss.defeatedOn);
        var currDate = new Date();
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
    var retCode = playMacro(FIGHT_FOLDER, "70_Boss_Start.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        bossObj = evaluateBossMessage();
        logV2(INFO, "BOSS", "Status: " + bossObj.status);
        switch (bossObj.status){
            case CONSTANTS.ATTACKSTATUS.OK:
                bossObj.status = attackBoss();
                break;
            case CONSTANTS.ATTACKSTATUS.PROBLEM:
                break;
            case CONSTANTS.ATTACKSTATUS.NOSTAMINA:
                break;
            case CONSTANTS.ATTACKSTATUS.BOSSDEFATED:
                break;
            default:
                break;
        }
    }
    else {
        logV2(INFO, "BOSS", "Problem Starting Boss Fight");
        bossObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    return bossObj.status;
}

function evaluateBossResult(){
    var retCode = playMacro(FIGHT_FOLDER, "75_Boss_Attack_Result.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Boss Attack Result", 'You WON the fight');
        msg = msg.toUpperCase();
        logV2(DEBUG, "BOSS", "Boss Result: " + msg);
        if (msg.startsWith('YOU WON THE FIGHT')){
        }
        else if (msg.startsWith("You DO NOT FEEL HEALTHY")){
        }
    }
    else {
        logV2(DEBUG, "BOSS", "Problem Getting Boss Result");
    }
}

// MOD 17/11
function attackBoss(){
    var status = CONSTANTS.ATTACKSTATUS.OK;
    var bossHealth = -1;
    var retCode = 0;
    var AUTOHEAL = true;
    retCode = playMacro(FIGHT_FOLDER, "73_Boss_StartAttack.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        do {
            var stamina = getStamina();
            if (stamina >= 5) {
                if (checkHealth(AUTOHEAL, stamina)) {
                    retCode = playMacro(FIGHT_FOLDER, "74_Boss_Attack.iim", MACRO_INFO_LOGGING);
                    if (retCode == SUCCESS) {
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
                        if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
                            status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                            break;
                        }
                    }
                    else {
                        logV2(INFO, "BOSS", "Problem With Attacking boss");
                        status = CONSTANTS.ATTACKSTATUS.PROBLEM;
                        break;
                    }
                }
                else {
                    logV2(INFO, "BOSS", "Not Enough Stamina For Healing or We're under attack");
                    status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    break;
                }
            }
            else {
                logV2(INFO, "BOSS", "Not Enough Stamina");
                status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                break;
            }
        }
        while (bossHealth > 0);
    }
    else {
        logV2(INFO, "BOSS", "Problem With Start Attacking boss");
        status = CONSTANTS.ATTACKSTATUS.PROBLEM;
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
                logV2(INFO, "BOSS", "Problem Parsing health");
            }
        }
        else {
            logV2(INFO, "BOSS", "Problem Extracting health");
        }
    }
    else {
        logV2(INFO, "BOSS", "Problem Getting Boss Health");
    }
    return health;
}


function evaluateBossMessage() {
    var retCode = playMacro(FIGHT_FOLDER, "71_Boss_Message.iim", MACRO_INFO_LOGGING);
    var bossObj = {"status": CONSTANTS.ATTACKSTATUS.UNKNOWN};
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Boss Message", "There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.");
        if (!isNullOrBlank(msg)){
            msg = msg.toUpperCase();
            logV2(INFO, "BOSS", "Boss Message: " + msg);
            if (msg.indexOf("THERE ARE NO BOSSES AVAILABLE") !== -1){
                var regExp = /BACK IN ([0-9]{1,2}) HOURS, ([0-9]{1,2}) MINUTES/;
                var matches = msg.match(regExp);
                if (matches != null && matches.length > 1){
                    var minutes = matches[2];
                    var hours = matches[1];
                    bossObj.status = 0;
                    date = new Date();

                    date = dateAdd(date, parseInt(minutes), 'minutes');
                    date = dateAdd(date, parseInt(hours), 'hours');
                    var formattedDate = formatDateToYYYYMMDDHHMISS(date);
                    //var newD = formatStringYYYYMMDDHHMISSToDate(formattedDate);
                    configMRObj.boss.defeatedOn = formattedDate;
                    writeMRObject(configMRObj, MR.MR_CONFIG_FILE);
                    waitV2("1");
					bossObj.status = CONSTANTS.ATTACKSTATUS.BOSSALREADYDEAD;
                }
                else {
					bossObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
					logV2(INFO, "BOSS", "No Time Found");
                }
            }
            else if (msg.startsWith(configMRObj.boss.name.toUpperCase())) {
                bossObj.status = CONSTANTS.ATTACKSTATUS.OK;
            	logV2(INFO, "BOSS", "BOSS AVAILABLE ???");
            }
        }
        else {
			bossObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
            logV2(INFO, "BOSS", "Problem Extracting Boss Message");
        }
    }
    else {
		bossObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
        logV2(INFO, "BOSS", "Problem Getting Boss Message");
    }
    return bossObj;
}

function continueFighting(status){
    var cont = false;
    if (status != CONSTANTS.ATTACKSTATUS.NOSTAMINA && status != CONSTANTS.ATTACKSTATUS.HEALINGDISABLED
        && status != CONSTANTS.ATTACKSTATUS.STOPONLEVELUP){
        cont = true;
    }
    logV2(INFO, "FIGHT", "continueFighting: " + cont + " / Status = " + status);
    return cont;
}

function attackRivals(){
    var rival = 0;
    var status = CONSTANTS.ATTACKSTATUS.OK;
    if (configMRObj.fight.rivals) {
        do {
            rival = extractRivalMobster();
            if (rival > 0) {
                var fighter = getFighterObject("RIVAL", "RIVAL " + rival, "0");
                var list = [fighter];
                status = processList(list, CONSTANTS.FIGHTERTPE.RIVAL);
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

function attackFightList(){
    var status = CONSTANTS.ATTACKSTATUS.OK;
    var fighters = getFightList();
    if (configMRObj.fight.fightList) {
        var filteredFightersList = filterFightList(fighters);
        var minFightList = configMRObj.fight.minLengthOfFightList == null ? 0 : configMRObj.fight.minLengthOfFightList;
        logV2(INFO, "FIGHT", "Min Fighters on Fight List: " + minFightList);
        if (filteredFightersList.length >= minFightList) {
            status = processList(filteredFightersList, CONSTANTS.FIGHTERTPE.NORMAL);
            if (status == CONSTANTS.ATTACKSTATUS.PROBLEM) {
                logV2(INFO, "FIGHT", "Normal Fighters - Profile Attack");
                status = startNormalAttack(filteredFightersList);
            }
        }
        else {
            status = homeFeedAttack();
            if (continueFighting(status)) {
                status = startProfileAttack();
            }
        }
    }
    logV2(INFO, "FIGHT", "Status: " + status);
    return status;
}

function fight(){
	
	var exitLoop = false;
	var status = CONSTANTS.ATTACKSTATUS.OK;
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
	var status = CONSTANTS.ATTACKSTATUS.OK;
	for (var i=0; i < list.length; i++){
		var arrayItem = list[i];
	    if (!arrayItem.skip){
			logV2(INFO, "FIGHT", "Fighting Player " + arrayItem.id + " - " + arrayItem.name);
			var statusObj = attack(arrayItem, fighterType);

			switch (statusObj.status) {
                case CONSTANTS.ATTACKSTATUS.OK :
                    // do nothing, continue with next fighter
                    break;
                case CONSTANTS.ATTACKSTATUS.PROBLEM :
                    logV2(INFO, "FIGHT", "Problem With Fightlist. Refreshing...");
                    refresh = true;
                    break;
                case CONSTANTS.ATTACKSTATUS.NOSTAMINA :
                    logV2(INFO, "FIGHT", "Out Of Stamina. Exiting processList");
                    status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                    //waitTillEnoughStamina();
                    refresh = true;
                    break;
                case CONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                    logV2(INFO, "FIGHT", "AutoHeal Disabled");
                    status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                    refresh = true;
                    break;
                case CONSTANTS.ATTACKSTATUS.STOPONLEVELUP :
                    logV2(INFO, "FIGHT", "Stop On Levl Up");
                    status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
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
		playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
		stamina = getStamina();
		energy = getEnergy();
		var health = getHealth();
		total = stamina + energy;
		var exp = getExperience();
		if (exp > 0){
			var staminaNeeded = exp / (4.3);
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
            else if (stamina >= configMRObj.fight.minStaminaToFight){
                logV2(INFO, "WAIT", "Enough Stamina to start fighting again");
                break;
            }
            else if (health > 0 && stamina > 20){
                logV2(INFO, "WAIT", "Enough Health to fight");
                break;
            }
            waitV2("60");
		}
		else {
            logV2(WARNING, "WAIT", "Problem getting experience");
        }
	}
	while (true);
    logV2(INFO, "WAIT", "Leaving wait");
}

function extractRivalMobster(){
	//Rival mobsters alive: 18 / 20
	logV2(INFO, "FIGHT", "Rival Mobsters");
	var retCode = 0;
	retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	retCode = playMacro(FIGHT_FOLDER, "22_Extract_Rival.iim", MACRO_INFO_LOGGING);
	var mob = 0;
	if (retCode == SUCCESS){
		var msg = getLastExtract(1, "Rival", "20 / 20");
		logV2(INFO, "FIGHT", "MSG: " + msg);
		msg = msg.toUpperCase().replace("RIVAL MOBSTERS ALIVE: ","");
		msg = msg.replace("/ 20", "").trim();
		logV2(INFO, "FIGHT", "MSG PROCESSED: " + msg);
		mob = parseInt(msg);
	}
	return mob;
}

function attack(fighter, fighterType){
	logV2(INFO, "FIGHT", "Attacking " + fighter.id);
	// ADD 15/11
    var statusObj = getStatusObject();
	fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
	var retCode = SUCCESS;
	if (fighterType != CONSTANTS.FIGHTERTPE.PROFILE && fighterType != CONSTANTS.FIGHTERTPE.NORMALPROFILE) {
        retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
    }
	if (!checkHealth(configMRObj.fight.autoHeal)){
        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
        return statusObj;
    }
    logV2(INFO, "FIGHT", "fighterType: " + fighterType);
    switch (fighterType){
        case CONSTANTS.FIGHTERTPE.PROFILE:
            retCode = playMacro(FIGHT_FOLDER, "81_Profile_Attack_Start.iim", MACRO_INFO_LOGGING);
            break;
        case CONSTANTS.FIGHTERTPE.NORMAL:
            addMacroSetting("ID", fighter.id);
            retCode = playMacro(FIGHT_FOLDER, "30_Attack_Start", MACRO_INFO_LOGGING);
            break;
        case CONSTANTS.FIGHTERTPE.RIVAL:
            retCode = playMacro(FIGHT_FOLDER, "32_AttackRivalMobster_start.iim", MACRO_INFO_LOGGING);
            break;
        case CONSTANTS.FIGHTERTPE.NORMALPROFILE:
            retCode = playMacro(FIGHT_FOLDER, "81_Profile_Attack_Start.iim", MACRO_INFO_LOGGING);
            break;
    }
	statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
	if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
        statusObj.status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
    }
	else if (retCode == SUCCESS){
		retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status", MACRO_INFO_LOGGING);
		if (retCode == SUCCESS){
			var msg = getLastExtract(1, "Attack Status", "You WON The Fight");
			//var msg = prompt("FIRST ATTACK","You WON");
			var status = evaluateAttackMessage(msg);
			switch (status){
                case CONSTANTS.OPPONENT.NOHEALTH:
                    checkHealth(configMRObj.fight.autoHeal);
                    break;
			    case CONSTANTS.OPPONENT.FRIEND :
					logV2(INFO, "FIGHT", "Add Friend: " + fighter.id);
					fighter.skip = true;
					addFriend(fighter);
					if (fighterType == CONSTANTS.FIGHTERTPE.PROFILE){
						removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
                        logV2(INFO, "FIGHT", "Remove Fighter + Add Friend: " + fighter.id);
					}
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				case CONSTANTS.OPPONENT.WON :
					// ADD 15/11
				    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
				    if (fighter.alive == null){
				        fighter.alive = 1;
                    }
                    else {
                        fighter.alive++;
                    }
				    if (fighterType != CONSTANTS.FIGHTERTPE.RIVAL &&
                        fighterType != CONSTANTS.FIGHTERTPE.PROFILE &&
                        fighterType != CONSTANTS.FIGHTERTPE.NORMALPROFILE){
						addFighter(fighter);
					}
					var attackStatusObj = attackTillDeath(fighter, fighterType);
                    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                    }
					else if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.NOSTAMINA){
					   // no stamina
						statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
					}
                    else if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.HEALINGDISABLED){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    }
                    else {
						statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					}
                    // ADD 15/11
                    updateStatistics(fighter, fighterType);
					break;
				case CONSTANTS.OPPONENT.DEAD :
                    if (fighter.dead == null){
                        fighter.dead = 1;
                    }
                    else {
                        fighter.dead++;
                    }
					logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					globalSettings.stolenIces++;
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                    // ADD 15/11
                    updateStatistics(fighter, fighterType);
					break;
				case CONSTANTS.OPPONENT.LOST :
                    // MOD 15/11
				    getVictimHealth(fighter);
					logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
					addStrongerOpponent(fighter);
                    if (fighterType == CONSTANTS.FIGHTERTPE.PROFILE){
                        removeItemFromArray(MR.MR_FIGHTERS_FILE, fighter.id);
                        logV2(INFO, "FIGHT", "Remove Fighter + Add Stronger Opponent: " + fighter.id);
                    }
					fighter.skip = true;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				default :
					statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
					logV2(INFO, "FIGHT", "Attack First Time Problem");
					break;
			}
		}
		else {
			logV2(INFO, "FIGHT", "Problem getting status for Fighter: " + fighter.id);
			statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
		}
	}
	else {
		logV2(INFO, "FIGHT", "Fighter Not Found: " + fighter.id + " / Fight List Refreshed???" );
		statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
	}
	return statusObj;
}

// MOD 15/11
function getVictimHealth(fighter){
	var health = -1;
	retCode = playMacro(FIGHT_FOLDER, "40_Victim_Health", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
		var healthMsg = getLastExtract(1, "Victim Health", "50%");
		if (!isNullOrBlank(healthMsg)) {
			healthMsg = healthMsg.replace("%", "");
			logV2(INFO, "ATTACK", "Victim Health: " + healthMsg);
            health = parseInt(healthMsg);
            if (health == 0){
                waitV2("0.3");
                // MOD 15/11
                checkIfIced(fighter);
            }
		}
		else {
            logV2(INFO, "ATTACK", "Problem extracting Victim Health (Empty))");
        }
	}
	return health;

}

function checkForAttackButton(){
    var btnAvailable = false;
	var retCode = playMacro(FIGHT_FOLDER, "43_Check_Attack_Button.iim", MACRO_INFO_LOGGING);
    var btn = getLastExtract(1, "ATTACK BUTTON", "Power Attack");
    if (retCode == SUCCESS && !isNullOrBlank(btn)){
        btnAvailable = true;
    }
    logV2(INFO, "ATTACK", "Check Attack Button: " + btnAvailable);
    return btnAvailable;

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
	do {
        victimHealed = false;
	    if (health > -1){
			if (firstAttack) {
				originalHealth = health;
				// MOD 15/11
                health = getVictimHealth(fighter);
			}
			if (previousHealth < health){
				logV2(INFO, "ATTACK", "Victim healed: " + fighter.id);
				nrOfHeals++;
				originalHealth = health;
				previousHealth = health;
                victimHealed = true;
                bigHealthAttacks = 0;
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
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
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
				if (nrOfAttacks > configMRObj.fight.maxNumberOfAttacks && health > configMRObj.fight.attackTillDiedHealth){
					logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (nrOfHeals > configMRObj.fight.numberOfHealsLimit && health > configMRObj.fight.attackTillDiedHealth){
					logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
					globalSettings.maxHealed++;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
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
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					fighter.bigHealth = true;
					break;
				}
				else {
					// MOD 15/11
                    var stamina = getStamina();
				    if (!checkHealth(configMRObj.fight.autoHeal, stamina)){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        logV2(INFO, "ATTACK", "Healing Disabled");
                        alive = false;
                        break;
                    }
					if (stamina < 5){
						statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
						break;
					}
					if (fighterType == CONSTANTS.FIGHTERTPE.RIVAL){
						retCode = playMacro(FIGHT_FOLDER, "42_VictimRivalMobster_Attack.iim", MACRO_INFO_LOGGING);
					}
					else {
					    addMacroSetting("ID", fighter.id);
                        logV2(DEBUG, "ATTACK", "ID: " + fighter.id);
						retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack", MACRO_INFO_LOGGING);
					}
					firstAttack = false;
					statusObj.totalStamina += 5;
					nrOfAttacks++;
                    bigHealthAttacks++;
					globalSettings.money += checkSaldo();
                    // MOD 15/11
					health = getVictimHealth(fighter);
					
					if (retCode != SUCCESS){
						statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
						break;
					}
				}
			}
		}
		else {
			// Problem with script
			statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
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

// MOD 15/11
function checkIfIced(fighter){
	iced = false;
	var retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		var msg = getLastExtract(1, "Ice Status", "Riki just Killed blabla. Your Kill Count is now 777").toUpperCase();
		logV2(INFO, "FIGHT", "Check For Iced: " + msg);
		if (msg.indexOf("YOUR KILL COUNT") !== -1){
			iced = true;
		}
		else if (msg.indexOf("JUST KILLED") !== -1){
			iced = true;
		}
	}
	else {
        logV2(INFO, "FIGHT", "Problem getting fight status: " + retCode);
    }
	if (iced){
		logV2(INFO, "FIGHT", "Total Ices: " + ++globalSettings.iced);
		// MOD 15/11
		fighter.iced++;
		fighter.lastIced = formatDateToYYYYMMDDHHMISS(new Date());
	}
	return iced;
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

function addFighter(fighter){
	if (!findFighter(fighterObj.fighters, fighter.id)){
		fighterObj.fighters.push(fighter);
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
	}
}

function evaluateAttackMessage(msg){
	logV2(INFO, "ATTACK", "Msg = " + msg);
	if (isNullOrBlank(msg)){
		return CONSTANTS.OPPONENT.UNKNOWN;
	}
	msg= msg.toUpperCase();
	if (msg.startsWith("YOU LOST")){
		return CONSTANTS.OPPONENT.LOST;
	}
	else if (msg.startsWith("YOU WON")){
		return CONSTANTS.OPPONENT.WON;
	}
	else if (msg.startsWith("YOU CANNOT ATTACK YOUR FRIEND")){
		return CONSTANTS.OPPONENT.FRIEND;
	}
	else if (msg.startsWith("IT LOOKS LIKE")){
		return CONSTANTS.OPPONENT.DEAD;
	}
    else if (msg.startsWith("YOU DO NOT FEEL HEALTHY")){
        return CONSTANTS.OPPONENT.NOHEALTH;
    }
	else {
		return CONSTANTS.OPPONENT.UNKNOWN;
	}
}

function getStamina(){
	playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
	var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
	logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
	if (!isNullOrBlank(staminaInfo)){
        staminaInfo = staminaInfo.replace(/,/g, '');
		var tmp = staminaInfo.split("/");
		var stamina = parseInt(tmp[0]);
		return stamina;
	}
	return 0;
}

function getEnergy(){
    var ret = playMacro(JOB_FOLDER, "10_GetEnergy.iim", MACRO_INFO_LOGGING);
    var energyInfo = getLastExtract(1, "Energy Left", "500/900");
    logV2(INFO, "ENERGY", "energy = " + energyInfo);
    if (!isNullOrBlank(energyInfo)){
        energyInfo = energyInfo.replace(/,/g, '');
        var tmp = energyInfo.split("/");
        var energy = parseInt(tmp[0]);
        return energy;
    }
    return 0;
}

function getExperience(){
	logV2(INFO, "EXP", "Get Experience");
	ret = playMacro(COMMON_FOLDER, "13_GetExperience.iim", MACRO_INFO_LOGGING);
	var exp = 0;
	if (ret == SUCCESS){
		var msg = getLastExtract(1, "Experience Left", "5,886 (1,264 to level)");
		exp = extractExperience(msg);
		logV2(INFO, "EXP", "Experience Left: " + exp);
	}
	return exp;

}

// MOD 22/11
function checkHealth(autoHeal, stamina){
    autoHeal = typeof autoHeal !== 'undefined' ? autoHeal : configMRObj.fight.autoHeal;
    var tries = 0;
    if (typeof stamina == 'undefined'){
        stamina = getStamina();
    }
        logV2(DEBUG, "FIGHT", "Checking Health");
        var health = getHealth();
        // MOD 22/11
        if (autoHeal) {
            if (stamina >= configMRObj.fight.minStaminaToHeal) {
                while (health < configMRObj.fight.heal) {
                    logV2(INFO, "FIGHT", "Health = " + health);
                    tries++;
                    if (!globalSettings.forceHealing) {
                        if (tries > 1 || health < 300) {
                            logV2(INFO, "FIGHT", tries + " attempt(s) to heal. Possible under attack");
                            waitV2("1");
                            dummyBank();
                            health = getHealth();
                            logV2(INFO, "FIGHT", "Health = " + health);
                        }
                        if (health == 0) {
                            logV2(INFO, "FIGHT", "Killed by another player");
                            autoHeal = false;
                            if (underAttack(configMRObj)) {
                                // Went To Home page;
                                // interrupt Attack / Boss Fight => disable autoHeal switch
                            }
                            // when it's your first heal => don't wait
                            waitV2("60");
                            break;
                        }
                    }
                    heal();
                    health = getHealth();
                }
            }
            else if (health == 0){
                logV2(INFO, "FIGHT", "Not Enough Stamina To Heal: " + stamina);
                autoHeal = false;
            }
        }
        else if (health > 0) {
           autoHeal = true;
        }
        else {
            logV2(INFO, "FIGHT", "Auto Heal disabled");
        }
        if (autoHeal) {
            health = getHealth();
            if (health > configMRObj.fight.heal) {
                globalSettings.heals++;
            }
        }
    globalSettings.forceHealing = false;
    logV2(DEBUG, "FIGHT", "Check Health Exit: " + autoHeal);
    return autoHeal;
}

function getFightList(){
	logV2(INFO, "FIGHTLIST", "Getting Fight List Info");
	var list = [];
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	logV2(INFO, "FIGHTLIST", "Extract_Start Return Code: " + retCode);
	if (retCode == SUCCESS){
		for (var i=1; i<= configMRObj.fight.listLength; i++){
			addMacroSetting("pos", i.toString(), ENABLE_LOGGING);
			var retCode = playMacro(FIGHT_FOLDER, "21_Extract.iim", MACRO_INFO_LOGGING);
			if (retCode == SUCCESS){
				var id = extractIdFromString(getLastExtract(1, "Fighter ID", "123456789"));
				var name = getLastExtract(2, "Fighter Name", "BlaBla");
				name = name.substring(0,100);
				var level = extractLevelFromString(getLastExtract(3, "Fighter Level", "200"));
				var object = getFighterObject(id, name, level);
				// MOD 15/11
				var gangObj = extractIdNameFromString(getLastExtract(4, "Gang", "data-params=\"controller=gang&amp;action=view&amp;id=3985490\">*TBC*</a>"),
				                                      "GANG");
                object.gangId = gangObj.id;
                object.gangName = gangObj.name;
				list.push(object);
			}
			else {
				// ignore this line on the fight list
				logV2(INFO, "FIGHTLIST", "Last Line reached: " + i);
				break;
			}
		}
	}
	else {
		throw new Error("Problem With Extract Start");
	}
	return list;
}

function getStatusObject(){
	return {"status":null, 
	        "totalStamina":0,
			"iced": 0
		   };
}

function filterFightList(fightList){
	filteredList = [];
	if (fightList != null && fightList.length > 0){
		fightList.forEach( function (fighter)
		{
			// lookup strong opponents list
			if (!findFighter(fightersToExclude.fighters, fighter.id)){
				// lookup friends list
				if (!findFighter(friendObj.fighters, fighter.id)){
					var maxLevel = globalSettings.currentLevel === 0 ? globalSettings.maxLevel : (globalSettings.currentLevel + configMRObj.fight.maxAttackLevels);
                    logV2(INFO, "FIGHTLIST", "Max Level: " + maxLevel);
					if (fighter.level <= maxLevel){
						// MOD 15/11
					    if (isAllyGang(firendObj.gangs, fighter.gangId)){
                            logV2(INFO, "FIGHTLIST", "Friendly Gang Found: " + fighter.gangId + " / " + fighter.gangName + " / Fighter ID: " + fighter.id);
                        }
                        else {
                            filteredList.push(fighter);
                        }
					}
					else {
						logV2(INFO, "FIGHTLIST", "High Level: " + fighter.id + " / Level: " + fighter.level);
					}
				}
				else {
					logV2(INFO, "FIGHTLIST", "Friend Found: " + fighter.id);
				}
			}
			else {
					logV2(INFO, "FIGHTLIST", "Excluded Fighter Found: " + fighter.id);
			}
		});
	}
    logV2(INFO, "FIGHTLIST", "Filtered Fightlist count: " + filteredList.length);
	return filteredList;
}

// ADD 15/11
function updateStatistics(fighter, fighterType){
    if (fighterType == CONSTANTS.FIGHTERTPE.RIVAL){
        // no stats for rival mobsters
        return;
    }
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var fighterItem = fighterObj.fighters[i];
        if (fighterItem.id == fighter.id){
            logV2(INFO, "FIGHT", "Updating statistics for " + fighter.id);
            if (fighter.lastAttacked != null) {
                fighterItem.lastAttacked = fighter.lastAttacked;
            }
            fighterItem.iced += fighter.iced;
            fighterItem.bigHealth = fighter.bigHealth;
            if (fighter.lastIced != null) {
                fighterItem.lastIced = fighter.lastIced;
            }
            if (fighter.alive != null && fighter.alive > 0) {
                addValueToProperty(fighterItem, "alive", 1);
            }
            if (fighter.dead != null && fighter.dead > 0) {
                addValueToProperty(fighterItem, "dead", 1);
            }
            fighterItem.gangId = fighter.gangId;
            fighterItem.gangName = fighter.gangName;
            found = true;
            logV2(INFO, "FIGHT", JSON.stringify(fighterItem));
            break;
        }
    }
    if (!found){
        logV2(INFO, "FIGHT", "Problem Updating statistics for " + fighter.id);
    }
    else {
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    }
}

function extractLevelFromString(text){
	text = removeComma(text);
    var regExp = /Level (.*)$/;
	var matches = text.match(regExp);
	if (matches != null && matches.length > 0){
		var level = matches[matches.length-1];
		level = parseInt(level);
		return level;
	}
	return text;
}


function extractIdFromString(text){
    var regExp = /id=([0-9]{1,30})"/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractExperience(text){
    text = text.toUpperCase().replace(/,/g, "");
    var regExp = /(?:.*)[0-9]{1,10} \((.*) TO LEVEL/; //5,886 (1,264 to level)
    var matches = text.match(regExp);
    var exp = 0;
    if (matches != null && matches.length > 0){
        exp = parseInt(matches[matches.length-1]);
    }
    return exp;

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
    status = profileAttack(fighters, CONSTANTS.FIGHTERTPE.NORMALPROFILE);
    return status;
}

function homeFeedAttack(){
    var status = CONSTANTS.ATTACKSTATUS.OK;
    if (!configMRObj.fight.homefeedAttack){
        logV2(INFO, "FIGHT", "Homefeed Attack disabled");
        status = CONSTANTS.ATTACKSTATUS.OK;
    }
    else {
        checkMiniHomeFeed();
        logV2(INFO, "FIGHT", "Start Fight List Using Home Feed");
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
        list = list.slice(0, configMRObj.fight.homefeedAttackSize);
        list.forEach(function (fighter) {
            logV2(INFO, "FIGHT", fighter.id + ": " + fighter.homefeed);
        });

        logV2(INFO, "FIGHT", "Nr of Homefeed Fighters Found: " + list.length);
        var status = profileAttack(list, CONSTANTS.FIGHTERTPE.PROFILE);
    }
    return status;
}

function startProfileAttack(){
    logV2(INFO, "FIGHT", "Start Profile Attack");
    var nr = fighterObj.fighters.length;
    var profileAttackLength = configMRObj.fight.profileAttackSize;
    logV2(INFO, "FIGHT", "Range Max:" + (nr - profileAttackLength));
    logV2(INFO, "FIGHT", "Total:" + nr);
    var start = randomIntFromInterval(0, nr - profileAttackLength);
    var max = Math.min(start+profileAttackLength, nr-1);
    logV2(INFO, "FIGHT", "Random Start Position: " + start);
    logV2(INFO, "FIGHT", "Random End Position: " + max);
    var newArray = fighterObj.fighters.slice(start, max);
    status = profileAttack(newArray, CONSTANTS.FIGHTERTPE.PROFILE);
    return status;
}

function profileAttack(array, fighterType){
    var refresh = false;
    var status = CONSTANTS.ATTACKSTATUS.OK;
    logV2(INFO, "FIGHT", "Profile Fighting: Nr Of Fighters: " + array.length);
    for (var i=0; i < array.length; i++) {
        var arrayItem = array[i];
        logV2(INFO, "PROFILE", JSON.stringify(arrayItem));
        if (isAllyGang(firendObj.gangs, arrayItem.gangId)){
            logV2(INFO, "FIGHT", "Profile Fighting: Friendly Gang Found for fighter " + arrayItem.id + " - " + arrayItem.name);
            continue;
        }
        addMacroSetting("ID", arrayItem.id);
        var retCode = playMacro(FIGHT_FOLDER, "80_Profile_Attack_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (!arrayItem.skip) {
                logV2(INFO, "FIGHT", "Profile Fighting Player " + arrayItem.id + " - " + arrayItem.name);
                var statusObj = attack(arrayItem, fighterType);
                switch (statusObj.status) {
                    case CONSTANTS.ATTACKSTATUS.OK :
                        // do nothing, continue with next fighter
                        break;
                    case CONSTANTS.ATTACKSTATUS.PROBLEM :
                        logV2(INFO, "FIGHT", "Problem With Fighter. Skipping...");
                        break;
                    case CONSTANTS.ATTACKSTATUS.NOSTAMINA :
                        logV2(INFO, "FIGHT", "Out Of Stamina. Exiting Profile Fighters List");
                        status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        refresh = true;
                        break;
                    case CONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                        logV2(INFO, "FIGHT", "AutoHeal Disabled. Exit Profile Fighers List");
                        status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        refresh = true;
                        break;
                }
            }
            else {
                logV2(INFO, "FIGHT", "Skipping Stronger Opponent: " + arrayItem.id);
            }
            if (refresh) break;
        }
        else {
            logV2(INFO, "FIGHT", "startProfileAttack Return Status: " + status);
        }
    }
    // reload fighters list (because it's possible that fighters were removed => friend / stronger opponent
    logV2(INFO, "FIGHT", "Reloading fighters list");
    fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
    return status;
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getFighterObject(id, name, level){
    return {"id":id, "name":name, "level": level, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null,
        "iced": 0, "alive": 0, "dead": 0, "homefeed": null
    };
}

function updateHomefeedFighter(fighterId, homefeed){
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var fighterItem = fighterObj.fighters[i];
        if (fighterItem.id == fighterId){
            found = true;
            if (!fighterItem.hasOwnProperty("homefeed") || fighterItem.homefeed < homefeed) {
                fighterItem.homefeed = homefeed;
                logV2(INFO, "FIGHT", "Update Homefeed: " + JSON.stringify(fighterItem));
                writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            }
            else {
                //logV2(INFO, "FIGHT", "NO Update Homefeed: " + JSON.stringify(fighterItem));
            }
            break;
        }
    }
    if (!found){
        logV2(INFO, "FIGHT", "Problem Updating homefeed for " + fighterId);
    }
}

function addHomeFeedKillToList(list, lineObj){

    var processed = false;
    if (list.hasOwnProperty(lineObj.fighterId)){
            //logV2(INFO, "HOMEFEED", "Already Added: " + lineObj.fighterId);
            processed = true;
    }
    if (findFighter(friendObj.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "FRIEND: " + lineObj.fighterId);
        processed = true;
    }
    else if (findFighter(fightersToExclude.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "STRONGER: " + lineObj.fighterId);
        processed = true;
    }
    else if (findFighter(fighterObj.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "FIGHTER: " + lineObj.fighterId);
        updateHomefeedFighter(lineObj.fighterId, lineObj.timeStamp);
        processed = true;
    }
    else if (isAllyGang(friendObj.gangs, lineObj.gangId)){
        logV2(INFO, "HOMEFEED", "FRIENDGANG: " + lineObj.fighterId + " / GANG: " + lineObj.gangId);
        processed = true;
    }
    if (!processed){
        list[lineObj.fighterId] = lineObj;
        var fighter = getFighterObject(lineObj.fighterId, lineObj.name, 0);
        fighter.gangId = lineObj.gangId;
        fighter.gangName = lineObj.gangName;
        fighter.homefeed = lineObj.timeStamp;
        addFighter(fighter);
        logV2(INFO, "HOMEFEED", "ADD: " + lineObj.fighterId);
    }
}

    function checkMiniHomeFeed(){
        var file = new ConfigFile(ORIG_MR_DIR + "02\\", MR.MR_HOMEFEED_FILE);
        var obj = initObject(file);
        var length = obj.kills.length;
        var listToCheck = {};
        var save = false;
        for (var i=length-1; i>=0; i--){
            var lineObj = obj.kills[i];
            if (!lineObj.hasOwnProperty("processed") || !lineObj.processed){
                addHomeFeedKillToList(listToCheck, lineObj);
                lineObj.processed = true;
                save = true;
            }
            else {
                logV2(INFO, "HOMEFEED", "Last Homefeed Line processed: " + lineObj.timeMsg + " " + lineObj.feedMsg);
                break;
            }
        }
        if (save) {
            writeObject(obj, file);
        }
        var arrayOfKeys = Object.getOwnPropertyNames(listToCheck);
        logV2(INFO, "HOMEFEED", "List Of Fighters Added");
        logV2(INFO, "HOMEFEED", "======================");
        arrayOfKeys.forEach(function (key) {
            logV2(INFO, "ADD", listToCheck[key].fighterId);
        });
        logV2(INFO, "HOMEFEED", JSON.stringify(listToCheck));
    }
