var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Attack");
songInit();
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "ATTACK";
var MACRO_FOLDER = "MR/Attack";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 10000;
var FIRST_ATTACK = true;


var counter = 0;

//xxx(); // 194 - 23 = 171 




var retCode = init();
if (retCode == SUCCESS){
	if (getHealth() > 0){
		// you already have health when you started this fight
		// so, when you're dead, don't heal immediately
		FIRST_ATTACK = false;
	}
	startFight();
}
else {
	alert("Problem Initializing Attack Screen");
}



function getDefenderHealth(){
	var oSpan = window.content.document.querySelectorAll("span[id*=fight-defender-health-bar]");
	var health = 0;
	if (oSpan.length >= 1){
		var healthInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check health: " + healthInfo);
		var health = healthInfo.replace("%", "");
			health = Number(health);
			logV2(INFO, CATEGORY, "Defender Health: " + health);
	}
	return health;
}


function init(){
	logV2(INFO, CATEGORY, "Start Attack");
	var retCode = 0;
	var i=0;
	do {
		retCode = simpleMacroPlayFolder("10_Attack_Init", MACRO_FOLDER);
		logV2(INFO, CATEGORY, "Init Attack status: " + retCode);
		i++;
		if (retCode != SUCCESS && i < 20){
			waitV2("0.1");
		}
	}
	while (retCode != SUCCESS);
	return retCode;
}

function getHealth(){
	var oSpan = window.content.document.querySelectorAll("span[class*=health]");
	var health = 0;
	if (oSpan.length >= 1){
		var healthInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check health: " + healthInfo);
		var items = healthInfo.split("/");
		if (items.length == 2){
			health = items[0].replace(",", "");
			health = Number(health);
			logV2(INFO, CATEGORY, "Health: " + health);
		}
	}
	return health;
}


function startFight(){
	var health = 0;
	health = getHealth();
	var stamina = getStamina();
	var defenderHealth = 0;
	while (health > 0 && stamina > 0) {
		if (initAttack(defenderHealth)){
			defenderHealth = getDefenderHealth();
			if (defenderHealth > 8){
				if (checkPowerButton() == 1){
					attack();
					logV2(INFO, CATEGORY, "Attacking...");
					stamina = getStamina();
					health = getHealth();
					if (stamina > 5000 && health < 5){
						heal();
						health = getHealth();
					}
				}
				else {
					logV2(INFO, CATEGORY, "Power Attack button missing. Stop attacking...");
					health = 0;
				}
			}
			else {
				logV2(INFO, CATEGORY, "Defender Health too low...");
				health = 0;
			}
		}
		else {
			logV2(INFO, CATEGORY, "Problem with initializing attack");
			health = 0;
		}
	}
}

function initAttack(defenderHealth){
	if (defenderHealth == 0){
		logV2(INFO, CATEGORY, "Init Attack");
		var retCode = simpleMacroPlayFolder("11_Attack_SingleHit", MACRO_FOLDER);
		return (retCode == SUCCESS);
	}
	return SUCCESS;
}

function attack(){
	logV2(INFO, CATEGORY, "Init Attack");
	var retCode = simpleMacroPlayFolder("12_Attack", MACRO_FOLDER);
	return (retCode == SUCCESS);
}

function getCash(){
	var oSpan = window.content.document.querySelectorAll("span[class*=cash]");
	//var cash = 0;
	if (oSpan.length >= 1){
		var cashInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Cash: " + cashInfo);
	}
	return cashInfo;
}

function closePopup(){
    var retCode = simpleMacroPlayFolder("02_ClosePopup.iim", COMMON_FOLDER);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}

function heal(){
	waitV2("5");
	logV2(INFO, CATEGORY, "Healing");
	var retCode = simpleMacroPlayFolder("15_Heal", COMMON_FOLDER);
	closePopup();
}

function deposit(){
	logV2(INFO, CATEGORY, "Collect Shakedown");
	getCash();
	var retCode = simpleMacroPlayFolder("12_ShakeDown_Deposit.iim", MACRO_FOLDER);
}

function getStamina(){
	var oSpan = window.content.document.querySelectorAll("span[class*=stamina]");
	var stamina = 0;
	if (oSpan.length >= 1){
		var staminaInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check stamina: " + staminaInfo);
		var items = staminaInfo.split("/");
		if (items.length == 2){
			stamina = items[0].replace(",", "");
			stamina = Number(stamina);
			logV2(INFO, CATEGORY, "stamina: " + stamina);
		}
	}
	return stamina;
}


function checkPowerButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=amt\\=5]");
	logV2(INFO, CATEGORY, "checkPowerButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
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
