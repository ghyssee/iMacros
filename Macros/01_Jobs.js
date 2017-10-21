var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
var FRAME="0";
LOG_FILE = new LogFile(LOG_DIR, "MRFight");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

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
var FIGHT_FOLDER = "MR/Jobs";
var COMMON_FOLDER = "MR/Common";

var fightersToExclude = initObject(MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initObject(MR_FRIENDS_FILE);
var fighterObj = initObject(MR_FIGHTERS_FILE);
var globalSettings = {"iced": 0, "money": 0, "currentLevel": 0, "nrOfAttacks": 0};

	 try {
		doJobs();
	 }
	 catch (ex) {
		logV2(INFO, "SUMMARY", "Total Iced: " + globalSettings.iced);
		logV2(INFO, "SUMMARY", "Money Gained: " + globalSettings.money);
		logV2(INFO, "SUMMARY", "Nr Of Attacks: " + globalSettings.nrOfAttacks);
	}


function doJobs(){
	
	var retCode = playMacro(COMMON_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
	var exitLoop = false;
	var counter = 0;
	do {
		var fighters = getFightList();
		counter++;
		var refresh = false;
		var filteredFightersList = filterFightList(fighters);
		filteredFightersList.forEach( function (arrayItem)
		{
			if (!arrayItem.skip){
				logV2(INFO, "FIGHT", "Fighting Player " + arrayItem.id + " - " + arrayItem.name);
				var statusObj = attack(arrayItem);
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
		logV2(INFO, "FIGHT", "Out Of The Fightlist Loop");
	}
	while (!exitLoop && counter < 10000);
}

function waitTillEnoughStamina(){
	var stamina = 0;
	do {
		stamina = getStamina();
		ret = waitV2("600");
		window.console.log("Outside macroplay = " + ret);
	}
	while (stamina < 100);
}

function attack(fighter){
	logV2(INFO, "FIGHT", "Attacking " + fighter.id);
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
	checkHealth();
	addMacroSetting("ID", fighter.id);
	var retCode = playMacro(FIGHT_FOLDER, "30_Attack_Start", MACRO_INFO_LOGGING);
	var statusObj = getStatusObject();
	statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
	checkIfLevelUp();
	/* attackStatus = 0 => Move On. Go To next (died, killed, won, lost)
	   attackStatus = 2 => Out Of Stamina
	   attackStatus = -1 => Problem with one of the scripts
	*/
	if (retCode == SUCCESS){
		retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status", MACRO_INFO_LOGGING);
		if (retCode == SUCCESS){
			var msg = getLastExtract(1);
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
					addFighter(fighter);
					if (checkIfIced()){
						globalSettings.iced++;
						statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
						logV2(INFO, "FIGHT", "Total Ices: " + globalSettings.iced);
						break;
					}
					var attackStatusObj = attackTillDeath(fighter);
					checkIfLevelUp();
					globalSettings.iced += attackStatusObj.iced;
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
					break;
				case CONSTANTS.OPPONENT.LOST :
					if (checkIfIced()){
						globalSettings.iced++;
						logV2(INFO, "FIGHT", "Total Ices: " + globalSettings.iced);
					}
					logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
					addStrongerOpponent(fighter);
					fighter.skip = true;
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				default :
					statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
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

function attackTillDeath(fighter){
	logV2(INFO, "ATTACK", "Attack Figther " + fighter.id);
	var alive = true;
	var retCode = 0;
	var oldHealth = 1000;
	var nrOfAttacks = 0;
	var statusObj = getStatusObject();
	var firstAttack = true;
	var nrOfHeals = 0;
	do {
		retCode = playMacro(FIGHT_FOLDER, "40_Victim_Health", MACRO_INFO_LOGGING);
		if (retCode == SUCCESS){
			var health = getLastExtract(1);
			//var health = prompt("Victim Health", "50%");
			if (isNullOrBlank(health)){
				break;
			}
			health = health.replace("%", "");
			logV2(INFO, "ATTACK", "Victim Health: " + health);
			health = parseInt(health);
			if (oldHealth < health){
				logV2(INFO, "ATTACK", "Victim healed: " + fighter.id);
				nrOfHeals++;
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
					deltaHealth = oldHealth-health;
					logV2(INFO, "ATTACK", "Victim Health changed: " + deltaHealth);
				}
				oldHealth = health;
				if (nrOfAttacks > 50 && health > 10){
					logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (nrOfHeals > 4){
					logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
					statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
					break;
				}
				else if (!firstAttack && deltaHealth > 0 && deltaHealth < 2 && health > 20){
					logV2(INFO, "ATTACK", "Victim has too much health. Skipping...");
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
					addMacroSetting("ID", fighter.id);
					retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack", MACRO_INFO_LOGGING);
					checkSaldo();
					firstAttack = false;
					if (checkIfIced()){
						statusObj.iced = 1;
						CONSTANTS.ATTACKSTATUS.OK;
						break;
					}
					// maybe todo: check status of fight. If Message starts with "It looks like"
					// Opponent was already dead and no stamina is spent
					// maybe also check if is iced by you
					statusObj.totalStamina += 5;
					nrOfAttacks++;
					
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
		var msg = getLastExtract().toUpperCase();
		logV2(INFO, "FIGHT", "Check For Iced: " + msg);
		if (msg.indexOf("YOUR KILL COUNT") !== -1){
			iced = true;
		}
		else if (msg.indexOf("JUST KILLED") !== -1){
			iced = true;
		}
	}
	return iced;
}

function checkIfLevelUp(){
	var retCode = playMacro(COMMON_FOLDER, "12_GetLevel.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		var msg = getLastExtract().toUpperCase();
		msg = msg.replace("LEVEL ", "");
		var level = parseInt(msg);
		if (globalSettings.currentLevel == 0) {
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
	var staminaInfo = getLastExtract(1);
	//var staminaInfo = prompt("Stamina", "300/400");
	logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
	if (!isNullOrBlank(staminaInfo)){
		var tmp = staminaInfo.split("/");
		var stamina = parseInt(tmp[0]);
		return stamina;
	}
	return 0;
}


function checkHealth(){
	logV2(INFO, "BOSS", "Checking Health");
	var health = 0;
	health = getHealth();
	while (health < 10){
		heal();
		health = getHealth();
	}
}

function checkFreeFighters(){
	logV2(INFO, "FIGHT", "Get Free Fighers");
	var nr = getFreeFighters();
	if (nr > 10){
		//attackFreeFighter();
	}
}

function getFreeFighters(){
	playMacro(FIGHT_FOLDER, "60_FreeFighter.iim", MACRO_INFO_LOGGING);
	var info = getLastExtract(1);
	logV2(INFO, "FIGHT", "Free Fighters Info = " + info);
	if (!isNullOrBlank(info)){
		var tmp = healthInfo.split("/");
		var nr = parseInt(tmp[0]);
		return nr;
	}
	return 0;
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
	var saldoInfo = getLastExtract(1);
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
				var id = extractIdFromString(getLastExtract(1));
				var name = getLastExtract(2);
				var level = extractLevelFromString(getLastExtract(3));
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

function getStatusObject(l){
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
	var healthInfo = getLastExtract(1);
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
