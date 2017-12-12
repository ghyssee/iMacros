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
    playMacro(FIGHT_FOLDER, "11_GetHealth.iim", MACRO_INFO_LOGGING);
    var healthInfo = getLastExtract(1, "Health", "50/200");
    //logV2(INFO, "HEALTH", "healthInfo = " + healthInfo);
    if (!isNullOrBlank(healthInfo)){
        healthInfo = removeComma(healthInfo);
        var tmp = healthInfo.split("/");
        var health = parseInt(tmp[0]);
        return health;
    }
    return 0;
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
        "gangId": null, "gangName": null};
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

function underAttack(configMRObj){
    var homefeedObj = initMRObject(MR.MR_HOMEFEED_FILE);
    var bullied = false;
    waitV2("1");
    getHomeFeed(configMRObj, homefeedObj);
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
    for (var i=0; i < homefeedObj.excludePlayers.length; i++){
        var playObj = homefeedObj.excludePlayers[i];
        if (playObj.id == fighterId){
            logV2(INFO, "HOMEFEED", "Excluded player found: " + fighterId);
            addValueToProperty(playObj, "ices", 1);
            found = true;
            break;
        }
    }
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
}
