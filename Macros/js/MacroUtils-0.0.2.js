/** MacroUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
  
var LOG_ERROR_ENABLED = true;
var LOG_ERROR_DISABLED = false;

var ON_ERROR_RETRY_ENABLED = true;
var ON_ERROR_RETRY_DISABLED = false;

var FORCE_PLAY_ENABLED = true;
var FORCE_PLAY_DISABLED = false;
var FORCE_PLAY = FORCE_PLAY_DISABLED;
 
function login(profileObject, loginObject){
	var retcode = 0;
	if (loginObject == null){
		loginObject = initObject(LOGIN_JSON_FILE);
	}
	if (loginObject.enabled && loginObject.id != profileObject.id) {
		logV2("INFO", profileObject.id, "Wrong user logged in : " + loginObject.id);
		logOut(loginObject);
	}
	if (loginObject.enabled){
		// user already logged in
	}
	else {
		var retries = 0;
		do {
			addMacroSetting("login", profileObject.login, DISABLE_LOGGING);
			addMacroSetting("password", profileObject.password, DISABLE_LOGGING);
			retries++;
			retcode = macroPlay("fblogin.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			if (retcode == ERROR_TIMEOUT || retcode == 802){
				logV2(WARNING, profileObject.id, "Timeout occured, first, log off just to be sure not logged in, than trying to log in again");
				macroPlay("Refresh.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
				macroPlay("fblogoff.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			}
			else if (retcode != 1){
				logV2(WARNING, profileObject.id, "Problem with login - retrying " + retries + " time(s)");
				waitV2(configObject.mafiaWars.wait.login);
				logV2(WARNING, profileObject.id, "Trying to logout...");
				macroPlay("fblogoff.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			}
		}
		while (retcode != 1 && retries < configObject.mafiaWars.retries.login);
		if (retcode == 1){
			logV2(INFO, profileObject.id, "Logging in for profile " + profileObject.id);
			loginObject.id = profileObject.id;
			loginObject.enabled = true;
		}
	}
	return retcode;
}

function logout(loginObject){
	logV2(INFO, loginObject.id, "Log off profile " + loginObject.id);
	var retries=0;
	retcode = macroPlay("fblogoff.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
	while (retcode != 1 && retries < configObject.mafiaWars.retries.logout){
		if (retcode == ERROR_TIMEOUT || retcode == 802){
			retcode = 1;
			logV2(WARNING, "LOGOUT", "Timeout occured, refresh the page and do a log off again");
			macroPlay("Refresh.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			macroPlay("fblogoff.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			waitV2("10");
		}
		else {
			waitV2(configObject.mafiaWars.wait.logOut);
			retcode = macroPlay("fblogoff.iim", LOG_ERROR_ENABLED, ON_ERROR_RETRY_ENABLED, FORCE_PLAY);
			logV2(WARNING, "LOGOUT", "Problem with Log off, retrying " + retries);
		}
		retries++;
	}
	loginObject.enabled = false;
	loginObject.id = "";
}

function getLastExtract(nr){
	//return "www.test.be";
	var msg = iimGetLastExtract(nr);
	if (!isNullOrBlank(msg)){
		return msg.trim();
	}
	return msg;
}

function waitV2(seconds){
	iimSet("seconds", seconds);
	retcode = iimPlay("Wait.iim");
	return retcode;
}

function macroPlay(macroName, logError, onErrorRetry, forcePlay){
	logV2(INFO, "PLAY", "Macro Name : " + macroName);
	do {
		iimSet("frame", configObject.mafiaWars.mafiaWarsFrame);
		for (var cnt1=0; cnt1 < configObject.global.macroSettings.listOfSettings.length; cnt1++){
			var msObject = configObject.global.macroSettings.listOfSettings[cnt1];
			iimSet(msObject.key, msObject.value);
			if (msObject.enableLogging) {
				logV2(INFO, "PLAY", "MacroSetting : Key = " + msObject.key + " / Value = " + msObject.value);
			}
		}
		configObject.global.macroSettings.listOfSettings = []; // reset the settings array
		if (!localConfigObject.global.enableMacroPlay && !forcePlay) return 1;
		//if (!localConfigObject.global.enableMacroPlay) return 1;
		var ret = 0; var retries = 0;
		var ok = false;
		
		ret = iimPlay(macroName);
		logV2(INFO, "PLAY", "Return code = " + ret);
		if (ret == CANCELED_BY_USER) {
			// canceled by user
			throw "Canceled by user";
		}
		if (ret != 1 && (logError == null || logError == true)){
			log("ERROR: (" + ret + ") retries = " + retries + " " + iimGetLastError(1));
		}
		if (ret == 1 || ret == -933){
			ok = true;
		}
		else if (onErrorRetry != null && onErrorRetry == true && ret == -933){
			ok = false;
			retries++;
			logV2(ERROR, "PLAY", "Problem: (" + ret + ") retries = " + retries + " " + iimGetLastError(1));
		}
		else {
			ok = true;
		}
	}
	while (ok == false && retries < 3);
	return ret;
}

function closeTab(){
	macroPlay("closeTab");
}

function addMacroSetting(key, value, logEnabled){
	var enableLogging = true;
	if (logEnabled != null) {
		enableLogging = (logEnabled == ENABLE_LOGGING);
	}
	var msObject = {"key":key,"value":value,"enableLogging":enableLogging};
	configObject.global.macroSettings.listOfSettings.push(msObject);
}

function screenshot(profile, file){
	   prepareScreenshot(profile, file);
	   return macroPlay("fbScreenshot.iim");
}

function prepareScreenshot(profile, file){
	   var folder = getDateYYYYMMDD();
	   createDirectory(SCREENSHOT_DIR + folder);
	   addMacroSetting("folder", folder, DISABLE_LOGGING);
	   addMacroSetting("file", profile + "." + file, DISABLE_LOGGING);
}

function startMafiaWars(loginObject){
	var retcode = 1;
	var mwLoadedOk = false;
	if (loginObject.mafiaWarsStarted == false){
	  loginObject.mafiaWarsStarted = true;
	  var retries = 1;
	  do {
		  retcode = macroPlay("MWStart.iim",LOG_ERROR_ENABLED,ON_ERROR_RETRY_ENABLED);
		  var ret = macroPlay ("MWCheckIfMafiaWarsIsLoaded.iim");
		  if (ret == -921) {
			  if (retries > configObject.mafiaWars.loadMafiaWars){
				mwLoadedOk = true;
				logV2(WARNING, "PLAY", "Mafiawars not started, but max retries exceeded.");
			  }
			  else {
				logV2(WARNING, "PLAY", "Mafiawars not started... Retries : " + retries);
				closeTab();
			  }
		  }
		  else {
			mwLoadedOk = true;
		  }
	  }
	  while (!mwLoadedOk);
	}
}

function closeMafiaWars(loginObject){
	if (loginObject.mafiaWarsStarted){
		closeTab();
	}
	loginObject.mafiaWarsStarted = false;
}

function macroPlayFolder(mwObjectCategory, macroName, logError, onErrorRetry, forcePlay){
	var macroFolder = "";
	if (!isNullOrBlank(mwObjectCategory.macroFolder)){
		macroFolder = mwObjectCategory.macroFolder + "/";
	}
	return macroPlay(macroFolder + macroName, logError, onErrorRetry, forcePlay);
}
