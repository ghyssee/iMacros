var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Hitnoteringen");
songInit();
var HYPHEN = " - ";
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "HITNOTERINGEN";

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){

	var albumObject = getAlbumObject();
	albumObject.tracks = [];
	albumObject.total = 0;
	
	getAlbumTitle(albumObject);
	getTrackLists(albumObject);

	writeObject(albumObject, FILENAME);
	alert(JSON.stringify(albumObject, null, 2));

}

function getTrackLists(albumObject){

	logHeader(INFO, CATEGORY, "Step: Get Track List Info", "*");
	
	var oSpan = null;
	var cd = null;
	var oTable = extractTable();
	if (oTable.length > 0){
		var oDiv = window.content.document.createElement('div');
			oDiv.innerHTML = oTable[0].outerHTML;
			var list = oDiv.querySelectorAll("div[class*=card-body]");
			logV2(INFO, CATEGORY, "Length of table: " + list.length);
			for (var i=0; i < list.length; i++){
				//logV2(INFO, CATEGORY, "line: " + list[i].innerHTML);
				var songObject = getTrackInfo(list[i]);	
				if (songObject != null){
					albumObject.tracks.push(songObject);
				}
			}
	}
	else {
		alert("No Hitnoteringen Table Found!");
	}
}

function extractTable(){
	var query = "ol[class*=chart]";
	var oTable = window.content.document.querySelectorAll(query);
	logV2(INFO, CATEGORY, "Table Extract Length: " + oTable.length);
	return oTable;
}

function getTrackInfo(tag){
	var songObject = getSongObject();
	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oDiv2 = window.content.document.createElement('table');
	oDiv2.innerHTML=tag.outerHTML;
	/* ex.
		<span class="position rounded">1</span>
		
		
		
		<span class="thumbnail"><img src="/static/waveform150.png" alt="geen albumhoes" width="70" height="70"></span>
		
		<span class="artiest text-truncate" itemprop="byArtist">Paul Elstak</span>
		<span class="titel text-truncate" itemprop="name">Rainbow in the Sky</span>
		<span class="tracklinks d-print-none">
			
			<span class="spotify"><a href="https://open.spotify.com/track/2PVqPbRv7mlCp2JYzDeMsc" target="_blank" class="p-1"><svg class="svg-inline--fa fa-spotify fa-2x c-fa-spotify" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="spotify" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" data-fa-i2svg=""><path fill="currentColor" d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"></path></svg><!-- <i class="fa-2x fab fa-spotify c-fa-spotify"></i> Font Awesome fontawesome.com --></a></span>
			<span class="youtube"><a href="https://www.youtube.com/watch?v=5HCNiXTkiIM" target="_blank" class="p-1"><svg class="svg-inline--fa fa-youtube fa-2x c-fa-youtube" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="youtube" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg><!-- <i class="fa-2x fab fa-youtube c-fa-youtube"></i> Font Awesome fontawesome.com --></a></span>
		</span>
	*/
	songObject.artist = extractTag(oDiv2, "class", "artiest");
	songObject.title = extractTag(oDiv2, "class", "titel");
	songObject.track = extractTag(oDiv2, "class", "position");
	//var trackLine = oDiv2.querySelectorAll("span[class*=artiest]");
	logV2(INFO, CATEGORY, JSON.stringify(songObject));
	return songObject;
}

function extractTag(oDiv, tag, item){
	var trackLine = oDiv.querySelectorAll("span[" + tag + "*=" + item + "]");
	var item = null;
	if (trackLine.length > 0){
		item = (trackLine[0].innerText);
	}
	return item;	
}

function removeNewline(text){
	return text.replace("\n", "");
}


function removeQuotes(text){
	return text.replace(/^\"(.*)\"$/g, "$1");
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("section[class*=header] h1");
	// ex. <h1 id="firstHeading" class="firstHeading mw-first-heading"><i>Billboard</i> Year-End Hot 100 singles of 2022</h1>
	var albumArtistTitle = "";
	logV2(INFO, CATEGORY, "albumArtistTitle oDiv Length: " + oDiv.length);
	for (var i=0; i < oDiv.length; i++){
		albumArtistTitle = oDiv[i].innerText;
		albumArtistTitle = albumArtistTitle.trim();
		logV2(INFO, CATEGORY, albumArtistTitle);
		albumObject.album = albumArtistTitle;
		albumObject.albumArtist = "Various Artists";
		albumObject.compilation = true;
		break; // exit for loop. We only need first element
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
