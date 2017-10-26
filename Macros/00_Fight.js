var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js2\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js2\\MyFileUtils-0.0.4.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js2\\MyConstants-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js2\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
var FRAME="0";
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
		"NOSTAMINA": 2
	}
});

init();
//var	configObject = initObject(CONFIG_JSON_FILE);
//var mwObject = initObject(MAFIAWARS_JSON_FILE);
var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";

var txt="blabla&id='123456789'&blabla='test'";
var regExp = /id='(.*)'[&|$]/;
var matches = txt.match(regExp);
for (var i = 0; i < matches.length; i++) {
    var str = matches[i];
    window.console.log(str);
}
window.console.log(MR_DIR);
var fightersToExclude = initObject(MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initObject(MR_FRIENDS_FILE);
var fighterObj = initObject(MR_FIGHTERS_FILE);
var globalSettings = {"iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0, "stolenIces": 0, "skippedHealth": 0, "maxHealed": 0, "heals": 0};

	 try {
		 var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
	 	 fight();
         //evaluateBossMessage();
	 }
	 catch (ex) {
	 	if (ex.name != USER_CANCEL) {
            logError(ex);
        }
        if (ex instanceof UserCancelError){
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

function fightBoss(){
    logV2(INFO, "BOSS", "Start Boss Fight");
    var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        bossObj = evaluateBossMessage();
        if (bossObj.status == 1){
            // check boss health
            // attack Boss
        }
    }
    else {
        logV2(INFO, "BOSS", "Problem Starting Boss Fight");
    }

}

function evaluateBossMessage() {
    //There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.
    //var retCode = playMacro(FIGHT_FOLDER, "71_Boss_Message.iim", MACRO_INFO_LOGGING);
    retCode = SUCCESS;
    var bossObj = {"status": 0, "hours": null, "minutes": null};
    if (retCode == SUCCESS){
        //var msg = getLastExtract(1, "Boss Message", "There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.");
        var msg = "There are no bosses available to fight. Please try coming back in 20 hours, 57 minutes.";
        if (!isNullOrBlank(msg)){
            msg = msg.toUpperCase();
            logV2(INFO, "BOSS", "Boss Message: " + msg);
            //alert(msg + "/" + msg.indexOf("THERE ARE No BOSSES AVAILABLE"));
            if (msg.indexOf("THERE ARE NO BOSSES AVAILABLE") !== -1){
                var regExp = /BACK IN ([0-9]{1,2}) HOURS, ([0-9]{1,2}) MINUTES/;
                var matches = msg.match(regExp);
                if (matches != null && matches.length > 1){
                    bossObj.minutes = matches[matches.length-1];
                    bossObj.hours = matches[matches.length-2];
                    alert(bossObj.hours + ":" + bossObj.minutes);
                }
                else {
                    logV2(INFO, "BOSS", "No Time Found");
                }
            }
            else {
                logV2(INFO, "BOSS", "BOSS AVAILABLE ???");
            }
        }
        else {
            logV2(INFO, "BOSS", "Problem Extracting Boss Message");
        }
    }
    else {
        logV2(INFO, "BOSS", "Problem Getting Boss Message");
    }
    return bossObj;
}

function fight(){
	
	var exitLoop = false;
	var counter = 0;
	do {
		counter++;
		var rival = 0;

		do {

			rival = extractRivalMobster();
			if (rival > 0) {
				var fighter = getFighterObject("RIVAL", "RIVAL " + rival, "0");
				var list = [fighter];
				processList(list, RIVAL_MOBSTER);
			}
		}
		while (rival > 0);

		var fighters = getFightList();
		var filteredFightersList = filterFightList(fighters);
		processList(filteredFightersList, !RIVAL_MOBSTER);
	}
	while (!exitLoop && counter < 100000);
}

function processList(list, rivalMobster){
	var refresh = false;
	list.forEach( function (arrayItem)
	{
		if (!arrayItem.skip){
			logV2(INFO, "FIGHT", "Fighting Player " + arrayItem.id + " - " + arrayItem.name);
			var statusObj = attack(arrayItem, rivalMobster);
			switch (statusObj.status) {
				case CONSTANTS.ATTACKSTATUS.OK :
					// do nothing, continue with next fighter
					break;
				case CONSTANTS.ATTACKSTATUS.PROBLEM :
					logV2(INFO, "FIGHT", "Problem With Fightlist. Refreshing...");
					refresh = true;
					break;
				case CONSTANTS.ATTACKSTATUS.NOSTAMINA :
					logV2(INFO, "FIGHT", "Out Of Stamina. Waiting for 10 minutes");
					waitTillEnoughStamina();
					refresh = true;
					break;
			}
		}
		else {
			logV2(INFO, "FIGHT", "Skipping Stronger Opponent: " + arrayItem.id);
		}
		if (refresh) return;
	});
}

function waitTillEnoughStamina(){
	var maxStamina = 300;
	do {
	    // refreshing stats (health / exp / stamina / energy)
		playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
		waitV2("60");
		stamina = getStamina();
		var exp = getExperience();
		if (exp > 0){
			var staminaNeeded = exp / 4;
			logV2(INFO, "WAIT", "Stamina Needed: " + staminaNeeded);
			maxStamina = Math.min(maxStamina, staminaNeeded);
		}
	}
	while (stamina < maxStamina);
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

function attack(fighter, rivalMobster){
	logV2(INFO, "FIGHT", "Attacking " + fighter.id);
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	checkHealth();
	if (rivalMobster){
		retCode = playMacro(FIGHT_FOLDER, "32_AttackRivalMobster_start.iim", MACRO_INFO_LOGGING);
	}
	else {
		addMacroSetting("ID", fighter.id);
		retCode = playMacro(FIGHT_FOLDER, "30_Attack_Start", MACRO_INFO_LOGGING);
	}
	var statusObj = getStatusObject();
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
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				case CONSTANTS.OPPONENT.WON :
					if (!rivalMobster) {
						addFighter(fighter);
					}
					if (getVictimHealth() ==0){
						statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
						break;
					}
					var attackStatusObj = attackTillDeath(fighter, rivalMobster);
					checkIfLevelUp();
					if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.NOSTAMINA){
					   // no stamina
						statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
					}
					else {
						statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					}
					break;
				case CONSTANTS.OPPONENT.DEAD :
					logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					globalSettings.stolenIces++;
					break;
				case CONSTANTS.OPPONENT.LOST :
                    getVictimHealth();
					logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
					addStrongerOpponent(fighter);
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

function getVictimHealth(){
	var health = -1;
	retCode = playMacro(FIGHT_FOLDER, "40_Victim_Health", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS) {
		var healthMsg = getLastExtract(1, "Victim Health", "50%");
		if (!isNullOrBlank(healthMsg)) {
			healthMsg = healthMsg.replace("%", "");
			logV2(INFO, "ATTACK", "Victim Health: " + healthMsg);
            health = parseInt(healthMsg);
            if (health == 0){
                waitV2("1");
                checkIfIced();
            }
		}
		else {
            logV2(INFO, "ATTACK", "Problem extracting Victim Health (Empty))");
        }
	}
	return health;

}

function attackTillDeath(fighter, rivalMobster){
	logV2(INFO, "ATTACK", "Attack Figther " + fighter.id);
	var alive = true;
	var retCode = 0;
	var previousHealth = 1000;
	var nrOfAttacks = 0;
	var statusObj = getStatusObject();
	var firstAttack = true;
	var nrOfHeals = 0;
	var originalHealth = 0;
	do {
		var health = getVictimHealth();
		if (health > -1){
			if (firstAttack) {
				originalHealth = health;
			}
			if (previousHealth < health){
				logV2(INFO, "ATTACK", "Victim healed: " + fighter.id);
				nrOfHeals++;
				originalHealth = health;
				previousHealth = health;
			}
			if (health == 0){
				logV2(INFO, "ATTACK", "Victim is dead: " + fighter.id);
				alive = false;
				statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
				break;
			}
			else {
				var deltaHealth = 0;
				if (!firstAttack){
					deltaHealth = previousHealth-health;
					logV2(INFO, "ATTACK", "Victim Health changed: " + deltaHealth);
				}
				previousHealth = health;
				if (nrOfAttacks > 50 && health > 10){
					logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (nrOfHeals > 2){
					logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
					globalSettings.maxHealed++;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (!firstAttack && deltaHealth > 0 && deltaHealth < 2 && health > 20 && nrOfAttacks > 20){
					logV2(INFO, "ATTACK", "Victim has too much health. Skipping...");
					logV2(INFO, "ATTACK", "Orignal Health: " + originalHealth);
					logV2(INFO, "ATTACK", "Current Health: " + health);
					logV2(INFO, "ATTACK", "Nr of Attacks: " + nrOfAttacks);
					globalSettings.skippedHealth++;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else {
					checkHealth();
					var stamina = getStamina();
					if (stamina < 5){
						statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
						break;
					}
					var iced = false;
					if (rivalMobster){
						retCode = playMacro(FIGHT_FOLDER, "42_VictimRivalMobster_Attack.iim", MACRO_INFO_LOGGING);
					}
					else {
						addMacroSetting("ID", fighter.id);
						retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack", MACRO_INFO_LOGGING);
					}
					firstAttack = false;
					statusObj.totalStamina += 5;
					nrOfAttacks++;
					checkSaldo();
					// maybe todo: check status of fight. If Message starts with "It looks like"
					// Opponent was already dead and no stamina is spent
					// maybe also check if is iced by you
					health = getVictimHealth();
					if (health == 0){
						CONSTANTS.ATTACKSTATUS.OK;
						break;
					}
					
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
			return statusObj;
		}
		//alive = false;
	}
	while (alive);
	logV2(INFO, "ATTACK", "Attack Figther Finished.");
	logV2(INFO, "ATTACK", "Total Stamina used: " + statusObj.totalStamina);
	logV2(INFO, "ATTACK", "Total Attacks: " + nrOfAttacks);
	globalSettings.nrOfAttacks += nrOfAttacks;
	return statusObj;
}

function checkIfIced(){
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
	friendObj.fighters.push(fighter);
	writeObject(friendObj, MR_FRIENDS_FILE);
}

function addStrongerOpponent(fighter){
	fightersToExclude.fighters.push(fighter);
	writeObject(fightersToExclude, MR_FIGHTERS_EXCLUDE_FILE);
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

function checkStamina(){
	logV2(INFO, "BOSS", "Getting Stamina");
	var stamina = 0;
	stamina = getStamina();
}

function getStamina(){
	playMacro(FIGHT_FOLDER, "52_GetStamina.iim", MACRO_INFO_LOGGING);
	var staminaInfo = getLastExtract(1, "Stamina Left", "300/400");
	logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
	if (!isNullOrBlank(staminaInfo)){
		var tmp = staminaInfo.split("/");
		var stamina = parseInt(tmp[0]);
		return stamina;
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


function checkHealth(){
	logV2(INFO, "BOSS", "Checking Health");
	var health = 0;
	health = getHealth();
	while (health < 10){
		heal();
		health = getHealth();
		if (health > 10){
			globalSettings.heals++;
		}
	}
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

function getFighterObject(id, name, level){
	return {"id":id, "name":name, "level": level, "skip": false};
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
			window.console.log(fighter.id);
			// lookup strong opponents list
			if (!findFighter(fightersToExclude.fighters, fighter.id)){
				// lookup friends list
				if (!findFighter(friendObj.fighters, fighter.id)){
						if (fighter.level <= 450){
							filteredList.push(fighter);
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
	return filteredList;
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
	playMacro(FIGHT_FOLDER, "10_Heal.iim", MACRO_INFO_LOGGING);
	closePopup();
}

function closePopup(){
	playMacro(FIGHT_FOLDER, "02_Close_Popup.iim", MACRO_INFO_LOGGING);
}

function getHealth(){
	playMacro(FIGHT_FOLDER, "11_GetHealth.iim", MACRO_INFO_LOGGING);
	var healthInfo = getLastExtract(1, "Health", "50%");
	//var healthInfo = prompt("Health", "80/350");
	logV2(INFO, "BOSS", "healthInfo = " + healthInfo);
	if (!isNullOrBlank(healthInfo)){
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
