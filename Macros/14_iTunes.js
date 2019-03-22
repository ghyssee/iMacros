var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Albums");
songInit();
var MACRO_FOLDER = "iTunes";
var ALBUM = "Album";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");

processAlbum();

function processAlbum(){
	
	var retCode = simpleMacroPlayFolder(MACRO_FOLDER + "_01_GetAlbum.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	var albumObject = getAlbumObject();
	albumObject.album = getLastExtract(1).trim();
	albumObject.albumArtist = getAlbumArtist(MACRO_FOLDER).trim();
	albumObject.tracks = [];
	albumObject.total = 1;
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

function processTrack(albumObject, track){
	var pos = track.toString();
	var songObject = getSongObject();

	songObject.track = trackObject.track.trim();
	if (isNullOrBlank(songObject.track)){
		return false;
	}
	songObject.cd = null;
	songObject.artist = getArtist(MACRO_FOLDER, pos).trim();
	songObject.title = getTitle(MACRO_FOLDER, pos).trim();
	songObject.cd = albumObject.total;
	albumObject.tracks.push(songObject);
	return true;
}

function processTrack2(albumObject, track){
	var pos = track.toString();
	var songObject = getSongObject();
	var trackObject = getTrack(MACRO_FOLDER, pos);
	songObject.track = trackObject.track.trim();
	if (isNullOrBlank(songObject.track)){
		return false;
	}
	songObject.cd = trackObject.cd;
	songObject.artist = getArtist(MACRO_FOLDER, pos).trim();
	songObject.title = getTitle(MACRO_FOLDER, pos).trim();
	songObject.cd = albumObject.total;
	albumObject.tracks.push(songObject);
	return true;
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
