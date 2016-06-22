//saveLocalFile("c:\\temp\\test.txt", "test123");
//createDirectory("c:\\temp\\eric");

var DATASOURCE_DIR = "C:\\My Programs\\iMacros\\Datasources\\";
var BASE_DIR = "C:\\My Programs\\iMacros\\";
var CONFIG_DIR  = BASE_DIR + "config\\";
var CONFIG_INI = CONFIG_DIR + "config.ini";
var TMP_DIR = BASE_DIR + "tmp\\";
var PROFILE_FILE = CONFIG_DIR + "profilesV2.json";
var CRAFTMANAGER_FILE = CONFIG_DIR + "CraftManager.json";
var INFO = 0; var ERROR = 1; WARNING = 2;
var LOG_DIR = BASE_DIR + "logs\\";
var LOG_FILE = LOG_DIR + "log." + getDateYYYYMMDD() + ".txt";
var ERROR_LOG = LOG_DIR + "log.ERROR." + getDateYYYYMMDD() + ".txt";

//var MAFIAWARS_FILE = "C:\\My Programs\\OneDrive\\iMacros\\config\\MafiaWarsV2.json";

// construction worker EG+MT
var tmp1 = "data:application/json;base64,eyJ0b2RheSI6MCwiYWNjZXB0R2lmdENvdW50IjowLCJzZW5kR2lmdENvdW50IjowLCJzZW5kQmFjayI6dHJ1ZSwic2VuZEludGVybmFsbHkiOnRydWUsImV4Y2x1ZGVkUGF0dGVybiI6InJlYWNoZWQgeW91ciBsaW1pdHxnb2xkIG1hc3Rlcnl8Y2Fubm90IGFjY2VwdCBtb3JlIiwiZGFpbHlMaW1pdCI6ImNhbm5vdCBhY2NlcHQgYW55IG1vcmUgRnJlZSBHaWZ0cyB0b2RheSIsImV4Y2x1ZGVkR2lmdHMiOnt9LCJhY3RpdmVGcmllbmRzIjp7fSwiY3VzdG9tTGlzdHMiOnsiTXlMaXN0IjpbIjExNzQ5ODA3NTYiLCIxMDAwMDAwMDg3Mzg1MzMiXX0sInVzZXJhY3Rpb25zIjp7fSwic2VsZWN0ZWRHaWZ0cyI6eyI0NTgiOnRydWV9LCJhY3RpdmVGUk1pbiI6MSwiaWdub3JlTGltaXRzIjpmYWxzZSwiaGlkZVVuY2hlY2tlZCI6dHJ1ZX0=";
var tmp2 = "eyJ0b2RheSI6MCwiYWNjZXB0R2lmdENvdW50IjowLCJzZW5kR2lmdENvdW50IjowLCJzZW5kQmFjayI6dHJ1ZSwic2VuZEludGVybmFsbHkiOnRydWUsImV4Y2x1ZGVkUGF0dGVybiI6InJlYWNoZWQgeW91ciBsaW1pdHxnb2xkIG1hc3Rlcnl8Y2Fubm90IGFjY2VwdCBtb3JlIiwiZGFpbHlMaW1pdCI6ImNhbm5vdCBhY2NlcHQgYW55IG1vcmUgRnJlZSBHaWZ0cyB0b2RheSIsImV4Y2x1ZGVkR2lmdHMiOnt9LCJhY3RpdmVGcmllbmRzIjp7fSwiY3VzdG9tTGlzdHMiOnsiTXlMaXN0IjpbIjExNzQ5ODA3NTYiLCIxMDAwMDAwMDg3Mzg1MzMiXX0sInVzZXJhY3Rpb25zIjp7fSwic2VsZWN0ZWRHaWZ0cyI6eyI0NTgiOnRydWV9LCJhY3RpdmVGUk1pbiI6MSwiaWdub3JlTGltaXRzIjpmYWxzZSwiaGlkZVVuY2hlY2tlZCI6dHJ1ZX0=";
var LTP_EXT = "_LTP.csv";
var FF_SETTING_PREFIX = "data:application/json;base64,";


var PROFILE_ERIC = "00_ERIC";
var PROFILE_AMALIN = "01_AMALIN";
var PROFILE_AARON = "02_AARON";
var PROFILE_AJORIS = "03_AJORIS";
var PROFILE_EG = "04_EG";
var PROFILE_MT = "05_MT";

var profileArray = [];
profileArray[0] = [PROFILE_ERIC, "47155432"];
profileArray[1] = [PROFILE_AMALIN, "48797921"];
profileArray[2] = [PROFILE_AARON, "69892133"];
profileArray[3] = [PROFILE_AJORIS, "84363679"];
profileArray[4] = [PROFILE_EG, "143980259"];
profileArray[5] = [PROFILE_MT, "114369514"];

//document.cookie = 'facebook.com=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
//javascript:document.cookie = 'facebook.com=; expires=Thu, 01-Jan-70 00:00:01 GMT;'
//var generator=window.open('','name','height=400,width=500');
//generator.document.write('<p>THIS IS ONLY A TEST</p>');
//content.document.cookie = 'about.com=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
//deleteCookie("facebook.com");
//alert(getCookie("about.com"));
//content.document.cookie = "facebook.com=; path=/";
//alert(content.document.cookie.length);

var macroSettings = [];

Date.prototype.getDOY = function() {
var onejan = new Date(this.getFullYear(),0,1);
return Math.ceil((this - onejan) / 86400000);
} 

var cmObject = {};
var profileArray = [];
var profileObject;
//initProfiles();
//var mwObj = initObject(MAFIAWARS_FILE);

var prefix = "MafiaWars/BossFight/";
var info = "<div class=\"boss-city-hud-generic-ch boss-city-hud-generic-ch-2 _inactive\" style=\"outline: 1px solid blue;\"><div class=\"title-txt\">";
var nr = Math.floor((Math.random() * 5) + 1); 
var info = "3.03K";
				var tmpInfo = replaceAll(info, "/", ",");
				tmpInfo = replaceAll(tmpInfo, "K", "");
var energy =  parseFloat(tmpInfo)*1000;
alert(energy);

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

function initProfiles(){
	var profileObject = getEmptyProfile();
	//profileObject.id = "00_ERIC";
	//profileObject.linkFbListId = "03_AJORIS";
	//profileArray.push(profileObject);
	//profileObject = getEmptyProfile();
	//profileObject.id = "01_AMALIN";
	//profileArray.push(profileObject);
	//profileObject = getEmptyProfile();
	//profileObject.id = "02_AARON";
	//profileArray.push(profileObject);
	//profileObject = getEmptyProfile();
	//profileObject.id = "03_AJORIS";
	//profileArray.push(profileObject);
	
	log("INFO: Processing Profile file " + PROFILE_FILE);
	if (fileExists(PROFILE_FILE)){
		var lines = readFile(PROFILE_FILE);
		if (lines != null){
			for (var i=0; i < lines.length; i++){
			   if (lines[i] != null && lines[i].trim != ""){
					alert("+" + lines[i] + "+");
					var profileObject = JSON.parse(lines[i]);
					profileArray.push(profileObject);
			   }
			}
		}
	}
	else {
		alert("Profile file " + PROFILE_FILE + " not found!");
	}
	
	
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

function eShopPRS(){

	for (var i=0; i < 300; i++){
		macroPlay("other/eShopGetOrderNr.iim");
		var orderNr = iimGetLastExtract(1);
		orderNr = orderNr.trim();
		iimDisplay (i.toString() + " " + orderNr);
		if (orderNr == "10743820" || orderNr =="10743821") {
			break;
		}
		macroPlay("other/eShopGetPRSId.iim");
		var prs = iimGetLastExtract(1);
		if (prs == ""){
			// zet op on hold
			macroPlay("other/eShopPRSOnHold.iim");
		}
		else {
			macroPlay("other/eShopPRSSave.iim");
		}
	}
}

function addSetting(setting , value){
	var tmpArray = [setting, value];
	macroSettings.push(tmpArray);
}

	
function testLogin(){

var retcode = 0;
for ( var i=0; i < 50; i++){
	iimSet("login","eric.ghyssens@dommel.be");
	iimSet("password", "toiki123");
	iimPlay("fbLogin.iim");
	retcode = iimPlay("fbLogoff.iim");
	log("nr of logins = " + i);
	if (retcode != 1){
		break;
	}
}


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

function getBase64Gifts(){
	var jstr = '{"today":0,"acceptGiftCount":0,"sendGiftCount":0,"sendBack":true,"sendInternally":true,"excludedPattern":"reached your limit|gold mastery|cannot accept more","dailyLimit":"cannot accept any more Free Gifts today","excludedGifts":{},"activeFriends":{},"customLists":{"MyList":[]},"useractions":{},"selectedGifts":{},"activeFRMin":1,"ignoreLimits":false,"hideUnchecked":true}';
	//var jstr = '{"today":0,"acceptGiftCount":0,"sendGiftCount":0,"sendBack":true,"sendInternally":true,"excludedPattern":"reached your limit|gold mastery|cannot accept more","dailyLimit":"cannot accept any more Free Gifts today","excludedGifts":{},"activeFriends":{},"customLists":{"MyList":["1174980756","100000008738533"]},"useractions":{},"selectedGifts":{},"activeFRMin":1,"ignoreLimits":false,"hideUnchecked":true}';
	var myObject = JSON.parse(jstr);
	var gifts = "100 redbag";
	var giftArray = splitLine(gifts, " ");
	for (var i=0; i < giftArray.length; i++){
		if (giftArray[i].trim() != ""){
			myObject.selectedGifts[giftArray[i].trim()] = true;
		}
	}
	var tmpArray = splitLine("123 456", " ");
	for (var i=0; i < tmpArray.length; i++){
		myObject.customLists.MyList.push(tmpArray[i]);
	}
	//myObject.customLists.MyList = ["123", "456"];
	alert(JSON.stringify(myObject));
	return encodeBase64(JSON.stringify(myObject));
}

function deleteCookie(name)
{
var exp=new Date();
exp.setTime(exp.getTime()-1);
var cookieval=getCookie(name);
content.document.cookie = name + "=" + cookieval; 
alert(cookieval);
expires= exp.toGMTString();
}

function getCookie(name)
{
var arg1 = name + "=";
var arg2 = arg1.length;
content.document.cookie = name; 
var arg3 = content.document.cookie.length;
var i = 0;
while(i < arg3)
{
var j = i + arg2;
if (content.document.cookie.substring(i,j) == arg1)
return getCookieVal(i);
i = content.document.cookie.indexOf(" ", i) + 1;
if (i == 0) break;
}
return null;
}

function getCookieVal(args4)
{
var endstr=content.document.cookie.indexOf(";",args4);
if(endstr==-1)
{
endstr=content.document.cookie.length;
}
return unescape(content.document.cookie.substring(args4,endstr));
}

function encodeGifts(){

	var tmp = "{\"today\":1,\"acceptGiftCount\":0,\"sendGiftCount\":1,\"sendBack\":true,\"sendInternally\":true,\"excludedPattern\":\"reached your limit|gold mastery|cannot accept more\",\"dailyLimit\":\"cannot accept any more Free Gifts today\",\"excludedGifts\":{},\"activeFriends\":{},\"customLists\":{\"MyList\":[\"1174980756\",\"100000008738533\"]},\"useractions\":{},\"selectedGifts\":%GIFTS%,\"activeFRMin\":1,\"ignoreLimits\":false,\"hideUnchecked\":true}";
	var gifts = "{\"100\":true,\"422\":true,\"redbag\":true,\"400\":true}";
	var prefix = "data:application/json;base64,";
	tmp = tmp.replace("%GIFTS%", gifts);
	dec = encodeBase64(tmp);
	alert(dec);
}

function removePath(filename){
	var strippedFilename = null;
	if (filename != null){
	}
	return strippedFilename;
}


function tmp1(){
	var excludeFilter = [".PROCESSING", ".DONE"];
	var listOfFiles = listFiles(DATASOURCE_DIR, "MWConfig.ini.", excludeFilter);
	if (listOfFiles != null && listOfFiles.length > 0){
		listOfFiles.sort();
		for (var i=0; i < listOfFiles.length; i++){
			alert(listOfFiles[i]);
		}
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

function getFirefoxSetting(branch, key){

var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);

var value = prefs.getCharPref(key, Components.interfaces.nsISupportsString);
return value;
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

function getResponseFromUrl(){
	
	var ret = -1;
	var retcode = 0;
	iimSet("text", "You");
	retcode = iimPlay("MWLimitedTimePropertiesGetResponse.iim");
	var txt = null;
	txt=iimGetLastExtract(1).trim();
	if (txt != "#EANF#"){
		log(txt);
		if (txt.startsWith("You have already sent 10 parts today")) return 0;
		if (txt.startsWith("You gave your friend")) return 1;
		if (txt.startsWith("Your Friend just received")) return 2;
		if (txt.startsWith("You have already sent parts from this feed")) return 3;
		return -1;
	}
	else {
		iimSet("text", "All rewards from this feed");
		retcode = iimPlay("MWLimitedTimePropertiesGetResponse.iim");
		txt=iimGetLastExtract(1);
		if (txt != "#EANF#"){
			return 4;
		}
		else {
			iimSet("text", "Thanks for helping");
			retcode = iimPlay("MWLimitedTimePropertiesGetResponse.iim");
			txt=iimGetLastExtract(1);
			if (txt != "#EANF#"){
				return 5;
			}
			else {
				iimSet("text", "This feed has expired");
				retcode = iimPlay("MWLimitedTimePropertiesGetResponse.iim");
				txt=iimGetLastExtract(1);
				if (txt != "#EANF#"){
					return 6;
				}
				else {
					return -1;
				}
			}
		}
	}
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

function changeSet(){
// prefs is an nsIPrefBranch

// Example 1: getting Unicode value
var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.mwaddonclient.");
//alert(prefs.getBoolPref("cookieonstart"));
//alert(value);
// select construction worker only
var tmp="data:application/json;base64,eyJ0b2RheSI6NiwiYWNjZXB0R2lmdENvdW50IjowLCJzZW5kR2lmdENvdW50Ijo0LCJzZW5kQmFjayI6dHJ1ZSwic2VuZEludGVybmFsbHkiOnRydWUsImV4Y2x1ZGVkUGF0dGVybiI6InJlYWNoZWQgeW91ciBsaW1pdHxnb2xkIG1hc3Rlcnl8Y2Fubm90IGFjY2VwdCBtb3JlIiwiZGFpbHlMaW1pdCI6ImNhbm5vdCBhY2NlcHQgYW55IG1vcmUgRnJlZSBHaWZ0cyB0b2RheSIsImV4Y2x1ZGVkR2lmdHMiOnt9LCJhY3RpdmVGcmllbmRzIjp7fSwiY3VzdG9tTGlzdHMiOnsiTXlMaXN0IjpbIjEwMDAwMDAwODczODUzMyJdfSwidXNlcmFjdGlvbnMiOnt9LCJzZWxlY3RlZEdpZnRzIjp7IjQ1OCI6dHJ1ZX0sImFjdGl2ZUZSTWluIjoxLCJpZ25vcmVMaW1pdHMiOmZhbHNlLCJoaWRlVW5jaGVja2VkIjp0cnVlfQ==";

var value = prefs.getCharPref("userscriptFBMWAddon_143980259_fgopt", Components.interfaces.nsISupportsString);
prefs.setCharPref("userscriptFBMWAddon_143980259_fgopt", tmp);

//extensions.mwaddonclient.userscriptFBMWAddon_114369514_fgopt

//alert(value);
// Example 2: setting Unicode value
//var str = Components.classes["@mozilla.org/supports-string;1"]
//      .createInstance(Components.interfaces.nsISupportsString);
//str.data = "some non-ascii text";
//prefs.setComplexValue("preference.with.non.ascii.value", 
//      Components.interfaces.nsISupportsString, str);
}



function totest() {

var mwConfig = "";
var listConfig = "";
var profileArray = [];
var SIMULATION = false;
profileArray[0] = ["00_ERIC", "ghyssens.eric@gmail.com", "Yorki1997", true, null, null];
profileArray[1] = ["01_AMALIN", "yorki.dummy04@dommel.be", "toiki123", true, null, null];
profileArray[2] = ["02_AARON", "dummy01@dommel.be", "toiki123", true, null, null];
profileArray[3] = ["03_AJORIS", "dummy02@dommel.be", "toiki123", true, null, null];
profileArray[4] = ["04_EG", "eric.ghyssens@dommel.be", "toiki123", true, null, null];
profileArray[5] = ["05_MT", "lorang.marie.therese@dommel.be", "gizmo1952", true, null, null];

var lines = readMWFile("C:\\My Programs\\iMacros\\Datasources\\MWConfig.ini");
//window.document.write("Hello World");
for (var i = 0; i < lines.length; i++){
	var line = splitLine(lines[i].trim(), "=");
	if (line == null){
		log("WARNING: The following line is ignored : " + lines[i]);
	}
	else {
		switch (line[0]) {
			case "mwconfig": 
				mwConfig = line[1];
				alert("ConfigurationMW = " + mwConfig);
				break;
			case "profile.status":
				var fields = splitLine(line[1], ",");
				if (fields != null && fields.length >= 2){
					var profile = getProfile(fields[0], profileArray);
					alert ("before " + profile);
					profile[3] = fields[1];
					if (fields.length == 3){
						profile[4] = fields[2];
					}
					alert (profile);
				}
				else {
					log("Error with line " + lines[i]);
				}
				break;
			case "profile.status.lists":
				var fields = splitLine(line[1], ",");
				if (fields != null && fields.length >= 2){
					var profile = getProfile(fields[0], profileArray);
					alert ("before " + profile);
					profile[3] = fields[1];
					if (fields.length == 3){
						profile[5] = fields[2];
					}
					alert ("Profile Lists = " + profile);
				}
				else {
					log("Error with line " + lines[i]);
				}
				break;
			case "start" :
			   alert("start");
			   break;
			case "simulation" :
			   if (line[1].toUpperCase() == "TRUE"){
				  SIMULATION = true;
			   }
			   else {
				  SIMULATION = false;
			   }
			   alert("simulation = " + SIMULATION);
			   break;
			case "list" :
				alert("list");
				break;
			case "listconfig" :
				listConfig = line[1];
				alert("listconfig = " + listConfig);
			   break;
			default: 
				log("WARNING : Following line is ignored: " + lines[i]);
				alert(line);
		}
	}
}

for (var i=0; i < profileArray.length; i++){
	var profile = profileArray[i];
	var str = "";
	for (var j=0; j < profile.length; j++){
		str += profile[j] + "|";
	}
	log (str);
}
}

function getProfile(profileID, tmpArray){

   for (var i=0; i < tmpArray.length; i++){
      if (tmpArray[i][0] == profileID){
	     return tmpArray[i];
	  }
   }
   return null;
}
  


function testRandom(){

var myArray2 = [0,0,0,0,0,0,0,0];
for (var i = 0; i < 100; i++){
   myArray2[randomNumber(0,8)]++;
}
alert (myArray2);
}

function readCSV(){
	
	var line=1;
	var url;
	
	do {
	   iimSet("line",line.toString());
	   iimSet("file", "01_AMALIN.csv");
	   retcode = iimPlay("readCSV.iim");
	   //iimDisplay("retcode = " + retcode);
	   url = iimGetLastExtract(1);
	   if (url != null && url.length > 0){
	   
		   iimDisplay("url = " + url);
		   iimSet("url",url);
		   //retcode = iimPlay("fbExecuteUrl.iim");
		   //if (retcode != 1){
			 // log("Problem executing url " + url);
		   //}
		   //screenshot(folder, "ss");
		   //iimPlay("fbClose.iim");
		   line++;
	   }
	}
	while (url != null && url.length > 0);
}

function fileExist(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function renameFile(oldFileName, directory, newFileName) {
        var newDir = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        var oldFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);

        newDir.initWithPath(directory);
		createDirectory(directory);
        oldFile.initWithPath(oldFileName);
		oldFile.moveTo(newDir, newFileName);
        return true;
}


function tmp(){

var retcode = 0;
//for (var i=1; i < 5; i++){
	//iimSet("pos", i.toString());
	retcode = iimPlay("test.iim");
	if (retcode == 1){
		var url = iimGetLastExtract(1);
		var title = iimGetLastExtract(2);
		//alert("Title = " + title + "\nUrl = " + url);
		if (url.substring(0, 5) != "#EANF") {
		   saveMacroInfo("tmp.csv", "1" + ";" + title + ";" + url);
		 }
	}
}

	
// Give 2x Loot Boost

// Help Eric (=> job Help
// Help xxx => War Help
// Send Parts
// Send
// Get Parts
// Join now
// Give and Get One
// Send Lath Strips
// Send English Bricks



// Send energy


// ignore these
// Get Daily Take Reward
// Send Power Pack





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

function saveLocalFile(filename, outputText) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(filename);
        if (file.exists() === false) {
            file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
        }
        var outputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
        outputStream.init(file, 0x04 | 0x10, 420, 0);
        outputStream.write(outputText, outputText.length);
		var newline = "fsdfs\r\n";
        outputStream.write(newline, newline.length);
        outputStream.close();
        return true;
}

function createDirectory(tmpdir) {
        var directory = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        directory.initWithPath(tmpdir);
        if (directory.exists() === false) {
            directory.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 420);
        }
        return true;
}

function saveMacroInfo(csv, outputText) {
        //var filename = "c:\\My Programs\\iMacros\\datasources\\" + csv;
		var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(csv);
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

function pausecomp(ms) {
ms += new Date().getTime();
while (new Date() < ms){}
} 

function log(outputText, filename) {
        //var filename = "C:\\My Programs\\iMacros\\logs\\log.Test.txt";
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

function readIniFileSection(filename, section){

	// open an input stream from file
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	 
	// read lines into array
	var line = {}, lines = [], hasmore, iniLine, found = false;
	do {
	  hasmore = istream.readLine(line);
	  iniLine = line.value.trim();
	  if (found == true){
		if (iniLine.startsWith("[")){
			hasmore = false;
		}
		else {
			if (iniLine != ""){
				lines.push(iniLine);
			}
		}
	  }
	  else if (iniLine == "[" + section + "]") {
		found = true;
	  }
	  
	} while(hasmore);
	 
	istream.close();
	
	return lines;

}

function getIniParameter(iniLines, key){
	for (var nrOfLines=0; nrOfLines < iniLines.length; nrOfLines++){
		var fields = splitLine(iniLines[nrOfLines], "=");
		if (fields.length == 2){
			if (fields[0] == key){
				return fields[1];
			}
		}
		else {
			log("WARNING: Invalid Line " + iniLines[nrOfLines]);
		}
	}
	return null;
}

function splitLine(line){
	   var fields = null;
	   if (line != null && line != ""){
		   fields = line.split(";");
	   }
	   return fields;
}

function readMWFile(filename){

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
	  if (line.value != null && line.value != "" && !line.value.startsWith(";")){
		lines.push(line.value);
	  }
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

function checkAndSplitLine(line, seperator, nrOfFields){

   var fields = splitLine(line, seperator);
   if (fields == null || fields.length != nrOfFields){
      return null;
   }
   return fields;
}

function deleteFile(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
		if (file.exists()){
			file.remove(false);
			return true;
		}
		return false;
}

function fileExists(fileName) {
        var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fileName);
        return file.exists();
}

function convertToNumber (sNumber, defaultNumber) {

 if (sNumber == null) return defaultNumber;
 if (isNaN(sNumber)) return defaultNumber;
 return parseInt(sNumber);
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

function updateIniFile(filename, section, key, value) {
	// open an input stream from file
	var file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	 
	var tmpFile = TMP_DIR + "config.ini";
	
	// open an output stream
	var outputFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
	outputFile.initWithPath(tmpFile);
	if (outputFile.exists()) {
		outputFile.remove(false);
	}
	outputFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
	

		// read lines into array
	var line = {}, lines = [], hasmore, iniLine, found = false;
	do {
	  hasmore = istream.readLine(line);
	  iniLine = line.value.trim();
	  if (found == true){
		if (iniLine.startsWith("[")){
			hasmore = false;
		}
		else {
			if (iniLine != ""){
				var fields = splitLine(iniLine, "=");
				if (fields[0] == key){
					iniLine = key + "=" + value;
				}
				lines.push(iniLine);
			}
		}
	  }
	  else if (iniLine == "[" + section + "]") {
		found = true;
	  }
	  //outputStream.write(iniLine, iniLine.length);
	  save(tmpFile, iniLine);
	  
	} while(hasmore);
	 
	istream.close();
	//outputStream.close();
	
	return true;
}

function macroPlay(macroName, logError, onErrorRetry){
	var ret = 0; var retries = 0;
	var ok = false;
	do {
		//for (var nr=0; nr < macroSettings.length; nr++){
			//iimSet(macroSettings[i][0], macroSettings[i][1]);
			//log(macroSettings[nr][0] + " , " + macroSettings[nr][1]);
		//}
		//return 1;
		
		
		ret = iimPlay(macroName);
		if (ret != 1 && (logError == null || logError == true)){
			log("ERROR: (" + ret + ") retries = " + retries + " " + iimGetLastError(1));
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
	while (ok == false && retries < 5);
	return ret;
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

function writeObject(object, file){
	var jstr = JSON.stringify(object, null, "   ");
	writeFile(file, jstr, true);
}

function isNullOrBlank(param){
   if (param != null && param != "#EANF#" && param != ""){
      return false;
   }
   return true;
}


function isNumeric(param){
	if (param == null || isNaN(Number(param))){
		return false;
	}
	return true;
}

/*
function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string1, find, replace) {
  return string1.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
*/
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

function logV2(type, profileObject, outputText, logFile){
	switch (type) {
		case ERROR:
			log("Profile = " + profileObject.id, ERROR_LOG);
			log(outputText, ERROR_LOG);
			break;
		case WARNING:
			log("WARN: " + outputText, logFile);
			break;
		case INFO:
			log("INFO: " + outputText, logFile);
			break;
		default:
			log(outputText, logFile);
			break;
   }
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
