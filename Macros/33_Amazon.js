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
var HYPHEN = /\ - | -|- /;
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "AMAZON";

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

	if (items.length >= 2){
		albumObject.albumArtist = items[0].trim();
		albumObject.album = "";
		for (var i=1; i < items.length; i++){
			albumObject.album += (i > 1 ? " - " : "") + items[i];
		}
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
	var cd = null;
	oSpan = window.content.document.querySelectorAll("div[id*=music-tracks");
	logV2(INFO, CATEGORY, "getTrackLists oSpan Length: " + oSpan.length);
	if (oSpan.length > 0){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML = oSpan[0].outerHTML;
		//logV2(INFO, CATEGORY, oSpan.outerHTML);
		var list = oDiv.querySelectorAll("tr, h4");
		for (var i=0; i < list.length; i++){
			logV2(INFO, CATEGORY, list[i].outerHTML);
			logV2(INFO, CATEGORY, list[i].innerText);
			if (isTrack(list[i])){
				cd = list[i].innerText.trim();
				cd = cd.replace(/(Tracklist|Dis[K|c]|[C|c][D|d]):? /,'');
				albumObject.total = cd;
				logV2(INFO, CATEGORY, "cd: " + cd);
			}
			else{
				var songObject = getTrackinfo(list[i], cd);
				albumObject.tracks.push(songObject);
			}
		}
		
	}
	else {
		alert("No Track Info Found!");
	}
}

function isTrack(tag){
	logV2(INFO, CATEGORY, "tag: " + tag.innerHTML);
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("h4");
	//logV2(INFO, CATEGORY, "isTrack oSpan Length: " + oSpan.length);
	return oSpan.length > 0;
}

function getTrackinfo(tag, cd){
	var songObject = getSongObject();
	songObject.cd = cd;
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oDiv2 = window.content.document.createElement('table');
	oDiv2.innerHTML=tag.outerHTML;
	var oInfo = oDiv2.querySelectorAll("td");
	// <tr> <td>26</td> <td>Call It Love (Sing It Back) - Jaehn, Felix</td> </tr>
	// cell 1: track number
	// cell 2: artist - title
	logV2(INFO, CATEGORY, "oInfo.length: " + oInfo.length);
	if (oInfo.length == 2){
		songObject.track = oInfo[0].innerText.trim();
		var array =  oInfo[1].innerText.trim().split(HYPHEN); // title.split(/ - ?/)
		logV2(INFO, CATEGORY, "Title: " + array[1]);
		logV2(INFO, CATEGORY, "Artist: " + array[0]);
		if (array.length >= 2){
			songObject.title = array[1];
			songObject.artist = array[0];
			logV2(INFO, CATEGORY, "songObject: " + JSON.stringify(songObject));
		}
		else {
			logV2(INFO, CATEGORY, "No Song Info found!");
		}
	}
	return songObject;
}

function getTrackNumber(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[data-test*=track-number");
	var trackNumber = null;
	for (var i=0; i < oSpan.length; i++){
		trackNumber = oSpan[i].innerText;
		trackNumber = trackNumber.replace(/\./,'');
		logV2(INFO, CATEGORY, "track number: " + trackNumber);
	}
	return trackNumber;
}

function getTrackList(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("h3[data-test*=tracklist-title");
	//logV2(INFO, CATEGORY, "isTrackListTag oSpan Length: " + oSpan.length);
	var cd = null;
	for (var i=0; i < oSpan.length; i++){
		cd = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "text: " + oSpan[i].innerText);
		cd = cd.replace(/Tracklist /,'');
	}
	return cd;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("span[id*=productTitle]");
	// ex. <span id="productTitle" class="a-size-large product-title-word-break">        Megahits 2023-die Erste       </span>
	var albumArtistTitle = '';
	logV2(INFO, CATEGORY, "albumArtistTitle oDiv Length: " + oDiv.length);
	for (var i=0; i < oDiv.length; i++){
		albumArtistTitle = oDiv[i].innerText;
		albumArtistTitle = albumArtistTitle.trim();
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
