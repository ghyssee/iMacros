var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Rivals");
songInit();
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "RIVALS";
var MACRO_FOLDER = "MR/Rivals";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 10000;
var FIRST_ATTACK = true;


var counter = 0;


var retCode = initRivals();
if (retCode == SUCCESS){
	var rivals = getRivals();
	if (rivals > 10){
		if (getHealth() > 0){
			// you already have health when you started this fight
			// so, when you're dead, don't heal immediately
			FIRST_ATTACK = false;
		}
		if (initAttack()){
			startFight();
		}
		else{
			logV2(INFO, CATEGORY, "Problem Initializeing rivals...");
		}
	}
	else {
		alert("Not enough rivals Alive");
	}
}
else {
	alert("Rivals not found!");
}

function initRivals(){
	logV2(INFO, CATEGORY, "Start Rivals");
	var retCode = 0;
	var i=0;
	do {
		retCode = simpleMacroPlayFolder("10_Rivals_Start.iim", MACRO_FOLDER);
		logV2(INFO, CATEGORY, "Rivals Start status: " + retCode);
		i++;
		if (retCode != SUCCESS && i < 20){
			waitV2("0.1");
		}
	}
	while (retCode != SUCCESS);
	return retCode;
}

function getRivals(){
	var results = []; 
	var rivals = 0;
	window.content.document.querySelectorAll("div").forEach(elem => {
		if (elem.textContent.startsWith("Rival Mobsters Alive")) {
			var rivalsInfo = elem.innerText;
			logV2(INFO, CATEGORY, rivalsInfo);
			rivalsInfo = rivalsInfo.replace(/^Rival Mobsters Alive: ?([0-9]{1,2}) ?\/ ([0-9]{1,2})/g, "$1");
			// ex. Rival Mobsters Alive: 35 / 40
			rivals = Number(rivalsInfo);
			logV2(INFO, CATEGORY, "Rivals: " + rivals);
		}
	});
	return rivals;
}

function getRivals2(){
	var results = []; 
	var rivals = 0;
	window.content.document.querySelectorAll("span").forEach(elem => {
		if (elem.textContent.startsWith("Rival Mobsters Alive")) {
			var rivalsInfo = elem.innerText;
			logV2(INFO, CATEGORY, rivalsInfo);
			rivalsInfo = rivalsInfo.replace(/^Rival Mobsters Alive: ?([0-9]{1,2}) ?\/ ([0-9]{1,2})/g, "$1");
			// ex. Rival Mobsters Alive: 35 / 40
			rivals = Number(rivalsInfo);
			logV2(INFO, CATEGORY, "Rivals: " + rivals);
		}
	});
	return rivals;
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
	var rivals = 100;
	do {
		attack();
		health = getHealth();
		if (checkContinueButton() == 1){
			rivals = getRivals2();
			continueRivals();
		}
	}
	while (health > 0 && rivals > 0);
}

function initAttack(){
	logV2(INFO, CATEGORY, "Start Attack");
	var ok = false;
	var oSpan = window.content.document.querySelectorAll("div[class*=feed_row]");
	for (var i =0; i < oSpan.length; i++){
		logV2(INFO, CATEGORY, oSpan[i].outerHTML);
		if (isRival(oSpan[i])){
			logV2(INFO, CATEGORY, "Rival Found. Extracting id...");
			var id = extractId(oSpan[i]);
			if (id != null){
				ok = goRivalAttack(id);
				logV2(INFO, CATEGORY, "ok: " + ok);
			}
			else {
				logV2(INFO, CATEGORY, "No Id found for rivals!!!");
			}
			
		}	
	}
	return ok;
	
}

function goRivalAttack(id){
	logV2(INFO, CATEGORY, "Go To Rival Attack Screen");
	iimSet("id", id);
	var retCode = simpleMacroPlayFolder("11_Rivals_InitAttack", MACRO_FOLDER);
	return (retCode == SUCCESS);
}

function extractId(oElement)
{
	/* ex: 
	<div class="feed_row">
	<div>
		<span style="color:#f40;">Scarlett Death</span> Level 17,485 rival mobster</div>
	<div style="text-align:right;">
		<a href="#" class="ajax_request css_button red" data-params="controller=fight&amp;action=attackview2&amp;id=2613803">
			<span class="stamina ibtn"/>Attack</a>
	</div>
</div>
*/
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=oElement.outerHTML;
	oRival = oDiv.querySelectorAll("a[data-params*=controller]");
	if (oRival.length > 0){
		var attr= oRival[0].getAttribute('data-params');
		// ex. controller=fight&action=attackview2&id=2613803
		logV2(INFO, CATEGORY, "attr: " + attr);
		var id = attr.replace(/^controller=fight&action=attackview2&id=(.*)/g, "$1");
		logV2(INFO, CATEGORY, "id: " + id);
		return id;
	}
	return null;
}

function isRival(oElement){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=oElement.outerHTML;
	oRival = oDiv.querySelectorAll("span[style*=color]");
	//logV2(INFO, CATEGORY, "oRival.length: " + oRival.length);
	if (oRival.length > 0){
		var attr= oRival[0].getAttribute('style');
		// ex. color:#f40;
		var color = attr.replace(/^color: ?#(.*);/g, "$1").toLowerCase();
		logV2(INFO, CATEGORY, "color: " + color);
		if (color == "f40"){
			return true;
		}
	}
	return false;
}

function attack(){
	logV2(INFO, CATEGORY, "Attack");
	var retCode = simpleMacroPlayFolder("12_Rivals_Attack", MACRO_FOLDER);
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

function healShakedown(){
	logV2(INFO, CATEGORY, "Healing");
	var retCode = simpleMacroPlayFolder("15_Shakedown_Heal", MACRO_FOLDER);
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

function checkAttackButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=amt\\=5]");
	logV2(INFO, CATEGORY, "checkAttackButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkContinueButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=action\\=nextmob]");
	logV2(INFO, CATEGORY, "checkContinueButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function continueRivals(){
	logV2(INFO, CATEGORY, "Continue Rivals");
	var retCode = simpleMacroPlayFolder("13_Rivals_Continue", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Rivals Continue status: " + retCode);
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
