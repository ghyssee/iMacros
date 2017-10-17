var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.2.js"));

var localConfigObject = null;
var NODE_ID = "";
LOG_FILE = new LogFile(LOG_DIR, "MRFight");

init();
//var	configObject = initObject(CONFIG_JSON_FILE);
//var mwObject = initObject(MAFIAWARS_JSON_FILE);

//fightBoss();
alert("test");

function fightBoss(){
	var retCode = initBossFight();
	if (retCode == 1){
		var exitLoop = true;
		do {
			//exitLoop = true;
			var health = getHealth();
			if (health > 1800){
				var st = attack();
				if (st == 1){
					exitLoop = false;
				}
				else if (st == -921){
					exitLoop = false;
					macroPlayFolder(mwObject.bossFight, "MWBossFight_90_Close.iim");
					retCode = initBossFight();
					if (retCode != 1){
						exitLoop = true;
					}
				}
				else {
					exitLoop = true;
				}
			}
			else {
				heal();
			}
		}
		while (!exitLoop);
	}
	else {
		logV2(INFO, "BOSS", "Problem Init BossFight");
	}
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
}


function initBossFight(){
	logV2(INFO, "BOSS", "Initializing Fight");
	var health = 0;
	do {
		heal();
		health = getHealth();
	}
	while (health < 1800);
	var retCode = macroPlayFolder(mwObject.bossFight, "MWBossFight_01_Init.iim");
	// TODO
	//retCode = prompt("Init Boss Fight", "1");

	return retCode;
}

function attack(){
	logV2(INFO, "BOSS", "Attacking...");
	var retCode = macroPlayFolder(mwObject.bossFight, "MWBossFight_30_Attack.iim");
	// TODO
	//retCode = prompt("Attack Status", "1");
	logV2(INFO, "TEST", "AttackStatus = " + retCode);
	return retCode;
}

function heal(){
	logV2(INFO, "TEST", "Healing...");
	macroPlayFolder(mwObject.bossFight, "MWBossFight_10_Heal.iim");
}

function getHealth(){
	macroPlayFolder(mwObject.bossFight, "MWBossFight_20_GetHealth.iim");
	var healthInfo = getLastExtract(1);
	// TODO
	//healthInfo = prompt("Health Info (example: 5850 / 9000", "");
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
