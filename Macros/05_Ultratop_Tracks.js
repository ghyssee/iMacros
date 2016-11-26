var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\SongUtils-0.0.2.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Albums");
songInit();
var MACRO_FOLDER = "Ultratop";
var ALBUM = "Album";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");

processAlbum();

function processAlbum(){
	
	var retCode = simpleMacroPlayFolder("Ultratop_01_GetAlbum.iim", MACRO_FOLDER);
	var albumObject = getAlbumObject();
	albumObject.album = getLastExtract(1);
	albumObject.total = 1;
	
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

function processTrack(albumObject, track){
	var pos = track.toString();
	var songObject = getSongObject();
	songObject.track = getTrack(pos);
	if (isNullOrBlank(songObject.track)){
		return false;
	}
	var artistTitle = getArtist("Ultratop_11_GetArtist_2.iim", pos);
	//if (isNullOrBlank(artistTitle)){
	  // artistTitle = getArtist("Ultratop_11_GetArtist_2.iim", pos);
	//}
	var array = artistTitle.split(" - ");
	songObject.artist = array[0];
	songObject.title = array[1];
	songObject.extraArtists = [];
	songObject.cd = albumObject.total;
	albumObject.tracks.push(songObject);
	return true;
}

function getTrack(pos){
	var track = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Ultratop_10_GetTrack.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		track = iimGetLastExtract(1);
		logV2(DEBUG, "MP3", "track: " + track);
		if (!isNullOrBlank(track)){
			track = track.replace(".", "").trim();
		}
	}
	return track;
}

function getArtist(macro, pos){
	var artist = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder(macro, MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		artist = iimGetLastExtract(1);
		if (!isNullOrBlank(artist)){
			artist = artist.replace("–", "");
		}
	}
	return artist;
}

function getTitle(pos){
	var title = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Ultratop_15_GetTitle.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		title = iimGetLastExtract(1);
	}
	return title;
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
