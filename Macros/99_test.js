var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\\MyConstants-0.0.3.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));

var FIGHT_FOLDER = "MR/Fight";
var COMMON_FOLDER = "MR/Common";
var JOB_FOLDER = "MR/Jobs";

getMacrosPath();
var msg = "<img src=\"https://d2swil18r7bmmr.cloudfront.net/img/items/200/bone_dagger.png\" style=\"width: 75px; height: 75px; outline: 1px solid blue;\" class=\"item\" data-id=\"120\">";
var regExp = /src=\"(.*)\" style/;
var matches = msg.match(regExp);
if (matches != null && matches.length > 0){
    var level = matches[1];
}
MR_FIGHTERS_FILE.file = MR_FIGHTERS_FILE.file + ".json";
var fighterObj = initObject(MR_FIGHTERS_FILE);
var testObj = findFighter(fighterObj.fighters, "135578150533601");
alert (testObj.name);
writeObject(fighterObj, MR_FIGHTERS_FILE);


    function findFighter(list, id){
        var obj = null;
        list.forEach( function (arrayItem)
        {
            if (arrayItem.id == id){
                obj = arrayItem;
                return;
            }
        });
        return obj;
    }

function extractFilename (str) {
    return str.split('\\').pop().split('/').pop();
}

function randomNumber (from, to){
   var upper = to - from+1;
   var lower = 0;
   var random = Math.floor((Math.random()*upper))+from;
   return random;
}

function bossFight(){
	var retCode = initBossFight();
	if (retCode == 1){
		var exitLoop = true;
		do {
			//exitLoop = true;
			var health = getHealth();
			if (health > 1800){
				var st = attack();
				if (st == 1){
					exitLoop = false;
				}
				else if (st == -921){
					exitLoop = false;
					iimPlay(prefix + "MWBossFight_90_Close.iim");
					retCode = initBossFight();
					if (retCode != 1){
						exitLoop = true;
					}
				}
				else {
					exitLoop = true;
				}
			}
			else {
				heal();
			}
		}
		while (!exitLoop);
	}
	else {
		logV2(INFO, "TEST", "Problem Init BossFight", "C:\\tmp\\bossfight.txt");
	}
}

function initBossFight(){
	var health = 0;
	do {
		heal();
		health = getHealth();
	}
	while (health < 1800);
	var retCode = iimPlay(prefix + "MWBossFight_01_Init.iim");
	return retCode;
}

function attack(){
	logV2(INFO, "TEST", "Attacking...", "C:\\tmp\\bossfight.txt");
	var retCode = iimPlay(prefix + "MWBossFight_30_Attack.iim");
	logV2(INFO, "TEST", "AttackStatus = " + retCode, "C:\\tmp\\bossfight.txt");
	return retCode;
}

function heal(){
	logV2(INFO, "TEST", "Healing...", "C:\\tmp\\bossfight.txt");
	iimPlay(prefix + "MWBossFight_10_Heal.iim");
}

function getHealth(){
	iimPlay(prefix + "MWBossFight_20_GetHealth.iim");
	var healthInfo = iimGetLastExtract(1);
	logV2(INFO, "TEST", "healthInfo = " + healthInfo, "C:\\tmp\\bossfight.txt");
	if (!isNullOrBlank(healthInfo)){
		var tmp = healthInfo.split("/");
		//alert(tmp[0] + "/" + tmp[1]);
		var health = parseInt(tmp[0]);
		return health;
	}
	return 0;
}

function test(){
var retcode = 1;
var exitLoop = false;
var counter = 0;
var total = 0;
do {
	retcode = iimPlay("tmp/MWAddOnLogIn.iim");
	if (retcode == 1){
	   // not logged in
	   counter++;
	   if (counter > 50){
		counter=0;
		logV2(INFO, "TEST", "Total Login attempts: " + total, "C:/tmp/logins.txt");
	   }
	   total++;
	}
	else {
		// logged in
		exitLoop = true;
	}
}
while (!exitLoop);

}

function getActiveCity(citiesToScan){
	for (var i=0; i < citiesToScan.length; i++){
		if (!isNullOrBlank(citiesToScan[i].travelId)){
			iimSet("city", citiesToScan[i].travelId);
			iimPlay("MafiaWars/Common/MWGetCity.iim");
			var info = iimGetLastExtract(1);
			if (isNullOrBlank(info)){
				return citiesToScan[i].travelId;
			}
		}
	}
	return null;
}

function getDefaultCity(citiesToScan){
	var defaultCity = "";
	for (var i=0; i < citiesToScan.length; i++){
		if (!isNullOrBlank(citiesToScan[i].travelId)){
			if (citiesToScan[i].default){
				return citiesToScan[i].travelId;
			}
		}
	}
	return null;
}

function travelToCity(citiesToScan, travelId){
	var activeCity = getActiveCity(citiesToScan);
	if (isNullOrBlank(activeCity) || activeCity != travelId){
		iimSet("city", travelId);
		var retcode = iimPlay("Startup/Job/MWTravelToCity.iim");
		logV2(INFO, "TEST", "City to Travel to: " + travelId + " - ReturnCode: " + retcode);
	}
	else {
		logV2(INFO, "TEST", "No Travel necessary, active city = " + activeCity);
	}
}


Components.utils.import("resource://gre/modules/FileUtils.jsm");
//cmObject = initObject(CRAFTMANAGER_FILE);
//initializeCraftManager(cmObject);
//selectJobsForCityDistrictType("11", "9", "CASH");

var url = "https://www.facebook.com/malin.cole/allactivity?log_filter=app_10979261223";

		
function jobMaster(){

	var object = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmsettings");
	for (var key in object.storage){
		if (object.storage.hasOwnProperty(key)){
			logV2(INFO, "TEST", key);
		}
	}
}

function addJobProfile(){
	var object = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmsettings");
	var jpObj = initObject("C:\\My Programs\\iMacros\\config\\tmp\\JobMasterProfile.json");
	jpObj.selectedJobs["c11j7"] = true;
	jpObj.jobCities["11"] = true;
	// jobrules
	// 1 = not mastered
	// 2 = experience
	// 3 = cash
	// 4 = consumable
	jpObj.ruleset["3"] = true;
	jpObj.ruleset["4"] = true;
	jpObj.jobRules = [2,3,4,1,5,6];
	object.storage["Mex0110"] = jpObj;
	writeObject (object, "C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmsettings.NEW");
}

function getJobs(){
	var object = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmsettings");
	var jobDataObject = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmdata");
	var jobs = [];
	var selectedJobsObj = object.storage["mexicodistrict0610"].selectedJobs;
	for (var key in selectedJobsObj){
		if (selectedJobsObj.hasOwnProperty(key)){
			if (selectedJobsObj[key] == true){
				jobs.push(key);
			}
		}
	}
	for (var i=0; i < jobs.length; i++){
		logV2(INFO, "TEST", jobs[i]);
		getJobInfo(jobDataObject, jobs[i]);
		
	}
}

function selectJobsForCityDistrictType(city, district, type){
	//var object = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmsettings");
	var jobDataObject = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmdata");
	var jpObj = initObject("C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmopt");
	jpObj.selectedJobs = {};
	var jobs = jobDataObject.jobTree[city][district];
	jpObj.jobCities[city] = true;
	for (var i=0; i < jobs.length; i++){
		var job = jobDataObject.jobs[jobs[i]];
		logV2(INFO, "TEST",job.title);
		if (checkJobType(job, type)){
			jpObj.selectedJobs[job.id] = true;
		}
	}
	writeObject (jpObj, "C:\\My Programs\\iMacros\\config\\tmp\\FBMWAddon_114369514_jmopt.NEW");
}
	
function checkJobType(job, type){
	switch (type){
		case "CONSUMABLE":
			if (job.pays.consumable != null && job.pays.consumable.length > 0){
				for (var tmp=0; tmp < job.pays.consumable.length; tmp++){
					if (job.pays.consumable[tmp].type == "consumable"){
						logV2(INFO, "TEST", "Consumable: " + job.pays.consumable[tmp].name);
						return true;
					}
				}
			}
			break;
		case "CASH":
			if (job.pays.cash != null && job.pays.cash.type == "cash"){
				logV2(INFO, "TEST", "Cash: " + job.pays.cash.value);
				return true;
			}
			break;
		default:
			break;
	}
	return false;
}
		
function getJobInfo(jobDataObject, jobId){
	var value = jobDataObject.jobs[jobId];
	if (value != null){
		logV2 (INFO, "TEST", value.city + " - " + value.title);
		if (value.uses["energy"] != null) {
			logV2 (INFO, "TEST", "Energy: " + value.uses.energy.value);
		}
		else {
			logV2 (INFO, "TEST", "Stamina: " + value.uses.stamina.value);
		}
		logV2 (INFO, "TEST", "Experience: " + value.pays.experience.value);
		logV2 (INFO, "TEST", "District: " + value.stage + " - " + jobDataObject.districts["11"][value.stage]);
	}
}
				
 function getTab()
        {
            //var doc = window.opener.gBrowser.contentDocument; //Gets the current document.
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
			var mainWindow = wm.getMostRecentWindow("navigator:browser");
			var doc = mainWindow.gBrowser.contentDocument; 
            var tab = null;
            var targetBrowserIndex = mainWindow.gBrowser.getBrowserIndexForDocument(doc);
            if (targetBrowserIndex != -1)
            tab = mainWindow.gBrowser.tabContainer.childNodes[targetBrowserIndex];
            else
            return(null);
            return(tab.linkedPanel);
        }

function getMaxTabsOpen(){
var w=Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getEnumerator('navigator:browser'),t=0;
while(w.hasMoreElements())
	t+=w.getNext().document.getElementById("content").mTabs.length;
return t;
}

function removeCustomAlert() {
    document.getElementsByTagName("body")[0].removeChild(document.getElementById("modalContainer"));
}




function strangerSwag(){
	var retcode = iimPlay("tmp/MWStrangerSwagExtractUrl.iim");
	if (retcode == 1){
		var url = iimGetLastExtract(1);
		alert("url1 = " + url);
		if (isNullOrBlank(url)){
			logV2(ERROR, "TEST", "StrangerSwag Problem getting url");
		}
		else {
			url = extractUrlFromHtml(url);
			alert(url);
			logV2(INFO, "TEST", "StrangerSwag Url : " + url);
		}
	}
	else {
		alert("Prob");
		logV2(ERROR, "TEST", "There was a problem checking LuckyBreak Reveal");
	}
}

function decodeHtml(tmp){
   var tmp2 = tmp.replace(/&amp;/g, "&");
   tmp2 = tmp2.replace(/,/g, "%2C");
   return tmp2;
}

function getEmptyProfile(){
   return {"id":"","mwId":"","fbId":"","login":"","password":"", "alias":"","fbName":"","enabled":true,"fbList":"","linkFbListId":""}
}

// this function returns a profile object
function lookupProfile(profileId){
   for (var i=0; i < profileArray.length; i++){
      if (profileArray[i].id == profileId){
	     return profileArray[i];
	  }
   }
   return null;
}

function initMW(){
	bfObject = {
		"strangerSwag":{"enabled":false,"enabledList":true},
		"askRedeem":false,
		"objectAsk":false,
		"doubleLoot":false,
		"collectRob":false
	}
	bfObject["strangerSwag.enabled"] = true;
	bfObject["testBf"] = "123";
}

function getPropertyPartId(listOfPartIds, listOfPartNames){
	var today = new Date();
	var nrOfElements = listOfPartNames.length;
	if (listOfPartIds != null && listOfPartIds != ""){
	   nrOfElements = listOfPartIds.length;
	}
	var daynum = today.getDOY() % nrOfElements;
	var partId = parseInt(listOfPartIds.substr(daynum, 1));
	alert(nrOfElements);
	return listOfPartNames[partId-1];
}

function craftManager(profile, mwID){

	var configFile = CONFIG_DIR + "CraftManager.ini";
	var nyProperties = []; var found = false;
	var jstr= '{"toggleSelected":false,"nyActiveProperties":[],"build":{},"enabled":{}}';
	var myObject = JSON.parse(jstr);
	var property = ""; var logInfo = "";
	if (!fileExists(configFile)) {
		log("ERROR: Problem reading " + configFile);
		return -1;
	}
	var lines = readFile(CONFIG_DIR + "CraftManager.ini");
	if (lines == null || lines.length == 0){
		log("ERROR: Problem reading " + configFile);
		return -1;
	}
	for (var cmLineNr = 0; cmLineNr < lines.length; cmLineNr++){
		var line = lines[cmLineNr].trim();
		if (line.startsWith("[")){
			if (profile == line.substr(1)){
				found = true;
				continue;
			}
			else {
				found = false;
			}
		}
		if (found == true){
			//log(profile + " " + line);
			// start reading the ini part
			var fields = splitLine(line, "=");
			var subFields = splitLine(fields[1], ",");
			if (line.startsWith("ny_")){
				property = fields[0].substr(3);
				if (subFields[0] == "1"){
					nyProperties.push(property);
				}
			}
			else {
				property = fields[0];
			}
			myObject.enabled[property] = (subFields[0] == "1");
			var level = parseInt(subFields[1]);
			myObject.build[property] = level-1;
			log("INFO: Adding property " + property + " / " + subFields[0] + " / level = " + subFields[1]);
		}
	}
	//var myObject = JSON.parse(jstr);
	myObject.nyActiveProperties = nyProperties;
	log(JSON.stringify(myObject));
	var cmopt = encodeBase64(JSON.stringify(myObject));
	changeFirefoxSetting("extensions.mwaddonclient.", "userscriptFBMWAddon_" + mwID + "_cmopt", FF_SETTING_PREFIX + cmopt);
}

function delCookies() {
	var c=content.document.cookie.split(";");
	for(var i=0;i<c.length;i++){
		var e=c[i].indexOf("=");
		var n=e>-1?c[i].substr(0,e):c[i];
		log(n);
		content.document.cookie=n+"=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	}
}

function importFirefoxSettings(){
	filename = DATASOURCE_DIR + "settings\\" + "MWAddOn.firefox.settings";
	if (fileExists(filename)){
		var lines = readFile(filename);
		for (var i=0; i < lines.length; i++){
			if (!lines[i].startsWith(";")){
				var fields = splitLine(lines[i], "|");
				//alert(fields[0] + "*****" + fields[1]);
				//changeFirefoxSetting("extensions.mwaddonclient.", fields[0], fields[1]);
			}
		}
	}
	else {
		alert(filename + " does not exist!");
	}
}

function exportFirefoxSettings(){

	var filename;
	var value;
	var key = "userscriptFBMWAddon_";
	var subkey = "";

	var keys = ["bfopt", "cmopt", "fgopt", "main", "mgopt", "plugins", "rbopt", "reminder"];

	filename = DATASOURCE_DIR + "settings\\" + "MWAddOn.firefox.settings";
	if (fileExists(filename)){
		deleteFile(filename);
	}
	for (var i=0; i < profileArray.length; i++){
		
		for (var j=0; j < keys.length; j++){
			subkey = key + profileArray[i][1] + "_" + keys[j];
			try {
				value = getFirefoxSetting("extensions.mwaddonclient.",  subkey);
				saveMacroInfo(filename, ";" + keys[j]);
				saveMacroInfo(filename, "userscriptFBMWAddon_" + subkey + "|" + value);
			}
			catch (err) {}
		}
	}
}

function changeFirefoxSetting(branch, key, value){

var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);

//var value = prefs.getCharPref("userscriptFBMWAddon_143980259_fgopt", Components.interfaces.nsISupportsString);
prefs.setCharPref(key, value);
}

function listFiles(directoryName, filter, excludeFilter){
	// file is the given directory (nsIFile)
	var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
	directory.initWithPath(directoryName);
	var entries = directory.directoryEntries;
	var array = [];
	while(entries.hasMoreElements())
	{
	  var entry = entries.getNext();
	  entry.QueryInterface(Components.interfaces.nsIFile);
	  if (entry.isFile()){
	    if (filter == null || entry.path.contains(filter)){
			if (excludeFilter == null) {
				array.push(entry.path);
			}
			else {
				var excluded = false;
				for (var i=0; i < excludeFilter.length; i++){
					if (entry.path.contains(excludeFilter[i])){
					   excluded = true;
					   break;
					}
				}
				if (!excluded){
					array.push(entry.path);
				}
			}
		}
	  }
	}
	return array;
}

function getUniqueFileName(sourceDir, filename){

	var uniqueFileName = filename;
	var i=0;
	var ext = "";
	while (fileExists(sourceDir + uniqueFileName) && i < 1000){
		ext = pad(i.toString(), 3);
		i++;
		uniqueFileName = filename + "." + ext;
	}
	if (i >= 1000) {
		return null;
	}
	return uniqueFileName;
}

function executeUrl(profile, csvFile){
	var line = 1;
	var url;
	var retcode;
	var txt;
	
	log("Processing file " + csvFile);
	
	do {
	   iimSet("line",line.toString());
	   iimSet("file", csvFile);
	   iimPlay("readCSV.iim");
	   url = iimGetLastExtract(1);
	   if (url != null && url.length > 0){
	   
		   iimSet("url",url);
		   retcode = iimPlay("fbExecuteUrl.iim");
		   if (retcode != 1){
			  log("Problem executing url " + url);
		   }
		   if (csvFile.contains(LTP_EXT)){
				
				var ret = getResponseFromUrl();
				if (ret == 1 || ret == 2 || ret == 3){
					// ignore it
					log (ret + " = " + url);
				}
				else if (ret == 4){
					// ignore rest of this file
					log ("4 = " + url);
				}
				else if (ret == 5){
					// save it to retry later
					log ("5 = " + url);
					var filename = csvFile.replace(/^.*[\\\/]/, '');
					saveMacroInfo(filename, "1" + ";" + "ltp" + ";" + url);
				}
				else {
					// unknown - not sure what to do with it
					log ("-1 = " + url);
				}
			}
			iimPlay("fbClose.iim");
			line++;
	   }
	}
	while (url != null && url.length > 0);
}


// public method for decoding
function decodeBase64 (input) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	while (i < input.length) {

		enc1 = _keyStr.indexOf(input.charAt(i++));
		enc2 = _keyStr.indexOf(input.charAt(i++));
		enc3 = _keyStr.indexOf(input.charAt(i++));
		enc4 = _keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}

	}

	//output = _utf8_decode(output);

	return output;
}

 function _utf8_decode (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
}

function encodeBase64(input) {
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	input = _utf8_encode(input);

	while (i < input.length) {

		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output +
		_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
		_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	}
	return output;
}

function _utf8_encode (string) {
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++) {

		var c = string.charCodeAt(n);

		if (c < 128) {
			utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}

	}
	return utftext;
}

function splitLine(line){
	   var fields = null;
	   if (line != null && line != ""){
		   fields = line.split(";");
	   }
	   return fields;
}

function splitLine(line, seperator){
	   var fields = null;
	   if (line != null && line != ""){
		   fields = line.split(seperator);
	   }
	   return fields;
}

function checkAndSplitLine(line, seperator, nrOfFields){

   var fields = splitLine(line, seperator);
   if (fields == null || fields.length != nrOfFields){
      return null;
   }
   return fields;
}

function initializeCraftManager(cmObject){

	var jstr= '{"toggleSelected":false,"nyActiveProperties":[],"build":{},"enabled":{}}';
	var property = "";
	
	for (var cmLineNr = 0; cmLineNr < cmObject.profiles.length; cmLineNr++){
		var nyProperties = []; 
		var myObject = JSON.parse(jstr);
		var cmProfileObject = cmObject.profiles[cmLineNr];
		log("INFO: Initialzing CraftManager for profile " + cmProfileObject.profileId);
		for (var pp=0; pp < cmProfileObject.nyProperties.length; pp++){
			if (cmProfileObject.nyProperties[pp].active){
				log("INFO: nyPropertyId = " + cmProfileObject.nyProperties[pp].id + " / level = " + cmProfileObject.nyProperties[pp].level);
				property = findNewYorkPropertyById(cmObject, cmProfileObject.nyProperties[pp].id);
				if (property != null){
					nyProperties.push(property.id);
					myObject.enabled[property.id] = true;
					var level = parseInt(cmProfileObject.nyProperties[pp].level);
					myObject.build[property.id] = level-1;
				}
			}
		}
		enableProperty(myObject, cmObject.london.nightclub.id, cmProfileObject.london.nightclub.enabled, cmProfileObject.london.nightclub.level);
		enableProperty(myObject, cmObject.london.eastEndPub.id, cmProfileObject.london.eastEndPub.enabled, cmProfileObject.london.eastEndPub.level);
		enableProperty(myObject, cmObject.chicago.warehouse.id, cmProfileObject.chicago.warehouse.enabled, cmProfileObject.chicago.warehouse.level);
		enableProperty(myObject, cmObject.chicago.speakEasy.id, cmProfileObject.chicago.speakEasy.enabled, cmProfileObject.chicago.speakEasy.level);
		enableProperty(myObject, cmObject.brazil.blackMarket.id, cmProfileObject.brazil.blackMarket.enabled, cmProfileObject.brazil.blackMarket.level);
		enableProperty(myObject, cmObject.brazil.workShop.id, cmProfileObject.brazil.workShop.enabled, cmProfileObject.brazil.workShop.level);
		enableProperty(myObject, cmObject.southAfrica.rdLab.id, cmProfileObject.southAfrica.rdLab.enabled, cmProfileObject.southAfrica.rdLab.level);

		myObject.nyActiveProperties = nyProperties;
		writeObject(myObject, CRAFTMANAGER_FILE + "." + cmProfileObject.profileId);
	}
	
		
	/*
	myObject.nyActiveProperties = nyProperties;
	var cmopt = encodeBase64(JSON.stringify(myObject));
	//changeFirefoxSetting("extensions.mwaddonclient.", "userscriptFBMWAddon_" + mwID + "_cmopt", FF_SETTING_PREFIX + cmopt);
	changeFirefoxSettingNew(mwID, "cmopt", cmopt);*/
}

function enableProperty(myObject, id, enabled, level){
		myObject.enabled[id] = enabled;
		var level = parseInt(level);
		myObject.build[id] = level-1;
}

function findNewYorkPropertyById(cmObject, id){

	if (cmObject.newYork.privateZoo.id == id){
		log("INFO: Enabling Private Zoo");
		return cmObject.newYork.privateZoo;
	}
	if (cmObject.newYork.chopShop.id == id){
		log("INFO: Enabling Chop Shop");
		return cmObject.newYork.chopShop;
	}
	if (cmObject.newYork.weaponsDepot.id == id){
		log("INFO: Enabling Weapons Depot");
		return cmObject.newYork.weaponsDepot;
	}
	if (cmObject.newYork.armory.id == id){
		log("INFO: Enabling Armory");
		return cmObject.newYork.armory;
	}
	if (cmObject.newYork.jailhouse.id == id){
		log("INFO: Enabling Jailhouse");
		return cmObject.newYork.jailhouse;
	}
	for (var ff=0; ff < cmObject.newYork.otherProperties.length; ff++){
		if (cmObject.newYork.otherProperties[ff].id == id) {
			log("FOUND: " + cmObject.newYork.otherProperties[ff].name);
			return cmObject.newYork.otherProperties[ff];
		}
	}
	return null;
}

function encodeMafiaWarsUrl(url){

if (url == null) return null;
//   var tmpUrl = encodeURIComponent(url);
   //tmpUrl = replaceAll(tmpUrl, "%24", "%2524");
   //tmpUrl = replaceAll(tmpUrl, "(", "%2528");
   //tmpUrl = replaceAll(tmpUrl, ")", "%2529");
   //tmpUrl = replaceAll(tmpUrl, "!", "%2521");
   //tmpUrl = replaceAll(tmpUrl, "*", "%252A");
   //tmpUrl = replaceAll(tmpUrl, "%2C", "%252C");
   //tmpUrl = replaceAll(tmpUrl, "%7C", "%257C");
   //tmpUrl = "https://www.facebook.com/l.php?u=" + tmpUrl;
   //var tmpUrl = replaceAll(tmpUrl, /,/g, "%2C");
   var tmpUrl = url.replace(/,/g, "%2C");
   //var startStr = "https://apps.facebook.com/inthemafia/track.php?";
   //tmpUrl = tmpUrl.replace(startStr, "");
   //tmpUrl = tmpUrl.replace(//g, "%7C");
   tmpUrl = replaceAll(tmpUrl, "|", "%7C");
   tmpUrl = replaceAll(tmpUrl, "$", "%24");
   tmpUrl = replaceAll(tmpUrl, "(", "%28");
   tmpUrl = replaceAll(tmpUrl, "!", "%21");
   tmpUrl = replaceAll(tmpUrl, "*", "%2A");
   tmpUrl = replaceAll(tmpUrl, "!", "%21");
   tmpUrl = replaceAll(tmpUrl, "!", "%21");
   tmpUrl = replaceAll(tmpUrl, "!", "%21");
   //tmpUrl = startStr + tmpUrl;
   return tmpUrl;
}

function replaceAll(string, find, replace) {
  return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function extractUrlFromHtml(htmlCode){
	var START_LINK = "link:";
	if (htmlCode == null) return null;
	var start = htmlCode.search(START_LINK);
	logV2(INFO, "INIT", "Start = " + start);
	if (start < 0) {
	   return null;
	}
	var end = htmlCode.search("', name:'");
	var url = htmlCode.substr(start+START_LINK.length+1, end-start-START_LINK.length-1);
	url = decodeHtml(url);
	return url;
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
