var BASE_DIR = "c:\\My Programs\\iMacros\\";
var STATUS_FILE = BASE_DIR + "status\\status.html";
var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log.IgnoreRequests";
var SCREENSHOT_DIR = BASE_DIR + "screenshots\\";
var DATASOURCE_DIR = BASE_DIR + "Datasources\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var QUEUE_DIR = DATASOURCE_DIR + "Queues\\";
var BACKUP_DIR = DATASOURCE_DIR + "old";
var CONFIG_DIR = BASE_DIR + "config\\";
var PROFILE_JSON_FILE = CONFIG_DIR + "profilesV2.json";
var LOGIN_JSON_FILE = CONFIG_DIR + "login.json";
var commonFolder = "Common/";
var FOLDER_IGNOREREQUESTS = "IngoreRequests/";
var SEPERATOR = ",";

var arrayOfProfiles = [];

arrayOfProfiles = init();

for (var i=0; i < arrayOfProfiles.length; i++){
	var profileObject = arrayOfProfiles[i];
	log("Starting profile " + i.toString());
	if (profileObject.enabled){
		var loginObject = initObject(LOGIN_JSON_FILE);
		if (login(profileObject, loginObject) == -1) continue;
		ignoreRequests(profileObject);
		iimPlay("fblogoff.iim");
	}
}

function ignoreRequests(profileObject){
   
   var retcode = 0;
   var success = 0;
   var retries = 0;
   var scriptToPlay = FOLDER_IGNOREREQUESTS + "fbIgnoreRequests.iim";
   var ignoreText = "";
   var formIDArray = [];
   var ignoreTextArray = [];
   ignoreTextArray[0] = "Alles<SP>negeren";
   ignoreTextArray[1] = "Ignore<SP>all";
   
   log ("Starting " + scriptToPlay);
   
   retcode = iimPlay(FOLDER_IGNOREREQUESTS + "fbIgnoreRequestsStart.iim");
   if (retcode != 1){
      log("ERROR: fbIgnoreRequests : NOK");
	  return;
   }

   if (testNoRequestsAnymore() == 1){
	  return;
   }
   
   var ignoreText = initIgnoreAll(ignoreTextArray);
   if (ignoreText == ""){
      // No ignore text found, possible that there aren't any to remove
	  log("INFO: No IgnoreAll Requests found...");
   }
   else {
	   removeIgnoreAll(ignoreText, scriptToPlay);
   }
   // start with 2nd part, removing play nows
   removePlayNows();
   log ("==============================================");
}

function initIgnoreAll(ignoreTextArray){

   var ignoreText = "";
   for (var j=0; j < ignoreTextArray.length; j++){
	   // try to guess correct ignoreText
	  iimSet("ignoretext", ignoreTextArray[j]);
	  iimSet("formid", "u_*");
	  retcode = iimPlay(FOLDER_IGNOREREQUESTS + "fbIgnoreRequestsInit.iim");
	  if (retcode == 1){
		 // we found the correct ignoreText
		 ignoreText = ignoreTextArray[j];
		 log("INFO: ignoreText = " + ignoreText);
		 break;
	  }
	}
	return ignoreText;
}

function removeIgnoreAll(ignoreText, scriptToPlay){
    var retcode = 0;
	var success = 0;
	var retries = 0;
	
	log("INFO: 1. Ignore All");
	do {
		if (retcode != 1){
			iimPlay(FOLDER_IGNOREREQUESTS + "fbIgnoreRequestsStart.iim");
		}
		iimSet("formid", "u_*");
		iimSet("ignoretext", ignoreText);
		retcode = iimPlay(scriptToPlay);
		if (retcode == 1){
		   success++;
		   retries=0;
		}
		else {
			retries++;
		}
	}
	while (retries < 3);
	
    log ("INFO: " + success + " requests ignored");
    log ("INFO: " + retries + " retries");
}

function testNoRequestsAnymore(){

   var retcode = 0;
   var noRequests = [];
   noRequests[0] = "Je<SP>hebt<SP>geen<SP>verzoeken";
   noRequests[1] = "You<SP>have<SP>no<SP>requests";
   log("INFO: Testing if there are any requests to remove");
   
   for (var i=0; i < noRequests.length && retcode != 1; i++){
		iimSet("norequests", noRequests[i]);
		retcode = iimPlay(FOLDER_IGNOREREQUESTS + "fbNoRequestsAnymore.iim");
   }
   if (retcode == 1){
      log("INFO: No requests / play nows to be removed");
   }
   return retcode;
}

function removePlayNows(){
   var success = 0; var retries = 0; var retcode = 0;
	log("INFO: 2. Play Now");
   do {
	  if (retcode != 1){
		iimPlay(FOLDER_IGNOREREQUESTS + "fbIgnoreRequestsStart.iim");
	    if (testNoRequestsAnymore() == 1){
		  break;
	    }
	  }
      retcode = iimPlay(FOLDER_IGNOREREQUESTS + "fbIgnorePlayNow.iim");
	  if (retcode == 1){
		 success++;
		 retries=0;
	  }
	  else {
		retries++;
	  }
   }
   while (retries < 3);
   log (success + " play now ignored");
   log (retries + " retries");
}

function getDateYYYYMMDD(){
//   var d1=new Date();
//   return d1.toString('yyyyMMdd');
   
	var d = new Date();
	var curr_date = d.getDate();
	var curr_month = d.getMonth();
	curr_month++;
	var curr_year = d.getFullYear();
	return ("" + curr_year + pad(curr_month,2) + pad(curr_date,2));
	   
}

function pad(number, length) {
   
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;

}

function createDirectory(tmpdir) {
        var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        directory.initWithPath(tmpdir);
        if (directory.exists() === false) {
            directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 420);
        }
        return true;
}

function log(outputText) {
        var filename = LOG_FILE + "." + getDateYYYYMMDD() + ".txt";
		var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(filename);
        if (file.exists() === false) {
            file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
        }
        var outputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
        outputStream.init(file, 0x04 | 0x10, 420, 0);
        outputStream.write(outputText, outputText.length);
		var newline = "\r\n";
        outputStream.write(newline, newline.length);
        outputStream.close();
        return true;
}

function init(){
	return initObject(PROFILE_JSON_FILE);
}

function readFile(filename){

	// open an input stream from file
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	 
	// read lines into array
	var line = {}, lines = [], hasmore;
	do {
	  hasmore = istream.readLine(line);
	  lines.push(line.value);
	} while(hasmore);
	 
	istream.close();
	
	return lines;

}

function splitLine(line, seperator){
	   var fields = null;
	   if (line != null && line != ""){
		   fields = line.split(seperator);
	   }
	   return fields;
}

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function initObject(fileName, arrayOfObjects){
	log("INFO: Processing JSON file " + fileName);
	if (fileExists(fileName)){
		var lines = readFile(fileName);
		if (lines != null){
			if (lines.length == 1 && arrayOfObjects == null){
			   return JSON.parse(lines[0]);
			}
			else if (lines.length > 1 && arrayOfObjects == null){
				var jsonStr = "";
				for (var i=0; i < lines.length; i++){
					if (lines[i] != null && lines[i].trim() != ""){
						jsonStr = jsonStr + lines[i].trim();
					}
				}
				return JSON.parse(jsonStr);
			}
			else {
				for (var i=0; i < lines.length; i++){
					if (lines[i] != null && lines[i].trim() != ""){
						var profileObject = JSON.parse(lines[i]);
						arrayOfObjects.push(profileObject);
					}
				}
				return arrayOfObjects;
			}
		}
	}
	else {
		var errorMsg = "File " + fileName + " not found!";
		alert(errorMsg);
		throw new Error(errorMsg);
	}
}

function login(profileObject, loginObject){
	var retcode = 0;
	if (loginObject.enabled){
		// user already logged in
	}
	else {
		iimSet("login", profileObject.login);
		iimSet("password", profileObject.password);
		retcode = iimPlay("fblogin.iim");
		if (retcode != 1){
			log("ERROR: Problem with login for profile " + profileObject.id);
			return -1;
		}
		log("INFO: Logging in for profile " + profileObject.id);
		loginObject.id = profileObject.id;
		loginObject.enabled = true;
	}
	return retcode;
}
