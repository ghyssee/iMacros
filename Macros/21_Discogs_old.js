var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Albums");
songInit();
var MACRO_FOLDER = "Discogs";
var ALBUM = "Album";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){
	
	var retCode = simpleMacroPlayFolder("Discogs_01_GetAlbum.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	var albumObject = getAlbumObject();
	albumObject.album = getLastExtract(1).trim();
    albumObject.albumArtist = getLastExtract(2).trim();
    albumObject.albumArtist = checkAlbumArtist(albumObject.albumArtist);
	albumObject.tracks = [];
	albumObject.total = 1;
	var pos = 0;
	var track = pos;
	var exit = false;
	do {
		pos++;
		/*
		var validTrack = checkTrack(pos);
		switch (validTrack){
			case 1:
				track++;
				exit = !processTrack(albumObject, pos, track);
				break;
			case 2: // bonus track line:
				break;
			default :
				exit = true;
				break;
		}*/
        track++;
        exit = !processTrack(albumObject, pos, track);
		logV2(DEBUG, "CAT", "Pos = " + pos);
	}
	while (!exit);
	writeObject(albumObject, FILENAME);
}

function checkAlbumArtist(albumArtist){
	if (isNullOrBlank(albumArtist) || albumArtist.toUpperCase() == "VARIOUS"){
		albumArtist = "Various Artists";
	}
	return albumArtist;
}


function selectArtist(){
	var artist = null;
	var msg = "Albumartist (Laat leeg indien verzamel CD of artist is ingevuld): ";
	var inputTxt = prompt(msg, "");
	if (inputTxt != null){
		if (inputTxt != ""){
			artist = inputTxt;
		}
	}
	return artist;
}


function processTrack(albumObject, track, realTrack){
	var pos = track.toString();
	var songObject = getSongObject();
	if (albumObject.ignoreTrack){
        songObject.track = pos.toString();
    }
    else {
        var trackObject = getTrackDiscogs(pos);
        if (trackObject == null){
        	return false;
		}
        songObject.track = trackObject.track;
        songObject.cd = trackObject.cd;
        albumObject.ignoreTrack = trackObject.ignore;
        albumObject.total = trackObject.cd;
    }
    	//alert(JSON.stringify(albumObject));
	songObject.artist = getArtistDiscogs(pos);
	if (isNullOrBlank(songObject.artist)){
		songObject.artist = albumObject.albumArtist;
	}
	songObject.title = getTitle(MACRO_FOLDER, realTrack.toString());
    if (isNullOrBlank(songObject.title)){
        return false;
    }
	songObject.extraArtists = getExtraArtist(pos);
	albumObject.tracks.push(songObject);
	return true;
}

function checkTrack(pos){
	iimSet("pos", pos.toString());
	var retCode = simpleMacroPlayFolder("Discogs_10_GetTrack.iim", MACRO_FOLDER);
	logV2(DEBUG, "POS", "Pos = " + pos);
	if (retCode == 1){
		track = iimGetLastExtract(1);
		if (track == null || track == ""){
			logV2(DEBUG, "MP3", "Skip Track (Bonus Track Notification)");
			return 2;
		}
		return 1;
	}
	return (-1);
}

function getTrackDiscogs(pos){
	var track = null;
	iimSet("pos", pos);
	var trackObject = {"track":null,"cd":null,"ignore":false};
	var retCode = simpleMacroPlayFolder("Discogs_10_GetTrack.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
        track = iimGetLastExtract(1);
        if (!isNullOrBlank(track)){
			if (track.indexOf("-") >= 0){
				var trackInfo = track.split("-");
				trackObject.track = trackInfo[1];
				trackObject.cd = trackInfo[0];
			}
			else {
				trackObject.track = track;
			}
		}
		else {
			trackObject = null;
		}
	}
	return trackObject;
}

function getArtistDiscogs(pos){
	var artist = null;
	iimSet("pos", pos);
	var retCode = simpleMacroPlayFolder("Discogs_11_GetArtist.iim", MACRO_FOLDER);
	logV2(DEBUG, "MP3", "ReturnCode: " + retCode);
	if (retCode == 1){
		artist = iimGetLastExtract(1);
		if (!isNullOrBlank(artist)){
			artist = artist.replace("–", "");
            artist = artist.replace(/\([0-9]{1,3}\)/g, "");
            artist = artist.replace(/\*$/, "");		}
	}
	return artist.trim();
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
			if (matches != null){
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
