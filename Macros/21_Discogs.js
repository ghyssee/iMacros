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

	var albumObject = getAlbumObject();
	var retCode = simpleMacroPlayFolder("Discogs_01_GetAlbum.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	var titleArtist = null;
	titleArtist = getLastExtract(1);
	if (!isNullOrBlank(titleArtist)){
		logV2(INFO, "DISCOGS", "titleArtist: " + titleArtist);
		getAlbumTitleArtist(albumObject, titleArtist);
	}
	else {
		albumObject.ignoreTrack = true;
		retCode = simpleMacroPlayFolder("Discogs_02_GetAlbumV2.iim", MACRO_FOLDER);
		albumObject.albumArtist = getLastExtract(1);
		albumObject.album = getLastExtract(2);
	}
	logV2(INFO, "DISCOGS", "albumObject.albumArtist: " + albumObject.albumArtist);
	logV2(INFO, "DISCOGS", "albumObject.album: " + albumObject.album);
	albumObject.tracks = [];
	albumObject.total = 1;
	var pos = 0;
	var track = pos;
	var exit = false;

	do {
		pos++;
        track++;
        exit = !processTrack(albumObject, pos);
		logV2(DEBUG, "CAT", "Pos = " + pos);
	}
	while (!exit);
	writeObject(albumObject, FILENAME);

}

function getAlbumTitleArtist(albumObject, albumArtist){
	var splitChar = String.fromCharCode(8211); // "–" special hypen char
	var items = albumArtist.split(splitChar);
	if (items.length == 2){
		logV2(INFO, "DISCOGS", "items[0]: " + items[0]);
		logV2(INFO, "DISCOGS", "items[1]: " + items[1]);
		albumObject.albumArtist = items[0].trim();
		albumObject.album = items[1].trim();
	}
	if (isNullOrBlank(albumArtist) || albumArtist.toUpperCase() == "VARIOUS"){
		albumArtist = "Various Artists";
	}
	return albumObject;
}

function processTrack(albumObject, track){
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
        albumObject.total = trackObject.cd;
    }
    	//alert(JSON.stringify(albumObject));
	songObject.artist = getArtistDiscogs(pos);
	if (isNullOrBlank(songObject.artist)){
		songObject.artist = albumObject.albumArtist;
	}
	songObject.title = getTitleDiscogs(pos, albumObject.ignoreTrack);
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
	logV2(DEBUG, "DISCOGS", "ReturnCode: " + retCode);
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


function getTitleDiscogs(pos, ignoreTrack){
	var title = null;
	iimSet("pos", pos);
	var macro = null;
	if (ignoreTrack){
		macro = "Discogs_16_GetTitleV2.iim";
	}
	else {
		macro = "Discogs_15_GetTitle.iim";
	}
	var retCode = simpleMacroPlayFolder(macro, MACRO_FOLDER);
	if (retCode == 1){
		title = iimGetLastExtract(1);
		if (!isNullOrBlank(title)){
			title = title.trim();
		}
	}
	return title;
}

function getArtistDiscogs(pos, ignoreTrack){
	var artist = null;
	iimSet("pos", pos);
	var macro = null;
	if (ignoreTrack){
		macro = "Discogs_11_GetArtist.iim";
	}
	else {
		macro = "Discogs_11_GetArtist.iim";
	}
	var retCode = simpleMacroPlayFolder(macro, MACRO_FOLDER);
	logV2(DEBUG, "DISCOGS", "ReturnCode: " + retCode);
	if (retCode == 1){
		artist = iimGetLastExtract(1);
		if (!isNullOrBlank(artist)){
			artist = clearArtistTag(artist);
		}
	}
	return artist;
}

function clearArtistTag(artist){
	artist = artist.replace("–", "");
	artist = artist.replace(/\([0-9]{1,3}\)/g, "");
	artist = artist.replace(/\*$/, "");
	artist = artist.trim();
	return artist;
}

function saveExtraArtist(extraArtists, extraOrtistObj, extraArtistsArray){
	if (extraOrtistObj != null && extraOrtistObj.type != null){
		logV2(INFO, "MP3", "Push previous type " + extraOrtistObj.type);
		var extraArtistName = "";
		var first = true;
		for (const element of extraArtistsArray) {
			logV2(INFO, "MP3", "element: " + element);
			if (!first){
				extraArtistName += ", ";				
			}
			else {
				first = false;
			}
			extraArtistName += clearArtistTag(element);
		}
		logV2(INFO, "MP3", "extraArtistName: " + extraArtistName);
		extraOrtistObj.extraArtist = extraArtistName;
		extraArtists.push(extraOrtistObj);
	}
}

function getExtraArtist(pos){
	iimSet("pos", pos);
	var extraArtists = [];
	var retCode = simpleMacroPlayFolder("Discogs_12_GetExtraArtist.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	if (retCode == 1){
		var extraArtistHTML = iimGetLastExtract(1);
		//alert(extraArtistHTML);
		logV2(INFO, "MP3", "extraArtistHTML: " + extraArtistHTML);
		if (!isNullOrBlank(extraArtistHTML)){
			var strippedExtraArtistHTML = extraArtistHTML;

			var oDiv = window.content.document.createElement('div');
			oDiv.innerHTML=strippedExtraArtistHTML;
			var oSpan = oDiv.getElementsByTagName("span");
			//alert(JSON.stringify(oSpan));
			//alert(oSpan.length);
			var object = null;
			var extraArtistsArray = [];
			for (var j=0; j < oSpan.length; j++){
				//alert(j + "/" + oSpan[j].innerText);
				var innerHTML = oSpan[j].innerHTML;
				if (innerHTML.includes("/artist/")){
					//object.extraArtist = object.extraArtist + "," + oSpan[j].innerText;
					//object.extraArtists.push(oSpan[j].innerText);
					extraArtistsArray.push(oSpan[j].innerText);
					logV2(INFO, "MP3 Extra Artist", oSpan[j].innerText);
				}
				else {
					saveExtraArtist(extraArtists, object, extraArtistsArray);
					object = getExtraArtistObject();
					extraArtistsArray = [];
					object.type = oSpan[j].innerText;
					logV2(INFO, "MP3 Type", oSpan[j].innerText);
					// a new type
				}
			}
			saveExtraArtist(extraArtists, object, extraArtistsArray);
			logV2(INFO, "MP3", JSON.stringify(object));
		}
		else {
			logV2(INFO, "MP3", "No Extra Artist Tag Found For Track " + track);
		}
	}
	logV2(INFO, "MP3", "extraArtists: " + JSON.stringify(extraArtists));
	return extraArtists;
}
function getExtraArtistOld(pos){
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
					//var artist = oHref[j].text;
					var artist = arrayType[1].trim();
					var object = getExtraArtistObject(type, clearArtistTag(artist));
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
