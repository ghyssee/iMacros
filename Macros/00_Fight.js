var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
LOG_FILE = new LogFile(LOG_DIR, "MRFight");

var CONSTANTS = Object.freeze({
    "UNKNOWN": 0,
    "FRIEND": 1,
    "WON" : 2,
	"LOST": 3
});

init();
//var	configObject = initObject(CONFIG_JSON_FILE);
//var mwObject = initObject(MAFIAWARS_JSON_FILE);
var FIGHT_FOLDER = "MR/Fight";

var txt="blabla&id='123456789'&blabla='test'";
var regExp = /id='(.*)'[&|$]/;
var matches = txt.match(regExp);
window.console.log("test");
for (var i = 0; i < matches.length; i++) {
    var str = matches[i];
    window.console.log(str);
}
window.console.log(MR_DIR);
var fightersToExclude = initObject(MR_FIGHTERS_EXCLUDE_FILE);
var friendObj = initObject(MR_FRIENDS_FILE);
var tmpFighter = [];
tmpFighter.push(getFighterObject("1", "dfsfds", 200));
tmpFighter.push(getFighterObject("10", "10qfddfsfds", 200));
tmpFighter.push(getFighterObject("11", "11fdfdfsfds", 200));
tmpFighter.push(getFighterObject("100", "11fdfdfsfds", 200));
tmpFighter.push(getFighterObject("200", "11fdfdfsfds", 200));

var filtered = filterFightList(tmpFighter);
filtered.forEach( function (arrayItem)
	{
		window.console.log("Filtered Id:" + arrayItem.id);
	});
	var tmp = evaluateAttackMessage("You Won The Fight");
	
	var tmp = '<a href="#" class="ajax_request" data-params="controller=profile&amp;action=view&amp;id=1700086423343089" style="outline: 1px solid blue;">tania</a>';
	var lst = getFightList();
lst.forEach( function (arrayItem)
	{
		window.console.log("Filtered name:" + arrayItem.name);
	});
	
	// attackTillDeath(getFighterObject("200", "11fdfdfsfds", 200));

function fightBoss(){
	
	var retCode = playMacro(FIGHT_FOLDER, "01_Start.iim");
	var exitLoop = true;
	do {
		//exitLoop = true;
		var fighters = getFightList();
		var filteredFightersList = filterFightList(fighters);
		var nrOfAttacks = 0;
		do {
			filteredFightersList.forEach( function (arrayItem)
			{
				var ret = attack(arrayItem);
				if (ret == -1){
					logV2(INFO, "FIGHT", "Problem With Fightlist. Refreshing...");
					nrOfAttacks = 0;
					return;
				}
				if (ret == 0){
					// do nothing, continue with next fighter
				}
				else if (ret == -2){
					logV2(INFO, "FIGHT", "Out Of Stamina. Waiting for 10 minutes");
					nrOfAttacks = 0;
					waitV2("600");
				}
				else if (ret >= 1){
					logV2(INFO, "FIGHT", "Nr Of Attacked Victims For This Fight List: " + nrOfAttacks);
					nrOfAttacks += ret;
				}
			});
		}
		while (nrOfAttacks > 0);
		waitV2("2");
	}
	while (!exitLoop);
}

function attack(fighter){
	logV2(INFO, "FIGHT", "Attacking " + figther.id);
	var retCode = playMacro(FIGHT_FOLDER, "30_Attack_Start");
	var nrOfAttacks = 0;
	if (retCode == SUCCESS){
		retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status");
		if (retCode == SUCCESS){
			var msg = getLastExtract(1);
			var status = evaluateAttackMessage(msg);
			switch (status){
				case CONSTANTS.FRIEND :
					addFriend(fighter);
					break;
				case CONSTANTS.WON :
					nrOfAttacks++;
					var status = attackTillDeath(fighter);
					if (status == -2){
					   // no stamina
					   return status;
					}
					break;
				case CONSTANTS.LOST :
					addStrongerOpponent(fighter);
					break;
				default :
					nrOfAttacks = -1;
			}
		}
		else {
			logV2(INFO, "FIGHT", "Problem getting status for Fighter: " + figther.id);
			nrOfAttacks = -1;
		}
	}
	else {
		logV2(INFO, "FIGHT", "Fighter Not Found: " + figther.id + " / Fight List Refreshed???" );
		nrOfAttacks = -1;
	}
	return nrOfAttacks;
}

function attackTillDeath(fighter){
	logV2(INFO, "ATTACK", "Attack Figther " + fighter.id);
	var alive = true;
	var retCode = 0;
	var oldHealth = 1000;
	do {
		retCode = playMacro(FIGHT_FOLDER, "40_Victim_Health");
		if (retCode == SUCCESS){
			var health = getLastExtract(1);
			if (isNullOrBlank(health)){
				return retCode;
			}
			health = health.replace("%", "");
			health = parseInt(health);
			if (oldHealth < health){
				logV2(INFO, "ATTACK", "Victim healed: " + fighter.id);
			}
			if (health == 0){
				logV2(INFO, "ATTACK", "Victim is dead: " + fighter.id);
				alive = false;
				return 1;
			}
			else {
				checkHealth();
				var stamina = getStamina();
				if (stamina < 5){
					return -2;
				}
				retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack");
				if (retCode != SUCCESS){
					return retCode;
				}
			}
		}
		alive = false;
	}
	while (alive);
	return retCode;
}

function addFriend(fighter){
	friendObj.fighters.push(fighter);
	writeObject(friendObj, MR_FRIENDS_FILE);
}

function addStrongerOpponent(fighter){
	fightersToExclude.fighters.push(fighter);
	writeObject(friendObj, MR_FIGHTERS_EXCLUDE_FILE);
}

function evaluateAttackMessage(msg){
	if (isNullOrBlank(msg)){
		return CONSTANTS.UNKNOWN;
	}
	msg= msg.toUpperCase();
	if (msg.startsWith("YOU LOST")){
		return CONSTANTS.LOST;
	}
	else if (msg.startsWith("YOU WON")){
		return CONSTANTS.WON;
	}
	else if (msg.startsWith("YOU CAN NOT ATTACK YOUR FRIEND")){
		return CONSTANTS.FRIEND;
	}
	else {
		return CONSTANTS.UNKNOWN;
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
	stamina = getHealth();
}

function getStamina(){
	playMacro(FIGHT_FOLDER, "52_GetStamina.iim");
	var staminaInfo = getLastExtract(1);
	logV2(INFO, "STAMINA", "stamina = " + staminaInfo);
	if (!isNullOrBlank(staminaInfo)){
		var tmp = staminaInfo.split("/");
		var stamina = parseInt(tmp[0]);
		return stamina;
	}
	return 0;
}


function checkHealth(){
	logV2(INFO, "BOSS", "Initializing Fight");
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
	playMacro(FIGHT_FOLDER, "60_FreeFighter.iim");
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
		bank();
	}
}

function bank(){
	logV2(INFO, "BANK", "Banking...");
	playMacro(FIGHT_FOLDER, "50_Bank.iim");
}

function getSaldo(){
	playMacro(FIGHT_FOLDER, "51_GetSaldo.iim");
	var saldoInfo = getLastExtract(1);
	logV2(INFO, "BANK", "saldoInfo = " + saldoInfo);
	if (!isNullOrBlank(saldoInfo)){
		var saldo = parseInt(saldoInfo);
		return saldo;
	}
	return 0;
}

function getFightList(){
	var list = [];
	var retCode = playMacro(FIGHT_FOLDER, "20_Extract_Start.iim");
	if (retCode == 1){
		for (var i=1; i<= 14; i++){
			addMacroSetting("pos", i.toString(), ENABLE_LOGGING);
			var retCode = playMacro(FIGHT_FOLDER, "21_Extract.iim");
			if (retCode == 1){
				var id = extractIdFromString(getLastExtract(1));
				var name = getLastExtract(2);
				var level = extractLevelFromString(getLastExtract(3));
				var object = getFighterObject(id, name, level);
				list.push(object);
			}
			else {
				// ignore this line on the fight list
			}
		}
	}
	else {
		throw new Error("Problem With Extract Start");
	}
	return list;
}

function getFighterObject(id, name, level){
	return {"id":id, "name":name, "level": level};
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
	alert("healing");
	playMacro(FIGHT_FOLDER, "10_Heal.iim");
}

function getHealth(){
	playMacro(FIGHT_FOLDER, "11_GetHealth.iim");
	var healthInfo = getLastExtract(1);
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
