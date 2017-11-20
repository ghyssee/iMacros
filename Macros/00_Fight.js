var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\\MyConstants-0.0.3.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
LOG_FILE = new LogFile(LOG_DIR, "MRFight");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var RIVAL_MOBSTER = true;

var CONSTANTS = Object.freeze({
    "OPPONENT" : {
		"UNKNOWN": 0,
		"FRIEND": 1,
		"WON" : 2,
		"LOST": 3,
		"DEAD": 4
	},
	"ATTACKSTATUS" : {
		"OK" : 0,
		"PROBLEM": -1,
		"NOSTAMINA": 2,
		"BOSSDEFATED": 1,
		"BOSSALREADYDEAD": 3,
        "HEALINGDISABLED": 4,
		"UNKNOWN": 5
	}
});

init();
var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

var fightersToExclude = initObject(MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initObject(MR_FRIENDS_FILE);
var fighterObj = initObject(MR_FIGHTERS_FILE);
var configMRObj = initObject(MR_CONFIG_FILE);
var globalSettings = {"maxLevel": 20000, "iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0, "stolenIces": 0, "skippedHealth": 0, "maxHealed": 0, "heals": 0,
                      "boss": {"attacks": 0}};
//var fighters = getFightList();
startScript();
//removeItemFromArray(MR_FIGHTERS_FILE, "10155726770108684")

function startScript(){
    try {
        var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
        do  {
            waitTillEnoughStamina();
            var status = CONSTANTS.ATTACKSTATUS.OK;
            configMRObj = initObject(MR_CONFIG_FILE);
            if (configMRObj.boss.active) {
                status = startFightBoss();
                logV2(INFO, "BOSSFIGHT", "Status: " + status);
            }
            if (continueFighting(status)){
                if (checkHealth()) {
                    fight();
                    logV2(INFO, "FIGHT", "Updating statistics");
                    writeObject(fighterObj, MR_FIGHTERS_FILE);
                }
                else {
                    logV2(INFO, "FIGHT", "AutoHeal Disabled. Waiting till enough health again");
                    waitV2("60");
                }
            }
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            writeObject(fighterObj, MR_FIGHTERS_FILE);
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
        logV2(INFO, "BOSS", "Boss Result: " + msg);
        if (msg.startsWith('YOU WON THE FIGHT')){
        }
        else if (msg.startsWith("You DO NOT FEEL HEALTHY")){
        }
    }
    else {
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
                checkHealth(AUTOHEAL);
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
                }
                else
                {
                    logV2(INFO, "BOSS", "Problem With Attacking boss");
                    status = CONSTANTS.ATTACKSTATUS.PROBLEM;
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
    logV2(INFO, "FIGHT", "Checking Health");
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
                    writeObject(configMRObj, MR_CONFIG_FILE);
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
    if (status != CONSTANTS.ATTACKSTATUS.NOSTAMINA && status != CONSTANTS.ATTACKSTATUS.HEALINGDISABLED){
        cont = true;
    }
    logV2(INFO, "FIGHT", "continueFighting: " + cont + " / Status = " + status);
    return cont;
}

function fight(){
	
	var exitLoop = false;
	var counter = 0;
	var status = CONSTANTS.ATTACKSTATUS.OK;
	do {
        configMRObj = initObject(MR_CONFIG_FILE);
        counter++;
		var rival = 0;

		do {

			rival = extractRivalMobster();
			if (rival > 0) {
				var fighter = getFighterObject("RIVAL", "RIVAL " + rival, "0");
				var list = [fighter];
				status = processList(list, RIVAL_MOBSTER);
                logV2(INFO, "FIGHT", "Status: " + status);
				if (!continueFighting(status)){
					logV2(INFO, "FIGHT", "Exit Fight V1...");
					exitLoop = true;
					break;
				}
			}
		}
		while (rival > 0);
		if (continueFighting(status)) {

            var fighters = getFightList();
            var filteredFightersList = filterFightList(fighters);
            var minFightList = isNullOrBlank(configMRObj.fight.minLengthOfFightList) ? 0: configMRObj.fight.minLengthOfFightList;
            logV2(INFO, "FIGHT", "Min Fighters on Fight List: " + minFightList);
            if (filteredFightersList.length >= minFightList) {
                status = processList(filteredFightersList, !RIVAL_MOBSTER);
            }
            else {
                status = startProfileAttack();
            }
            logV2(INFO, "FIGHT", "Status: " + status);
            if (!continueFighting(status)){
                logV2(INFO, "FIGHT", "Exit Fight V2...");
                exitLoop = true;
                break;
            }
        }
	}
	while (!exitLoop && counter < 100000);
}

function processList(list, rivalMobster){
	var refresh = false;
	var status = CONSTANTS.ATTACKSTATUS.OK;
	for (var i=0; i < list.length; i++){
		var arrayItem = list[i];
	    if (!arrayItem.skip){
			logV2(INFO, "FIGHT", "Fighting Player " + arrayItem.id + " - " + arrayItem.name);
			var statusObj = attack(arrayItem, rivalMobster, false);
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
    var minStamina = 50;
    do {
	    // refreshing stats (health / exp / stamina / energy)
		playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
		stamina = getStamina();
		energy = getEnergy();
		total = stamina + energy;
		var exp = getExperience();
		if (exp > 0){
			var staminaNeeded = exp / (4.3);
			logV2(INFO, "WAIT", "Stamina Needed: " + staminaNeeded);
            logV2(INFO, "WAIT", "Total (Energy + Stamina available): " + total);
            logV2(INFO, "WAIT", "Stamina: " + stamina);
            logV2(INFO, "WAIT", "maxStamina: " + maxStamina);
			// maxStamina = Math.min(maxStamina, staminaNeeded);
            if (total >= staminaNeeded && stamina > 19 && (stamina >= minStamina || exp < 300)) {
                logV2(INFO, "WAIT", "Enough Stamina to level up");
                break;
            }
            else if (stamina >= maxStamina){
                logV2(INFO, "WAIT", "Enough Stamina to start fighting again");
                break;
            }
            waitV2("60");
		}
	}
	// wait till stamina > 100
    // or stamina + energy > (experience needed to level up / 4)
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
		msg = msg.replace("/ 20", "").trim();;
		logV2(INFO, "FIGHT", "MSG PROCESSED: " + msg);
		mob = parseInt(msg);
	}
	return mob;
}

function attack(fighter, rivalMobster, profileFighter){
	logV2(INFO, "FIGHT", "Attacking " + fighter.id);
	// ADD 15/11
    var statusObj = getStatusObject();
	fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
	var retCode = SUCCESS;
	if (!profileFighter) {
        retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
    }
	if (!checkHealth()){
        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
        return statusObj;
    }
	if (profileFighter){
        retCode = playMacro(FIGHT_FOLDER, "81_Profile_Attack_Start.iim", MACRO_INFO_LOGGING);
	}
	else if (rivalMobster){
		retCode = playMacro(FIGHT_FOLDER, "32_AttackRivalMobster_start.iim", MACRO_INFO_LOGGING);
	}
	else {
		addMacroSetting("ID", fighter.id);
		retCode = playMacro(FIGHT_FOLDER, "30_Attack_Start", MACRO_INFO_LOGGING);
	}
	statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
	checkIfLevelUp();
	if (retCode == SUCCESS){
		retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status", MACRO_INFO_LOGGING);
		if (retCode == SUCCESS){
			var msg = getLastExtract(1, "Attack Status", "You WON The Fight");
			//var msg = prompt("FIRST ATTACK","You WON");
			var status = evaluateAttackMessage(msg);
			switch (status){
				case CONSTANTS.OPPONENT.FRIEND :
					logV2(INFO, "FIGHT", "Add Friend: " + fighter.id);
					fighter.skip = true;
					addFriend(fighter);
					if (profileFighter){
						removeItemFromArray(MR_FIGHTERS_FILE, fighter.id);
                        logV2(INFO, "FIGHT", "Remove Fighter + Add Friend: " + fighter.id);
					}
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				case CONSTANTS.OPPONENT.WON :
					// ADD 15/11
				    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
				    if (!rivalMobster && !profileFighter) {
						addFighter(fighter);
					}
					var attackStatusObj = attackTillDeath(fighter, rivalMobster);
					checkIfLevelUp();
					if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.NOSTAMINA){
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
                    updateStatistics(fighter, rivalMobster);
					break;
				case CONSTANTS.OPPONENT.DEAD :
					logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					globalSettings.stolenIces++;
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                    // ADD 15/11
                    updateStatistics(fighter, rivalMobster);
					break;
				case CONSTANTS.OPPONENT.LOST :
                    // MOD 15/11
				    getVictimHealth(fighter);
					logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
					addStrongerOpponent(fighter);
                    if (profileFighter){
                        removeItemFromArray(MR_FIGHTERS_FILE, fighter.id);
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

function attackTillDeath(fighter, rivalMobster){
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
	do {
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
					logV2(INFO, "ATTACK", "Victim Health changed: " + deltaHealth);
				}
				previousHealth = health;
				if (nrOfAttacks > 50 && health > 20){
					logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (nrOfHeals > 2 && health > 2){
					logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
					globalSettings.maxHealed++;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (!firstAttack && deltaHealth > 0 && deltaHealth < 2 && health > 30 && nrOfAttacks > 20){
					logV2(INFO, "ATTACK", "Victim has too much health. Skipping...");
					logV2(INFO, "ATTACK", "Orignal Health: " + originalHealth);
					logV2(INFO, "ATTACK", "Current Health: " + health);
					logV2(INFO, "ATTACK", "Nr of Attacks: " + nrOfAttacks);
					globalSettings.skippedHealth++;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					fighter.bigHealth = true;
					break;
				}
				else {
					// MOD 15/11
				    if (!checkHealth()){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        alive = false;
                        break;
                    }
					var stamina = getStamina();
					if (stamina < 5){
						statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
						break;
					}
					if (rivalMobster){
						retCode = playMacro(FIGHT_FOLDER, "42_VictimRivalMobster_Attack.iim", MACRO_INFO_LOGGING);
					}
					else {
					    addMacroSetting("ID", fighter.id);
                        logV2(INFO, "ATTACK", "ID: " + fighter.id);
						retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack", MACRO_INFO_LOGGING);
					}
					firstAttack = false;
					statusObj.totalStamina += 5;
					nrOfAttacks++;
					checkSaldo();
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
		//alive = false;
        logV2(INFO, "ATTACK", "Alive = " + alive);
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
	var retCode = playMacro(COMMON_FOLDER, "12_GetLevel.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		var msg = getLastExtract(1, "Level 300").toUpperCase();
		msg = msg.replace("LEVEL ", "");
		var level = parseInt(msg);
		if (globalSettings.currentLevel === 0) {
			globalSettings.currentLevel = level;
		}
		else if (level > globalSettings.currentLevel){
			logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
			var ret = closePopup();
			if (ret == SUCCESS){
				logV2(INFO, "LEVELUP", "Dialog Box Closed");
			}
			globalSettings.currentLevel = level;
		}
	}
}

function addFriend(fighter){
    if (!findFighter(friendObj.fighters, fighter.id)){
    	friendObj.fighters.push(fighter);
        writeObject(friendObj, MR_FRIENDS_FILE);
    }
}

function addStrongerOpponent(fighter){
    if (!findFighter(fightersToExclude.fighters, fighter.id)){
    	fightersToExclude.fighters.push(fighter);
        writeObject(fightersToExclude, MR_FIGHTERS_EXCLUDE_FILE);
    }
}

function addFighter(fighter){
	if (!findFighter(fighterObj.fighters, fighter.id)){
		fighterObj.fighters.push(fighter);
		writeObject(fighterObj, MR_FIGHTERS_FILE);
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
	else {
		return CONSTANTS.OPPONENT.UNKNOWN;
	}
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
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


function checkHealth(autoHeal){
    autoHeal = typeof autoHeal !== 'undefined' ? autoHeal : configMRObj.fight.autoHeal;
        logV2(INFO, "FIGHT", "Checking Health");
        var health = 0;
        health = getHealth();
        if (autoHeal) {
            while (health < 500) {
                heal();
                health = getHealth();
                if (health > 500) {
                    globalSettings.heals++;
                }
            }
        }
        else if (health > 0) {
           autoHeal = true;
        }
        else {
            logV2(INFO, "FIGHT", "Auto Heal disabled");
        }
    return autoHeal;
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
	playMacro(COMMON_FOLDER, "11_GetSaldo.iim", MACRO_INFO_LOGGING);
	var saldoInfo = getLastExtract(1, "Saldo", "$128");
	//var saldoInfo = prompt("Saldo", "500");
	logV2(INFO, "BANK", "saldoInfo = " + saldoInfo);
	if (!isNullOrBlank(saldoInfo)){
        saldoInfo = removeComma(saldoInfo);
		var saldo = parseInt(saldoInfo.replace("$", ""));
		return saldo;
	}
	return 0;
}

function getFightList(){
	logV2(INFO, "FIGHTLIST", "Getting Fight List Info");
	var list = [];
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	logV2(INFO, "FIGHTLIST", "Extract_Start Return Code: " + retCode);
	if (retCode == SUCCESS){
		for (var i=1; i<= 15; i++){
			addMacroSetting("pos", i.toString(), ENABLE_LOGGING);
			var retCode = playMacro(FIGHT_FOLDER, "21_Extract.iim", MACRO_INFO_LOGGING);
			if (retCode == SUCCESS){
				var id = extractIdFromString(getLastExtract(1, "Fighter ID", "123456789"));
				var name = getLastExtract(2, "Fighter Name", "BlaBla");
				name = name.substring(0,100);
				var level = extractLevelFromString(getLastExtract(3, "Fighter Level", "200"));
				var object = getFighterObject(id, name, level);
				// MOD 15/11
				var gangObj = extractGangFromString(getLastExtract(4, "Gang", "data-params=\"controller=gang&amp;action=view&amp;id=3985490\">*TBC*</a>"));
				logV2(INFO, "GANG", "ID=" + gangObj.id);
                logV2(INFO, "GANG", "NAME=" + gangObj.name);
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

function filterGang(gangId){
    var found = false;
    if (gangId != null) {
        for (var i = 0; i < friendObj.gangs.length; i++) {
            var gangObj = friendObj.gangs[i];
            if (gangObj.id == gangId) {
                found = true;
                break;
            }
        }
    }
    return found;
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
					var maxLevel = globalSettings.currentLevel === 0 ? globalSettings.maxLevel : (globalSettings.currentLevel + 500);
                    logV2(INFO, "FIGHTLIST", "Max Level: " + maxLevel);
					if (fighter.level <= maxLevel){
						// MOD 15/11
					    if (filterGang(fighter.gangId)){
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
function updateStatistics(fighter, rivalMobster){
    if (rivalMobster){
        // no stats for rival mobsters
        return;
    }
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var fighterItem = fighterObj.fighters[i];
        if (fighterItem.id == fighter.id){
            logV2(INFO, "FIGHT", "Updating statistics for " + fighter.id);
            fighterItem.lastAttacked = fighter.lastAttacked;
            fighterItem.iced += fighter.iced;
            fighterItem.bigHealth = fighter.bigHealth;
            if (fighter.lastIced != null) {
                fighterItem.lastIced = fighter.lastIced;
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
}

function findFighter(list, id){
	found = false;
	list.forEach( function (arrayItem)
	{
		if (arrayItem.id == id){
			found = true;
			return;
		}
	});
	return found;
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
    var regExp = /id=(.*)"[ |$]/;
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

function heal(){
	logV2(INFO, "TEST", "Healing...");
	var retCode = playMacro(FIGHT_FOLDER, "10_Heal.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
        closePopup();
    }
}

function closePopup(){
	var retCode = playMacro(COMMON_FOLDER, "02_ClosePopup.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		logV2(INFO, "POPUP", "Popup Closed");
	}
}

function getHealth(){
	playMacro(FIGHT_FOLDER, "11_GetHealth.iim", MACRO_INFO_LOGGING);
	var healthInfo = getLastExtract(1, "Health", "50/200");
	logV2(INFO, "BOSS", "healthInfo = " + healthInfo);
	if (!isNullOrBlank(healthInfo)){
        healthInfo = removeComma(healthInfo);
		var tmp = healthInfo.split("/");
		var health = parseInt(tmp[0]);
		return health;
	}
	return 0;
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
    writeObject(fighterObj, MR_FIGHTERS_FILE);
    waitV2("1");
    var obj= initObject(file);
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
		writeObject(obj, file);
	}
	return index > -1;
}

function startProfileAttack(){
    var refresh = false;
    var status = CONSTANTS.ATTACKSTATUS.OK;
    var nr = fighterObj.fighters.length;
    logV2(INFO, "FIGHT", "Range Max:" + (nr - 100));
    logV2(INFO, "FIGHT", "Total:" + nr);
    var start = randomIntFromInterval(0, nr - 100);
    var max = Math.min(start+100, nr-1);
    logV2(INFO, "FIGHT", "Random Start Position: " + start);
    logV2(INFO, "FIGHT", "Random End Position: " + max);
    for (var i=start; i <= max; i++) {
        var arrayItem = fighterObj.fighters[i];
        if (filterGang(arrayItem.gangId)){
            logV2(INFO, "FIGHT", "Profile Fighting: Friendly Gang Found for fighter " + arrayItem.id + " - " + arrayItem.name);
        }
        addMacroSetting("ID", arrayItem.id);
        var retCode = playMacro(FIGHT_FOLDER, "80_Profile_Attack_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (!arrayItem.skip) {
                logV2(INFO, "FIGHT", "Profile Fighting Player " + arrayItem.id + " - " + arrayItem.name);
                var statusObj = attack(arrayItem, false, true);
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
    fighterObj = initObject(MR_FIGHTERS_FILE);
    return status;
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function getFighterObject(id, name, level){
    return {"id":id, "name":name, "level": level, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null,
        "iced": 0
    };
}


function extractGangFromString (text){
    var gangObj = {id:null, name:null};
    text = text.toUpperCase();
    //logV2(INFO, "GANG", "MSG= " + text);
    if (contains(text, "CONTROLLER=GANG")){
        gangObj.id = extractGangIdFromString(text);
        gangObj.name = extractGangNameFromString(text);
    }
    return gangObj;
}

function extractGangIdFromString(text){
    var regExp = /CONTROLLER=GANG&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=([0-9]{1,20})\">/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractGangNameFromString(text){
    var regExp = /CONTROLLER=GANG&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=(?:[0-9]{1,20})\">([^<]*)<\/A>(?:.*)/;
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}
