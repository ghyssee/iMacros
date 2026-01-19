/** SongUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
function songInit(){
		
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
			SCRIPT_ONEDRIVE_DIR.path = oneDrivePath + "\\";
			logV2(INFO, "INIT", "OneDrive Datasource Path = " + SCRIPT_ONEDRIVE_DIR.fullPath());
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
		LOG_FILE.path = LOG_DIR;
		logV2(INFO, "INIT", "Setting Log File to " + LOG_FILE.fullPath());
		ERROR_LOG.path = LOG_DIR;
		validateDirectory(LOG_DIR);
	}
}

function setupEnvrionment(oneDrivePath){
	pathObject = initObject(oneDrivePath + "\\config\\Setup.json");
	pathObject.computerName = getComputerName();
}

function getComputerName(){
	var dnsComp = Components.classes["@mozilla.org/network/dns-service;1"]; 
	var dnsSvc = dnsComp.getService(Components.interfaces.nsIDNSService);
	var compName = dnsSvc.myHostName;
	return compName;
}

function getPath(pathId){
	var path = "";
	var parent = null;
	if (pathObject[pathId] != null){
		tmpObject = pathObject[pathId];
		do {
			path = tmpObject.path + "\\" + path;
			parent = tmpObject.parent;
			if (parent != null) {
				tmpObject = pathObject[parent];
				if (tmpObject == null){
					throw new Error("Parent Not Found: " + parent);
				}
			}
		}
		while (parent != null);
	}
	else {
		var errorMsg = "PathId does not exist: " + pathId;
		alert(errorMsg);
		logV2(ERROR, "ERROR", errorMsg);
		throw new Error(errorMsg);
	}
	if (path != null){
		path = path.replace(/\//g, "\\");
		path = path.replace("%ONEDRIVE%", ONEDRIVEPATH);
		path = path.replace("%HOST%", getComputerName());
	}
	return path;
}

function validateDirectory(directoryName){
	if (!fileExists(directoryName)){
		var errorMsg = "Directory does not exist: " + directoryName;
		alert(errorMsg);
		logV2(ERROR, "ERROR", errorMsg);
		throw new Error(errorMsg);
	}
}

function getSongObject(){
	var song = {"track":null, "artist":null, "title":null, "cd":null};
	return song;
}

function getAlbumObject(){
		var albumObject = {"album":null,"tracks":null,"albumArtist":null,"filename":null,"total":0,"ignoreTrack":false,"compilation":false, "currentTrack": 0};
		return albumObject;
}

function getAlbumArtist(folder){
var albumArtist = null;
	var retCode = simpleMacroPlayFolder(folder + "_02_GetAlbumArtist.iim", folder);
	albumArtist = iimGetLastExtract(1);
	return albumArtist;
}

function getTrack(folder, pos){
	var track = null;
	iimSet("pos", pos);
	var trackObject = {"track":null,"cd":null};
	var retCode = simpleMacroPlayFolder(folder + "_10_GetTrack.iim", folder);
	track = iimGetLastExtract(1);
	trackObject.track = track;
	return trackObject;
}

function getTitle(folder, pos){
	var title = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder(folder + "_15_GetTitle.iim", folder);
	if (retCode == 1){
		title = iimGetLastExtract(1);
        if (!isNullOrBlank(title)){
        	title = title.trim();
        }
	}
	return title;
}

function getArtist(folder, pos){
	var artist = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder(folder + "_11_GetArtist.iim", folder);
	if (retCode == 1){
		artist = iimGetLastExtract(1);
		if (!isNullOrBlank(artist)){
			artist = artist.trim();
		}
	}
	return artist;
}
