var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));

LOG_FILE = new LogFile(LOG_DIR, "SeekDestroy");
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var CATEGORY = "SEEKDESTROY";
var MACRO_FOLDER = "MR/Seek";
var COMMON_FOLDER = "MR/Common";
var MR_ID = "-1";
var MIN_STAMINA = 10000;
var FIRST_ATTACK = true;


var counter = 0;

var RESOURCE_TYPE = Object.freeze({
        "RIVALS": {"type": "Rival Mobsters Alive", "color": "f40", "id": "2"},
		"STREET_TUGS": {"type": "Street Thugs Alive", "color": "fc4", "id": "3"},
    }
);

test();

var job = test();

	var retCode = initSeekDestroy();
	
	if (retCode == SUCCESS){
		if (getHealth() > 0){
			// you already have health when you started this fight
			// so, when you're dead, don't heal immediately
			FIRST_ATTACK = false;
		}
		if (initAttack(job)){
			startFight();
		}
		else{
		logV2(INFO, CATEGORY, "Problem Initializing Attack...");
		}
	}


function test(){
	var oSpan = window.content.document.querySelectorAll("a[class*=qbit]");
	// stamina: <div class="qbit" style="background-position:-195px -30px;width:30px;height:30px;top:10px;left:15px;"></div>
	logV2(INFO, CATEGORY, "checkContinueButton: " + oSpan.length);
	var staminaJobs = [];
	for (var i=0; i < oSpan.length; i++){
		logV2(INFO, CATEGORY, oSpan[i].outerHTML);
		var dataId = checkTest(oSpan[i]);
		if (dataId != null){
			staminaJobs.push(dataId);
		}
	}
	//alert(staminaJobs.toString());
	selectJob(staminaJobs);
}

function checkTest(object){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=object.outerHTML;
	var dataId = object.getAttribute('data-id');
	logV2(INFO, CATEGORY, "data-id: " + dataId);
	var oRes = oDiv.querySelectorAll("div[class*=qbit]");
	var staminaJobs = [];
	var found = null;
	for (var i=0; i < oRes.length; i++){
		logV2(INFO, CATEGORY, oRes[i].outerHTML);
		var attr= oRes[i].getAttribute('style');
		logV2(INFO, CATEGORY, "attribute value: " + attr);
		var regExp = "^background-position:(.*)px (.*)px;width(.*)$";
		var matches = attr.match(regExp);
		logV2(INFO, CATEGORY, "matches.length: " + matches.length);
		if (matches != null && matches.length > 0){
			// background-position:-195px 0px;width:30px;height:30px;top:10px;left:15px;
			var x = matches[1];
			var y = matches[2];
			logV2(INFO, CATEGORY, "x: " + x);
			logV2(INFO, CATEGORY, "y: " + y);
			if (x == "-195" && y == "-30") {
				logV2(INFO, CATEGORY, "Stamina Candidate found");
				found = dataId;
			}
		}
	}
	return found;
}

function selectJob(aStaminaJobs){
	var job = null;
	var msg = "Select Stamina Job" + NEWLINE;
	msg += "=".repeat("20") + NEWLINE.repeat(2);
	for (var i=0; i < aStaminaJobs.length; i++){
		msg += aStaminaJobs[i] + NEWLINE;
	}	
	
	//do {
		job = prompt(msg, aStaminaJobs[0]);
	//}
	//while (job != null);
	logV2(INFO, CATEGORY, "Seek & Destroy Stamina job: " + job);
}

function initSeekDestroy(){
	logV2(INFO, CATEGORY, "Start Seek & Destroy");
	var retCode = simpleMacroPlayFolder("10_Seek_Start", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Seek & Destroy Start status: " + retCode);
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
	var exit = false;
	do {
		attack();
		health = getHealth();
		if (checkContinueButton() == 1){
			continueSeek();
		}
		if (checkAttackButton() == 0){
			logV2(INFO, CATEGORY, "Attack Button not found!");
			exit = true;
		}
		if (checkFinishedButton() == 1){
			alert("Task Finished!");
			exit = true;
		}
	}
	while (health > 0 && exit == false);
}

function initAttack(jobId){
	logV2(INFO, CATEGORY, "Start Attack");
	iimSet("ID", jobId);
	var retCode = simpleMacroPlayFolder("11_Seek_StartAttack", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Seek & Destroy Start Attack status: " + retCode);
	
	//<a href="#" class="ajax_request css_button white" data-params="controller=quest&amp;action=viewtask&amp;pos=1">Go Now</a>
	var ok = checkAttackScreen();
	if (!ok){
		// try 1 more time to click on go now button
		ok = clickGoNowButton();
	}
	return ok;
	
}

function clickGoNowButton(){
	logV2(INFO, CATEGORY, "Go Now");
	var retCode = simpleMacroPlayFolder("13_GoNow", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Seek & Destroy Go Now status: " + retCode);
	return (retCode == SUCCESS);
}


function goRivalAttack(id){
	logV2(INFO, CATEGORY, "Go To Rival Attack Screen");
	iimSet("id", id);
	var retCode = simpleMacroPlayFolder("11_Rivals_InitAttack", MACRO_FOLDER);
	return (retCode == SUCCESS);
}

function attack(){
	logV2(INFO, CATEGORY, "Attack");
	var retCode = simpleMacroPlayFolder("12_Seek_Attack", MACRO_FOLDER);
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
	var oSpan = window.content.document.querySelectorAll("a[data-params*=controller\\=quest\\&action\\=updatetask]");
	// <a href="#" class="ajax_request css_button white" data-params="controller=quest&amp;action=updatetask&amp;pos=1">Continue</a>
	logV2(INFO, CATEGORY, "checkContinueButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkFinishedButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-id*=quest-pop][class*=pop-close]");
	// <a href="#" class="ajax_request css_button white pop-close" data-id="quest-pop">Continue</a>
	logV2(INFO, CATEGORY, "checkFinishedButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkAttackScreen(){
	var oSpan = window.content.document.querySelectorAll("div[id*=quest-task]");
	logV2(INFO, CATEGORY, "checkAttackScreen: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function continueSeek(){
	logV2(INFO, CATEGORY, "Continue Seek & Destroy");
	var retCode = simpleMacroPlayFolder("14_Seek_Continue", MACRO_FOLDER);
	logV2(INFO, CATEGORY, "Seek & Destroy Continue status: " + retCode);
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
