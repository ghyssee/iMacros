/** MWUtilsLegacy
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
function doCraftManiaV1(profileObject, mwObject, urlFile){
	var profileId = profileObject.id;
	checkCraftManiaFullyUpgradedV2(profileObject, mwObject, urlFile);
	var craftManiaProperties = initObject(CRAFTMANIA_JSON_FILE);
	var retcode = macroPlay("MWLinkNatorInit.iim");
	if (retcode == 1){
		for (var nr = 0; nr < craftManiaProperties.properties.length; nr++){
			if (!craftManiaProperties.properties[nr].profiles.contains(profileObject.alias)){
				logV2(INFO, profileId, "Disabled : " + craftManiaProperties.properties[nr].description);
				continue;
			}
			screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsInit" + craftManiaProperties.properties[nr].id);
			retcode = macroPlay("MWCraftManiaOtherPartsInitV2.iim",true,true);
			if (retcode == 1){
				var prefix = " ".repeat(5);
				logV2(INFO, profileId, "Processing CraftMania Property " + craftManiaProperties.properties[nr].description);
				var loadProp = craftManiaProperties.properties[nr].description;
				var craftOtherpartsStatus = "";
				var cnt=0;
				do {
					retcode = macroPlay("MWCraftManiaOtherPartsInitStep2V2.iim",true,true);
					craftOtherpartsStatus = getLastExtract(1);
					logV2(INFO, profileId, "Status = " + craftOtherpartsStatus + " / Count = " + cnt.toString());
					cnt++;
					if (cnt > 1){
						macroPlay("MWCraftManiaOtherPartsInitV2.iim",true,true);
					}
					if (!localConfigObject.global.enableMacroPlay){
							break;
						}
				}
				while (!craftOtherpartsStatus.startsWith("Load ") && cnt < 3);
				logV2(INFO, profileId, prefix + "LoadProperty = " + loadProp + " (" + craftManiaProperties.properties[nr].description + ")");
				addMacroSetting("property", loadProp);
				retcode = macroPlay("MWCraftManiaOtherPartsInitStep3V2.iim",true,true);
				if (retcode == 1){
					retcode = macroPlay("MWCraftManiaPartsCheck.iim");
					if (retcode == 1) {
						logV2(INFO, profileId, prefix + craftManiaProperties.properties[nr].description + " already asked for Other Parts");
						screenshot(profileId, mwObject.craftMania.screenshot + craftManiaProperties.properties[nr].id + "_OtherPartsAlreadyAsked");
						continue;
					}
					var limitedTimePropertyObject = findLimitedTimePropertyById(mwObject, craftManiaProperties.properties[nr].partId1);
					logV2(INFO, profileId, prefix + "Searching for " + limitedTimePropertyObject.description);
					addMacroSetting("part1", limitedTimePropertyObject.description);
					limitedTimePropertyObject = findLimitedTimePropertyById(mwObject, craftManiaProperties.properties[nr].partId2);
					logV2(INFO, profileId, prefix + "Searching for " + limitedTimePropertyObject.description);
					addMacroSetting("part2", limitedTimePropertyObject.description);
					retcode = macroPlay("MWCraftManiaOtherPartsV3.iim",true,true);
					if (retcode == 1){
						var url1 = getLastExtract(1);
						var url2 = getLastExtract(2);
						if (!isNullOrBlank(url1)){
							url1 = encodeMafiaWarsUrl(url1);
							//writeCSVLine(profileId + LTP_EXT, [profileId,"1","CraftMania Part1 " + craftManiaProperties.properties[nr].description,url1]);
							urlFile.addUrl(url1, URLFile.type.LTP, "CraftMania Part1 " + craftManiaProperties.properties[nr].description);
							logV2(INFO, profileId, prefix + "CraftMania Part1 url = " + url1);
						}
						else {
							logV2(ERROR, profileId, "CraftMania part1 not found!");
						}
						if (!isNullOrBlank(url2)){
							url2 = encodeMafiaWarsUrl(url2);
							//writeCSVLine(profileId + LTP_EXT, [profileId,"1", "CraftMania Part2 " + craftManiaProperties.properties[nr].description,url2]);
							urlFile.addUrl(url2, URLFile.type.LTP, "CraftMania Part2 " + craftManiaProperties.properties[nr].description);
							logV2(INFO, profileId, prefix + "CraftMania Part2 url = " + url2);
						}
						else {
							logV2(ERROR, profileId, "CraftMania part2 not found!");
						}
					}
					else {
						logV2(ERROR, profileId, "CraftMania Other parts not executed");
					}
					screenshot(profileId, mwObject.craftMania.screenshot + "OtherParts");
				}
				else {
					logV2(ERROR, profileId, "CraftMania Other Parts Problem selecting property " + craftManiaProperties.properties[nr].description);
				}
			}
			else {
				logV2(ERROR, profileId, "Problem Initializing CraftMania Other Parts");
			}
		}
		
		// CraftMania Any Part
		retcode = macroPlay("MWCraftManiaAnyPartInitV2.iim",true,true);
		screenshot(profileId, mwObject.craftMania.screenshot + "AnyPartInit");
		if (retcode == 1){
			retcode = macroPlay("MWCraftManiaPartsCheck.iim");
			if (retcode == 0){
			   logV2(INFO, profileId, "Already Asked for Any Part!");
			   screenshot(profileId, mwObject.craftMania.screenshot + "AnyPartAlreadyAsked");
			   return retcode;
			}
			var propCounter = 0;
			for (var nr = 0; nr < craftManiaProperties.properties.length; nr++){
				var prefix = "     ";
				logV2(INFO, profileId, "Processing CraftMania Property " + craftManiaProperties.properties[nr].description + " / Pos = " + craftManiaProperties.properties[nr].id);
				logV2(INFO, profileId, prefix + "Profiles to process : " + craftManiaProperties.properties[nr].profiles);
				logV2(INFO, profileId, prefix + "Alias : " + profileObject.alias);
				propCounter++;
				if (craftManiaProperties.properties[nr].profiles.contains(profileObject.alias)){
					//if (profileId == "01_AMALIN"){
					//	addMacroSetting("pos", propCounter.toString());
					//	retcode = macroPlay("MWCraftManiaAnyPartV3.iim",true,true);
					//}
					//else {
						var description = craftManiaProperties.properties[nr].shortDescription;
						if (isNullOrBlank(description)){
							description = craftManiaProperties.properties[nr].description;
						}
						addMacroSetting("property", craftManiaProperties.properties[nr].description);
						retcode = macroPlay("MWCraftManiaAnyPartV2.iim",true,true);
					//}
					if (retcode == 1){
						var url1 = getLastExtract(1);
						if (!isNullOrBlank(url1)){
							url1 = encodeMafiaWarsUrl(url1);
							//writeCSVLine(profileId + LTP_EXT, [profileId,"1","LTP Any Part " + craftManiaProperties.properties[nr].description,url1]);
							urlFile.addUrl(url1, URLFile.type.LTP, "LTP Any Part " + craftManiaProperties.properties[nr].description);
							logV2(INFO, profileId, prefix + "CraftMania any part url = " + url1);
						}
						else {
							logV2(ERROR, profileId, "CraftMania any part not found! V1");
						}
						var info1 = getLastExtract(2);
						if (!isNullOrBlank(info1)){
							logV2(INFO, profileId, prefix + "CraftMania Any Part Property : " + info1);
						}
						screenshot(profileId, mwObject.craftMania.screenshot + "AnyPart");
					}
					else {
						logV2(ERROR, profileId, "CraftMania any part not found! V2");
					}
				}
				else {
					logV2(INFO, profileId, "Disabled (Any) : " + craftManiaProperties.properties[nr].description);
				}
			}
		}
		else {
		   logV2(ERROR, profileId, "Problem initializing CraftMania any part");
		}
		screenshot(profileId, mwObject.craftMania.screenshot);
	}
	else {
		logV2(ERROR, profileId, "Problem initializing Link-a-Nator");
	}
	return retcode;
}

/* this upgrade uses the Link-a-Nator Upgrade, but it doesn't work, url is never valid
*/

function upgradeLimitedTimePropertiesV2(profileObject, loginObject, mwObject, urlFile){
	var success = 0;
	var retcode = 0;
	if (login(profileObject, loginObject) == -1) return -1;
	var category = mwObject.limitedTimePropertiesFull.title;
	startCategory(category);
	startMafiaWars(loginObject);
	feedFix();
	success = macroPlay("MWLinkNatorInit.iim");
	if (success == 1){
		retcode = macroPlay("MWLimitedTimePropertiesCheckUpgrade.iim",true,true);
		screenshot(profileObject.id, mwObject.limitedTimePropertiesFull.screenshot + "01_StartUpgrade");
		if (retcode == 1){
			// not upgradeable
		}
		else {
			retcode = macroPlay("MWLimitedTimePropertiesUpgrade.iim",true,true);
			if (retcode == 1){
				var url = getLastExtract(1);
				if (!isNullOrBlank(url)){
					url = encodeMafiaWarsUrl(url);
					//writeCSVLine(profileObject.id + ".csv", [profileObject.id,"1","LTPUpgrade",url]);
					urlFile.addUrl(url, URLFile.type.NORMAL, "LTPUpgrade");
					logV2(INFO, profileObject.id, "LTP Upgrade url = " + url);
					screenshot(profileObject.id, mwObject.limitedTimeProperties.screenshot + "02_Upgraded");
				}
			}
		}

	   if (retcode == 1){
		endCategory(category, true);
		statusCategory(category, true);
	   }
	   else {
		endCategory(category, false);
		statusCategory(category, false);
	   }
	}
	screenshot(profileObject.id, mwObject.limitedTimePropertiesFull.screenshot + "03_EndUpgrade");
	return success;
}

/* doCraftManiaOtherPartsV1 : this uses the Link-a-Nator to ask for Limited Time Properties Other Parts,
                              but for some reason, this does not work anymore
*/

function doCraftManiaOtherPartsV1(profileObject, mwObject, urlFile, craftManiaProperties){
	var profileId = profileObject.id;
	var retcode = macroPlay("MWLinkNatorInit.iim");
	if (retcode == 1){
		for (var nr = 0; nr < craftManiaProperties.properties.length; nr++){
			if (!craftManiaProperties.properties[nr].profiles.contains(profileObject.alias)){
				logV2(INFO, profileId, "Disabled : " + craftManiaProperties.properties[nr].description);
				continue;
			}
			screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsInit_" + craftManiaProperties.properties[nr].id);
			var loadProp = craftManiaProperties.properties[nr].description;
			var prefix = "     ";
			var retcode = macroPlay("craft/MWCraftManiaOtherPartsInitStep1.iim",true,true);
			alert("step1");
			screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsInitStep1_" + craftManiaProperties.properties[nr].id);
			if (retcode == 1){
				addMacroSetting("propertyid", craftManiaProperties.properties[nr].propertyId);
				retcode = macroPlay("craft/MWCraftManiaOtherPartsInitStep2.iim",true,true);
			alert("step2");
				screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsInitStep2_" + craftManiaProperties.properties[nr].id);
				if (retcode == 1){
					logV2(INFO, profileId, "Processing CraftMania Property " + loadProp);
					retcode = macroPlay("craft/MWCraftManiaOtherPartsGetUrl1.iim",true,true);
					var url1 = getLastExtract(1);
					if (!isNullOrBlank(url1)){
						url1 = encodeMafiaWarsUrl(url1);
						//writeCSVLine(profileId + LTP_EXT, [profileId,"1","CraftMania Part1 " + craftManiaProperties.properties[nr].description,url1]);
						urlFile.addUrl(url1, URLFile.type.LTP, "CraftMania Part1 " + loadProp);
						logV2(INFO, profileId, prefix + "CraftMania Part1 url = " + url1);
					}
					else {
						logV2(ERROR, profileId, "CraftMania part1 not found!");
					}
					screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsUrl1_" + craftManiaProperties.properties[nr].id);
					retcode = macroPlay("craft/MWCraftManiaOtherPartsGetUrl2.iim",true,true);
					var url2 = getLastExtract(1);
					if (!isNullOrBlank(url2)){
						url2 = encodeMafiaWarsUrl(url2);
						//writeCSVLine(profileId + LTP_EXT, [profileId,"1", "CraftMania Part2 " + craftManiaProperties.properties[nr].description,url2]);
						urlFile.addUrl(url2, URLFile.type.LTP, "CraftMania Part2 " + loadProp);
						logV2(INFO, profileId, prefix + "CraftMania Part2 url = " + url2);
					}
					else {
						logV2(ERROR, profileId, "CraftMania part2 not found!");
					}
					screenshot(profileId, mwObject.craftMania.screenshot + "OtherPartsUrl2_" + craftManiaProperties.properties[nr].id);
				}
				else {
					logV2(ERROR, profileId, "CraftMania Other parts not executed");			
				}
			}
			else {
				logV2(ERROR, profileId, "CraftMania Other parts not executed V2");			
			}
			retcode = macroPlay("craft/MWCraftManiaOtherPartsClose.iim",true,true);
			screenshot(profileId, mwObject.craftMania.screenshot + "Close_" + craftManiaProperties.properties[nr].id);
		}
	}
	else {
		logV2(ERROR, profileId, "Problem initializing Link-a-Nator");
	}
	return retcode;
}

/* executeUrlFile: uses a CSV file to read the urls
                   This is replaced by a JSON file
*/

function executeUrlFile(profile, csvFile, seperator){
	var url;
	var fields;
	
	logV2(INFO, profile, "Processing file " + csvFile);
	
	if (!fileExists(csvFile)){
		logV2(ERROR, profile, "File " + csvFile + " does not exist");
		return -1;
	}
	var lines = readCSV(csvFile, profile, 4, ",");
        if (lines == null) {
            return -1;
        }
	for (nrOfLines=0; nrOfLines < lines.length; nrOfLines++) {
	   fields = lines[nrOfLines];
	   if (fields[3] != null && fields[3].length > 0){
			url = fields[3];
			processUrl(profile, url, "ss." + NODE_ID, false);
			if (csvFile.contains(LTP_EXT)){
				getFeedBackLTP(profile, csvFile, url);
			}
			macroPlay("fbClose.iim");
	   }
	}
}

function readCSV(csvFile, profile, nrOfFields, seperator){
    logV2(INFO, profile, "Processing file " + csvFile);

    if (!fileExists(csvFile)){
            logV2(ERROR, profile, "File " + csvFile + " does not exist");
            return -1;
    }
    var csvArray = [];
    var lines = readFile(csvFile);
    if (lines == null || lines.length == 0){
            logV2(INFO, profile, "File " + csvFile + " is empty");
            return -1;
    }
    for (nrOfLines=0; nrOfLines < lines.length; nrOfLines++) {  
       fields = splitLine(lines[nrOfLines], seperator);
       if (fields == null || fields.length != nrOfFields){
           logV2(ERROR, profile, "Problem with CSV file " + csvFile + " - Line Number = " + (nrOfLines+1));
           if (fields != null){
                logV2(ERROR, profile, "Nr of fields expected: " + nrOfFields + " / Actual Nr Of Fields: " + fields.length);
                logV2(ERROR, profile, "Line = " + lines[nrOfLines]);
            }
           return null;
       }
       else {
           csvArray.push(fields);
       }
    }
    return csvArray;
}

/* this function is not used anymore
*/

function processUrl(profile, url, screenshotName, closeScreen){
	var ret1;
	var txt;
	var retries = 0;
	var exitLoop = false;
	ret1 = logV2(INFO, profile, "Process Url: " + url);
	do {
		addMacroSetting("seconds","60");
		addMacroSetting("url",url);
		ret1 = macroPlay("ProcessUrl.iim", true, false);
		logV2(INFO, profile, "ProcessUrl Return code: " + ret1);
		if (ret1 != 1){
			logV2(WARNING, profile, "Problem found processing url. Return code = " + ret1);
			retries++;
			if (retries > configObject.mafiaWars.retries.executeUrl){
				exitLoop = true;
			    logV2(WARNING, profile, "Number of retries exceeded. Url not executed");
			    logV2(ERROR, profile, "Number of retries exceeded. Url not executed:" + url);
			}
			else {
				if (ret1 == ERROR_TIMEOUT || ret1 == 802){
				   logV2(WARNING, profile, "ProcessUrl retries: " + retries);
				   screenshot(profile, screenshotName + "." + NODE_ID + ".Retry_" + retries);
				   macroPlay("fbClose.iim");
				}
				else {
				   logV2(WARNING, profile, "Process Url: Unknown error");
				   logV2(ERROR, profile, "Process Url: Unknown error. Url = " + url);
				   exitLoop = true;
				}
			}
		}
		else {
			exitLoop = true;
		}
	}
	while (!exitLoop);

	if (ret1 != 1){
	  logV2(WARNING, profile, "Problem executing url " + url);
	}
	screenshot(profile, screenshotName + "." + NODE_ID);
	if (closeScreen){
		macroPlay("fbClose.iim");
	}
}

function getFeedBackLTP(profileId, csvFile, urlObject){
	var ltpLog = new ConfigFile(LOG_DIR, "LTPFeedBack." + getDateYYYYMMDD() + ".log");
	var ltpLog2 = new ConfigFile(LOG_DIR, "LTPFeedBackOk." + getDateYYYYMMDD() + ".log");
	logV2(INFO, profileId, "LTP FeedBack Info", ltpLog);
	retcode = macroPlay("MWLimitedTimePropertiesFeedBack.iim");
	var saveLTP = false;
	if (retcode == 1) {
	   var msg1 = getLastExtract(1);
	   if (isNullOrBlank(msg1)){
			var msg2 = getLastExtract(2);
			if (isNullOrBlank(msg2)){
				logV2(INFO, profileId, "Problem getting feedback info V1. Save Url?", ltpLog);
				saveLTP = true;
			}
			else {
				logV2(INFO, profileId, msg2, ltpLog);
				if (msg2.startsWith("You gave your friend")){
					logV2(INFO, profileId, msg2, ltpLog2);
				}
				if (msg2.startsWith("Thanks for helping")){
					logV2(INFO, profileId, "Save url for later", ltpLog);
					saveLTP = true;
				}
			}
	   }
	   else {
			logV2(INFO, profileId, msg1, ltpLog);
			if (msg1.startsWith("You gave your friend")){
					logV2(INFO, profileId, msg1, ltpLog2);
			}
			if (msg1.startsWith("Thanks for helping")){
				logV2(INFO, profileId, "Save url for later", ltpLog);
				saveLTP = true;
			}
	   }
	}
	else {
		logV2(INFO, profileId, "Problem getting feedback info V2. Save Url ? - Return code = " + retcode.toString(), ltpLog);
	}
	if (saveLTP) {
		var filename = getUniqueFileName(QUEUE_DIR + profileId + "\\", csvFile.replace(/^.*[\\\/]/, ''));
		logV2(INFO, profileId, "Saving file to " + QUEUE_DIR + profileId + "\\" + filename, ltpLog);
		save(QUEUE_DIR + profileId + "\\" + filename, profileId + ",1," + "ltp" + "," + url);
	}
	
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

function extortionCraft(){

	if (mwObject.extortiunCraft.enabled && profileObject.id != "00_ERIC"){
	    if (login(profileObject, loginObject) == -1) return -1;
		startMafiaWars(loginObject);
	    category = mwObject.extortiunCraft.title;
	    startCategory(category);
	    //checkAndReloadTab(loginObject, profileObject, mwObject.extortiun, "ViralBoss");
		macroPlay("MWExtortiunRun.iim");
		screenshot(profileObject.id, mwObject.extortiunCraft.screenshot + "_01_Init");
		for (var ec=0; ec < mwObject.extortiunCraft.list.length; ec++){
		    var ecId = (ec+1).toString();
			var extCraftObj = mwObject.extortiunCraft.list[ec];
			logV2(INFO, profileObject.id, "Id: " + extCraftObj.id + " / description = " + extCraftObj.description);
			addMacroSetting("pos", ecId);
			retcode = macroPlay("MWExtortiunSelect.iim");
			screenshot(profileObject.id, mwObject.extortiunCraft.screenshot + "_02_Select_" + ecId);
			addMacroSetting("pos", ecId);
			retcode = macroPlay("MWExtortiunRunGetLevelV2.iim");
			var extortiunLvl = getLastExtract(1);
			screenshot(profileObject.id, mwObject.extortiunCraft.screenshot + "_03_GetLevel_" + ecId);
			if (retcode != 1 || isNullOrBlank(extortiunLvl)){
				logV2(WARNING, profileObject.id, "Extortiun: Problem getting level");
			}
			else
			{
				var lvl = extortiunLvl.substr(0,2).trim();
				logV2(INFO, profileObject.id, "Extortiun Level: " + lvl);
				addMacroSetting("level", lvl.toString());
				retcode = macroPlay("MWExtortiunCraftItem.iim");
				//var extortiunCraft = iimGetLastExtract(1);
				//logV2(INFO, profileObject.id, "Extortiun Craft: " + extortiunCraft);
				if (retcode == 1) { // && !isNullOrBlank(extortiunCraft)){
					logV2(INFO, profileObject.id, "Extortiun Craft: OK");
				}
			}
		}
		screenshot(profileObject.id, mwObject.extortiunCraft.screenshot + "_09_End");
	    endCategory(category, retcode == 1);
		statusCategory(category, retcode == 1);
	}
}

function scan(){

    var profileName = "";
    var retcode = 1;
	
	for (cnt=0; cnt < arrayOfProfiles.length; cnt++){
	
		if (!arrayOfProfiles[cnt].enabled) continue; // skip if disabled
		
		var profileObject = arrayOfProfiles[cnt];
		profileName = profileObject.id;
	    logV2(INFO, profileName, "Starting profile " + profileName);
		
		var loginProfileObject = lookupProfile(arrayOfProfiles[cnt].linkFbListId);
		addMacroSetting("login", loginProfileObject.login, DISABLE_LOGGING);
		addMacroSetting("password", loginProfileObject.password, DISABLE_LOGGING);
		logV2(INFO, profileName, "Looking up items with profile " + loginProfileObject.id);
		macroPlay("fblogin.iim");

		var retries = 1;
		logV2(INFO, profileName, "Facebook List = " + arrayOfProfiles[cnt].fbList);
		addMacroSetting("profile", arrayOfProfiles[cnt].fbList);
		retcode = macroPlay(FOLDER_COMMON + "fbStart.iim", true);
		if (retcode == 1 || retcode == -933){
		    if (configObject.mafiaWars.doubleLoot.enabled && mwObject.doubleLoot.enabledList) {
				logV2(INFO, profileName, "Searching 2x loot");
				ExtractUrlSpecificType(profileName, "Give 2x Loot Boost", 1);
			}

		    if (mwObject.objectAsk.enabledList) {
				logV2(INFO, profileName, "Searching object parts");
				for (var objects = 0; objects < configObject.mafiaWars.objectAsk.parts.length; objects++){
					logV2(INFO, profileName, "Searching Object Ask Part = " + configObject.mafiaWars.objectAsk.parts[objects].name);
					ExtractUrlSpecificType(profileName, "Send " + configObject.mafiaWars.objectAsk.parts[objects].name, 1);
				}
				ExtractUrlSpecificType(profileName, "Send a part", 1);
			}
			
		    if (mwObject.powerCards.enabledList){
				logV2(INFO, profileName, "Searching power cards");
				ExtractUrlSpecificTypeSpecificUrl(profileName, profileName, "Send", 1, "arena_powercard");
			}
			
		    if (mwObject.jobHelp.enabledList){
				logV2(INFO, profileName, "Searching job help");
				ExtractUrlSpecificTypeSpecificUrl(profileName, profileName, "Help", 1, "next_controller%3Djob%26next_action%3Dgive_help");
			}

		    if (configObject.mafiaWars.buzzCraft.enabled && mwObject.buzzCraft.enabledList){
				logV2(INFO, profileName, "Searching buzz crafts");
				ExtractUrlSpecificType(profileName, "Give to Get 1", 1);
			}
						
		    if ((configObject.mafiaWars.faceOff.enabled || configObject.mafiaWars.faceOff.enabled) && mwObject.faceOff.enabledList){
				logV2(INFO, profileName, "Searching votes");
				ExtractUrlSpecificType(profileName, "Go Vote", 1);
			}

		    if (configObject.mafiaWars.askRedeem.enabled && mwObject.askRedeem.enabledList){
				logV2(INFO, profileName, "Searching ask & redeem requests");
				ExtractUrlSpecificTypeSpecificUrl(profileName, profileName, "Send", 1, "holiday_event%2522%257D"); // "holiday_event%22%7D");
			}
			
		    if (configObject.mafiaWars.collectRob.enabled && mwObject.collectRob.enabledList){
				logV2(INFO, profileName, "Searching " + configObject.mafiaWars.collectRob.part);
				ExtractUrlSpecificType(profileName, "Send " + configObject.mafiaWars.collectRob.part, 1);
			}
			
			if (mwObject.mexico.bank.enabledList) {
				logV2(INFO, profileName, "Searching Mexico bank parts");
				ExtractUrlSpecificType(profileName, "Send Swinging Doors", 1);
				ExtractUrlSpecificType(profileName, "Send Teller Visor", 1);
				ExtractUrlSpecificType(profileName, "Send Steel Bars", 1);
				ExtractUrlSpecificType(profileName, "Send Money Bag", 1);
			}
			if (mwObject.mexico.property.enabledList) {
				//var saObject = findPropertyNameByRandomNumber(profileObject.mexico.propertyPart, mwObject.mexicoProperty);
				//var saObject = mwObject.mexicoProperty.parts[0];
				//log("Info: Searching for property part [" + saObject.linkName + "]");
				//ExtractUrlSpecificType(profileName, saObject.linkName, 1);
				logV2(INFO, profileName, "Searching Mexico property parts");
				ExtractUrlSpecificType(profileName, "Send Sets of Mosaic Tiles", 1);
				ExtractUrlSpecificType(profileName, "Send Sets of Adobe Bricks", 1);
				ExtractUrlSpecificType(profileName, "Send Planks of Mexican Kingwoo", 1);
				ExtractUrlSpecificType(profileName, "Send Mexican Thatches", 1);
				ExtractUrlSpecificType(profileName, "Send Sets of Iron Frames", 1);
			}

			if (mwObject.losAngelos.property.enabledList) {
				//var saObject = findPropertyNameByRandomNumber(profileObject.mexico.propertyPart, mwObject.mexicoProperty);
				//var saObject = mwObject.mexicoProperty.parts[0];
				//log("Info: Searching for property part [" + saObject.linkName + "]");
				//ExtractUrlSpecificType(profileName, saObject.linkName, 1);
				logV2(INFO, profileName, "Searching Praag property parts");
				ExtractUrlSpecificType(profileName, "Send Sets of Mosaic Tiles", 1);
				ExtractUrlSpecificType(profileName, "Send Sets of Adobe Bricks", 1);
				ExtractUrlSpecificType(profileName, "Send Planks of Mexican Kingwoo", 1);
				ExtractUrlSpecificType(profileName, "Send Mexican Thatches", 1);
				ExtractUrlSpecificType(profileName, "Send Sets of Iron Frames", 1);
			}
			if (mwObject.losAngelos.property.enabledList) {
				logV2(INFO, profileName, "Searching Praag bank parts");
				ExtractUrlSpecificType(profileName, "Send Swinging Doors", 1);
				ExtractUrlSpecificType(profileName, "Send Teller Visor", 1);ExtractUrlSpecificType(profileName, "Send Steel Bars", 1);
				ExtractUrlSpecificType(profileName, "Send Money Bag", 1);
			}

		    if (mwObject.familyProperty.enabledList) {
				logV2(INFO, profileName, "Searching family property parts");
			    //ExtractUrlSpecificTypeSpecificUrl(profileName,  profileName, "Get a Part", 1, "item_id%2522%253A%2213000"); // reinforced concreet
				//ExtractUrlSpecificTypeSpecificUrl(profileName,  profileName, "Get a Part", 1, "item_id%2522%253A%2220000"); // artillery shell
				ExtractUrlSpecificTypeSpecificUrl(profileName,  profileName, "Get a Part", 1, "item_id%2522%253A%252228378"); // sicilian marble
				
			}
		    if (configObject.mafiaWars.crafterChoice.enabled && mwObject.crafterChoice.enabledList) {
				logV2(INFO, profileName, "Searching crafter's choice parts");
				ExtractUrlSpecificTypeSpecificUrl(profileName,  profileName, "Send Parts", 1, "craftersChoice%26next_action%3Dfeed_accept");
			}
		    if (configObject.mafiaWars.luckyBreak.enabled && mwObject.luckyBreak.enabledList) {
				logV2(INFO, profileName, "Searching Lucky Break parts");
				ExtractUrlSpecificType(profileName, "Give to Get 1", 1);
			}
		    if (mwObject.helpWar.enabledList) {
				logV2(INFO, profileName, "Searching war help");
				ExtractUrlSpecificTypeSpecificUrl("WAR",  profileName, "Help " + listArray[i][COL_LISTS_SPECIFICTEXT], 1, "next_controller%3Dwar"); // warhelp
			}
		    if (configObject.mafiaWars.limitedTimeProperties.enabled && mwObject.limitedTimeProperties.enabledList) {
				logV2(INFO, profileName, "Searching limited time properties");
				var ext = "_LTP";
				activateLimitedTimeProperty(mwObject, configObject.mafiaWars.limitedTimeProperties.partId1);
				activateLimitedTimeProperty(mwObject, configObject.mafiaWars.limitedTimeProperties.partId2);
				for (var nr = 0; nr < mwObject.limitedTimeProperties.parts.length; nr++){
					if (mwObject.limitedTimeProperties.parts[nr].active){
						logV2(INFO, profileName, "limitedTimeProperties part " + nr + " = " + mwObject.limitedTimeProperties.parts[nr].description);
						logV2(INFO, profileName, "PartId = " + mwObject.limitedTimeProperties.parts[nr].partId);
						ExtractUrlSpecificTypeSpecificUrl(profileName + ext,  profileName, "Send Parts", 1, mwObject.limitedTimeProperties.parts[nr].partId);
					}
				}
				ExtractUrlSpecificTypeSpecificUrl(profileName + ext,  profileName, "Send Parts", 1, "next_action%3DaddAnyPropertyPart"); // any part
			}
		    if (configObject.mafiaWars.craftMania.enabled && mwObject.craftMania.enabledList) {
				logV2(INFO, profileName, "Searching craft mania properties");
				var ext = "_LTP";
				
				var craftMania = initObject(CRAFTMANIA_JSON_FILE);
				var prefix1 = " ".repeat(5);
				for (var nr = 0; nr < craftMania.properties.length; nr++){
					logV2(INFO, profileName, "Processing " + craftMania.properties[nr].description);
					if (craftMania.properties[nr].profiles.contains(profileObject.alias)){
						var propertyObject = craftMania.properties[nr];
						logV2(INFO, profileName, prefix1 + "Searching " + propertyObject.propertyId + " / " + propertyObject.description);
						var limitedTimePropertyObject = findLimitedTimePropertyById(mwObject, propertyObject.partId1);
						var prefix = "prop_id%2522%253A%2522";
						logV2(INFO, profileName, prefix1 + "partId1 = " + propertyObject.propertyId + "/" + propertyObject.partId1 + "/" + limitedTimePropertyObject.partId);
						ExtractUrlSpecificTypeSpecificUrl(profileName + ext,  profileName, "Send Parts", 1, prefix+propertyObject.propertyId, limitedTimePropertyObject.partId); 
						limitedTimePropertyObject = findLimitedTimePropertyById(mwObject, propertyObject.partId2);
						logV2(INFO, profileName, prefix1 + "partId2 = " + propertyObject.propertyId + "/" + propertyObject.partId2 + "/" + limitedTimePropertyObject.partId);
						ExtractUrlSpecificTypeSpecificUrl(profileName + ext,  profileName, "Send Parts", 1, prefix+propertyObject.propertyId, limitedTimePropertyObject.partId); 
						ExtractUrlSpecificTypeSpecificUrl(profileName + ext,  profileName, "Send Parts", 1, prefix+propertyObject.propertyId, "next_action%3DaddAnyPropertyPart"); 
					}
					else {
						logV2(INFO, profileName, "Disabled: " + craftMania.properties[nr].description);
					}
				}
			}
			
		    if (mwObject.craftMania.enabledList || mwObject.limitedTimeProperties.enabledList){
				logV2(INFO, profileName, "Searching get parts of limited time properties");
				ExtractUrlSpecificTypeSpecificUrl(profileName,  profileName, "Get Parts", 1, "next_action%3DupgradeBragFeed"); // get a part
			}
			
		    if (mwObject.strangerSwag.enabledList) {
				var retries = 0;
				retcode = 1;
				do {
					retries++;
					if (retcode != 1){ // tab not found
						logV2(INFO, profileObject.id, mwObject.strangerSwag.title + ": Tab not found. Retries = " + retries.toString());
						closeMafiaWars(loginObject);
						retcode = startMafiaWars(loginObject);
					}
					retcode = checkTab("FeedOfTheDay", mwObject.strangerSwag.screenshot, profileObject, loginObject);
				}
				while (retcode != 1 && retries < 2);
				logV2(INFO, profileName, "Searching strangers swag");
				ExtractUrlSpecificTypeSpecificUrl(profileName, profileName, "Help ", 1, "next_controller%3DFeedOfTheDay"); // strangers swag
			}

		    if (mwObject.dailyTake.enabledList) {
				logV2(INFO, profileName, "Searching daily take");
				ExtractUrlSpecificType("DAILYTAKE", "Get Daily Take Reward", 1); // dailytake
			}
		}
		else {
			logV2(ERROR, profileName, "There was a problem with the scanning. Errorcode = " + retcode);
		}
		closeTab();
		macroPlay("fblogoff.iim");
	}
}

function ExtractUrlSpecificType(profile, type, maxUrls){

	var retcode = 1;
	var nrOfMatches = 0;
	
	for (var i=1; i <= 50 && nrOfMatches < maxUrls && retcode == 1; i++){
		var retries = 1;
		do {
			addMacroSetting("pos", i.toString());
			addMacroSetting("searchstr", type);
			retcode = macroPlay(FOLDER_FACEBOOK_LISTS + "profileUrl.iim", true, false);
			if (retcode == -933) logV2(INFO, profile, "Retrying " + retries + " time(s) for " + type);
			retries++;
			//if (retcode == -933) retcode = 1;
		}
		while (retcode == -933 && retries < 10);
		
		if (retcode == 1){
			var url = getLastExtract(1);
			logV2(INFO, profile, "url = " + url);
			var title = getLastExtract(2);
			if (url != null && url.substring(0, 5) != "#EANF") {
			   nrOfMatches++;
			   writeCSVLine(profile + ".csv", [profile, i.toString(),title,url]);
			 }
			 else {
			    retcode = -1;
				break;
			 }
		}
		else {
		   break;
		}
	}
}

function ExtractUrlSpecificTypeSpecificUrl(filename, profile, type, maxUrls, specificText, specificText2){

	var retcode = 1;
	var nrOfMatches = 0;
	
	logV2(INFO, profile, "Text1 = " + specificText);
	logV2(INFO, profile, "Text2 = " + specificText2);
	for (var i=1; i <= 30 && nrOfMatches < maxUrls && retcode == 1; i++){
		
		var retries = 1;
		do {
			addMacroSetting("pos", i.toString());
			addMacroSetting("searchstr", type);
			retcode = macroPlay(FOLDER_FACEBOOK_LISTS + "profileUrl.iim", true, false);
			if (retcode == -933) logV2(INFO, profile, "Retrying " + retries + " time(s) for " + type);
			retries++;
		}
		while (retcode == -933 && retries < 10);
		//if (retcode == -933) retcode = 1;
		
		if (retcode == 1){
			var url = getLastExtract(1);
			logV2(INFO, profile, "url = " + url);
			var title = getLastExtract(2);
			if (url != null && url.substring(0, 5) != "#EANF"){
			   if (url.contains(specificText) && (specificText2 == null || url.contains(specificText2))) {
					nrOfMatches++;
					writeCSVLine(filename + ".csv", [profile, i.toString(),title + "/" + specificText,url]);
			    }
				else {
				}
			 }
			 else {
			    retcode = -1;
				break;
			 }
		}
		else {
		   break;
		}
	}
}

function copyToQueues(){
	// now copying the files to the queues
	logV2(INFO, "INIT", "Copying files to the queues");
	var timeStamp = getDateYYYYMMDDHHMI();
	var commonFile = DATASOURCE_DIR+COMMON_URL_FILE;
	var oldFileName = null;
	for (var i=0; i < arrayOfProfiles.length; i++){
		var filename = arrayOfProfiles[i].id + ".csv";
		oldFileName = DATASOURCE_DIR + filename;
		if (fileExists(oldFileName)){
			copyOneFileToQueue(arrayOfProfiles[i].id, oldFileName, filename);
			// move the file to the backup directory
			var newFileName = arrayOfProfiles[i].id + "." + timeStamp + ".csv";
			if (renameFile(oldFileName, BACKUP_DIR, newFileName)){
			  logV2(INFO, "INIT", "File " + filename + " moved to " + newFileName);
			}
		}
		
		// copy LTP files to queues
		logV2(INFO, "INIT", "Copying LTP files to the queues");
		filename = arrayOfProfiles[i].id + LTP_EXT;
		oldFileName = DATASOURCE_DIR + filename;
		if (fileExists(oldFileName)){
			copyOneFileToQueue(arrayOfProfiles[i].id, oldFileName, filename);
			// move the file to the backup directory
			var newFileName = arrayOfProfiles[i].id + "." + timeStamp + LTP_EXT;
			if (renameFile(DATASOURCE_DIR+filename, BACKUP_DIR, newFileName)){
				logV2(INFO, "INIT", "File " + filename + " moved to " + newFileName);
			}
		}

		if(fileExists(commonFile)){
			var destDir = QUEUE_DIR + arrayOfProfiles[i].id + "\\";
			copyFile(commonFile, destDir, getUniqueFileName(destDir, COMMON_URL_FILE));
		}
	}
	if (fileExists(commonFile)){
		var newFile = COMMON_URL_FILE+"."+timeStamp;
		if (renameFile(commonFile, BACKUP_DIR, newFile)){
		  logV2(INFO, "INIT", "File " + commonFile + " moved to " + newFile);
		}
	}
}
