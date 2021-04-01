var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.2.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight-0.0.6.js"));
eval(readScript(MACROS_PATH + "\\js\\underscore-min.js"));

// 182-11 = 171
var localConfigObject = null;
setMRPath("MRFight");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;
var watchFile = new LogFile(LOG_DIR, "Watch");

init();

//var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var fighterArrayObj = {};
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var settingsObj = initObject(getMRRootFile(MR.MR_SETTINGS_FILE));
var profileObj = initObject(MR_PROFILE_FILE);

var globalSettings = {"profile": getProfileObject((getProfile()))};
//createFightersIndexedArray();
//var txt="<div class=\"feed_row\" style=\"outline: 1px solid blue;\"><div><a href=\"/game/gang/5963946\" class=\"tag\">≋𝐒𝐓≋</a> <a href=\"/game/player/1143458102342837\" class=\"pro\">the Alien💫</a> Level 11,464</div><div style=\"text-align:right;\"><a href=\"#\" class=\"ajax_request css_button red\" data-params=\"controller=fight&amp;action=attackview&amp;id=1143458102342837\"><span class=\"stamina ibtn\"></span>Attack</a></div></div>";
//var id = extractFighterId(txt);
//alert(id);
startScript();

function createFightersIndexedArray(){
    fighterObj.fighters.forEach( function (fighter)
        {
            fighterArrayObj[fighter.id] = fighter;
        });
}

function startScript(){
    try {
		startMafiaReloaded();        
		do  {
            configMRObj = initMRObject(MR.MR_CONFIG_FILE);
            startFightList();
            waitV2("30");
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            logV2(INFO, "CANCEL", ex.message);
            if (ex.name != USER_CANCEL){
                alert(ex.message);
            }
            // do nothing
        }
        else {
            logError(ex);
        }
    }
}


function goToFightPage(){
    var retCode = initAndCheckScript(FIGHT_FOLDER, "20_Extract_Start.iim", "23_Fight_Test.iim", "fight list", "INITFIGHT", "Init Fight List");
    return retCode;
}

function watchFighters(fighter){
	var fightersToWatch = [
	{"id": "1285983768080939", "name": "≡SЯБ≡ {|nWo|} Goran"},
	{"id": "2069963439901170", "name": "≡SЯБ≡{|nWo|} Lopatar jug"},
	{"id": "10154922098149196", "name": "нσηєувєє"},
	{"id": "10208024289142193", "name": "☿ReW☿ 𝔻✦𝔼 Old Guy 👴"},
	{"id": "102787323542590", "name": "☿ReW☿ 𝔻✦𝔼 Dog 👴"},
	{"id": "10206499839455202", "name": "☿ReW☿ 𝔻✦𝔼 Bird 👴"},
	{"id": "127513661225330", "name": "☿ReW☿ 𝔻✦𝔼 Slow Dog 👴"},
	{"id": "100258397454180", "name": "☿ReW☿ 𝔻✦𝔼 Slow Dog 👴"},
	{"id": "10209325616642705", "name": "ᵀᴴᴱFarm💀Truckᴮᴮ [GS]ᴸᵡᴹ"},
	{"id": "10206929454619792", "name": "lιттle devιl"},
	{"id": "10212700280927276", "name": "ӍЄѦИ ԀЄИҬіՏҬ"},
    {"id": "10209527806418129", "name": "Hookedagain4sureGM💜🦋💜"},
	{"id": "10208272951484897", "name": "𝕋ℍ𝔼 𝕆𝕝𝕕 𝔽𝕒𝕣𝕥"}
	];
	for (var j=0; j < fightersToWatch.length; j++){
		if (fightersToWatch[j].id == fighter.id){
			logV2(INFO, "FIGHTLIST", fighter.id + " " + fighter.name, watchFile);
			logV2(INFO, "FIGHTLIST", fighter.gangId + " " + fighter.gangName, watchFile);
			logV2(INFO, "FIGHTLIST", "==================================================", watchFile);
			break;
		}
	}
}

function startFightList(){
    var retCode = goToFightPage();
    if (retCode == SUCCESS) {
        var fightListObj = {"list": null, "lastDate": null};
//        var fileObj = initMRObject(MR.MR_FIGHTLIST_FILE);
        fightListObj.lastDate = getDateYYYYMMDDHHMISS();
        fightListObj.list = getFightList();
		logV2(INFO, "FIGHTLIST", "Checking " + formatDateYYYYMMDDHHMISS(), watchFile);
		for (var i=0; i < fightListObj.list.length; i++){
			watchFighters(fightListObj.list[i]);
			// logV2(INFO, "FIGHTLIST", fightListObj.list[i].id + " " + fightListObj.list[i].name);
			// logV2(INFO, "FIGHTLIST", fightListObj.list[i].gangId + " " + fightListObj.list[i].gangName);
		}
		// logV2(INFO, "FIGHTLIST", "==================================================");
		
//        writeObject(fightListObj, fileObj);
    }
    else {
        logV2(WARNING, "FIGHTLIST", "Problem going to fightpage");
    }
}


function getFightList(){
    logV2(INFO, "FIGHTLIST", "Getting Fight List Info");
    var list = [];
    for (var i=1; i<= configMRObj.fight.listLength; i++){
        addMacroSetting("pos", i.toString(), ENABLE_LOGGING);
        var retCode = playMacro(FIGHT_FOLDER, "21_ExtractV2.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS){
            var txt = getLastExtract(1, "Fight Line", "Fight Line");
            var id = extractFighterId(txt);
            if (id == null){
                // if setting rival mobster is disabled, than fighterId is empty and line must be skipped
                continue;
            }
            var name = extractFighterName(txt).substring(0,100);
            var level = extractLevelFromString(txt);
            var object = getFighterObject(id, name, level);
            // MOD 15/11
            var gangObj = extractGangInformation(txt);
            object.gangId = gangObj.id;
            object.gangName = gangObj.name;
            object.lastChecked = formatDateToYYYYMMDDHHMISS();
            /*
            if (isAllyGang(friendObj.gangs, object.gangId)) {
                logV2(INFO, "FIGHT", "Prefiltered: Is Ally Gang");
                logObj(INFO, "FIGHT", object);
            }*/
            //else {
                list.push(object);
            //}
        }
        else {
            // ignore this line on the fight list
            logV2(INFO, "FIGHTLIST", "Last Line reached: " + i);
            break;
        }
    }
    return list;
}

function extractLevelFromString(text){
    text = removeComma(text);
    var regExp = "</a> Level (.*)<";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var level = matches[matches.length-1];
        level = parseInt(level);
        return level;
    }
    return text;
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


function goToFightPage(){
    var retCode = initAndCheckScript(FIGHT_FOLDER, "20_Extract_Start.iim", "23_Fight_Test.iim", "fight list", "INITFIGHT", "Init Fight List");
    return retCode;
}
