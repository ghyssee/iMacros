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
var HYPHEN = "-";
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "BoOKSPOT";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){

	var albumObject = getAlbumObject();
	albumObject.tracks = [];
	albumObject.total = 0;
	
	getAlbumTitle(albumObject);
	getTrackLists(albumObject);
	logV2(INFO, CATEGORY, JSON.stringify(albumObject));

	writeObject(albumObject, FILENAME);
	alert(JSON.stringify(albumObject, null, 2));

}

function fillAlbumTitleArtist(albumObject, albumArtist){
	logHeader(INFO, CATEGORY, "Step: Fill Album Artist", "*");
	var items = albumArtist.split(HYPHEN);

	if (items.length == 2){
		albumObject.albumArtist = items[0].trim();
		albumObject.album = items[1].trim();
		if (albumObject.albumArtist == "Various Artists"){
			albumObject.compilation = true;
		}
	}
	else {
		albumObject.album = albumArtist;
		albumObject.albumArtist = "Various Artists";
		albumObject.compilation = true;
	}
	logV2(INFO, CATEGORY, "albumObject.albumArtist: " + albumObject.albumArtist);
	logV2(INFO, CATEGORY, "albumObject.album: " + albumObject.album);
	return albumObject;
}

function getTrackLists(albumObject){

	logHeader(INFO, CATEGORY, "Step: Get Track List Info", "*");
	
	var oSpan = null;
	oSpan = window.content.document.querySelectorAll("div[data-test-id*=tracklist]");
	// pdp-tracklist
	logV2(INFO, CATEGORY, "getTrackLists oSpan Length: " + oSpan.length);
	var cd = null;
	if (oSpan.length > 0){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML = oSpan[0].outerHTML;
		var oTrackLines = oDiv.querySelectorAll("li");
		// ex. track line: <li><div><span class="trackno">1</span></div><div class="trackcontent"><span class="description">Dit Is Wat Mijn Mama Zei</span><span class="artist">Metejoor</span></div></li>
		logV2(INFO, CATEGORY, "oTrackLines.length: " + oTrackLines.length);
		for (var i=0; i < oTrackLines.length; i++){
			var songObject = getTrackInfo(oTrackLines[i]);
			albumObject.tracks.push(songObject);
		}
	}
	else {
		alert("No Track info Found");
	}
}

function isTrack(tag){
	logV2(INFO, CATEGORY, "tag: " + tag.innerHTML);
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[data-test*=track-number");
	//logV2(INFO, CATEGORY, "isTrack oSpan Length: " + oSpan.length);
	return oSpan.length > 0;
}

function getTrackInfo(tag){
	var songObject = getSongObject();
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var track = getTrackNumber(tag);
	songObject.track = track;
	songObject.title = getMyTitle(tag);
	songObject.artist = getMyArtist(tag);
		logV2(INFO, CATEGORY, "Title: " + songObject.title);
		logV2(INFO, CATEGORY, "Artist: " + songObject.artist);
	return songObject;
}

function getTrackNumber(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[class*=trackno]");
	var trackNumber = null;
	for (var i=0; i < oSpan.length; i++){
		trackNumber = oSpan[i].innerText;
		trackNumber = trackNumber.replace(/\./,'');
		logV2(INFO, CATEGORY, "track number: " + trackNumber);
	}
	return trackNumber;
}

function getMyTitle(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[class*=description]");

	var title = null;
	for (var i=0; i < oSpan.length; i++){
		title = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "Title: " + title);
	}
	return title;
}

function getMyArtist(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[class*=artist]");
	var artist = null;
	for (var i=0; i < oSpan.length; i++){
		artist = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "artist: " + artist);
	}
	return artist;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("h1[class*=header-pdp]");
	// ex. <span class="u-mr--xs" data-test="title">Various Artists - Die Slow Van Toen 10 (CD)</span>
	var albumArtistTitle = '';
	logV2(INFO, CATEGORY, "albumArtistTitle oDiv Length: " + oDiv.length);
	for (var i=0; i < oDiv.length; i++){
		albumArtistTitle = oDiv[i].innerText;
		logV2(INFO, CATEGORY, albumArtistTitle);
		fillAlbumTitleArtist(albumObject, albumArtistTitle);
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
