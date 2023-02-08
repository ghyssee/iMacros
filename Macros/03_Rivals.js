var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.3.js"));

LOG_FILE = new LogFile(LOG_DIR, "Rivals");
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "RIVALS";
var MACRO_FOLDER = "MR/Rivals";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 10000;
var FIRST_ATTACK = true;


var counter = 0;
var ORDER_UP = 1;
var ORDER_DOWN = 2;
var ORDER_TYPE = Object.freeze({
        "UP": 1,
		"DOWN": 2
    }
);

var FILENAME = getMRFile("rivals.json");
var rivalsObj = initObject(FILENAME);

var resource = selectRival(rivalsObj);

if (resource != null) {

	writeObject(rivalsObj, FILENAME);
	var retCode = initRivals(resource);
	if (retCode == SUCCESS){
		var rivalObj = getRivals(resource);
		if (isRivalAlive(resource, rivalObj)){
			if (getHealth() > 0){
				// you already have health when you started this fight
				// so, when you're dead, don't heal immediately
				FIRST_ATTACK = false;
			}
			if (initAttack(resource)){
				startFight(resource);
			}
			else{
				logV2(INFO, CATEGORY, "Problem Initializing rivals...");
			}
		}
		else {
			alert("Not enough rivals Alive");
		}
	}
	else {
		alert("Rivals not found!");
	}
}

function isRivalAlive(resource, rivalObj){
	var alive = false;
	if (resource.order == ORDER_TYPE.DOWN && rivalObj.counter > 7){
		// ex. Rival Mobsters Alive: 10 / 40
		alive = true;
	}
	else if (resource.order == ORDER_TYPE.UP && rivalObj.counter != rivalObj.total){
		// ex. Zombies Destroyed: 0 / 26
		alive = true;
	}
	logV2(INFO, CATEGORY, "isRivalAlive: " + alive);
	return alive;
}


function isValidId(id){
	var valid = false;
	Object.entries(rivalsObj.rivals).forEach(([key, value]) => {
		if (value.id == id){
			valid = true;
		}
	});	
	return valid;
}

function selectRival(rivalsObj){
	var rival = null;
	var msg = "Select Rival Type" + NEWLINE;
	msg += "=".repeat("20") + NEWLINE.repeat(2);
	
	Object.entries(rivalsObj.rivals).forEach(([key, value]) => {
		msg+= value.id + " = " + value.type  + NEWLINE.repeat(2);
	});	
	var defaultRivalId = (rivalsObj.lastSelectedRivalId == null ? rivalsObj.rivals.RIVALS.id : rivalsObj.lastSelectedRivalId);
	
	do {
		rival = prompt(msg, defaultRivalId);
	}
	while (!isValidId(rival) && rival != null);
	var resource = null;
	Object.entries(rivalsObj.rivals).forEach(([key, value]) => {
		if (value.id == rival){
			resource = value;
			rivalsObj.lastSelectedRivalId = rival;
		}
	});	
	
	return resource;
}

function playFight(macroName, resource){
	logV2(INFO, CATEGORY, "CONTROLLER: " + resource.controller);
	iimSet("CONTROLLER", resource.controller);
	return simpleMacroPlayFolder(macroName, MACRO_FOLDER);
}

function initRivals(resource){
	logV2(INFO, CATEGORY, "Start Rivals");
	var retCode = 0;
	var i=0;
	do {
		retCode = playFight("10_Rivals_Start.iim", resource);
		logV2(INFO, CATEGORY, "Rivals Start status: " + retCode);
		i++;
		if (retCode != SUCCESS && i < 20){
			waitV2("0.1");
		}
	}
	while (retCode != SUCCESS);
	return retCode;
}

function getRivalObject(){
	var rivals = {"counter": 0, "total": 0};
	return rivals;
}

function getRivals(resource){
	var results = []; 
	var rivals = getRivalObject();
	logV2(INFO, CATEGORY, "Entering getRivals");
	window.content.document.querySelectorAll("div, span").forEach(elem => {
		//logV2(INFO, CATEGORY, "div.span: " + elem.textContent);
		if (elem.textContent.startsWith(resource.type)) {
			var rivalsInfo = elem.innerText;
			logV2(INFO, CATEGORY, "rivalsInfo: " + rivalsInfo);
			//rivalsInfo = rivalsInfo.replace(/^Rival Mobsters Alive: ?([0-9]{1,2}) ?\/ ([0-9]{1,2})/g, "$1");
			//var search_term = new RegExp("^" + resource.type + ": ?([0-9]{1,2}) ?\/ ([0-9]{1,2})", "g");
			//rivalsInfo = rivalsInfo.replace(search_term, "$1");
			
			var regExp = "^" + resource.type + ": ?([0-9]{1,3}) ?/ ?([0-9]{1,3})$";
			logV2(INFO, CATEGORY, "regExp: " + regExp);
			var matches = rivalsInfo.match(regExp);
			if (matches != null && matches.length == 3){
				logV2(INFO, CATEGORY, "matches: " + JSON.stringify(matches));
				rivals.counter = matches[1];
				rivals.total = matches[2];
				logV2(INFO, CATEGORY, "rivals: " + JSON.stringify(rivals));
				
			}
			else {
				// no matches found, this should never happen
				logV2(INFO, CATEGORY, "no matches found, this should never happen");
			}
	
			
			
		    // ex. Rival Mobsters Alive: 35 / 40
			//rivals = Number(rivalsInfo);
			//logV2(INFO, CATEGORY, "Rivals: " + rivals);
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

function startFight(resource){
	var health = 0;
	health = getHealth();
	if (health == 0){
		heal();
	}
	var rivalObj = getRivalObject();
	// set rivalObj total alive > 0 because in first call, we don't know the total alive yet
	rivalObj.counter = 10;
	rivalObj.total = 100;
	do {
		attack(resource);
		health = getHealth();
		if (checkContinueButton() == 1){
			rivalObj = getRivals(resource);
			continueRivals(resource);
		}
		logV2(INFO, CATEGORY, "startFight: " + health + "/" + JSON.stringify(rivalObj));
	}
	while (health > 0 && getRivalsAlive(resource, rivalObj) > 0);
}


function getRivalsAlive(resource, rivalObj){
	var alive = 0;
	if (resource.order == ORDER_TYPE.DOWN){
		// ex. Rival Mobsters Alive: 10 / 40
		alive = rivalObj.counter;
	}
	else if (resource.order == ORDER_TYPE.UP){
		// ex. Zombies Destroyed: 0 / 26
		alive = rivalObj.total - rivalObj.counter;
	}
	logV2(INFO, CATEGORY, "getRivalsAlive: " + alive);
	return alive;
}


function initAttack(resource){
	logV2(INFO, CATEGORY, "Start Attack");
	var ok = false;
	var oSpan = window.content.document.querySelectorAll("div[class*=feed_row]");
	for (var i =0; i < oSpan.length; i++){
		logV2(INFO, CATEGORY, oSpan[i].outerHTML);
		if (isRival(oSpan[i], resource)){
			logV2(INFO, CATEGORY, "Rival Found. Extracting id...");
			var id = extractId(oSpan[i], resource);
			if (id != null){
				ok = goRivalAttack(resource, id);
			}
			else {
				logV2(INFO, CATEGORY, "No Id found for rivals!!!");
			}
			
		}	
	}
	return ok;
	
}

function goRivalAttack(resource, id){
	logV2(INFO, CATEGORY, "Go To Rival Attack Screen");
	logV2(INFO, CATEGORY, "Rival Id: " + id);
	iimSet("id", id);
	var retCode = playFight("11_Rivals_InitAttack", resource);
	return (retCode == SUCCESS);
}

function extractId(oElement, resource)
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
		var search_term = new RegExp("^controller=(.*)" + resource.controller + "&action=attackview.?" + "&id=(.*)", "g");
		var id = attr.replace(search_term, "$2");
		logV2(INFO, CATEGORY, "id: " + id);
		return id;
	}
	return null;
}

function isRival(oElement, resource){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=oElement.outerHTML;
	oRival = oDiv.querySelectorAll("span[style*=color]");
	//logV2(INFO, CATEGORY, "oRival.length: " + oRival.length);
	if (oRival.length > 0){
		var attr= oRival[0].getAttribute('style');
		// ex. color:#f40;
		var color = attr.replace(/^color: ?#(.*);/g, "$1").toLowerCase();
		logV2(INFO, CATEGORY, "color: " + color);

		if (color == resource.color){
			return true;
		}
	}
	return false;
}

function attack(resource){
	logV2(INFO, CATEGORY, "Attack");
	var retCode = playFight("12_Rivals_Attack", resource);
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

function continueRivals(resource){
	logV2(INFO, CATEGORY, "Continue Rivals");
	var retCode = playFight("13_Rivals_Continue", resource);
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
