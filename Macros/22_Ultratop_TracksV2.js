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
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "ULTRATOP";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){

	var albumObject = getAlbumObject();
	albumObject.tracks = [];
	albumObject.total = 0;
	
	getAlbumTitle(albumObject);

    getTracks(albumObject);
	writeObject(albumObject, FILENAME);
	alert(JSON.stringify(albumObject, null, 2));

}

function fillAlbumTitleArtist(albumObject, albumArtist){
	logHeader(INFO, CATEGORY, "Step: Fill Album Artist", "*");
	albumObject.compilation = isCompilation();
	if (albumObject.compilation){
		albumObject.albumArtist = "Various Artists";
		albumObject.album = albumArtist;
	}
	else {
		var items = albumArtist.split(HYPHEN);
		if (items.length == 2){
			albumObject.albumArtist = items[0].trim();
			albumObject.album = items[1].trim();
		}
		else {
			albumObject.album = albumArtist;
			albumObject.albumArtist = "Various Artists";
		}
	}
	logV2(INFO, CATEGORY, "albumObject.albumArtist: " + albumObject.albumArtist);
	logV2(INFO, CATEGORY, "albumObject.album: " + albumObject.album);
	return albumObject;
}

function isCompilation(){
	logHeader(INFO, CATEGORY, "Step: Check if Album is compilation", "*");
	var oDiv = window.content.document.querySelectorAll("div[class*=compilatie]");
	logV2(INFO, CATEGORY, "Compilation tag found: " + oDiv.length);
	if (oDiv.length > 0){
		return true;
	}
	return false;
}


function getTracks(albumObject){

	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	
	var oSpan = null;
	oSpan = window.content.document.querySelectorAll("div[class*=content]");
	for (var i=0; i < oSpan.length; i++){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=oSpan[i].outerHTML;
		var oName = oDiv.querySelectorAll("a[name*=tracks]");
		logV2(INFO, CATEGORY, "ELEMENTS with 'tracks' as name: " + oName.length);
		if (oName.length == 1) {
			processTracks(albumObject, oSpan[i]);
			// skip other 'tracks' tags
			break;
		}
	}
}

function processTracks(albumObject, oElement){
		logHeader(INFO, CATEGORY, "Step: Processing Tracks", "*");
		logV2(INFO, CATEGORY, oElement.outerHTML);
		var removeElement = removeMoreTracksNode(oElement);
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=removeElement.outerHTML;
		var oName = oDiv.querySelectorAll("div[style*=table-row]");
		for (var i=0; i < oName.length; i++){
			var songObject = getSongObject();
			logV2(INFO, CATEGORY, oName[i].innerText);
			fillSongInfo(albumObject, songObject, oName[i]);
		}
}

function removeMoreTracksNode(oElement){
		logHeader(INFO, CATEGORY, "Step: Remove MoreTracks Node", "*");
		var oDivTest = window.content.document.createElement('div');
		oDivTest.innerHTML=oElement.outerHTML;
		var elementToRemove = oDivTest.querySelectorAll("div[id=moretracks]");
		if (elementToRemove.length > 0){
			logV2(INFO, CATEGORY, "Moretracks found. Removing it");
			elementToRemove[0].parentNode.removeChild(elementToRemove[0]);
		}
		return oDivTest;
}


function addTrack(albumObject, songObject){
	albumObject.tracks.push(songObject);
	albumObject.currentTrack++;
}

function fillSongInfo(albumObject, songObject, oElement){
	
	logHeader(INFO, CATEGORY, "Step: Fill Song Info", "*");
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=oElement.outerHTML;
	logV2(INFO, CATEGORY, "fillSongInfo oElement.innerHTML: " + oDiv.innerHTML);
	oTrack = oDiv.querySelectorAll("div[style*=table-cell]");
	if (oTrack.length == 4){
		// 1 = track
		// 2 = Artist - Title
		// 3 = Audio
		// 4 = Length of track
		getTrackHTML(albumObject, songObject, oTrack[0]);
		getArtistTitleHTML(albumObject, songObject, oTrack[1]);	
		addTrack(albumObject, songObject);
	}
	// check if table cell contains cd number
	else {
		var myText = oDiv.innerText;
		logV2(INFO, CATEGORY, "Check for cd number: " + myText);
		//if (myText.toUpperCase().startsWith("CD ")){
		//	logV2(INFO, CATEGORY, "CD Tag Found");
		//	albumObject.total = extractCD(myText);
		//}
		var regex = new RegExp("(CD|LP) ");
		var cdTagFound = regex.test(myText);
		if (cdTagFound){
			logV2(INFO, CATEGORY, "CD Tag Found");
			albumObject.total = extractCD(myText);
		}
	}
}


function checkExtraArtist(albumObject, songObject, oDiv){
	logHeader(INFO, CATEGORY, "Step: Check for Extra Artist", "*");
	var oSpan = oDiv.getElementsByTagName("span");
	logV2(INFO, CATEGORY, "Extra Artist Span Elements: " + oSpan.length);
	if (oSpan.length > 0){
		var extraArtist = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "extraArtist: " + extraArtist);
		// remove ( )
		extraArtist = extraArtist.replace(/ ?\((.*)\)/g, "$1");
		logV2(INFO, CATEGORY, "extraArtist After Cleanup: " + extraArtist);
		songObject.artist = extraArtist;
	}
	else {
		songObject.artist = albumObject.albumArtist;
	}
}

function extractCD(tagInfo){
	logHeader(INFO, CATEGORY, "Step: extract CD from String", "*");
	tagInfo = tagInfo.toUpperCase();
	tagInfo = tagInfo.replace(/^(?:CD|LP) ([0-9]{1,2}):?/g, "$1");
	tagInfo = tagInfo.trim();
	logV2(INFO, CATEGORY, "Extracted CD: " + tagInfo);
	return tagInfo;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("div[class*=heading]");
	var albumArtistTitle = '';
	logV2(INFO, CATEGORY, "albumArtistTitle oDiv Length: " + oDiv.length);
	for (var i=0; i < oDiv.length; i++){
		albumArtistTitle = albumArtistTitle + (i > 0 ? " - " : "") + oDiv[i].innerText;
		logV2(INFO, CATEGORY, "Album Title: " + albumArtistTitle);
		fillAlbumTitleArtist(albumObject, albumArtistTitle);
	}
}

function getTrackHTML(albumObject, songObject, oDiv){
	logHeader(INFO, CATEGORY, "Step: Get Track Number", "*");
	var track = oDiv.innerText;
	logV2(INFO, CATEGORY, "track: " + track);
	songObject.track = track;
	if (albumObject.total > 0){
		songObject.cd = albumObject.total
	}
}

function getArtistTitleHTML(albumObject, songObject, oDiv){
	logHeader(INFO, CATEGORY, "Step: Get Artist/Title", "*");
	var artistTitle = oDiv.innerText;
	logV2(INFO, CATEGORY, "artistTitle: " + artistTitle);
	var items = artistTitle.split(HYPHEN);
	if (items.length == 2){
		songObject.artist = items[0].trim();
		songObject.title = items[1].trim();
	}
	else if (!albumObject.compilation){
		songObject.artist = albumObject.albumArtist;
		songObject.title = artistTitle;
	}
	else {
		// this should never occur / artist + title will not be filled in
		logV2(INFO, CATEGORY, "No Artist + Title found");
	}
	logV2(INFO, CATEGORY, "songObject: " + JSON.stringify(songObject));
}

function printElements(oElements){
	if (oElements.length == 0) {
		logV2(INFO, "ELEMENTS", "No Elements found!");
	}
	else {
		for (var i=0; i < oElements.length; i++){
			logV2(INFO, "ELEMENTS", "outerHTML:" + oElements[i].outerHTML);
			logV2(INFO, "ELEMENTS", "innerText: " + oElements[i].innerText);
		}
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
