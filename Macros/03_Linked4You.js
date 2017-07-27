var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.3.js"));

var localConfigObject = null;
var NODE_ID = "";
LOG_FILE = new LogFile(LOG_DIR, "Linked4You");
init();
var	configObject = initObject(CONFIG_JSON_FILE);
var mwObject = initObject(MAFIAWARS_JSON_FILE);
var MACRO_FOLDER = "Linked4You";
var EPISODE = "NCIS";
var COMMON_FOLDER = "Common";
var FILENAME = OUTPUT_DIR + EPISODE + ".txt";

linked4You();

function linked4You(){
	var startPage = "http://linked4you.net/forumdisplay.php?fid=192";
	save(FILENAME, EPISODE + NEWLINE);
	
	iimSet("profile", startPage);
	simpleMacroPlayFolder("fbStart.iim", COMMON_FOLDER);
	logV2(DEBUG, "INIT", "Lookup episode: " + EPISODE);
	for (var i=1; i < 50; i++){
		var epObj = {fileName:"", url:""};
		iimSet("pos", i.toString());
		iimSet("episode", EPISODE);
		var retCode = simpleMacroPlayFolder("Linked4You_10_GetEpisode.iim", MACRO_FOLDER);
		logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
		epObj.fileName = getLastExtract(1);
		if (!isNullOrBlank(epObj.fileName)){
			epObj.url = getLastExtract(2);
			retCode = processEpisode(epObj);
		}
		else {
			break;
		}
	}	

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
			PROFILE_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting Profiles file to " + PROFILE_JSON_FILE.fullPath());
			MAFIAWARS_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting MafiaWars file to " + MAFIAWARS_JSON_FILE.fullPath());
			SCRIPT_ONEDRIVE_DIR.path = oneDrivePath + "\\";
			logV2(INFO, "INIT", "OneDrive Datasource Path = " + SCRIPT_ONEDRIVE_DIR.fullPath());
			CRAFTMANIA_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting CraftMania file to " + CRAFTMANIA_JSON_FILE.fullPath());
			GIFTS_FILE.path = CONFIG_ONEDRIVE_DIR;
			logV2(INFO, "INIT", "Settting Gifts file to " + GIFTS_FILE.fullPath());
		}
	}
	var value = getFirefoxSetting("eric.imacros.",  "nodeId");
	if (value != null){
		NODE_ID = value;
		logV2(INFO, "INIT", "Setting Node Id to " + NODE_ID);
		SCRIPT_ONEDRIVE_DIR.file = "datasources" + (NODE_ID == "" ? "" : "\\" + NODE_ID);
		//= SCRIPT_ONEDRIVE_DIR + NODE_ID + "\\";
		logV2(INFO, "INIT", "Setting OneDrive Datasource Dir to " + SCRIPT_ONEDRIVE_DIR.fullPath());
	}
	
	value = getFirefoxSetting("extensions.imacros.",  "defsavepath");
	if (value != null){
		BASE_DIR = value.replace("\\Macros", "\\");
		validateDirectory(BASE_DIR);
		LOG_DIR = BASE_DIR + "logs\\";
		//value = getFirefoxSetting("eric.imacros.",  "logpath");
		//if (value != null){
			//LOG_DIR = BASE_DIR + value + "\\";
			//createDirectory(LOG_DIR);
			LOG_FILE.path = LOG_DIR;
			logV2(INFO, "INIT", "Setting Log File to " + LOG_FILE.fullPath());
			ERROR_LOG.path = LOG_DIR;
		//}
		//else {
			//createDirectory(LOG_DIR);
		//}
		validateDirectory(LOG_DIR);
		DATASOURCE_DIR = BASE_DIR + "Datasources";
		value = getFirefoxSetting("eric.imacros.",  "datasourcepath");
		if (value != null){
			DATASOURCE_DIR = BASE_DIR + value + "\\";
			createDirectory(DATASOURCE_DIR);
			logV2(INFO, "INIT", "Setting DataSource Directory to " + DATASOURCE_DIR);
		}
		else {
			DATASOURCE_DIR = DATASOURCE_DIR + "\\";
			createDirectory(DATASOURCE_DIR);
		}
		//validateDirectory(DATASOURCE_DIR);
		SCRIPT_DIR = DATASOURCE_DIR;
		BACKUP_DIR = DATASOURCE_DIR + "\old";
		//validateDirectory(BACKUP_DIR);
		logV2(INFO, "INIT", "Setting Backup Directory to " + BACKUP_DIR);
		QUEUE_DIR = DATASOURCE_DIR + "Queues\\";
		//validateDirectory(QUEUE_DIR);
		QUEUE_STOP_PROCESS_FILE = DATASOURCE_DIR + "processQueues.disabled";
		logV2(INFO, "INIT", "Setting Queue Directory to " + QUEUE_DIR);
	}
}

function processEpisode (epObj){
	logV2(INFO, "EPISODE", "Episode Filename: " + epObj.fileName);
	logV2(INFO, "EPISODE", "Episode URL: " + epObj.url);
	iimSet("profile", epObj.url);
	var retCode = simpleMacroPlayFolder("fbStart.iim", COMMON_FOLDER);
	logV2(DEBUG, "EPISODE", "ReturnCode: " + retCode);
	
	if (retCode == 1){
		// check if already replied
		retCode = simpleMacroPlayFolder("Linked4You_20_CheckNotRepliedYet.iim", MACRO_FOLDER);
		logV2(INFO, "EPISODE", "Already Replied Status: " + retCode);
		if (retCode == 1){
			retCode = simpleMacroPlayFolder("Linked4You_21_NewReply", MACRO_FOLDER);
			makeScreenShot ("Linked4You.Unforgettable");
			save (FILENAME, epObj.fileName);
			save (FILENAME, epObj.url + NEWLINE);
		}
	}
	else {
		logV2(WARNING, "EPISODE", "Problem executing URL: " + epObj.url);
	}
	
	simpleMacroPlayFolder("closeTab.iim", COMMON_FOLDER);
	return retCode;
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


function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
}
