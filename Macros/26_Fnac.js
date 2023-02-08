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
var CATEGORY = "FNAC";

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
	
	// only take content from <section id="TrackList" class="f-productLayerGrid__section js-productSection tracklist">
	var oSection = window.content.document.querySelectorAll("section[id*=TrackList]");
	if (oSection.length > 0){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=oSection[0].outerHTML;
		var oSpan = null;	
		oSpan = oDiv.querySelectorAll("li.f-trackList__disk, li.f-trackList__row");
		logV2(INFO, CATEGORY, "getTrackLists oSpan Length: " + oSpan.length);
		var cd = null;
		for (var i=0; i < oSpan.length; i++){
			logV2(INFO, CATEGORY, "text: " + oSpan[i].innerText);
			var cdInfo = getTrackList(oSpan[i]);
			if (cdInfo != null){
				// it's a Tracklist Line. Filling in cd number
				logV2(INFO, CATEGORY, "cd: " + cdInfo);	
				cd = cdInfo;
				albumObject.total = cd;
			}
			else {
				if (isTrack(oSpan[i])){
					logV2(INFO, CATEGORY, "Track Line found. Getting info...");
					var songObject = GetTrackinfo(oSpan[i], cd);
					logV2(INFO, CATEGORY, JSON.stringify(songObject));
					albumObject.tracks.push(songObject);
				}
			}
		}
	}
	else {
		alert("No Content found for section id=TrackList");
	}
}

function isTrack(tag){
	logV2(INFO, CATEGORY, "tag: " + tag.innerHTML);
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("li[class*=f-trackList__row");
    //logV2(INFO, CATEGORY, "isTrack oSpan Length: " + oSpan.length);
	return oSpan.length > 0;
}

function GetTrackinfo(tag, cd){
	var songObject = getSongObject();
	songObject.cd = cd;
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var track = getTrackNumber(tag);
	songObject.track = track;
	var title = getTitleArtist(tag);
	var array = title.split(/ - ?/);
	if (array.length >= 2){
		songObject.artist = array[0];
		songObject.title = array[1];
		logV2(INFO, CATEGORY, "Title: " + array[0]);
		logV2(INFO, CATEGORY, "Artist: " + array[1]);
		}
	return songObject;
}

function getTrackNumber(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[class*=f-trackList__number]");
	// ex. <span class="f-trackList__number">17</span>
	var trackNumber = null;
	for (var i=0; i < oSpan.length; i++){
		trackNumber = oSpan[i].innerText;
		trackNumber = trackNumber.replace(/\./,'');
		logV2(INFO, CATEGORY, "track number: " + trackNumber);
	}
	return trackNumber;
}

function getTitleArtist(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("span[class*=f-trackList__title]");
	// ex. <span class="f-trackList__title">Dua Lipa &amp; Megan Thee Stallion - Sweetest Pie</span>
	var titleArtist = null;
	for (var i=0; i < oSpan.length; i++){
		titleArtist = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "Title Artist: " + titleArtist);
	}
	return titleArtist;
}

function getTrackList(tag){
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var oSpan = oDiv.querySelectorAll("li[class*=f-trackList__disk");
	//logV2(INFO, CATEGORY, "isTrackListTag oSpan Length: " + oSpan.length);
	var cd = null;
	for (var i=0; i < oSpan.length; i++){
		cd = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "text: " + oSpan[i].innerText);
		cd = cd.replace(/(Disque|Tracklist|CD) /,'');
	}
	return cd;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("h1[data-automation-id*=product-title-label]");
	// ex. <h1 class="f-productHeader-Title" data-automation-id="product-title-label">Nrj Hits Été 2022</h1>
	var albumArtistTitle = '';
	logV2(INFO, CATEGORY, "albumArtistTitle oDiv Length: " + oDiv.length);
	for (var i=0; i < oDiv.length; i++){
		albumArtistTitle = oDiv[i].innerText;
		logV2(INFO, CATEGORY, albumArtistTitle);
		albumArtistTitle = stripAlbum(albumArtistTitle);
		fillAlbumTitleArtist(albumObject, albumArtistTitle);
	}
}

function stripAlbum(album){
		var strippedAlbum = album.replace(/ ?\(C[D|d]\)/,'');
		logV2(INFO, CATEGORY, strippedAlbum);
		return strippedAlbum;
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
