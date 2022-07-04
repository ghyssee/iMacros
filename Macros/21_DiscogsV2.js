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
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var MACRO_FOLDER = "Discogs";
var ALBUM = "Album";
var nrOfSkippedLines = 0;

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();
//alert(clearArtistTag('Gordon Muir Wilson*, Hugh Jude Brankin*, John Robinson Reid, Ross Alexander Campbell*'));

function processAlbum(){

	var albumObject = getAlbumObject();
	var retCode = simpleMacroPlayFolder("Discogs_01_GetAlbum.iim", MACRO_FOLDER);
	logV2(DEBUG, "INIT", "ReturnCode: " + retCode);
	albumObject.tracks = [];
	albumObject.total = 1;
	
	getAlbumTitle(albumObject);

    trackHTML = getTracks(albumObject);
	alert(JSON.stringify(albumObject, null, 2));
	writeObject(albumObject, FILENAME);

}

function fillAlbumTitleArtist(albumObject, albumArtist){
	var items = albumArtist.split(HYPHEN);
	if (items.length == 2){
		albumObject.albumArtist = items[0].trim();
		albumObject.album = items[1].trim();
	}
	if (isNullOrBlank(albumObject.albumArtist) || albumObject.albumArtist.toUpperCase() == "VARIOUS"){
		albumObject.albumArtist = "Various Artists";
		albumObject.compilation = true;
	}
	else {
		albumObject.compilation = false;
	}
	logV2(INFO, "DISCOGS", "albumObject.albumArtist: " + albumObject.albumArtist);
	logV2(INFO, "DISCOGS", "albumObject.album: " + albumObject.album);
	return albumObject;
}


function getTracks(albumObject){
	var oSpan = window.content.document.querySelectorAll("[data-track-position]");
	logV2(INFO, "DISCOGS", "oSpan.length: " + oSpan.length);
	for (var j=0; j < oSpan.length; j++){
		var outerHTML = oSpan[j].outerHTML;
		logV2(INFO, "DISCOGS", "outerHTML: " + outerHTML);
		checkItem(albumObject, outerHTML);
	}
}

function checkItem(albumObject, item){
	var songObject = getSongObject();
	item = "<table>" + item + "</table>";
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=item;
	logV2(INFO, "DISCOGS", "oDiv: " + oDiv.innerHTML);
	getTrackHTML(albumObject, songObject, oDiv);
	getArtistHTML(albumObject, songObject, oDiv);
	getTrackTitleHTML(songObject, oDiv);
	getExtraArtists(songObject, oDiv);
	if (albumObject.total < songObject.cd) {
		albumObject.total = songObject.cd;
	}
	
	albumObject.tracks.push(songObject);

}

function getAlbumTitle(albumObject){
			var oDiv = window.content.document.querySelectorAll("h1[class*=title]");
			var albumArtistTitle = '';
			logV2(INFO, "DISCOGS", "albumArtistTitle oDiv Length: " + oDiv.length);
			for (var i=0; i < oDiv.length; i++){
				albumArtistTitle = albumArtistTitle + (i > 0 ? " - " : "") + oDiv[i].innerText;
				logV2(INFO, "DISCOGS", "Album Title: " + albumArtistTitle);
				fillAlbumTitleArtist(albumObject, albumArtistTitle);
			}
}

function getTrackHTML(albumObject, songObject, oDiv){
	var oElement = oDiv.querySelectorAll("[class*=trackPos]");
	if (oElement.length > 0) {
		for (var i=0; i < oElement.length; i++){
			var track = oElement[i].innerText;
			logV2(INFO, "DISCOGS", "track: " + track);
			if (track.indexOf("-") >= 0){
				var trackInfo = track.split("-");
				songObject.track = trackInfo[1];
				songObject.cd = trackInfo[0];
			}
			else {
				songObject.track = track;
			}			
			albumObject.currentTrack++;
			// there should be only 1 trackPos Class
			break;
		}
	}
	else {
		albumObject.currentTrack++;
		var track = albumObject.currentTrack;
		songObject.track = track;
	}
}

function getArtistHTML(albumObject, songObject, oDiv){
	var oElement = oDiv.querySelectorAll("[class*=artist]");
	for (var i=0; i < oElement.length; i++){
		var artist = clearArtistTag(oElement[i].innerText);
		if(isNullOrBlank(artist) && !albumObject.compilation){
			artist = albumObject.albumArtist;
		}
		songObject.artist = artist;
		logV2(INFO, "DISCOGS", "artist: " + artist);
	}
}

function getExtraArtists(songObject, oDiv){
	var oElement = oDiv.querySelectorAll("div[class*=trackCredits]");
	logV2(INFO, "DISCOGS", "oElement.length: " + oElement.length);
	var extraArtists = [];
	for (var i=0; i < oElement.length; i++){
		var extraArtistInfo = oElement[i].innerHTML;
		logV2(INFO, "DISCOGS", "Extra artist Info: " + extraArtistInfo);
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=extraArtistInfo;
		var oSubDiv = oDiv.getElementsByTagName("div");
		logV2(INFO, "DISCOGS", "Extra Artist Types: " + oSubDiv.length);
		for (var i=0; i < oSubDiv.length; i++){
			var extraArtistLine = oSubDiv[i].innerText;
			logV2(INFO, "DISCOGS", "Extra Artist Type Info: " + extraArtistLine);
			var oExtraArtist = splitExtraArtist(extraArtistLine);
			if (oExtraArtist != null) {
				extraArtists.push(oExtraArtist);
			}
			else {
				logV2(INFO, "DISCOGS", "ignoring this line " + extraArtistLine);
			}
		}
	}
	songObject.extraArtists = extraArtists;
}

function splitExtraArtist(extraArtistLine){
	var extraArtistArray = extraArtistLine.split(" " + HYPHEN + " ");
	var oExtraArtist = null;
	if (extraArtistArray.length == 2){
		oExtraArtist = getExtraArtistObject();
		oExtraArtist.extraArtist = clearArtistTag(extraArtistArray[1]);
		oExtraArtist.type = extraArtistArray[0];
		logV2(INFO, "DISCOGS", JSON.stringify(oExtraArtist));
	}
	return oExtraArtist;
}

function getExtraArtistsOld(songObject, oDiv){
	var oElement = oDiv.querySelectorAll("div[class*=trackCredits]");
	logV2(INFO, "DISCOGS", "oElement.length: " + oElement.length);
	var extraArtists = [];
	for (var i=0; i < oElement.length; i++){
		var extraArtistInfo = oElement[i].innerText;
		logV2(INFO, "DISCOGS", "Extra artist Info: " + extraArtistInfo);
		var extraArtistArray = extraArtistInfo.split(" " + HYPHEN + " ");
		if (extraArtistArray.length == 2){
			var oExtraArtist = getExtraArtistObject();
			oExtraArtist.extraArtist = clearArtistTag(extraArtistArray[1]);
			oExtraArtist.type = extraArtistArray[0];
			logV2(INFO, "DISCOGS", JSON.stringify(oExtraArtist));
		}
		extraArtists.push(oExtraArtist);
	}
	songObject.extraArtists = extraArtists;
}

function getTrackTitleHTML(songObject, oDiv){
	var oElement = oDiv.querySelectorAll("span[class*=trackTitle]");
	for (var i=0; i < oElement.length; i++){
		var title = oElement[i].innerText;
		songObject.title = title;
		logV2(INFO, "DISCOGS", "title: " + title);
	}
}


function clearArtistTag(artist){
	artist = artist.replace("–", "");
	artist = artist.replace(/ ?\([0-9]{1,3}\)/g, "");
	artist = artist.replace(/\*$/, ""); // remove * at end of string
	artist = artist.replace(/\* /g, " "); // replace *<space> with <space>
	artist = artist.replace(/\*, ?/g, "; "); // replace *, with ,
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
	logV2(INFO, "INIT", "ReturnCode: " + retCode);
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
			logV2(INFO, "MP3", "extraArtists: " + JSON.stringify(extraArtists));
		}
		else {
			logV2(INFO, "MP3", "No Extra Artist Tag Found For Track " + pos);
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
