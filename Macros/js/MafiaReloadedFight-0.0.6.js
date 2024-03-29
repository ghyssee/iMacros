var FIGHTERCONSTANTS = Object.freeze({
    "RIVAL_ID": "RIVAL",
    "OPPONENT" : {
        "UNKNOWN": 0,
        "FRIEND": 1,
        "WON" : 2,
        "LOST": 3,
        "DEAD": 4,
        "NOHEALTH": 5
    },
    "ATTACKSTATUS" : {
        "OK" : 0,
        "PROBLEM": -1,
        "NOSTAMINA": 2,
        "BOSSDEFATED": 1,
        "BOSSALREADYDEAD": 3,
        "HEALINGDISABLED": 4,
        "UNKNOWN": 5,
        "STOPONLEVELUP": 6,
        "EXPREACHED": 7,
        "STAMINALIMIT": 8,
        "REFRESH": 9,
        "NOHEALTH": 10,
        "STAMINACOSTHIGH": 11
    },
    "FIGHTERTPE" : {
        "RIVAL" : 1,
        "PROFILE": 2,
        "NORMALPROFILE": 3,
        "ASSASSIN" : 4,
        "HOMEFEED" : 5,
        "WISEGUY" : 6,
    },
    "FIGHTERSTATUS": {
        "UNKNOWN": "UNKNOWN",
        "ATTACK": "ATTACK",
        "FRIEND": "FRIEND",
        "STRONGER": "STRONGER"
    },
    "SHAKEDOWN": {
        "CHOOSE_BUSINESS": 0,
        "NODEAL": 1,
        "SUCCESSFUL": 2,
        "NOSTAMINA": 3,
        "COLLECT": 4,
        "FINISHED": 5,
        "PROBLEM": -1
    }
});
var PAGE_TYPE = Object.freeze({
    "PROFILE": true,
    "FIGHT": false
});


    function extractLevelFromString(text){
    text = removeComma(text);
    var regExp = "</a> Level (.*)<";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var level = matches[matches.length-1];
        level = parseInt(level);
        return level;
    }
    return text;
}

function extractFighterInformation(text){
    var obj = {id:null, name:null};
    obj.id = extractFighterId(text);
    obj.name = extractFighterName(text);
    return obj;
}

function unescape(text){
    // underscore-min.js neede to be included for this to work
    return _.unescape(text);
}

function extractFighterId(text){
    //var regExp = "CLASS=\"PRO\" DATA-ID=\"" + "([0-9]{1,30})\">";
    var regExp = "<a href=\"/game/player/([0-9]{1,30})\"";
    //var regExp = /id=([0-9]{1,30})"/;
    text = text.toLowerCase();
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return null;
}

function extractFighterName(text){
    //var regExp = "class=\"pro\" data-id=\"" + "(?:[0-9]{1,20})\">([^<]*)<\/a>(?:.*)";
    var regExp = "class=\"pro\">(.*)</a> Level(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var name = unescape(matches[matches.length-1]);
        return name.trim();
    }
    return unescape(text);
}

function extractProfileFighterName(text){
    //var regExp = "class=\"tag\" data-id=\"" + "(?:[0-9]{1,20})\">(?:[^<]*)<\/a>(.*)</h2>";
    var regExp = "class=\"tag\">(?:.*)<\/a> (.*)</h2>";
    if (!contains(text, "class=\"tag\"")){
        regExp = "class=\"ellipsis\">(.*)</h2>";
    }
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var name = unescape(matches[matches.length-1]);
        return name.trim();
    }
    return unescape(text);
}

function extractGangInformation(text){
    var gangObj = {id:null, name:null};
    if (contains(text, "class=\"tag\"")){
        gangObj.id = extractGangIdFromString(text);
        gangObj.name = extractGangNameFromString(text);
    }
    return gangObj;
}

function isFightingEventPlayer(text, ally){
    var regExp = "<span style=(?:.*)>" + ally + "</span>";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return true;
    }
    return false;

}

function extractGangIdFromString(text){
    //var regExp = "class=\"tag\" data-id=\"" + "([0-9]{1,20})\">";
    var regExp = "<a href=\"/game/gang/([0-9]{1,30})\"";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractGangNameFromString(text){
    // logV2(INFO, "extractGangNameFromString", text);
    var regExp = "class=\"tag\">(.*)</a>(?:.*)(?:</h2>|<a href=\"/game/player)";
    //var regExp = "class=\"tag\">(.*)</a>(?:.*)(?:</h2>|<a href=\"/game/player)?";
    //var regExp = "class=\"tag\">(.*)</a> <a href=";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var name = unescape(matches[matches.length-1]);
        return name.trim();
    }
    else {
        regExp = "class=\"tag\">(.*)$";
        matches = text.match(regExp);
        if (matches != null && matches.length > 0){
            var name = unescape(matches[matches.length-1]);
            return name.trim();
        }
    }
    return unescape(text);
}

function findFighter(list, id){
    var found = false;
    list.forEach( function (arrayItem)
    {
        if (arrayItem.id == id){
            found = true;
            return;
        }
    });
    return found;
}

function getFighter(list, id){
    var fighter = null;
    list.forEach( function (arrayItem)
    {
        if (arrayItem.id == id){
            fighter = arrayItem;
            return;
        }
    });
    return fighter;
}

function getHealth(){
    var healthObj = getHealthObj();
    logObj(DEBUG, "HEALTH", healthObj.leftOver);
    return healthObj.leftOver;
}

function getHealthV2(globalSettings){
    // it is possible that health is the same when attack button was pressed, but not registered
    var health = -1;
    var oldHealth = globalSettings.oldHealth;
    var counter = 0;
    do {
        var healthObj = getHealthObj();
        health = healthObj.leftOver;
        counter++;
        if (health == 0){
            break;
        }
        if (counter > 1){
            logV2(DEBUG, "HEALTH", "Health Retries: " + counter);
            dummyBank();
        }
    }
    while (counter <= 10 && (health == -1 || health == oldHealth));
    logV2(DEBUG, "HEALTH", "oldHealth:" + oldHealth);
    globalSettings.oldHealth = health;
    return health;
}


function getHealthObj(){
    playMacro(FIGHT_FOLDER, "11_GetHealth.iim", MACRO_INFO_LOGGING);
    var healthInfo = getLastExtract(1, "Health", "50/200");
    var healthObj = {"leftOver": -1, "total": 0};
    //logV2(INFO, "HEALTH", "healthInfo = " + healthInfo);
    if (!isNullOrBlank(healthInfo)){
        healthInfo = removeComma(healthInfo);
        var tmp = healthInfo.split("/");
        healthObj.leftOver = parseInt(tmp[0]);
        healthObj.total = parseInt(tmp[1]);
    }
    return healthObj;
}

function heal(){
    var retCode = playMacro(FIGHT_FOLDER, "10_Heal.iim", MACRO_INFO_LOGGING);
    logV2(DEBUG, "HEAL", "Healing...");
    var healed = false;
    if (retCode == SUCCESS) {
        healed = closePopup();
    }
    return healed;
}

function isAllyGang(list, gangId){
    var found = false;
    if (gangId != null) {
        for (var i = 0; i < list.length; i++) {
            var gangObj = list[i];
            if (gangObj.active && gangObj.id == gangId) {
                found = true;
                break;
            }
        }
    }
    return found;
}

function isAlly(list, fighter){
    var found = false;
    if (propertyExistAndNotNull(fighter, "gangId")) {
        for (var i = 0; i < list.length; i++) {
            var gangObj = list[i];
            if (gangObj.active) {
                if (gangObj.id == fighter.gangId) {
                    found = true;
                    break;
                }
                if (propertyExistAndNotNull(gangObj, "whiteTag") && contains(fighter.name, gangObj.whiteTag)){
                    logV2(INFO, "Friendly White Tagged Player: " + fighter.id + " " + fighter.name);
                    found = true;
                    break;
                }
            }
        }
    }
    return found;
}

function getHomeFeedObj(time, feed){
    var obj = {"timeMsg": time, "feedMsg": feed, "timeStamp": null, "currentTime": null, "name": null, "fighterId": null,
        "gangId": null, "gangName": null, "id":UUID()};
    return obj;
}

function checkForAttackers(configMRObj, homefeedObj){
    var count=0;
    var length = homefeedObj.kills.length -1;
    var attackers = {};
    for (var i=length; i >= 0; i--){
        var homefeedLine = homefeedObj.kills[i];
        var currDate = new Date();
        currDate = dateAdd(currDate, -configMRObj.fight.underAttackTime, configMRObj.fight.underAttackTimeUnit);
        var date = formatStringYYYYMMDDHHMISSToDate(homefeedLine.timeStamp);
        if (currDate <= date){
            if (attackers.hasOwnProperty(homefeedLine.fighterId)){
                attackers[homefeedLine.fighterId]["count"]++;
            }
            else {
                attackers[homefeedLine.fighterId] = {"name": homefeedLine.name, "count": 1};
            }
            if (homefeedLine.fighterId == "10212700280927276"){
                waitV2("300");
            }

        }
        else {
            // list is sorted on most recent
            break;
        }
    }
    Object.getOwnPropertyNames(attackers).forEach(
        function (val, idx, array) {
            if (attackers[val]["count"] > configMRObj.fight.underAttackLimit){
                count = attackers[val]["count"];
                logV2(INFO, "HOMEFEED", "We are being bullied by player " + val + " - " + attackers[val]["name"] + ": Nr Of Kills: " + count);
            }
            else if (attackers[val]["count"] > configMRObj.fight.underAttackLimitForList && isAttacker(configMRObj, val)){
                count = attackers[val]["count"];
                logV2(INFO, "HOMEFEED", "We are being bullied by listed attacker " + val + " - " + attackers[val]["name"] + ": Nr Of Kills: " + attackers[val]["count"]);
            }
        }
    );
    return count;
}

function extractTimeFromHomefeed(msg, time){
    //var example = "3 hours, 32 minutes ago:";
    msg = msg.toLowerCase();
    var regExp = "([0-9]{1,2}) " + time;
    var matches = msg.match(regExp);
    if (matches != null && matches.length > 0){
        return parseInt(matches[matches.length-1]);
    }
    return 0;
}

function processHomefeed(processHomefeed){
    var homefeedObj = initMRObject(MR.MR_HOMEFEED_FILE);
    logV2(INFO, "HOMEFEED", "processHomefeedLines: " + processHomefeed);
    if (processHomefeed) {
        getHomeFeed(configMRObj, homefeedObj);
    }
    return processHomefeed;
}

function underAttack(configMRObj, processHomefeed){
    var homefeedObj = initMRObject(MR.MR_HOMEFEED_FILE);
    var bullied = false;
    if (checkForAttackers(configMRObj, homefeedObj) > 1){
        var waitTime = configMRObj.fight.underAttackWaitSeconds.toString();
        bullied = true;
        waitV2(waitTime);
    }
    return bullied;
}

function isAttacker(configMRObj, fighterId){
    var list = configMRObj.fight.underAttackList;
    for (var i=0; i < list.length; i++){
        if (list[i].id == fighterId){
            return true;
        }
    }
    return false;
}

function isExcludedPlayer(homefeedObj, fighterId){
    var found = false;
    logV2(INFO, "HOMEFEED", 'isExcludedPlayer fighterId' + fighterId);
    for (var i=0; i < homefeedObj.excludePlayers.length; i++){
        var playObj = homefeedObj.excludePlayers[i];
        if (playObj.id == fighterId){
            logV2(INFO, "HOMEFEED", "Excluded player found: " + fighterId);
            addValueToProperty(playObj, "ices", 1);
            found = true;
            break;
        }
    }
    logV2(INFO, "HOMEFEED", 'isExcludedPlayer ' + found);
    return found;
}

function getHomeFeed(configMRObj, homefeedObj){
    logV2(INFO, "HOMEFEED", "Get Home Feed");
    var retCode = initAndCheckScript(COMMON_FOLDER, "30_Home.iim", "33_Home_Test.iim","feed", "HOMEFEED", "init Homefeed");
    var listOfKills = [];
    var listOfLines = [];
    if (retCode == SUCCESS){
        for (var i=1; i <= configMRObj.homefeedLines; i++) {
            addMacroSetting("POS", i.toString());

            retCode = playMacro(COMMON_FOLDER, "31_HomeFeedLine.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS){
                var timeMsg = getLastExtract(1, "Home Feed Time", "1 hour, 34 minutes ago:");
                var originalMsg = getLastExtract(2, "Home Feed Line", "BlaBla");
                var txtMsg = getLastExtract(3, "Home Feed Line", "BlaBla");
                var line = getHomeFeedObj(timeMsg, txtMsg);
                //txtMsg = txtMsg.toLowerCase();
                //var msg = originalMsg.toLowerCase();
                var gangObj = extractGangInformation(originalMsg);
                line.gangId = gangObj.id;
                line.gangName = gangObj.name;
                var fighterObj = extractHomeFighterInformation(originalMsg);
                if (fighterObj.id == null){
                    logV2(WARNING, "HOMEFEED", "Problem with homefeed line: " + originalMsg);
                    continue;
                }
                line.fighterId = fighterObj.id;
                line.name = fighterObj.name;
                var currDate = new Date();
                line.currentTime = formatDateToYYYYMMDDHHMISS(currDate);
                var timeStamp = currDate;
                var seconds = extractTimeFromHomefeed(timeMsg, "second");
                timeStamp = dateAdd(timeStamp, -seconds, "seconds");
                var minutes = extractTimeFromHomefeed(timeMsg, "minute");
                timeStamp = dateAdd(timeStamp, -minutes, "minutes");
                var hours = extractTimeFromHomefeed(timeMsg, "hour");
                timeStamp = dateAdd(timeStamp, -hours, "hours");
                var days = extractTimeFromHomefeed(timeMsg, "day");
                timeStamp = dateAdd(timeStamp, -days, "days");
                line.timeStamp = formatDateToYYYYMMDDHHMISS(timeStamp);
                logV2(INFO, "HOMEFEED", "Time: " + timeStamp);
                logV2(INFO, "HOMEFEED", "Player: " + line.fighterId + " - " + line.name);
                if (txtMsg.toLowerCase().startsWith("you were killed")) {
                    if (!isExcludedPlayer(homefeedObj, line.fighterId)) {
                        listOfKills.push(line);
                    }
                }
                else if (contains(txtMsg, "accepted your")) {
                    listOfLines.push(line);
                }
                else {
                    listOfLines.push(line);
                }
            }
            else {
                //logV2(INFO, "FIGHT", "Problem Home Feed: Get Line " + i);
                break;
            }
        }
        if (isUndefined(homefeedObj.kills)){
            homefeedObj.kills = [];
        }
        if (isUndefined(homefeedObj.lines)){
            homefeedObj.lines = [];
        }
        for (var i=(listOfKills.length-1);i >= 0; i--){
            homefeedObj.kills.push(listOfKills[i]);
        }
        for (var i=(listOfLines.length-1);i >= 0; i--){
            homefeedObj.lines.push(listOfLines[i]);
        }
        writeMRObject(homefeedObj, MR.MR_HOMEFEED_FILE);

        do {
            retCode = playMacro(COMMON_FOLDER, "32_HomeFeedClear.iim", MACRO_INFO_LOGGING);
            if (retCode != SUCCESS) {
                logV2(INFO, "FIGHT", "Problem clearing home feed");
                break;
            }
            retCode = playMacro(COMMON_FOLDER, "34_HomeFeedClearTest.iim", MACRO_INFO_LOGGING);
        }
        while (retCode != SUCCESS);
    }
    else {
        logV2(INFO, "FIGHT", "Problem Going To MR Home Page");
    }
    logV2(INFO, "HOMEFEED", "End Home Feed");
}

function addFighter(fighterObj, fighter){
    if (!findFighter(fighterObj.fighters, fighter.id)){
        fighterObj.fighters.push(fighter);
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    }
}

function addFighterV2(fighterObj, fighter){
    var foundFighter = getFighter(fighterObj.fighters, fighter.id);
    if (foundFighter == null){
        logV2(INFO, "ADDFIGHTER", "Add fighter " + fighter.id);
        fighterObj.fighters.push(fighter);
        // add object to the indexed array
        fighterArrayObj[fighter.id] = fighter;
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
        foundFighter = fighter;
    }
    else {
        logV2(INFO, "ADDFIGHTER", "Update fighter " + fighter.id);
        updateFighterInfo(foundFighter, fighter);
    }
    return foundFighter;
}

function updateFighterInfo(fighterToUpdate, fighter){
    fighterToUpdate.gangId = fighter.gangId;
    fighterToUpdate.gangName = fighter.gangName;
    fighterToUpdate.level = fighter.level;
    fighterToUpdate.lastChecked = formatDateToYYYYMMDDHHMISS();
}

function getFighterObject(id, name, level){
    return {"id":id, "name":name, "level": level, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null, "lastChecked": null,
        "iced": 0, "alive": 0, "dead": 0, "homefeed": null, "staminaCost": null, "attackType": null
    };
}

function updateHomefeedFighter(fighterObj, fighterId, homefeed){
    var found = false;
    for (var i=0; i < fighterObj.fighters.length; i++){
        var fighterItem = fighterObj.fighters[i];
        if (fighterItem.id == fighterId){
            found = true;
            if (!fighterItem.hasOwnProperty("homefeed") || fighterItem.homefeed < homefeed) {
                fighterItem.homefeed = homefeed;
                logV2(INFO, "FIGHT", "Update Homefeed: " + JSON.stringify(fighterItem));
                writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            }
            else {
                //logV2(INFO, "FIGHT", "NO Update Homefeed: " + JSON.stringify(fighterItem));
            }
            break;
        }
    }
    if (!found){
        logV2(INFO, "FIGHT", "Problem Updating homefeed for " + fighterId);
    }
}

function addHomeFeedKillToList(friendObj, fightersToExclude, fighterObj, list, lineObj){

    var processed = false;
    if (list.hasOwnProperty(lineObj.fighterId)){
        //logV2(INFO, "HOMEFEED", "Already Added: " + lineObj.fighterId);
        processed = true;
    }
    if (findFighter(friendObj.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "FRIEND: " + lineObj.fighterId);
        processed = true;
    }
    else if (findFighter(fightersToExclude.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "STRONGER: " + lineObj.fighterId);
        processed = true;
    }
    else if (findFighter(fighterObj.fighters, lineObj.fighterId)){
        logV2(INFO, "HOMEFEED", "FIGHTER: " + lineObj.fighterId);
        updateHomefeedFighter(fighterObj, lineObj.fighterId, lineObj.timeStamp);
        processed = true;
    }
    else if (isAllyGang(friendObj.gangs, lineObj.gangId)){
        logV2(INFO, "HOMEFEED", "FRIENDLY GANG MEMBER: " + lineObj.fighterId + " / GANG: " + lineObj.gangId);
        processed = true;
    }
    if (!processed){
        list[lineObj.fighterId] = lineObj;
        var fighter = getFighterObject(lineObj.fighterId, lineObj.name, 0);
        fighter.gangId = lineObj.gangId;
        fighter.gangName = lineObj.gangName;
        fighter.homefeed = lineObj.timeStamp;
        addFighter(fighterObj, fighter);
        logV2(INFO, "HOMEFEED", "ADD: " + lineObj.fighterId);
    }
}

function checkProfileMiniHomeFeed(profile, friendObj, fightersToExclude, fighterObj){
    logHeader(INFO, "HOMEFEED", "Profile = " + profile.name, "*");
    var file = new ConfigFile(ORIG_MR_DIR + profile.id + "\\", MR.MR_HOMEFEED_FILE);
    var obj = initObject(file);
    var length = obj.kills.length;
    var listToCheck = {};
    var save = false;
    for (var i=length-1; i>=0; i--){
        var lineObj = obj.kills[i];
        if (!lineObj.hasOwnProperty("processed") || !lineObj.processed){
            addHomeFeedKillToList(friendObj, fightersToExclude, fighterObj, listToCheck, lineObj);
            lineObj.processed = true;
            save = true;
        }
        else {
            logV2(INFO, "HOMEFEED", "Last Homefeed Line processed: " + lineObj.timeMsg + " " + lineObj.feedMsg);
            break;
        }
    }
    if (save) {
        writeObject(obj, file);
    }
    var arrayOfKeys = Object.getOwnPropertyNames(listToCheck);
    logHeader(INFO, "HOMEFEED", "List Of Fighters Added", "=");
    arrayOfKeys.forEach(function (key) {
        logV2(INFO, "ADD", listToCheck[key].fighterId);
    });
}

function checkMiniHomeFeed(profileObj, activeProfile, friendObj, fightersToExclude, fighterObj){
    logV2(INFO, "HOMEFEED", "checkMiniHomeFeed");
    profileObj.list.forEach( function (profile)
    {
        if (profile.id != activeProfile && profile.mini){
            checkProfileMiniHomeFeed(profile, friendObj, fightersToExclude, fighterObj);
        }
    });
}

function checkForStopFighting(category, optimization){
    if (optimization){
        var stopFighting = false;
        do {
            stopFighting = getTempSetting(null, category, "stopFighting");
            if (stopFighting){
                var msg = "Fighting temporary disabled";
                logV2(INFO, category.toUpperCase(), msg);
                iimdisplay(msg);
                waitV2("10");
            }
        }
        while (stopFighting);
        iimdisplay("");
    }
    return false;
}

function performAttackInit(fighterType){
    var msg = null;
    var counter = 0;
    var macro = null;
    switch (fighterType) {
        case FIGHTERCONSTANTS.FIGHTERTPE.PROFILE:
            macro = "81_Profile_Attack_Start.iim";
            break;
        case FIGHTERCONSTANTS.FIGHTERTPE.RIVAL:
            macro = "32_AttackRivalMobster_start.iim";
            break;
        case FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY:
            addMacroSetting("CONTROLLER", settingsObj.fighting.rivalController, "ENABLE_LOGGING");
            macro = "37_AttackWiseGuy_start.iim";
            break;
        case FIGHTERCONSTANTS.FIGHTERTPE.NORMALPROFILE:
            macro = "81_Profile_Attack_Start.iim";
            break;
        case FIGHTERCONSTANTS.FIGHTERTPE.ASSASSIN:
            macro = "81_Profile_Attack_Start.iim";
            break;
        default:
            macro = "81_Profile_Attack_Start.iim";
            break;
    }
    logV2(DEBUG, "MACRO", macro);
    var retCode = initAndCheckScript(FIGHT_FOLDER, macro, "34_Attack_Start_Test.iim", "power attack", "INITATTACK", "Init Attack Step 1");
    if (retCode == SUCCESS) {
        var counter = 0;
        do {
            retCode = initAndCheckScript(FIGHT_FOLDER, "33_Attack_Start_1st.iim", "35_Attack_Start_Test_Step2.iim", "*", "INITATTACK", "Init Attack Step 2");
            if (retCode != SUCCESS){
                break;
            }
            retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS) {
                msg = getLastExtract(1, "Attack Status", "You WON The Fight");
                counter++;
            }
            if (counter > 1){
                logV2(INFO, "INITATTACK", "Problem extracting message. Retries: " + counter);
            }
        }
        while (isNullOrBlank(msg) && counter <= 10);
    }
    return msg;
}

function continueFightingAfterHealthCheck(healthObj){
    return healthObj.continueFighting;
}

function refreshAfterHealing(healthObj){
    var refresh = healthObj.refresh;
    return refresh;
}

function getVictimHealth(fighter, profileObj){
    var health = -1;
    retCode = playMacro(FIGHT_FOLDER, "40_Victim_Health", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var healthMsg = getLastExtract(1, "Victim Health", "50%");
        if (!isNullOrBlank(healthMsg)) {
            healthMsg = healthMsg.replace("%", "");
            logV2(DEBUG, "ATTACK", "Victim Health: " + healthMsg);
            health = parseInt(healthMsg);
            if (health == 0){
                waitV2("0.2");
                // MOD 15/11
                var iced = checkIfIced(fighter, profileObj);
                if (!iced){
                    logV2(DEBUG, "ATTACK", "Victim Health is 0, but is not killed yet");
                    health = 1;
                }
            }
        }
        else {
            logV2(INFO, "ATTACK", "Problem extracting Victim Health (Empty))");
        }
    }
    return health;

}

function checkForAttackButton(){
    var btnAvailable = false;
    var retCode = playMacro(FIGHT_FOLDER, "43_Check_Attack_Button.iim", MACRO_INFO_LOGGING);
    var btn = getLastExtract(1, "ATTACK BUTTON", "Power Attack");
    if (retCode == SUCCESS && !isNullOrBlank(btn)){
        btnAvailable = true;
    }
    logV2(DEBUG, "ATTACK", "Check Attack Button: " + btnAvailable);
    return btnAvailable;

}

function performAttack(victimHealth, fighterType, fighter){
    var retCode = -1;
    var status = performExperienceCheck(configMRObj, globalSettings);
    if (status == FIGHTERCONSTANTS.ATTACKSTATUS.EXP){
        return status;
    }
    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.RIVAL || fighterType == FIGHTERCONSTANTS.FIGHTERTPE.WISEGUY ){
        retCode = playMacro(FIGHT_FOLDER, "42_VictimRivalMobster_Attack.iim", MACRO_INFO_LOGGING);
    }
    else {
        //addMacroSetting("ID", fighter.id);
        logV2(DEBUG, "ATTACK", "ID: " + fighter.id);
        if (victimHealth <= configMRObj.fight.attackTillDiedHealth || fighterType == FIGHTERCONSTANTS.FIGHTERTPE.ASSASSIN){
            retCode = playMacro(FIGHT_FOLDER, "44_Victim_SpeedAttack.iim", MACRO_INFO_LOGGING);
        }
        else {
            retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack.iim", MACRO_INFO_LOGGING);
        }
    }
    if (retCode != SUCCESS) {
        status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    else {
        status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    }
    return status;
}

function performExperienceCheck(configMRObj, globalSettings){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    globalSettings.expReached = false;
    if (configMRObj.global.stopWhenExpBelow > 0){
        var exp = getExperience();
        if (exp == 0){
            logV2(WARNING, "EXPERIENCECHECK", "Problem getting experience");
            status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
        }
        else {
            if (exp <= configMRObj.global.stopWhenExpBelow) {
                status = FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED;
                globalSettings.expReached = true;
            }
            else {
                status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
            }
        }
    }
    return status;
}

function updateIces(fighter){
    var newIceDate = getDateYYYYMMDD();
    var oldIceDate = fighter.lastIced;
    if (oldIceDate == null){
        oldIceDate =  newIceDate;
    }
    if (oldIceDate != null) {
        var iceDate = oldIceDate.substr(0,8);
        if (iceDate == newIceDate){
            addValueToProperty(fighter, "icesOfTheDay", 1);
            logV2(INFO, "FIGHT", "Update Ice: " + fighter.icesOfTheDay);
        }
        else {
            fighter.icesOfTheDay = 1;
            logV2(INFO, "FIGHT", "Add Ice: " + fighter.icesOfTheDay);
        }
    }
    fighter.iced++;
    fighter.lastIced = formatDateToYYYYMMDDHHMISS(new Date());
    logV2(INFO, "FIGHT", JSON.stringify(fighter));

}

function isExcludedKill(fighter, profileObj){
    for (var i=0; i < profileObj.list.length; i++){
        var profile = profileObj.list[i];
        if (profile.fighterId == fighter.id){
            return true;
        }
    }
    return false;
}

function addKill(msg, fighter, profileObj){
    if (!isExcludedKill(fighter, profileObj)) {
        var kills = initMRObject(MR.MR_KILLS_FILE);
        var currDate = formatDateYYYYMMDDHHMISS();
        var homefeedObj = getHomeFeedObj(currDate, msg);
        homefeedObj.timestamp = formatDateToYYYYMMDDHHMISS();
        homefeedObj.fighterId = fighter.id;
        homefeedObj.name = fighter.name;
        homefeedObj.gangId = fighter.gangId;
        homefeedObj.gangName = fighter.gangName;
        kills.list.push(homefeedObj);
        writeMRObject(kills, MR.MR_KILLS_FILE);
    }
    else {
        logV2(INFO, "KILLS", "Player is one of my defined accounts. Not added to the kills list: " + fighter.id + "/" + fighter.name);
    }
}

function checkIfIced(fighter, profileObj){
    iced = false;
    var retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status.iim", MACRO_INFO_LOGGING);
    var msg = null;
    if (retCode == SUCCESS){
        var originalMsg = getLastExtract(1, "Ice Status", "BlaBlaBla just Killed blabla. Your Kill Count is now 777");
        msg = originalMsg.toUpperCase();
        logV2(INFO, "FIGHT", "Check For Iced: " + msg);
        if (msg.indexOf("YOUR KILL COUNT") !== -1){
            iced = true;
        }
        else if (msg.indexOf("JUST KILLED") !== -1){
            iced = true;
        }
    }
    else {
        logV2(INFO, "FIGHT", "Problem getting fight status: " + retCode);
    }
    if (iced){
        logV2(INFO, "FIGHT", "Total Ices: " + ++globalSettings.iced);
        if (fighter != null && fighter.id != FIGHTERCONSTANTS.RIVAL_ID) {
            addKill(originalMsg, fighter, profileObj);
            fighter.gangPoints = getGangPoints(msg);
            updateIces(fighter);
        }
    }
    return iced;
}


function getGangPoints(text){
    var regExp = "YOU EARNED ([0-9]{0,5}) GANG POINT";
    var matches = text.match(regExp);
    var gangPoints = 0;
    if (matches != null && matches.length > 0){
        gangPoints = parseInt(matches[matches.length-1]);
        logV2(INFO, "FIGHT", "Gang Points: " + gangPoints);
    }
    return gangPoints;
}

function getStaminaCost(){
    iced = false;
    var retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status.iim", MACRO_INFO_LOGGING);
    var staminaCost = 0;
    if (retCode == SUCCESS){
        var originalMsg = getLastExtract(1, "Ice Status", "BlaBlaBla just Killed blabla. Your Kill Count is now 777");
        var msg = originalMsg.toUpperCase();
        logV2(DEBUG, "FIGHT", "Check Stamina Cost: " + msg);
        var regExp = "USING ([0-9]{1,3})";
        var matches = msg.match(regExp);
        if (matches != null && matches.length > 0){
            staminaCost = parseInt(matches[matches.length-1]);
        }
    }
    else {
        logV2(INFO, "FIGHT", "Problem getting stamina cost: " + retCode);
    }
    logV2(DEBUG, "FIGHT", "staminaCost: " + staminaCost);
    return staminaCost;
}

function extractFighterinfo(fighter){
    logV2(INFO, "FIGHT", "Update info for fighter " + fighter.id);
    var retCode = playMacro(FIGHT_FOLDER, "85_Profile_GetInfo.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var lvlInfo = getLastExtract(1, "Level", "1,126");

        var xtraInfo = getLastExtract(2, "Fighter Info", "");
        if (!isNullOrBlank(lvlInfo)){
            lvlInfo = removeComma(lvlInfo);
            var level = parseInt(lvlInfo);
            var pl = extractProfileFighterName(xtraInfo);
            if (level > 0){
                fighter.level = level;
                var gangObj = extractGangInformation(xtraInfo);
                fighter.gangId = gangObj.id;
                fighter.gangName = gangObj.name;
                fighter.name = pl;
                fighter.lastChecked = formatDateToYYYYMMDDHHMISS();
            }
            else {
                logV2(WARNING, "FIGHT", "Problem converting level for player " + fighter.id);
                retCode == -1;
            }
        }
        else {
            logV2(WARNING, "FIGHT", "Problem extracting level for player " + fighter.id);
            retCode == -1;
        }
    }
    else {
        logV2(WARNING, "FIGHT", "Problem updating player " + fighter.id);
    }
    return retCode;
}

function findIndexedArray(indexedObj, id){
    return propertyExistAndNotNull(indexedObj, id);
}

function extractHomeGangInformation(text){
    var gangObj = {id:null, name:null};
    if (contains(text, "class=\"tag\"")){
        gangObj.id = extractHomeGangIdFromString(text);
        gangObj.name = extractHomeGangNameFromString(text);
    }
    return gangObj;
}

function extractHomeGangIdFromString(text){
    //var regExp = "class=\"tag\" data-id=\"" + "([0-9]{1,20})\">";
    var regExp = "<a href=\"/game/gang/([0-9]{1,30})\"";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractHomeGangNameFromString(text){
    var regExp = "class=\"tag\">(.*)(?:</a> <a href=)?$";
    //var regExp = "class=\"tag\">(.*)</a> <a href=";
    //var regExp = "class=\"tag\" data-id=\"" + "(?:[0-9]{1,20})\">([^<]*)<\/a>(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var name = unescape(matches[matches.length-1]);
        return name.trim();
    }
    return unescape(text);
}

function extractHomeFighterId(text){
//<div style="outline: 1px solid blue;">You were killed by <a href="/game/gang/3239260" class="tag">M+</a> <a href="/game/player/10209710235625552" class="pro">Riki</a>! Your cats sharpen their claws menacingly…</div>

    var regExp = "<a href=\"/game/player/([0-9]{1,30})\"";
    //var regExp = "CLASS=\"PRO\" DATA-ID=\"" + "([0-9]{1,30})\">";
    text = text.toLowerCase();
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return null;
}

function extractHomeFighterName(text){
    //.* or .*?. The first one is greedy and will match till the last "sentence" in your string,
    // the second one is lazy and will match till the next "sentence" in your string.
    var regExp = "class=\"pro\">(.*?)<\/a>(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        var name = unescape(matches[matches.length-1]);
        return name.trim();
    }
    return unescape(text);
}

function extractHomeFighterInformation(text){
    var obj = {id:null, name:null};
    obj.id = extractHomeFighterId(text);
    obj.name = extractHomeFighterName(text);
    return obj;
}
