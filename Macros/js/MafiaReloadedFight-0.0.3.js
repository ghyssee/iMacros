var FIGHTERCONSTANTS = Object.freeze({
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
        "HOMEFEED" : 5
    },
    "FIGHTERSTATUS": {
        "UNKNOWN": "UNKNOWN",
        "ATTACK": "ATTACK",
        "FRIEND": "FRIEND",
        "STRONGER": "STRONGER"
    }
});

function extractIdNameFromString (text, type){
    var gangObj = {id:null, name:null};
    text = text.toUpperCase();
    if (contains(text, "CONTROLLER=" + type)){
        gangObj.id = extractGangIdFromString(text, type);
        gangObj.name = extractGangNameFromString(text, type);
    }
    return gangObj;
}

function extractGangIdFromString(text, type){
    var regExp = "CONTROLLER=" + type + "&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=([0-9]{1,20})\">";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
}

function extractGangNameFromString(text, type){
    var regExp = "CONTROLLER=" + type + "&(?:AMP;)?ACTION=VIEW&(?:AMP;)?ID=(?:[0-9]{1,20})\">([^<]*)<\/A>(?:.*)";
    var matches = text.match(regExp);
    if (matches != null && matches.length > 0){
        return matches[matches.length-1];
    }
    return text;
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
            logV2(INFO, "HEALTH", "Health Retries: " + counter);
            dummyBank();
        }
    }
    while (counter <= 10 && (health == -1 || health == oldHealth));
    logV2(INFO, "HEALTH", "oldHealth:" + oldHealth);
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
    logV2(INFO, "HEAL", "Healing...");
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
                txtMsg = txtMsg.toLowerCase();
                var msg = originalMsg.toLowerCase();
                var gangObj = extractIdNameFromString(msg, "GANG");
                line.gangId = gangObj.id;
                line.gangName = gangObj.name;
                var fighterObj = extractIdNameFromString(msg, "PROFILE");
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
                if (txtMsg.startsWith("you were killed")) {
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
        "iced": 0, "alive": 0, "dead": 0, "homefeed": null
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
    logV2(INFO, "MACRO", macro);
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
            logV2(INFO, "ATTACK", "Victim Health: " + healthMsg);
            health = parseInt(healthMsg);
            if (health == 0){
                waitV2("0.3");
                // MOD 15/11
                checkIfIced(fighter, profileObj);
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
    logV2(INFO, "ATTACK", "Check Attack Button: " + btnAvailable);
    return btnAvailable;

}

function performAttack(victimHealth, fighterType, fighter){
    var retCode = -1;
    var status = performExperienceCheck(configMRObj, globalSettings);
    if (status == FIGHTERCONSTANTS.ATTACKSTATUS.EXP){
        return status;
    }
    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.RIVAL){
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


function checkForExperienceLimit(){
    return (configMRObj.global.stopWhenExpBelow > 0);
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
    if (retCode == SUCCESS){
        var originalMsg = getLastExtract(1, "Ice Status", "Riki just Killed blabla. Your Kill Count is now 777");
        var msg = originalMsg.toUpperCase();
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
        addKill(originalMsg, fighter, profileObj);
        updateIces(fighter);
    }
    return iced;
}

function getStaminaCost(){
    iced = false;
    var retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status.iim", MACRO_INFO_LOGGING);
    var staminaCost = 0;
    if (retCode == SUCCESS){
        var originalMsg = getLastExtract(1, "Ice Status", "Riki just Killed blabla. Your Kill Count is now 777");
        var msg = originalMsg.toUpperCase();
        logV2(INFO, "FIGHT", "Check Stamina Cost: " + msg);
        var regExp = "USING ([0-9]{1,3})";
        var matches = msg.match(regExp);
        if (matches != null && matches.length > 0){
            staminaCost = parseInt(matches[matches.length-1]);
        }
    }
    else {
        logV2(INFO, "FIGHT", "Problem getting stamina cost: " + retCode);
    }
    logV2(INFO, "FIGHT", "staminaCost: " + staminaCost);
    return staminaCost;
}
