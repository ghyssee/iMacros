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
var CATEGORY = "QMUSIC";

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
	
	var oSection = window.content.document.querySelectorAll("ul[class*=c-playlist]");
	// ex. <ul class="c-playlist c-playlist--large c-playlist--dividers">
	logV2(INFO, CATEGORY, "getTrackLists oSection Length: " + oSection.length);
	if (oSection.length > 0){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=oSection[0].outerHTML;
		var oSpan = null;	
		oSpan = oDiv.querySelectorAll("li[class*=c-playlist__item]");
		// ex. <li class="c-playlist__item"><div class="o-playlist" data-hitlist-selector-code="9006-32" id="8632" slug="rainbow-in-the-sky"><div class="o-playlist__position">
        // <div class="o-playlist__image"><img src="https://cdn-radio.dpgmedia.net/cover/w300/7/73/05/01/228025/dj_paul_elstak-rainbow_in_the_sky_s.jpg" alt="Rainbow In The Sky"></div> <div class="o-playlist__content"><span class="o-playlist__stats"><span class="o-playlist__previous">1</span> | 
        // <strong class="o-playlist__movement o-playlist__movement--equal"><svg class="icon o-icon o-icon--small icon--small"><use xlink:href="#icon-hitlist-equal"></use></svg> 
        // </strong></span> <h3 class="o-playlist__title">Rainbow In The Sky</h3> <p class="o-playlist__artist">DJ PAUL ELSTAK</p></div> <div class="o-playlist__actions"><button href="https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview62/v4/37/37/79/3737796f-b5ce-4c26-09c9-924fa3d60bc5/mzaf_7294632354045517163.plus.aac.p.m4a" class="o-playlist__button o-preview"><svg class="icon o-icon o-icon--track"><use xlink:href="#icon-play"></use></svg> <!----></button> <button class="o-playlist__button o-like"><svg class="icon o-icon o-playlist__icon" aria-hidden="true"><use xlink:href="#icon-heart"></use></svg></button> <span> <button aria-label="Actions" class="o-playlist__button c-button--action"><svg class="icon o-icon o-playlist__icon"><use xlink:href="#icon-actions"></use></svg></button></span></div></div></li>

		logV2(INFO, CATEGORY, "nr of track records found: " + oSpan.length);
		
		for (var i=0; i < oSpan.length; i++){
			logV2(INFO, CATEGORY, "text: " + oSpan[i].innerText);
			var songObject = getTrackinfo(oSpan[i]);
		    logV2(INFO, CATEGORY, JSON.stringify(songObject));
			albumObject.tracks.push(songObject);
		}
	}
	else {
		alert("No Content found for class c-playlist");
	}
}

function getTrackinfo(tag){
	var songObject = getSongObject();
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	//logV2(INFO, CATEGORY, tag.outerHTML);
	var oDiv = window.content.document.createElement('div');
	oDiv.innerHTML=tag.outerHTML;
	var track = getTrackNumber(oDiv);
	songObject.track = track;
	var title = getQTitle(oDiv);
    songObject.title = title;
	var artist = getQArtist(tag);
	songObject.artist = artist;
	logV2(INFO, CATEGORY, "Title: " + title);
	logV2(INFO, CATEGORY, "Artist: " + artist);
	return songObject;
}

function getTrackNumber(oDiv){
	var oSpan = oDiv.querySelectorAll("div[class*=o-playlist__position]");
	// <div class="o-playlist__position">2</div>
	var trackNumber = null;
	for (var i=0; i < oSpan.length; i++){
		trackNumber = oSpan[i].innerText;
		trackNumber = trackNumber.trim().replace(/\./,'');
		logV2(INFO, CATEGORY, "track number: " + trackNumber);
	}
	return trackNumber;
}

function getQTitle(oDiv){
	var oSpan = oDiv.querySelectorAll("h3[class*=o-playlist__title]");
	// ex. <h3 class="o-playlist__title">Rainbow In The Sky</h3>
	var title = null;
	for (var i=0; i < oSpan.length; i++){
		title = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "Title: " + title);
	}
	return title;
}

function getQArtist(oDiv){
	var oSpan = oDiv.querySelectorAll("p[class*=o-playlist__artist]");
	// ex. <p class="o-playlist__artist">DJ PAUL ELSTAK</p>
	var artist = null;
	for (var i=0; i < oSpan.length; i++){
		artist = oSpan[i].innerText;
		logV2(INFO, CATEGORY, "artist: " + artist);
	}
	return artist;
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("h1[class*=o-page__title]");
	// ex. <h1 class="o-page__title">Top 500 van de '90s</h1>
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
