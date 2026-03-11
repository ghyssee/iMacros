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
var CATEGORY = "Apple";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){

	var albumObject = getAlbumObject();
	albumObject.tracks = [];
	albumObject.total = 0;
	
	getAlbumTitle(albumObject);
	getAlbumArtist(albumObject);
	getTrackList(albumObject);
	logV2(INFO, CATEGORY, JSON.stringify(albumObject));

	writeObject(albumObject, FILENAME);
	alert(JSON.stringify(albumObject, null, 2));

}

function getTrackList(albumObject){

	logHeader(INFO, CATEGORY, "Step: Get Track List Info", "*");
	
	var oSpan = null;
	oSpan = window.content.document.querySelectorAll("div[class*=songs-list-row__song-container]");
	// Note: Spotify only shows first 30 tracks in Pale Moon. No fix for the moment
	logV2(INFO, CATEGORY, "getTrackLists oSpan Length: " + oSpan.length);
	alert(oSpan.length);
	var trackInfo = null;
	for (var i=0; i < oSpan.length; i++){
		trackInfo = oSpan[i].outerHTML;
		logV2(INFO, CATEGORY, "track Info: " + trackInfo);
		// <div class="songs-list-row__song-name-wrapper svelte-1mzgkuh" data-testid="song-name-wrapper"><a data-testid="click-action" class="click-action svelte-c0t0j2" href="https://music.apple.com/gb/song/take-on-me/1728696099"><div class="songs-list-row__song-name svelte-1mzgkuh" aria-label="Take On Me" tabindex="-1" role="checkbox" dir="auto" data-testid="track-title">Take On Me</div></a> <div class="songs-list-row__by-line svelte-1mzgkuh songs-list-row__by-line__mobile" data-testid="track-title-by-line" dir="auto"><span class="svelte-1mzgkuh"><a data-testid="click-action" class="click-action svelte-c0t0j2" href="https://music.apple.com/gb/artist/a-ha/166566">a-ha</a></span></div></div>
		var songobject = getTrackInfo(oSpan[i]);
		albumObject.tracks.push(songobject);
	}
}

function getTrackInfo(tag){
	var songObject = getSongObject();
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	songObject.track = getTrackNumber(tag);
	songObject.title = getMyTitle(tag);
	songObject.artist = getMyArtist(tag);
	return songObject;
}

function getTrackNumber(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("div[data-testid=track-number]");
	logV2(INFO, CATEGORY, "Tracknumber oSpan length: " + oSpan.length);
	var trackNumber = null;
	for (var i=0; i < oSpan.length; i++){
		trackNumber = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "track number: " + trackNumber);
	}
	return trackNumber;
}

function getMyTitle(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("div[data-testid=track-title]");
    logV2(INFO, CATEGORY, "Song Title oSpan length: " + oSpan.length);
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
	var oSpan = oDiv.querySelectorAll("div[data-testid=track-title-by-line]");
    logV2(INFO, CATEGORY, "Artist oSpan length: " + oSpan.length);
	var artist = null;
	for (var i=0; i < oSpan.length; i++){
		artist = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "Artist: " + artist);
	}
	return artist;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title", "*");
	var oDiv = window.content.document.querySelectorAll("h1[data-testid*=non-editable-product-title]");
	logV2(INFO, CATEGORY, "albumTitle oDiv Length: " + oDiv.length);
	if ( oDiv.length > 0) {
		albumObject.album = oDiv[0].innerText;
		logV2(INFO, CATEGORY, albumObject.album);
	}
}

function getAlbumArtist(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Artist", "*");
	var oDiv = window.content.document.querySelectorAll("div[data-testid*=product-subtitles]");
	var albumArtist = '';
	logV2(INFO, CATEGORY, "albumArtist oDiv Length: " + oDiv.length);
	logV2(INFO, CATEGORY, "albumArtist oDiv Length: " + oDiv[0].innerText);
	if ( oDiv.length > 0) {
		albumObject.albumArtist = oDiv[0].innerText;
		logV2(INFO, CATEGORY, albumObject.artist);
		if (albumObject.albumArtist.toUpperCase() == "VARIOUS ARTISTS"){
			albumObject.compilation = true;
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
