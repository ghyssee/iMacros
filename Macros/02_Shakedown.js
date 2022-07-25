var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "ShakeDown");
songInit();
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "SHAKEDOWN";
var MACRO_FOLDER = "MR/Shakedown";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 10000;
var FIRST_ATTACK = true;


var counter = 0;
var retCode = startShakeDown();
if (retCode == 1){
	if (getHealth() > 0){
		// you already have health when you started this shakedown
		// so, when you're dead, don't heal immediately
		FIRST_ATTACK = false;
	}
	getStamina();	
	var status = 0;
	do {
		status = evaluateShakedownStatus();
		deposit();
		waitV2("0.1");
	}
	while (status == 0);
}
else {
	alert("Shakedown not found!");
}


function startShakeDown(){
	logV2(INFO, CATEGORY, "Start Shakedown");
	var retCode = simpleMacroPlayFolder("10_ShakeDown_Start.iim", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Shakedown Start status: " + retCode);
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
	do {
		attack();
		health = getHealth();
		if (checkContinueButton() == 1){
			continueShakedown();
			health = 0;
		}
	}
	while (health > 0);
}

function attack(){
	logV2(INFO, CATEGORY, "Attack");
	var retCode = simpleMacroPlayFolder("11_ShakeDown_Attack", MACRO_FOLDER);
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

function getShakedownStatus(){
	var oSpan = window.content.document.querySelector("div[id*=shake-status]").querySelectorAll("h2");
	var status = null;
	if (oSpan.length >= 1){
		status = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Status: " + status);
	}
	return status;
}

function closePopup(){
    var retCode = simpleMacroPlayFolder("02_ClosePopup.iim", COMMON_FOLDER);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}

function healShakedown(){
	logV2(INFO, CATEGORY, "Healing");
	var retCode = simpleMacroPlayFolder("15_Shakedown_Heal", MACRO_FOLDER);
	closePopup();
}

function evaluateShakedownStatus(){
	var status = getShakedownStatus();
	var exitCode = 0;
	if (status != null){
		status = status.toUpperCase();
		if (status.startsWith("CHOOSE")){
			chooseBusiness();
			exitCode = 0;
		}
		else if (status.startsWith("NO DEAL")){
			// continue fighting
			logV2(INFO, CATEGORY, "NO DEAL");
			var stamina = getStamina();
			if (stamina > 10000){
				var health = getHealth();
				if (health > 0){
					startFight();
					exitCode = 0;
				}
				else {
					logV2(INFO, CATEGORY, "You're Dead!!!");
					if (FIRST_ATTACK){
						healShakedown();
						FIRST_ATTACK = false;
					}
					else {
						waitV2(60);
						healShakedown();
					}
					exitCode = 0;
				}
			}
			else { 
			 logV2(INFO, CATEGORY, "Not enough stamina");
			 alert("Not enough stamina");
			 exitCode = 1;
			}			
		}
		else if (status.startsWith("SUCCESSFUL")){
			logV2(INFO, CATEGORY, "SUCCESSFUL");
			exitCode = 1;
		}
		else if (status.startsWith("EVENT COMPLETE")){
			logV2(INFO, CATEGORY, "SUCCESSFUL");
			alert("Shakedown Event Completed");
			exitCode = 1;
		}
		else if (status.startsWith("THERE ARE COPS")){
			logV2(INFO, CATEGORY, "THERE ARE COPS");
			exitCode = 1;
		}
		else {
			logV2(INFO, CATEGORY, "UNKNOWN STATUS");
			exitCode = 1;
		}
	}
	else {
		logV2(INFO, CATEGORY, "shakedown status not found");
		exitCode = 1;
	}
	logV2(INFO, CATEGORY, "exitCode: " + exitCode);
	return exitCode;
}

function chooseBusiness(){
    logV2(INFO, "SHAKEDOWN", "Choose Business");
    var number = randomNumber(1, 3);
    logV2(INFO, "SHAKEDOWN", "Business choosen: " + number);
	iimSet("ID", number.toString());
    retCode = simpleMacroPlayFolder("13_Shakedown_Choose.iim", MACRO_FOLDER);
    if (retCode != SUCCESS){
        logV2(WARNING, "SHAKEDOWN", "Problem choosing business");
    }
    logV2(INFO, "SHAKEDOWN", "Choose Business - retCode: " + retCode);
    return retCode;
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

function checkContinueButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=killed]");
	logV2(INFO, CATEGORY, "checkContinueButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function continueShakedown(){
	logV2(INFO, CATEGORY, "Continue Shakedown");
	var retCode = simpleMacroPlayFolder("14_Shakedown_Continue", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Shakedown Continue status: " + retCode);
	return retCode;
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
