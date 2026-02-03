var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\SongUtils-0.0.3.js"));
setupEnvrionment(getOneDrivePath());

LOG_FILE = new LogFile(LOG_DIR, "Ultratop");
songInit();
var HYPHEN = String.fromCharCode(8211); // "–" special hypen char
var ALBUM = "Album";
var nrOfSkippedLines = 0;
var CATEGORY = "ULTRATOP";
//xxx(); // 187 - 16 = 171 lines coming from readScript

var FILENAME = new ConfigFile(getPath(PATH_PROCESS), ALBUM + ".json");
//var albumArtist = selectArtist(); // 171

processAlbum();

function processAlbum(){

	//var top50Object = {"title":null,"tracks":null,"filename":null};
	var top50Object = getAlbumObject();
    top50Object.tracks = [];
	top50Object.total = 0;
	
	getTop50Title(top50Object);

    getTracks(top50Object);
	//writeObject(top50Object, FILENAME);
	alert(JSON.stringify(top50Object, null, 2));
	makeTop50(top50Object);

}

function makeTop50(top50Object){
	var top50File = OUTPUT_DIR + "Ultratop50_New_" + top50Object.filename + ".txt";
	var newline = "\r\n";
	writeFileWrapper(top50File, top50Object.album + newline, true);
	writeFileWrapper(top50File, "=".repeat(top50Object.album.length) + newline, false);
	for (const track of top50Object.tracks){
		var line = padChar(track.status, 2, ' ') + " " + padChar(track.track, 2, ' ') + " " + track.artist + " - " + track.title;
       logV2(INFO, CATEGORY, line);
	   writeFileWrapper(top50File, line + newline, false);
    }
	writeObject(top50Object, FILENAME);
}

function getTop50Title(top50Object){
	logHeader(INFO, CATEGORY, "Step: Get Top50 Title", "*");
	var oDiv = window.content.document.querySelectorAll("div[class*=heading]");
	var top50Title = '';
	logV2(INFO, CATEGORY, "top50Title oDiv Length: " + oDiv.length);
	if (oDiv.length >= 1) {
		top50Title = oDiv[0].innerText;
		splittedText = top50Title.split("\n");
		if (splittedText.length == 2) {
		   top50Title = splittedText[0] + " " + splittedText[1];
		}
	}
	else {
		alert("No Title found!");
	}
	// get the date of the top 50
	oDiv = window.content.document.querySelectorAll("select[id*=chartdate]");
	if (oDiv.length >= 1) {
		top50Title+=' ' + oDiv[0].options[oDiv[0].selectedIndex].text;
		top50Title+=' ' + 'NEW/RE';
		top50Object.filename= oDiv[0].value;
	}
	else {
		logV2(INFO, CATEGORY, "Top 50 date not found!");
	}
	top50Object.album = top50Title;
	top50Object.albumArtist = "Various Artists";
	top50Object.compilation = true;
	logV2(INFO, CATEGORY, "top50Title: " + top50Title);
}

function getTracks(top50Object){

	logHeader(INFO, CATEGORY, "Step: Get Track Info", "*");
	var oSpan = window.content.document.querySelectorAll("div[class*=content\\ chartitem]");
	var oTrackNumber = window.content.document.querySelectorAll("div[class*=chart_pos]");
	
	for (var i=0; i < oSpan.length; i++){
		var oDiv = window.content.document.createElement('div');
		oDiv.innerHTML=oSpan[i].outerHTML;
		var oName = oDiv.querySelectorAll("div[class=chart_title] > a[href*=\\/nl\\/song\\/]");
		if (oName.length == 1) {
			// check if status = "N" or "RE"
			oStatus = oDiv.querySelectorAll("div[class=chart_neu_re]");
			if (oStatus.length >= 1) {
				var status = oStatus[0].innerText;
			   logV2(INFO, CATEGORY, "status: " + status);
			   processTrack(top50Object, oName[0], oTrackNumber[i], status);
			}
		}
		else {
			logV2(INFO, CATEGORY, "No trackinfo found for string '" + oDiv.innerHTML + "'");
		}
	}
}

function processTrack(top50Object, oTrack, oTrackNumber, status){
	var songObject = getSongObject();
	var track = oTrackNumber.innerText;
	logV2(INFO, CATEGORY, "track: " + track);
	logV2(INFO, CATEGORY, "Trackinfo: " + oTrack.innerHTML);
	songObject.track = track;
	songObject.status = status;
	let searchTrack = oTrack.innerHTML;
	var artist = searchTrack.match(/<b>(.*)<\/b>/);
	var artistFound = false;
	var titleFound = false;
	if (artist.length == 2) {
		var artist = decodeEntities(artist[1]);
		songObject.artist = artist;
		artistFound = true;
	    logV2(INFO, CATEGORY, "Artist: " + artist);
	}
	else {
		logV2(INFO, CATEGORY, "No artist found for Trackinfo " + searchTrack);
	}
	var titleArr = searchTrack.match(/<br>(.*)/);
	if (titleArr.length == 2) {
		var title = decodeEntities(titleArr[1]);
	    songObject.title = title;
		titleFound = true;
	    logV2(INFO, CATEGORY, "title: " + title);
	}
	else {
		logV2(INFO, CATEGORY, "No title found for Trackinfo " + searchTrack);
	}
	if (artistFound && titleFound){
		top50Object.tracks.push(songObject);	
	}
	else {
		logV2(INFO, CATEGORY, "No artist or title could be found!!!");
	}
}

function decodeEntities(s){
    var str, temp= window.content.document.createElement('p');
    temp.innerHTML= s;
    str= temp.textContent || temp.innerText;
    temp=null;
    return str;
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
