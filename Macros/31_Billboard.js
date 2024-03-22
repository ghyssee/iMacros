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
var HYPHEN = " - ";
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "BILLBOARD";

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

function getTrackLists(albumObject){

	logHeader(INFO, CATEGORY, "Step: Get Track List Info", "*");
	
	var oSpan = null;
	var cd = null;
	var oTable = extractTable("class", "editable");
	if (oTable.length > 0){
		var oDiv = window.content.document.createElement('div');
			oDiv.innerHTML = oTable[0].outerHTML;
			var list = oDiv.querySelectorAll("tr");
			for (var i=0; i < list.length; i++){
				logV2(INFO, CATEGORY, "line: " + list[i].innerText);
				var songObject = getTrackInfo(list[i]);	
				if (songObject != null){
					albumObject.tracks.push(songObject);
				}
			}
	}
	else {
		alert("No Billboard Table Found!");
	}
}

function extractTable(type, attribute){
	var query = "table[class*=wikitable";
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
		<tr>
		<td scope="row">1
		</td>
		<td>"<a href="/wiki/Heat_Waves" title="Heat Waves">Heat Waves</a>"</td>
		<td><a href="/wiki/Glass_Animals" title="Glass Animals">Glass Animals</a>
		</td></tr>
	*/
	var oInfo = oDiv2.querySelectorAll("td");
	if (oInfo.length == 3){
		songObject.track = removeNewline(oInfo[0].innerText);
		songObject.artist = removeNewline(oInfo[2].innerText);
		songObject.title = removeQuotes(removeNewline(oInfo[1].innerText));
		logV2(INFO, CATEGORY, JSON.stringify(songObject));
	}
	else {
		logV2(INFO, CATEGORY, "Skipping line " + tag.innerHTML);
		songObject = null;
	}
	return songObject;
}

function removeNewline(text){
	return text.replace("\n", "");
}


function removeQuotes(text){
	return text.replace(/^\"(.*)\"$/g, "$1");
}

function getAlbumTitle(albumObject){
	logHeader(INFO, CATEGORY, "Step: Get Album Title/Artist", "*");
	var oDiv = window.content.document.querySelectorAll("h1[id*=firstHeading]");
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
