var ONEDRIVEPATH = getOneDrivePath();
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyUtils-0.0.1.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyFileUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MyConstants-0.0.2.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\MacroUtils-0.0.3.js"));
eval(readScript(ONEDRIVEPATH + "\\iMacros\\js\\SongUtils-0.0.2.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Albums");
songInit();
var MACRO_FOLDER = "Discogs";
var ALBUM = "Album";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");

processAlbum();

function processAlbum(){
	
	var retCode = simpleMacroPlayFolder("Discogs_01_GetAlbum.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	var albumObject = getAlbumObject();
	albumObject.albumArtist = getLastExtract(1);
	albumObject.album = getLastExtract(2);
	albumObject.tracks = [];
	var track = 0;
	do {
		track++;
	}
	while (processTrack(albumObject, track));
	writeObject(albumObject, FILENAME);
}

function processTrack(albumObject, track){
	var pos = track.toString();
	var songObject = getSongObject();
	var trackObject = getTrack(pos);
	songObject.track = trackObject.track;
	if (isNullOrBlank(songObject.track)){
		return false;
	}
	songObject.cd = trackObject.cd;
	songObject.artist = getArtist(pos);
	songObject.title = getTitle(pos);
	songObject.extraArtists = getExtraArtist(pos);
	albumObject.tracks.push(songObject);
	return true;
}

function getTrack(pos){
	var track = null;
	iimSet("pos", pos);
	var trackObject = {"track":null,"cd":null};
	var retCode = simpleMacroPlayFolder("Discogs_10_GetTrack.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		track = iimGetLastExtract(1);
		if (!isNullOrBlank(track)){
			if (track.contains("-")){
				var trackInfo = track.split("-");
				trackObject.track = trackInfo[1];
				trackObject.cd = trackInfo[0];
			}
			else {
				trackObject.track = track;
			}
		}
		else {
			trackObject.track = track;
		}
	}
	return trackObject;
}

function getArtist(pos){
	var artist = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Discogs_11_GetArtist.iim", MACRO_FOLDER);
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
	var retCode = simpleMacroPlayFolder("Discogs_15_GetTitle.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		title = iimGetLastExtract(1);
	}
	return title;
}

function getExtraArtist(pos){
	iimSet("pos", pos);
	var extraArtists = [];
	var retCode = simpleMacroPlayFolder("Discogs_12_GetExtraArtist.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	if (retCode == 1){
		var extraArtistHTML = iimGetLastExtract(1);
		logV2(DEBUG, "MP3", "extraArtistHTML: " + extraArtistHTML);
		if (!isNullOrBlank(extraArtistHTML)){
			var regex = /<blockquote>(.*)<\/blockquote>/;
			var matches = extraArtistHTML.match(regex);
			if (!isNullOrBlank(matches)){
				logV2(DEBUG, "MP3", "Match " + matches[0]);
			var strippedExtraArtistHTML = matches[0];

				var oDiv = window.content.document.createElement('div');
				oDiv.innerHTML=strippedExtraArtistHTML;
				var oSpan = oDiv.getElementsByTagName("span");

				var oHref = oDiv.getElementsByTagName("a");

				for (var j=0; j < oSpan.length; j++){
					var type = oSpan[j].innerText;
					arrayType = type.split("–");
					if (arrayType != null && arrayType.length > 0){
						type = arrayType[0].trim();
					}
					
					var object = getExtraArtistObject(type, oHref[j].text);
					extraArtists.push(object);
				}
				
				for (var i=0; i < extraArtists.length; i++){
					logV2(DEBUG, "MP3", "Extra Artist Info: " + JSON.stringify(extraArtists[i]));

				}
			}
		}
		else {
			logV2(DEBUG, "MP3", "No Extra Artist Tag Found For Track " + track);
		}
	}
	return extraArtists;
}

function getExtraArtistObject(type, extraArtist){
	return {"type":type, "extraArtist":extraArtist};
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
