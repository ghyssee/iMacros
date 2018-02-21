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
        "STAMINALIMIT": 8
    },
    "FIGHTERTPE" : {
        "NORMAL" : 0,
        "RIVAL" : 1,
        "PROFILE": 2,
        "NORMALPROFILE": 3,
        "ASSASSIN" : 4,
        "HOMEFEED" : 5
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
    found = false;
    list.forEach( function (arrayItem)
    {
        if (arrayItem.id == id){
            found = true;
            return;
        }
    });
    return found;
}

function getHealth(){
    var healthObj = getHealthObj();
    return healthObj.leftOver;
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
        healed = true;
        closePopup();
    }
    return healed;
}

function isAllyGang(list, gangId){
    var found = false;
    if (gangId != null) {
        for (var i = 0; i < list.length; i++) {
            var gangObj = list[i];
            if (gangObj.id == gangId) {
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
    var retCode = playMacro(COMMON_FOLDER, "30_Home.iim", MACRO_INFO_LOGGING);
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
        retCode = playMacro(COMMON_FOLDER, "32_HomeFeedClear.iim", MACRO_INFO_LOGGING);
        if (retCode != SUCCESS){
            logV2(INFO, "FIGHT", "Problem clearing home feed");
        }
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

function getFighterObject(id, name, level){
    return {"id":id, "name":name, "level": level, "skip": false,
        "gangId": null, "gangName": null, "bigHealth": false, "lastAttacked": null, "lastIced": null,
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

function checkForStopFighting(category){
    var stopFighting = getTempSetting(null, category, "stopFighting");
    if (stopFighting){
        var msg = "Fighting temporary disabled";
        logV2(INFO, category.toUpperCase(), msg);
        iimdisplay(msg);
        waitV2("60");
        iimdisplay("");
    }
    return stopFighting;
}
