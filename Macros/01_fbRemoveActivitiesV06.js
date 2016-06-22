var BASE_DIR = "c:\\My Programs\\iMacros\\";
var CONFIG_DIR = BASE_DIR + "config\\";
var CONFIG_ONEDRIVE_DIR = CONFIG_DIR;
var CONFIG_JSON_FILE = new ConfigFile(CONFIG_ONEDRIVE_DIR, "config.json");
var LOG_DIR = BASE_DIR + "logs\\";
var PROFILE_JSON_FILE = new ConfigFile(CONFIG_ONEDRIVE_DIR, "profilesV3.json");
var LOGIN_JSON_FILE = new ConfigFile(CONFIG_DIR, "login.json");
var APPLICATIONS_JSON_FILE = new ConfigFile(CONFIG_DIR, "FaceBookApps.json");
var MENU_FILE = new ConfigFile(CONFIG_DIR, "RemoveActivitiesMenu.json");
var LOG_FILE = new LogFile(LOG_DIR, "RemoveActivities");
var LOG_ERROR = new LogFile(LOG_DIR, "RemoveActivities_ERROR");
var LOCAL_CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "localconfig.json");

var PROFILE_ERIC = "00_ERIC";
var PROFILE_AMALIN = "01_AMALIN";
var PROFILE_AARON = "02_AARON";
var PROFILE_AJORIS = "03_AJORIS";
var PROFILE_EG = "04_EG";
var PROFILE_MT = "05_MT";

var ENABLED = "1";
var DISABLE_LOGGING = false;
var ENABLE_LOGGING = true;

var DATASOURCE_DIR = "c:\\My Programs\\iMacros\\Datasources\\";

var mapActivities = "FacebookActivities/";

var macroSettings = [];
var profileArray = [];
var applications = [];
var stop = false;

var arrayOfProfiles = [];
var NEWLINE = "\n";
var NODE_ID = "";
var localConfigObject = null;

String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
      if (count & 1) result += pattern;
      count >>>= 1, pattern += pattern;
    }
    return result + pattern;
  };

init();
var applicationObject = initObject(APPLICATIONS_JSON_FILE);
var title = "Remove Activities";
// structure: 
//{applicationName:"Name of the application(s)",
// id:"MW;CV;FV", list of applications separated by ;
// number:"1"} // id that you enter in the inputbox

var CHOICES = initObject(MENU_FILE);
var DEFAULT_VALUE = "*";

/*
[{applicationName:"Default",id:"*",number:"1"},
			   {applicationName:"Mafia Wars",id:"MW",number:"2"},
			   {applicationName:"Solitaire in Wonderland",id:"SIW",number:"3"}
		      ];*/
			  
var msg = title + NEWLINE + "-".repeat(100) + NEWLINE;
for (var i=0; i < CHOICES.length; i++){
	msg += CHOICES[i].number + " = " + CHOICES[i].applicationName + " (" + CHOICES[i].id + ")" + NEWLINE;
}
var inputTxt = prompt(msg, "1");
var found = false;
var ids = [];
var profiles = "";
if (!isNullOrBlank(inputTxt)){
	for (var i=0; i < CHOICES.length; i++){
		if (CHOICES[i].number == inputTxt){
			found = true;
			ids = CHOICES[i].id.split(";");
			break;
		}
	}
}

if (inputTxt != null && !found) {
	alert("No Valid choice made!");
}
else if (inputTxt == null || inputTxt == "0"){
	// cancel button pushed, do nothing
}
else {
	
	// Select the profiles
	msg = "Select Profile" + NEWLINE + "-".repeat(50) + NEWLINE;
	msg += DEFAULT_VALUE + " = " + "Default" + NEWLINE;
	for (var i=0; i < arrayOfProfiles.length; i++){
		msg += arrayOfProfiles[i].alias + " = " + arrayOfProfiles[i].id + NEWLINE;
	}
	inputTxt = prompt(msg, "*");
	if (!isNullOrBlank(inputTxt)){
		if (inputTxt.contains(DEFAULT_VALUE)){
			profiles = null;
		}
		else {
			profiles = inputTxt;
		}
		try {
			startRemoveActivitiesApplications(ids, profiles);
		}
		catch (err) {
			log("ERROR: " + err);
			macroPlay("fbLogoffIfLoggedIn.iim", false, false);
		}
	}
	
}
//startRemoveActivities();

function startRemoveActivitiesApplications(ids, profiles){

	log("Log off if logged in from any facebook profile");
	macroPlay("fbLogoffIfLoggedIn.iim", false, false);
	for (var i=0; i < arrayOfProfiles.length; i++){
		var profileObject = arrayOfProfiles[i];
		var loginObject = initObject(LOGIN_JSON_FILE);
		log("INFO: Processing profile " + profileObject.id);
		if (ids[0] == "*"){
			// default selected from startup menu
			// Step 1: look if any applications are specified in the profile file and clean them up
			// Step 2: Iterate over facebook applications file and clean up all enabled applications for specific profiles
			log("INFO: Step 1: Remove profile specific applications");
			if (profileObject.removeActivities.appsToRemove.enabled){
				if (isEmpty(profileObject.removeActivities.appsToRemove.list)){
					log("WARNING: No specific applications found");
				}
				else {
					for (var j=0; j < profileObject.removeActivities.appsToRemove.list.length; j++){
						var specificApp = profileObject.removeActivities.appsToRemove.list[j];
						log("INFO: Removing activities for application " + specificApp.id + "/" + specificApp.yearToDelete + "/" + specificApp.wait);
						cleanUpApplication(profileObject, loginObject, specificApp.id, specificApp.yearToDelete, specificApp.wait, profiles);
					}
				}
			}
			log("-".repeat(100));
			log("INFO: Step 2: Remove activities specified in " + APPLICATIONS_JSON_FILE.fullPath());
			if (applicationObject.enabled) {
				log("INFO: Status: Enabled");
				log("INFO: Step 1: Remove profile specific applications");
				for (var j=0; j < applicationObject.listOfApps.length; j++){
					var singleApplicationObject = applicationObject.listOfApps[j];
					if (singleApplicationObject.enabled && singleApplicationObject.profiles.contains(profileObject.alias)){
						log("INFO: Clean up for application " + singleApplicationObject.name);
						if (login(profileObject, loginObject) == -1) {
							log("WARNING: There was a problem with login for profile " + profileObject.id);
							continue;
						}
						else {
							var startPos = "1";
							//if (removeActivities(singleApplicationObject, profileObject, startPos) == 0) {
							if (cleanUpApplication(profileObject, loginObject, singleApplicationObject.id, singleApplicationObject.yearToDelete, singleApplicationObject.wait, profiles) == -1){
								// user not logged in, continue with next user
								break;
							}
							//removeSpecificApplicationActivities(singleApplicationObject, profileObject, startPos, singleApplicationObject.wait, singleApplicationObject.yearToDelete);
						}
					}
				}
			}
			else {
				log("INFO: Status: Disabled");
			}
			log("-".repeat(100));
		}
		else {
			// something different than default selected from the menu
			for (var j=0; j < ids.length; j++){
				if (cleanUpApplication(profileObject, loginObject, ids[j], null, null, profiles) == -1){
					// user not logged in, continue with next user
					break;
				}
				
			}
		}
		if (loginObject.enabled){
			macroPlay("fblogoff.iim");
		}
		if (stop) break;
	}
}

function cleanUpApplication(profileObject, loginObject, appId, year, wait, profiles){
	log("INFO: Look up aplication info for id " + appId);
	var appObject = findApplicationByApplicationId(appId);
	if (appObject == null){
		log("WARNING: The following application id was not found : " + appId);
	}
	else {
		if ((profiles == null && appObject.profiles.contains(profileObject.alias)) ||
		    (profiles != null && profiles.contains(profileObject.alias)) 
		   ){
			// login if not logged in yet
			if (login(profileObject, loginObject) == -1) {
				log("WARNING: There was a problem with login for profile " + profileObject.id);
				return -1;
			}
			log("INFO: Profile " + profileObject.id + " : Application : " + appObject.name + " : Removing activities" );
			removeSpecificApplicationActivities(appObject, profileObject, "1", year, wait);
		}
		else {
			log("INFO: Profile " + profileObject.id + " disabled for this application");
		}
	}
	return 0;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function findApplicationByApplicationId(appId){
	for (var cnt=0; cnt < applicationObject.listOfApps.length; cnt++){
		if (applicationObject.listOfApps[cnt].id == appId){
			return applicationObject.listOfApps[cnt];
		}
	}
	return null;
}

/*
function removeActivities(applicationObject, profileObject, startPos){
	var url="https://www.facebook.com/" + profileObject.fbName + "/allactivity?log_filter=app_" + applicationObject.faceBookId;
	log("INFO: Processing url " + url + " with startPos " + startPos);
	return removeActivities2(url, profileObject, startPos, applicationObject.wait, applicationObject.yearToDelete);
}
*/
function removeSpecificApplicationActivities(applicationObject, profileObject, startPos, yearToDelete, wait){
	var url="https://www.facebook.com/" + profileObject.fbName + "/allactivity?log_filter=app_" + applicationObject.faceBookId;
	log("INFO: Processing url " + url + " with startPos " + startPos + " for year " + yearToDelete + " and wait " + wait);
	return removeActivities2(url, profileObject, startPos, wait, yearToDelete);
}

function removeActivities2(url, profileObject, startPos, waitSeconds, year){
 
	var success = 0;
	var failure = 0;
	var retcode = 0;
	var failuresInRow = 0;
	var successInRow = 0;
	var startPos = 1;
	var pos = startPos.toString();
	var returnCode = 1; // continue with next line
	var tagNotFound = 0;
	var error933 = 0;

	var stop = 0;

	var wait = "5";
	if (waitSeconds != null && waitSeconds != "") {
		wait = waitSeconds;
	}
	
	
	var activityType = profileObject.removeActivities.type;
	
	if (!profileObject.removeActivities.enabled){
		log("INFO: Ignoring the removal of activities for this user");
		return 1;
	}

	macroPlay(mapActivities + "FbActivitiesInit.iim");

	activitiesStart(url, wait, year);

	retcode = 1;

  for (var i=0;i<5000;i++)
  {
	 if (retcode != 1){
	    addSetting("seconds", wait);
		retcode = activitiesStart(url, wait, year);
	   if (retcode == 1 || retcode == -933){
	      //failuresInRow = 0;
		  //success++;
	   }
	   else {
	      failure++;
	      failuresInRow++;
	   }
	 }
	 else {
			do {
			   //iimSet("startPos", pos);
			   if (successInRow >= 20) {
			      // refresh
				  successInRow = 0;
				  log("INFO: resetting succesInRow");
	              addSetting("seconds", wait);
				  activitiesStart(url, wait, year);
			   }
				switch (activityType){
					case "3":
			           addSetting("pos", ((successInRow+1)*2).toString());
					   log("Position = " + ((successInRow+1)*2).toString());
					   retcode = macroPlay(mapActivities + "FbActivitiesRemove3.iim");
					   break;
					case "2":
			           addSetting("pos", ((successInRow+1)*2).toString());
					   log("Position = " + ((successInRow+1)*2).toString());
					   retcode = macroPlay(mapActivities + "FbActivitiesRemove2.iim");
					   break;
					default :
			           retcode = macroPlay(mapActivities + "FbActivitiesRemove.iim");
				}
			   if (retcode == 1){
			      failuresInRow = 0;
				  success++;
				  successInRow++;
				  tagNotFound=0;
			   }
			   else if (retcode == -933){
			      // do nothing, retry
				  error933++;
				  retcode = 1;
			   }
			   else {
					if (retcode == -921) {
						tagNotFound++;
			     	}
			      failure++;
			      failuresInRow++;
				  successInRow=0;
				}
			}
			while (retcode == 1);
			log("INFO: Check if Stop file is present");
			if (fileExists(DATASOURCE_DIR + "03.stop")){
				deleteFile(DATASOURCE_DIR + "03.stop");
				stop = 3;
				break;
			}
	 }

	 var info = "Lus = " + i + " / Return code = " + retcode + 
				" / waitSeconds = " + waitSeconds + 
				" / success = " + success + 
				" / error933 = " + error933 + 
				" / failure = " + failure + 
				" / opeenvolgende errors = " + failuresInRow +
				" / tagNotFound = " + tagNotFound;
	 iimDisplay(info);				
	 log("INFO: " + info);

	 if (failuresInRow > 2 || tagNotFound > 5){
	   // list is more than likely empty
	   stop = 1;
	   break;
	 }

  }

  switch (stop) {
	case 1: log ("INFO : Following list might be empty : " + url); break;
	case 2: log ("WARNING : Following list is giving problems : " + url); break;
	case 3: log ("INFO : Process is asked to be stopped by user"); returnCode = 0; break;
	default: log ("INFO : Following list exceeded nr of removals : " + url);
}

  logSummary(url, success, failure, failuresInRow, tagNotFound, error933);
  macroPlay("Common/closeTab.iim");
  
  return returnCode;
  
}

function addSetting(setting , value, logEnabled){
	var tmpArray = [setting, value];
	macroSetting.push(tmpArray);
}

function activitiesStart(url, wait, year) {
	   
	   //var wait = "5";
	   //if (waitSeconds != null && waitSeconds != "") {
			//wait = waitSeconds;
	   //}
	   addSetting("profile", url);
       addSetting("seconds", wait);
	   retcode = macroPlay(mapActivities + "FBActivitiesStart.iim");
	   if (year != null && year != ""){
			addSetting("year", year);
			log("INFO: Selecting year " + year);
			macroPlay(mapActivities + "FBActvitiesSelect.iim");
	   }
	   if (retcode == -933){
		  return 1;
		}
return retcode;		
}

function logSummary(url, success, failure, failuresInRow, tagNotFound, error933){
   log("SUMMARY for url " + url);
   log("success       = " + success);
   log("failures      = " + failure);
   log("failuresInRow = " + failuresInRow);
   log("tagNotFound   = " + tagNotFound);
   log("error933      = " + error933);
   log("================================================");
}
  
function pausecomp(ms) {
	ms += new Date().getTime();
	while (new Date() < ms){}
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


function splitLine(line, splitChar){
	   var fields = null;
	   if (splitChar == "" || splitChar == null){
	      splitChar = ";"
	   }
	   if (line != null && line != ""){
		   fields = line.split(splitChar);
	   }
	   return fields;
}

function log(outputText) {
        var filename = LOG_FILE.fullPath();
		return save(filename, outputText);
}

function logErr(outputText) {
        var filename = LOG_ERROR.fullPath();
		return save(filename, outputText);
}

function save(saveFile, outputText) {
        var filename = saveFile;
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

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function deleteFile(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		if (file.exists()){
			return file.remove(false);
		}
		return false;
}

function macroPlay(macroName, logError, onErrorRetry){
	var ret = 0; var retries = 0;
	var ok = false;
	log("INFO: Executing Macro: " + macroName);
	do {
		for (var nr=0; nr < macroSettings.length; nr++){
			iimSet(macroSettings[nr][0], macroSettings[nr][1]);
		}
		ret = iimPlay(macroName);
		if (ret == -101){
			throw "Canceled by user";
		}
		log("Ret = " + ret);
		//if (ret == -933) ret = 1;
		if (ret != 1 && (logError == null || logError == true)){
			if (ret != -933){
				logErr("ERROR: (" + ret + ") retries = " + retries + " " + iimGetLastError(1));
			}
		}
		if (ret == 1){
			ok = true;
		}
		else if (onErrorRetry != null && onErrorRetry == true && ret == -933){
			ok = false;
			retries++;
		}
		else {
			ok = true;
		}
	}
	while (ok == false && retries < 2);
	macroSettings = [];
	return ret;
}

function macroPlayOld(macroName, logError, onErrorRetry){
	var ret = 0; var retries = 0;
	var ok = false;
	log("INFO: Executing Macro: " + macroName);
		for (var nr=0; nr < macroSettings.length; nr++){
			iimSet(macroSettings[nr][0], macroSettings[nr][1]);
		}
		ret = iimPlay(macroName);
	macroSettings = [];
	return ret;
}


function addSetting(setting , value, loggingEnabled){
    if (loggingEnabled == null || loggingEnabled == true){
		log("INFO: Setting: " + setting + " / Value: " + value);
	}
	var tmpArray = [setting, value];
	macroSettings.push(tmpArray);
}

function init(){
	localConfigObject = initObject(LOCAL_CONFIG_JSON_FILE);
	var oneDrivePath = localConfigObject.global.oneDriveInstallDir;
	var IMACROS_CONFIG = "\\iMacros\\config\\";
	if (!isNullOrBlank(oneDrivePath)){
		if (localConfigObject.global.config == "ONEDRIVE"){
			CONFIG_ONEDRIVE_DIR = oneDrivePath + IMACROS_CONFIG;
			CONFIG_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			PROFILE_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			APPLICATIONS_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
			MENU_FILE.path = CONFIG_ONEDRIVE_DIR;
			log("Settting Config file to " + CONFIG_JSON_FILE.fullPath());
			log("Settting Profiles file to " + PROFILE_JSON_FILE.fullPath());
			log("Settting FB Applications file to " + APPLICATIONS_JSON_FILE.fullPath());
			log("Settting RemoveApplications Menu file to " + MENU_FILE.fullPath());
		}
	}
	configObject = initObject(CONFIG_JSON_FILE);
	arrayOfProfiles = initObject(PROFILE_JSON_FILE);
}

function readApplications(){

	var appFile = APPLICATIONS_FILE.fullPath();
	log("INFO: Processing applications file " + appFile);
	if (fileExists(appFile)){
		var lines = readFile(appFile);
		if (lines != null){
			for (var i=0; i < lines.length; i++){
				if (lines[i].trim().startsWith(";")){
				   // comment line - ignore this line
				   continue;
				}
				var tmpProfile = splitLine(lines[i],";");
				if (tmpProfile != null){
  				    if (tmpProfile.length == 4){
					    tmpProfile.push("5");
					    applications.push(tmpProfile);
					}
					else if (tmpProfile.length == 5){
					   // ok wait seconds is filled in
					    applications.push(tmpProfile);
					}
					else if (tmpProfile.length == 6){
					   // ok wait seconds is filled in
					    applications.push(tmpProfile);
					}
				}
				else {
					log("ERROR: Invalid line " + lines[i]);
				}
			}
		}
	}
	else {
		alert("Applications file " + appFile + " not found!");
	}
}

function writeFile(fileName, data, overwrite) {
	// file is nsIFile, data is a string
	var file = new FileUtils.File(fileName);
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
				   createInstance(Components.interfaces.nsIFileOutputStream);

	// use 0x02 | 0x10 to open file for appending.
	if (overwrite){
		foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	}
	else {
		foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0); 
	}

	// if you are sure there will never ever be any non-ascii text in data you can 
	// also call foStream.write(data, data.length) directly
	var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
					createInstance(Components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, "UTF-8", 0, 0);
	converter.writeString(data);
	converter.close(); // this closes foStream
}

function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file, jstr, true);
}

function initObject(fileNameObject, arrayOfObjects){
	var fileName = fileNameObject.fullPath();
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
		addSetting("login", profileObject.login, DISABLE_LOGGING);
		addSetting("password", profileObject.password, DISABLE_LOGGING);
		retcode = macroPlay("fblogin.iim");
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

function isNullOrBlank(param){
   if (param != null && param != "#EANF#" && param != ""){
      return false;
   }
   return true;
}

function ConfigFile(path, file){
	this.path = path;
	this.file = file;
	this.fullPath = function() { return this.path + this.file};
}

function LogFile(path, fileId){
	this.path = path;
	this.fileId = fileId;
	this.fullPath = function() { return this.path + "log." + this.fileId + "." + (NODE_ID == "" ? "" : NODE_ID + ".") + getDateYYYYMMDD() + ".txt"};
}

