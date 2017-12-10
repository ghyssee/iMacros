var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\SongUtils-0.0.2.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Albums");
songInit();
//var	configObject = initObject(CONFIG_JSON_FILE);
var MACRO_FOLDER = "Amazon";
var ALBUM = "Album";
var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");

processAlbum();

function processAlbum(){
	
	var albumObject = getAlbum();
	
	albumObject.tracks = [];
	var track = 0;
	var exitLoop = false;
	var oldTrack = 1;
	do {
		track++;
		exitLoop = !processTrack(albumObject, track);
		if (!exitLoop){
			if (oldTrack > parseInt(albumObject.tracks[track-1].track)){
				logV2(DEBUG, "INIT", "Increase Number of CD's");
				albumObject.total++;
				albumObject.tracks[track-1].cd = albumObject.total;
			}
			oldTrack = parseInt(albumObject.tracks[track-1].track);
		}
	}
	while (exitLoop == false);
	writeObject(albumObject, FILENAME);
}

function getAlbum(){
	var albumObject = {"album":null,"tracks":null,"total":1};
	if (!getAlbumName("Amazon_01_GetAlbum.iim", albumObject)){
		getAlbumName("Amazon_02_GetAlbum.iim", albumObject);
	}
	alert(albumObject.album);
	return albumObject;
}

function getAlbumName(macroName, albumObject){
	var retCode = simpleMacroPlayFolder(macroName, MACRO_FOLDER);
	albumObject.album = getLastExtract(1);
	var ok = false;
	if (!isNullOrBlank(albumObject.album)){
		albumObject.album = albumObject.album.trim();
		ok =true;
	}
	else {
		albumObject.album = null;
	}
	return ok;
}

function processTrack(albumObject, track){
	var pos = track.toString();
	var pos2 = (track*2).toString();
	var songObject = getSongObject();
	songObject.track = getTrack(pos);
	logV2(DEBUG, "INIT", "songObject.track: " + songObject.track);
	if (isNullOrBlank(songObject.track)){
		return false;
	}
	songObject.title = getTitle(pos2);
	songObject.artist = getArtist(pos2);
	songObject.extraArtists = [];
	songObject.cd = albumObject.total;
	albumObject.tracks.push(songObject);
	return true;
}

function getTrack(pos){
	var track = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Amazon_10_GetTrack.iim", MACRO_FOLDER);
	if (retCode == 1){
		track = iimGetLastExtract(1);
		logV2(DEBUG, "MP3", "track: " + track);
		if (!isNullOrBlank(track)){
			track = track.replace(".", "").trim();
		}
	}
	return track;
}

function getArtist(pos){
	var artist = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Amazon_11_GetArtist.iim", MACRO_FOLDER);
	if (retCode == 1){
		artist = iimGetLastExtract(1);
	}
	return artist;
}

function getTitle(pos){
	var title = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Amazon_15_GetTitle.iim", MACRO_FOLDER);
	if (retCode == 1){
		title = iimGetLastExtract(1);
		if (isNullOrBlank(title)){
            iimSet("pos", pos);
			retCode = simpleMacroPlayFolder("Amazon_16_GetTitle.iim", MACRO_FOLDER);
			title = iimGetLastExtract(2);
		}
	}
	return title;
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + (NODE_ID == "" ? "" : "." + NODE_ID) + "." + getDateYYYYMMDD() + ".txt"};
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
