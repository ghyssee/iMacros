var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Test");
songInit();
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "ULTRATOP";
var MACRO_FOLDER = "MR";
var MR_ID = "-1";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");



var counter = 0;


joinFightClub();
do {
	setMyId();
	waitV2("0.5");
}
while (MR_ID == "-1");

do {
	var myCounter = startFight();
	counter++;
}
while (counter < 100 && myCounter != -1 && counter != -1);


function joinFightClub(){
	logV2(INFO, CATEGORY, "Join Fight Club");
	var retCode = simpleMacroPlayFolder("11_Fightclub_Join.iim", MACRO_FOLDER);
}

function leaveFightClub(){
	logV2(INFO, CATEGORY, "Leave Fight Club");
	var retCode = simpleMacroPlayFolder("12_Fightclub_Leave", MACRO_FOLDER);
	collectFightClub();
}

function collectFightClub(){
	logV2(INFO, CATEGORY, "Collect Fight Club");
	var retCode = simpleMacroPlayFolder("13_Fightclub_Collect", MACRO_FOLDER);
}

function setMyId(){
	logV2(INFO, CATEGORY, "setMyId");
	var oSpan = null;
	// contain id fc-health but not class health_bar
	oSpan = window.content.document.querySelectorAll("span[id*=fc-health]:not([class*=health_bar])");
	for (var i=0; i < oSpan.length; i++){
		//logV2(INFO, CATEGORY, oSpan[i].innerText);
		//logV2(INFO, CATEGORY, oSpan[i].outerHTML);
		var health = oSpan[i].innerText;
		health = health.replace(/(.*)\%/g, "$1");
		var attr= oSpan[i].getAttribute('id');
		attr = attr.replace(/fc-health-(.*)/g, "$1");
		MR_ID = attr;
		logV2(INFO, CATEGORY, "MR_ID: " + MR_ID);
		break;
	}
}

function checkResultsButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=result]");
	logV2(INFO, CATEGORY, "checkResultsButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function checkLeaveButton(){
	var oSpan = window.content.document.querySelectorAll("a[data-params*=leave]");
	logV2(INFO, CATEGORY, "checkLeaveButton: " + oSpan.length);
	if (oSpan.length >= 1){
		return 1;
	}
	return 0;
}

function quitFightClub(){
	logV2(INFO, CATEGORY, "Fight Club Finished");
	waitV2("1");
	if (checkLeaveButton() == 1){
		leaveFightClub();
	}
	else if (checkResultsButton() == 1){
		collectFightClub();
	}
}

function getMyHealth(){
	logV2(INFO, CATEGORY, "getMyHealth");
	var oSpan = null;
	var health = 0;
	do {
		// checking for results button
		var results = checkResultsButton();
		if (results == 1){
			// results button available. No need for checking health anymore
			return 0;
		}
		// gettting my health
		oSpan = window.content.document.querySelectorAll("span[id=fc-health-" + MR_ID + "]");
		//logV2(INFO, CATEGORY,"getMyHealth oSpan.length: " + oSpan.length);

		for (var i=0; i < oSpan.length; i++){
			//logV2(INFO, CATEGORY, oSpan[i].innerText);
			//logV2(INFO, CATEGORY, oSpan[i].outerHTML);
			var health = oSpan[i].innerText;
			health = health.replace(/(.*)\%/g, "$1");
			var attr= oSpan[i].getAttribute('id');
			attr = attr.replace(/fc-health-(.*)/g, "$1");
			//logV2(INFO, CATEGORY, "My health: " + health);
			return health;
		}
		if (oSpan.length == 0){	
			logV2(INFO, CATEGORY, "Waiting...");
			waitV2(0.5);
			
		}
	}
	while (oSpan.length == 0);
	return health;
}

function getFighters(){
	var nr = 0;
	var oSpan = null;
	do {
		
		var results = checkResultsButton();
		if (results == 1){
			// results button available. No need for checking health anymore
			return null;
		}
		// check for Leave button
		
		// end check
		// contain id fc-health but not class health_bar
		oSpan = window.content.document.querySelectorAll("span[id*=fc-health]:not([class*=health_bar])");
		nr = oSpan.length;
		if (nr != 5){
			waitV2(0.1);
		}
	}
	while (nr != 5 && results == 0);
	return oSpan;
}

	
function startFight(){
	var oSpan = getFighters();
	if (oSpan == null){
		quitFightClub();
		//alert("No Fighters available. Fight Finished!");
		return -1;
	}
	var counter = 0;
	
	var nr = oSpan.length;
	var fighters = new Array();
	//for (var i=0; i < oSpan.length; i++){
	for (var i=nr-1; i >= 0; i--){
		var myHealth = getMyHealth();
		if (myHealth == 0){
			//alert("I'm dead");
			quitFightClub();
			return -1;
		}
		var fighterObj = {"id": null, "health": -1};
		//logV2(INFO, CATEGORY, oSpan[i].innerText);
		logV2(INFO, CATEGORY, oSpan[i].outerHTML);
		var health = oSpan[i].innerText;
		health = health.replace(/(.*)\%/g, "$1");
		var attr= oSpan[i].getAttribute('id');
		attr = attr.replace(/fc-health-(.*)/g, "$1");
		if (attr == MR_ID){
			//logV2(INFO, CATEGORY, "Skip MySelf");
			continue;
		}
		//logV2(INFO, CATEGORY, "health: " + health);
		//logV2(INFO, CATEGORY, "attr: " + attr);
		if (Number(health) > 0){
			//logV2(INFO, CATEGORY, "Is Not Dead yet");
			fighterObj.id = attr;
			fighterObj.health  = Number(health);
			counter++;
			fighters.push(fighterObj);
		}
	}
	logV2(INFO, CATEGORY, JSON.stringify(fighters));
	var attackObj = getFighterLowestHealth(fighters);
	logV2(INFO, CATEGORY, "Lowest Health Player: " + JSON.stringify(attackObj));
	if (attackObj != null && attackObj != null){
		var retCode = attack(attackObj.id);
		//if (retCode != 1){
	//		return -1;
	//	}
	//	simulateClick(attackObj.id);
	}
	else {
		logV2(INFO, CATEGORY, "There was a problem with attacking lowest health player");
		return counter;
	}
	return counter;
}

function simulateClick(id){
	oSpan = oSpan = window.content.document.querySelectorAll("a[id*=fc-atk-" + id + "]");
	logV2(INFO, CATEGORY, "Simulate: " + oSpan.length);
	if (oSpan.length == 1){
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
		waitV2("0.1");
		oSpan[0].click();
        //logV2(INFO, CATEGORY, "Clicking...");
	}
	else {
		logV2(INFO, CATEGORY, "Problem Clicking attack button for: " + id);
	}
}

function getFighterLowestHealth(fighterObj){
	var lowestHealth = 1000;
	var lowestHealthObj = null;
	for (var i=0; i < fighterObj.length; i++){
		var obj = fighterObj[i];
		if (obj.health < lowestHealth){
			lowestHealthObj = obj;
			lowestHealth = lowestHealthObj.health;
		}
	}
	return lowestHealthObj;
}

function attack(id){
	logV2(INFO, CATEGORY, "Attacking " + id);
	iimSet("id", id);
	var retCode = simpleMacroPlayFolder("10_Attack_Fightclub.iim", MACRO_FOLDER);
	if (retCode == -921){
		logV2(INFO, CATEGORY, "Player is probably already dead");
	}
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
