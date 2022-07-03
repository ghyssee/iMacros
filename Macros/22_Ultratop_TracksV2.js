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
//alert(clearArtistTag('Gordon Muir Wilson*, Hugh Jude Brankin*, John Robinson Reid, Ross Alexander Campbell*'));

function processAlbum(){

	var albumObject = getAlbumObject();
	albumObject.tracks = [];
	albumObject.total = 1;
	
	getAlbumTitle(albumObject);

    getTracks(albumObject);
	alert(JSON.stringify(albumObject, null, 2));
//	writeObject(albumObject, FILENAME);

}

function fillAlbumTitleArtist(albumObject, albumArtist){
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
	var oDiv = window.content.document.querySelectorAll("div[class*=compilatie]");
	logV2(INFO, CATEGORY, "Compilation tag found: " + oDiv.length);
	if (oDiv.length > 0){
		return true;
	}
	return false;
}

function checkForMoreTracks(){
	// sometimes there is more than 1 album shown on the screen
	// if that's the case, select the one with id moretracks
	var oDiv = window.content.document.querySelectorAll("div[id=moretracks]");
	for (var j=0; j < oDiv.length; j++){
		var outerHTML = oDiv[j].outerHTML;
		logV2(INFO, CATEGORY, "checkForMoreTracks outerHTML: " + outerHTML);
	}
	return oDiv;
}

function getTracks(albumObject){
	
	var oDiv = checkForMoreTracks();
	var oSpan = null;
	if (oDiv.length > 0){
		oNewDiv = window.content.document.createElement('div');
		oNewDiv.innerHTML=oDiv[0].outerHTML;
		oSpan = oNewDiv.querySelectorAll("div[style*=table-row]");
	}
	else {
		oSpan = window.content.document.querySelectorAll("div[style*=table-row]");
	}
	logV2(INFO, CATEGORY, "oSpan.length: " + oSpan.length);
	for (var j=0; j < oSpan.length; j++){
		var outerHTML = oSpan[j].outerHTML;
		logV2(INFO, CATEGORY, "outerHTML: " + outerHTML);
		checkItem(albumObject, outerHTML);
	}
}

function checkItem(albumObject, item){
	var songObject = getSongObject();
	item = "<table>" + item + "</table>";
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=item;
	logV2(INFO, CATEGORY, "oDiv: " + oDiv.innerHTML);
	var oElement = oDiv.querySelectorAll("div[style*=table-cell]");
	logV2(INFO, CATEGORY, "oElement.length: " + oElement.length);
	if (oElement.length == 4){
		// 1 = track
		// 2 = Artist - Title
		// 3 = Audio
		// 4 = Length of track
		getTrackHTML(albumObject, songObject, oElement[0]);
		getArtistTitleHTML(albumObject, songObject, oElement[1]);	
		albumObject.tracks.push(songObject);
	}
	// check if table cell contains cd number
	else {
		var myText = oDiv.innerText;
		logV2(INFO, CATEGORY, "Check for cd number: " + myText);
		if (myText.toUpperCase().startsWith("CD ")){
			logV2(INFO, CATEGORY, "CD Tag Found");
			albumObject.total = extractCD(myText);
		}
	}

}

function extractCD(tagInfo){
	tagInfo = tagInfo.toUpperCase();
	tagInfo = tagInfo.replace(/^CD ([0-9]{1,2}):?/g, "$1");
	tagInfo = tagInfo.trim();
	logV2(INFO, CATEGORY, "Extracted CD: " + tagInfo);
	return tagInfo;
}

function getAlbumTitle(albumObject){
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
	var track = oDiv.innerText;
	logV2(INFO, CATEGORY, "track: " + track);
	songObject.track = track;
	if (albumObject.total > 0){
		songObject.cd = albumObject.total
	}
}

function getArtistTitleHTML(albumObject, songObject, oDiv){
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
