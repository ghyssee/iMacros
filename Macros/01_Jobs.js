var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.4.js"));

var localConfigObject = null;
var NODE_ID = "";
var SUCCESS = 1;
var FRAME="0";
LOG_FILE = new LogFile(LOG_DIR, "MRJobs");
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
var JOB_FOLDER = "MR/Jobs";
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
	
	var retCode = playMacro(JOB_FOLDER, "01_Start.iim", MACRO_INFO_LOGGING);
	if (retCode == SUCCESS){
		retCode = playMacro(JOB_FOLDER, "02_Job_District.iim", MACRO_INFO_LOGGING);
		if (retCode == SUCCESS){
			retCode = playMacro(JOB_FOLDER, "03_Job_Energy.iim", MACRO_INFO_LOGGING);
			// Get Energy + Experience
			if (retCode == SUCCESS){
				var energy = getLastExtract(1);
				var exp = getLastExtract(2);
				
			}
		}
	var exitLoop = false;
	var counter = 0;
	do {
		var retCode = playMacro(JOB_FOLDER, "01_Job_Init.iim", MACRO_INFO_LOGGING);
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

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
}

function getEnergy(){
	playMacro(JOB_FOLDER, "10_GetEnergy.iim", MACRO_INFO_LOGGING);
	var energyInfo = getLastExtract(1);
	//var staminaInfo = prompt("Stamina", "300/400");
	logV2(INFO, "ENERGY", "energy = " + energyInfo);
	if (!isNullOrBlank(energyInfo)){
		var tmp = energyInfo.split("/");
		var energy = parseInt(tmp[0]);
		return energy;
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

function getStatusObject(l){
	return {"status":null, 
	        "totalStamina":0,
			"iced": 0
		   };
}

function closePopup(){
	playMacro(FIGHT_FOLDER, "02_Close_Popup.iim", MACRO_INFO_LOGGING);
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
