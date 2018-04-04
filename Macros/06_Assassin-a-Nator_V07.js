var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.5.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight-0.0.3.js"));

var localConfigObject = null;
var globalSettings = {"kills": 0, "heals": 0, "autoHealWait": false, "expReached": false, "oldHealth": -1, "assassinProfile": null,
    "autoHeal": false, "node": null,
    "profile": null
};
setMRPath(getLogFile());
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;
// 185 - 14 = 171

init();

var assassinObj = initMRObject(MR.MR_ASSASSIN_FILE);
var friendObj = initMRObject(MR.MR_FRIENDS_FILE);
var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var fightersToExclude = initMRObject(MR.MR_FIGHTERS_EXCLUDE_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var profileObj = initObject(MR_PROFILE_FILE);

globalSettings.assassinProfile = getAssassinProfile();
initScript();
//displayObj(globalSettings.assassinProfile);
startScript();
//if (assassinObj.gang.extract){
//    gangExtract(assassinObj.gang.gangId);
//}

function initScript(){
    var value = getFirefoxSetting(MR_BRANCH_ASSASSIN,  MR_ASSASSIN_AUTOHEAL, DATATYPE_BOOLEAN);
    if (value == null){
        globalSettings.autoHeal = configMRObj.fight.autoHeal;
    }
    else {
        globalSettings.autoHeal = value;
    }
    globalSettings.profile = getProfileObject(getProfile());
    logV2(INFO, "INIT", "AutoHeal: " + globalSettings.autoHeal);

}

function getLogFile(){
    var value = getFirefoxSetting(MR_BRANCH,  MR_NODE, DATATYPE_STRING);
    var file = "MRAssassin-a-Nator";
    if (value != null){
        globalSettings.node = value;
        file += ".Node" + value;
    }
    return file;
}

function activateTempSettings(){
    // Profile: Malin - Script: AutoHeal - Enable autoHeal
    setAssassinTempSettting("autoHeal", "autoHeal", true);
    // Profile: Eric - Script: Fight - Disable HomefeedAttack
    setTempSetting(globalSettings.profile.id, "fight", "homefeedAttack", false);
    // Profile: Eric - Script: Fight - Disable homefeed processing
    setTempSetting(globalSettings.profile.id, "homefeed", "processLines", false);
    setTempSetting(globalSettings.profile.id, "homefeed", "checkMini", false);
    // Profile: Eric - Script: Fight - Disable autoHeal
    setTempSetting(globalSettings.profile.id, "fight", "fightAutoHeal", false);
    setTempSetting(globalSettings.profile.id, "assassin-a-nator", "busyFighting", true);
    var nrOfScriptsRunning = getTempSetting(null, "assassin-a-nator", "nrOfScriptsRunning");
    nrOfScriptsRunning++;
    setTempSetting(globalSettings.profile.id, "assassin-a-nator", "nrOfScriptsRunning", nrOfScriptsRunning);
}

function deactivateTempSettings(){
    setAssassinTempSettting("autoHeal", "autoHeal", false);
    setTempSetting(globalSettings.profile.id, "fight", "homefeedAttack", null);
    setTempSetting(globalSettings.profile.id, "homefeed", "processLines", null);
    setTempSetting(globalSettings.profile.id, "homefeed", "checkMini", null);
    setTempSetting(globalSettings.profile.id, "fight", "fightAutoHeal", null);
    var nrOfScriptsRunning = getTempSetting(null, "assassin-a-nator", "nrOfScriptsRunning");
    nrOfScriptsRunning--;
    setTempSetting(globalSettings.profile.id, "assassin-a-nator", "nrOfScriptsRunning", nrOfScriptsRunning);
    if (nrOfScriptsRunning == 0) {
        setTempSetting(globalSettings.profile.id, "assassin-a-nator", "busyFighting", false);
    }
}

function getAssassinProfile(){
    var assassinProfileId = getFirefoxSetting(MR_BRANCH,  MR_ASSASSIN_PROFILE_KEY);
    if (isNullOrBlank(assassinProfileId)) {
        assassinProfileId = assassinObj.activeProfile;
    }
    for (var i = 0; i < assassinObj.profiles.length; i++) {
        var assassinProfile = assassinObj.profiles[i];
        if (assassinProfile.id == assassinProfileId) {
            return assassinProfile;
        }
    }
    alert("Assassin Profile Not Found: " + assassinProfileId);
    throw new UserCancelError("Assassin Profile Not Found");
}

function setAssassinTempSettting(category, sub, value){
    globalSettings.assassinProfile.players.forEach(function (fighter) {
        if (fighter.hasOwnProperty("active") && fighter.active) {
            var obj = findProfileByFighterId(profileObj, fighter.id);
            if (obj){
                setTempSetting(obj.id, category, sub, value);
            }
        }
    });
}

function startScript(){
    try {
        startMafiaReloaded();
        globalSettings.currentLevel = getLevel();
        logV2(INFO, "LEVEL", "Starting Level: " + globalSettings.currentLevel);
        activateTempSettings();
        if (assassinObj.gang.extract){
            gangExtract(assassinObj.gang.gangId);
        }
        do  {
            if (checkForStopFighting("assassin-a-nator")){
                continue;
            }
            else if (globalSettings.stopOnLevelUp){
                logV2(INFO, "FIGHT", "You Leveled Up and setting stopOnLevelUp is enabled");
                waitV2("60");
            }
            else if (globalSettings.autoHealWait){
                globalSettings.autoHealWait = false;
                waitV2("70");
            }
            else if (globalSettings.expReached){
                // check again, possibly leveled up
                var msg = "Experience Limit reached";
                logV2(INFO, "FIGHT", msg);
                var exp = getExperience();
                iimDisplay(msg);
                if (exp > configMRObj.global.stopWhenExpBelow){
                    globalSettings.expReached = false;
                    iimDisplay("");
                    continue;
                }
                else {
                    waitV2("60");
                    iimdisplay("");
                }
            }
            else {
                var status = performExperienceCheck(configMRObj, globalSettings);
                if (status == FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED) {
                    continue;
                }
                waitTillEnoughStamina();
                setTempSetting(globalSettings.profile.id, "assassin-a-nator", "busyFighting", true);
                // if (health is 0, don't check for underAttack, it's already checked
                globalSettings.forceHealing = true;
                configMRObj = initMRObject(MR.MR_CONFIG_FILE);
                var healthObj = performHealthCheck("START", configMRObj.fight.autoHeal);
                if (continueFightingAfterHealthCheck(healthObj)) {
                    fight();
                    logV2(INFO, "FIGHT", "Updating statistics");
                    //writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
                }
                else {
                    logV2(INFO, "FIGHT", "AutoHeal Disabled. Waiting till enough health again if autoheal disabled or stamina if minimum stamina has reached");
                }
                setTempSetting(globalSettings.profile.id, "assassin-a-nator", "busyFighting", false);
            }
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            // do nothing
        }
        else {
            logError(ex);
        }
        logV2(INFO, "SUMMARY", "Total Kills: " + globalSettings.kills);
        logV2(INFO, "SUMMARY", "Heals: " + globalSettings.heals);
    }
    deactivateTempSettings();
}

function continueFighting(status){
    var cont = false;
    if (status != FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA && status != FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED
        && status != FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP && status != FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT){
        cont = true;
    }
    logV2(INFO, "FIGHT", "continueFighting: " + cont + " / Status = " + status);
    return cont;
}

function fight(){

    var exitLoop = false;
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    do {
        configMRObj = initMRObject(MR.MR_CONFIG_FILE);
        status = profileAttack(globalSettings.assassinProfile.players, FIGHTERCONSTANTS.FIGHTERTPE.ASSASSIN);
        if (continueFighting(status)) {
            status = homeFeedAttack();
        }
        else {
            logV2(INFO, "FIGHT", "Exit Fight V2...");
            exitLoop = true;
            break;
        }

    }
    while (!exitLoop);
    return status;
}

function waitTillEnoughStamina(){
    var maxStamina = 200;
    var stamina = 0;
    var energy = 0;
    var total = 0;
    var minStamina = configMRObj.fight.minStaminaToHeal;
    logV2(INFO, "TEMP", "Profile: Malin, script AutoHeal - disable autoHeal");
    setAssassinTempSettting("autoHeal", "autoHeal", false);
    logV2(INFO, "TEMP", "Profile: Malin, script Fight - reset autoHeal");
    setAssassinTempSettting("fight", "autoHeal", null);
    do {
        dummyBank();
        // refreshing stats (health / exp / stamina / energy)
        var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
        stamina = staminaObj.leftOver;
        if (stamina == -1){
        }
        else {
            energy = getEnergy();
            var health = getHealth();
            total = stamina + energy;
            var exp = getExperience();
            if (exp > 0) {
                var staminaNeeded = exp / (4.5);
                logV2(INFO, "WAIT", "Stamina Needed: " + staminaNeeded);
                logV2(INFO, "WAIT", "Total (Energy + Stamina available): " + total);
                logV2(INFO, "WAIT", "Stamina: " + stamina);
                logV2(INFO, "WAIT", "maxStamina: " + maxStamina);
                // maxStamina = Math.min(maxStamina, staminaNeeded);
                if (total >= staminaNeeded && stamina > configMRObj.fight.minStaminaToFightForLevelUp && (stamina >= minStamina || exp < 300)) {
                    logV2(INFO, "WAIT", "Enough Stamina to level up");
                    // force healing
                    if (health == 0) {
                        if (heal()) {
                            logV2(INFO, "WAIT", "Force Healing");
                            globalSettings.heals++;
                        }
                    }
                    break;
                }
                else if (stamina >= configMRObj.fight.minStaminaToFight) {
                    logV2(INFO, "WAIT", "Enough Stamina to start fighting again");
                    break;
                }
                else if (health > 0 && stamina > 20) {
                    logV2(INFO, "WAIT", "Enough Health to fight");
                    break;
                }
            }
            else {
                logV2(WARNING, "WAIT", "Problem getting experience");
            }
        }
        waitV2("60");
    }
    while (true);
    logV2(INFO, "WAIT", "Leaving wait");
    setAssassinTempSettting("fight", "autoHeal", false);
    setAssassinTempSettting("autoHeal", "autoHeal", true);
}

function attack(fighter, fighterType){
    logV2(INFO, "FIGHT", "Attacking " + fighter.id);
    var statusObj = getStatusObject();
    if (propertyExistAndEqualTo(fighter, "status", FIGHTERCONSTANTS.FIGHTERSTATUS.STRONGER) || propertyExistAndEqualTo(fighter, "status", FIGHTERCONSTANTS.FIGHTERSTATUS.FRIEND)){
        logV2(INFO, "ATTACK", "Skipping fighter " + fighter.id);
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.SKIP;
        return statusObj;
    }
    var healthObj = performHealthCheck("ATTACK", configMRObj.fight.autoHeal);
    if (!continueFightingAfterHealthCheck(healthObj)){
        logV2(INFO, "ATTACK", "Not enough health to fight");
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOHEALTH;
        return statusObj;
    }
    else if (refreshAfterHealing(healthObj)){
        logV2(INFO, "ATTACK", "Refresh After Healing");
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.REFRESH;
        return statusObj;
    }
    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
    }
    msg = performAttackInit(fighterType);
    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
    }
    else if (!isNullOrBlank(msg)) {
        var status = evaluateAttackMessage(msg);
        switch (status) {
            case FIGHTERCONSTANTS.OPPONENT.NOHEALTH:
                break;
            case FIGHTERCONSTANTS.OPPONENT.FRIEND :
                removeItemFromArray(MR.MR_FIGHTERS_FILE, fighterObj, fighter.id);
                addFriend(fighter);
                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.SKIP;
                break;
            case FIGHTERCONSTANTS.OPPONENT.WON :
                fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                addValueToProperty(fighter, "alive", 1);
                var attackStatusObj = attackTillDeath(fighter);
                if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp) {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                }
                else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA) {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                }
                else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED) {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                }
                else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT) {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                }
                else if (attackStatusObj.status == FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM) {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
                }
                else {
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                }
                updateStatistics(fighter, fighterType);
                if (!propertyExistAndNotNull(fighter, status) || fighter.status == FIGHTERCONSTANTS.FIGHTERSTATUS.UNKNOWN){
                    logV2(INFO, "FIGHT", "Updating status for fighter " + fighter.id);
                    fighter.status = FIGHTERCONSTANTS.FIGHTERSTATUS.ATTACK;
                    writeMRObject(assassinObj, MR_ASSASSIN_FILE);
                }
                break;
            case FIGHTERCONSTANTS.OPPONENT.DEAD :
                addValueToProperty(fighter, "dead", 1);
                logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                globalSettings.stolenIces++;
                updateStatistics(fighter, fighterType);
                break;
            case FIGHTERCONSTANTS.OPPONENT.LOST :
                fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                getVictimHealth(fighter, profileObj);
                logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
                removeItemFromArray(MR.MR_FIGHTERS_FILE, fighterObj, fighter.id);
                addStrongerOpponent(fighter);
                if (!propertyExistAndNotNull(fighter, status) || fighter.status == FIGHTERCONSTANTS.FIGHTERSTATUS.UNKNOWN){
                    fighter.status = FIGHTERCONSTANTS.FIGHTERSTATUS.STRONGER;
                    writeMRObject(assassinObj, MR_ASSASSIN_FILE);
                }
                fighter.skip = true;
                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                break;
            default :
                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
                logV2(INFO, "FIGHT", "Attack First Time Problem");
                break;
        }
    }
    else {
            logV2(INFO, "FIGHT", "Problem getting status for Fighter: " + fighter.id);
            statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
        }
    return statusObj;
}

function attackTillDeath(fighter){
    logV2(INFO, "ATTACK", "AttackTillIced Figther " + fighter.id);
    var alive = true;
    var retCode = 0;
    var previousHealth = 1000;
    var nrOfAttacks = 0;
    var statusObj = getStatusObject();
    var firstAttack = true;
    var nrOfHeals = 0;
    var originalHealth = 0;
    var health = 0;
    var victimHealed;
    var bigHealthAttacks = 0;
    var oldStaminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
    var staminaObj = oldStaminaObj;
    globalSettings.oldHealth = -1; // resetting old health;

    do {
        victimHealed = false;
        if (health > -1){
            if (firstAttack) {
                originalHealth = health;
                health = getVictimHealth(fighter, profileObj);
            }
            if (previousHealth < health){
                logV2(INFO, "ATTACK", "Victim healed: " + fighter.id);
                nrOfHeals++;
                originalHealth = health;
                previousHealth = health;
                victimHealed = true;
                bigHealthAttacks = 0;
            }
            var victimIsDeath = false;
            if (health == 0){
                // check if attack button available (if health is 0, he can still be alive)
                if (checkForAttackButton()){
                    logV2(INFO, "ATTACK", "Victim is not dead yet. Continue Attacking...");
                    victimIsDeath = false;
                    alive = true;
                }
                else {
                    logV2(INFO, "ATTACK", "Victim is dead: " + fighter.id);
                    alive = false;
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    victimIsDeath = true;
                    break;
                }
            }
            if (!victimIsDeath) {
                var deltaHealth = 0;
                if (!firstAttack){
                    deltaHealth = previousHealth-health;
                    logV2(DEBUG, "ATTACK", "Victim Health changed: " + deltaHealth);
                }
                previousHealth = health;
                if (nrOfAttacks > configMRObj.fight.maxNumberOfAttacks && health > configMRObj.fight.attackTillDiedHealth){
                    logV2(INFO, "ATTACK", "Max. Nr Of Attacks Reached. Skipping...");
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    break;
                }
                else if (nrOfHeals > configMRObj.fight.numberOfHealsLimit && health > configMRObj.fight.attackTillDiedHealth){
                    logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
                    globalSettings.maxHealed++;
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    break;
                }
                else if (health >= configMRObj.fight.attackTillDiedHealth && !firstAttack && !victimHealed &&
                    deltaHealth < 2 && health > configMRObj.fight.attackTillDiedBigHealth &&
                    (originalHealth - health) <= configMRObj.fight.deltaBigHealth &&
                    bigHealthAttacks > configMRObj.fight.maxNumberOfAttacksBigHealth){
                    logV2(INFO, "ATTACK", "Victim has too much health. Skipping...");
                    logV2(INFO, "ATTACK", "Delta Health: " + deltaHealth);
                    logV2(INFO, "ATTACK", "Orignal Health: " + originalHealth);
                    logV2(INFO, "ATTACK", "Current Health: " + health);
                    logV2(INFO, "ATTACK", "Big Health Attacks: " + bigHealthAttacks);
                    globalSettings.skippedHealth++;
                    statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
                    fighter.bigHealth = true;
                    break;
                }
                else {
                    var healthObj = performHealthCheck("ATTACKTILLDEATH", configMRObj.fight.autoHeal, stamina);
                    if (!continueFightingAfterHealthCheck(healthObj)) {
                        logV2(INFO, "ATTACK", "No health to fight");
                        continue;
                    }
                    else if (refreshAfterHealing(healthObj)) {
                        logV2(INFO, "ATTACK", "Refresh After Healing");
                        alive = false;
                        break;
                    }
                    var stamina = staminaObj.leftOver;
                    if (stamina == -1) {
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                        logV2(INFO, "ATTACK", "Stamina Limit Reached");
                        break;
                    }
                    else if (stamina < 5) {
                        statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        break;
                    }
                    var attackStatus = performAttack(health, FIGHTERCONSTANTS.FIGHTERTPE.ASSASSIN, fighter);
                    staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
                    if (stamina >= oldStaminaObj.leftOver){
                        logV2(WARNING, "FIGHT", "ATTACK Button not registered");
                    }
                    else {
                        firstAttack = false;
                        statusObj.totalStamina += 5;
                        nrOfAttacks++;
                        bigHealthAttacks++;
                        globalSettings.money += checkSaldo();
                        // MOD 15/11
                        health = getVictimHealth(fighter, profileObj);
                        var exitAttack = false;
                        switch (attackStatus) {
                            case FIGHTERCONSTANTS.ATTACKSTATUS.OK:
                                break;
                            case FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED:
                                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.EXPREACHED;
                                exitAttack = true;
                                break;
                            case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM:
                                statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
                                exitAttack = true;
                                break;
                        }
                        if (exitAttack) {
                            break;
                        }
                    }
                }

            }
        }
        else {
            // Problem with script
            statusObj.status = FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM;
            logV2(INFO, "ATTACK", "Problem Attack Till Death");
            return statusObj;
        }
    }
    while (alive);
    logV2(INFO, "ATTACK", "Attack Figther Finished.");
    logV2(INFO, "ATTACK", "Total Stamina used: " + statusObj.totalStamina);
    logV2(INFO, "ATTACK", "Total Attacks: " + nrOfAttacks);
    globalSettings.nrOfAttacks += nrOfAttacks;
    return statusObj;
}

function checkIfLevelUp(){
    var level = getLevel();
    var levelUp = false;
    if (globalSettings.currentLevel === 0) {
        globalSettings.currentLevel = level;
    }
    else if (level > globalSettings.currentLevel){
        levelUp = true;
        globalSettings.stopOnLevelUp = configMRObj.fight.stopOnLevelUp;
        logV2(INFO, "LEVELUP", "New Level: " + level + ". Checking For Dialog Box");
        var ret = closePopup();
        if (ret == SUCCESS){
            logV2(INFO, "LEVELUP", "Dialog Box Closed");
        }
        globalSettings.currentLevel = level;
    }
    return levelUp;
}

function addFriend(fighter){
    if (!findFighter(friendObj.fighters, fighter.id)){
        friendObj.fighters.push(fighter);
        writeMRObject(friendObj, MR.MR_FRIENDS_FILE);
    }
}

function addStrongerOpponent(fighter){
    if (!findFighter(fightersToExclude.fighters, fighter.id)){
        fightersToExclude.fighters.push(fighter);
        writeMRObject(fightersToExclude, MR.MR_FIGHTERS_EXCLUDE_FILE);
    }
}

function evaluateAttackMessage(msg){
    logV2(INFO, "ATTACK", "Msg = " + msg);
    if (isNullOrBlank(msg)){
        return FIGHTERCONSTANTS.OPPONENT.UNKNOWN;
    }
    msg= msg.toUpperCase();
    if (msg.startsWith("YOU LOST")){
        return FIGHTERCONSTANTS.OPPONENT.LOST;
    }
    else if (msg.startsWith("YOU WON")){
        return FIGHTERCONSTANTS.OPPONENT.WON;
    }
    else if (msg.startsWith("YOU CANNOT ATTACK YOUR FRIEND")){
        return FIGHTERCONSTANTS.OPPONENT.FRIEND;
    }
    else if (msg.startsWith("IT LOOKS LIKE")){
        return FIGHTERCONSTANTS.OPPONENT.DEAD;
    }
    else if (msg.startsWith("YOU DO NOT FEEL HEALTHY")){
        return FIGHTERCONSTANTS.OPPONENT.NOHEALTH;
    }
    else {
        return FIGHTERCONSTANTS.OPPONENT.UNKNOWN;
    }
}

function getStatusObject(){
    return {"status":null,
        "totalStamina":0,
        "iced": 0
    };
}

function updateFighter(player){
    for (var i=0; i < assassinObj.homefeedPlayers.length; i++){
        var obj = assassinObj.homefeedPlayers[i];
        if (obj.id == player.id){
            obj = player;
            writeMRObject(assassinObj, MR.MR_ASSASSIN_FILE);
            logV2(INFO, "UDATE", "Player Info Saved");
            break;
        }
    }
}


function updateStatistics(fighter, fighterType){
    logObj(INFO, "STATS", fighter);
    if (fighterType == FIGHTERCONSTANTS.FIGHTERTPE.HOMEFEED) {
        updateFighter(fighter);
    }
    else {
        writeMRObject(assassinObj, MR.MR_ASSASSIN_FILE);
    }
}

function init(){

    localConfigObject = initObject(LOCAL_CONFIG_JSON_FILE);
    localConfigObject.global.oneDriveInstallDir = ONEDRIVEPATH + "\\";

    var oneDrivePath = localConfigObject.global.oneDriveInstallDir;
    var IMACROS_CONFIG_DIR = "\\iMacros\\config\\";

    if (!isNullOrBlank(oneDrivePath)){
        if (localConfigObject.global.config == "ONEDRIVE"){
            CONFIG_ONEDRIVE_DIR = oneDrivePath + IMACROS_CONFIG_DIR;
            CONFIG_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
            logV2(INFO, "INIT", "Settting Config file to " + CONFIG_JSON_FILE.fullPath());
            PROFILE_JSON_FILE.path = CONFIG_ONEDRIVE_DIR;
            logV2(INFO, "INIT", "Settting Profiles file to " + PROFILE_JSON_FILE.fullPath());
            SCRIPT_ONEDRIVE_DIR.path = oneDrivePath + "\\";
            logV2(INFO, "INIT", "OneDrive Datasource Path = " + SCRIPT_ONEDRIVE_DIR.fullPath());
        }
    }
    validateDirectory(LOG_DIR);
}

function validateDirectory(directoryName){
    if (!fileExists(directoryName)){
        var errorMsg = "Directory does not exist: " + directoryName;
        alert(errorMsg);
        logV2(ERROR, "ERROR", errorMsg);
        throw new Error(errorMsg);
    }
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
    var value = _getFirefoxSetting("extensions.imacros.",  "defsavepath");
    if (value == null){
        throw new Error("iMacros Probably not installed...");
    }
    return value;
}

function _getFirefoxSetting(branch, key){

    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(branch);

    var value = prefs.getCharPref(key, Components.interfaces.nsISupportsString);
    return value;
}

function removeItemFromArray(file, fightObj, id){
    var index = -1;
    for (var i=0; i < fightObj.fighters.length; i++){
        var item = fightObj.fighters[i];
        if (item.id == id){
            index = i;
            break;
        }
    }
    if (index >= 0){
        fightObj.fighters.splice(index, 1);
        writeMRObject(fightObj, file);
    }
    return index > -1;
}

function getAssassinPlayerObj(){
    return {
        "fighterId": null,
        "active": true,
        "id": UUID(),
        "name": null,
        "level": 0,
        "bigHealth": false,
        "lastAttacked": null,
        "lastIced": null,
        "iced": 0,
        "alive": 0,
        "dead": 0,
        "gangId": null,
        "gangName": null,
        "status": FIGHTERCONSTANTS.FIGHTERSTATUS.UNKNOWN
    };
}

function extractFightersFromGang(gangId){
    var retCode = SUCCESS;
    var array = [];
    if (gangId != null){
        do {
            retCode = playMacro(FIGHT_FOLDER, "90_Gang_Extract_Fighter.iim", MACRO_INFO_LOGGING);
            if (retCode == SUCCESS) {
                var assassinPlayer = getAssassinPlayerObj();
                assassinPlayer.fighterId = null;
                assassinPlayer.name = null;
                assassinPlayer.level = 0;
                assassinPlayer.gangId = gangId;
                assassinPlayer.gangName = null;
                array.push(assassinPlayer);
            }
            else {
                logV2(WARNING, "GANGATTACK", "There was a problem extracting Fighter from Gang " + gangId);
            }
        }
        while (retCode == SUCCESS);
    }
    else {
        logV2(WARNING, "GANGATTACK", "Gang Id is empty");
    }
    return array;
}

function extractFightersFromGang2(gangId){
    var retCode = SUCCESS;
    var counter = 0;
    var array = [];
    do {
        //retCode = playMacro(FIGHT_FOLDER, "90_Gang_Extract_Fighter.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            var assassinPlayer = getAssassinPlayerObj();
            assassinPlayer.fighterId = UUID();
            assassinPlayer.name = UUID();
            assassinPlayer.level = 0;
            assassinPlayer.gangId = gangId;
            assassinPlayer.gangName = UUID();
            array.push(assassinPlayer);
        }
        else {
            logV2(WARNING, "GANGATTACK", "There was a problem extracting Fighter from Gang " + gangId);
        }
        counter++;
    }
    while (counter < 5);
    return array;
}

function gangExtract(gangId){
    addMacroSetting("ID", gangId);
    var retCode = playMacro(FIGHT_FOLDER, "90_Gang_Attack_Init.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS) {
        var players = extractFightersFromGang(gangId);
        gangAttackInit(players, assassinObj.gang.profileId);
    }
    else {
        logV2(WARNING, "GANGATTACK", "There was a problem With The Gang Init: " + gangId);
    }
}

function gangAttackInit(array, profileId){
    var filteredArray = [];
    array.forEach(function (fighter){
        if (findFighter(fighterObj.fighters, fighter.id)){
            fighter.status = FIGHTERCONSTANTS.FIGHTERSTATUS.ATTACK;
            filteredArray.push(fighter);
        }
        else if (findFighter(fightersToExclude.fighters, fighter.id)){
            logV2(INFO, "GANGATTACK", "Stronger opponent: " + fighter.id + " " + fighter.name);
            fighter.status = FIGHTERCONSTANTS.FIGHTERSTATUS.STRONGER;
            filteredArray.push(fighter);
        }
        else if (findFighter(friendObj.fighters, fighter.id)){
            logV2(INFO, "GANGATTACK", "Friend: " + fighter.id + " " + fighter.name);
            fighter.status = FIGHTERCONSTANTS.FIGHTERSTATUS.FRIEND;
            filteredArray.push(fighter);
        }
        else {
            fighter.status = "UNKNOWN";
            filteredArray.push(fighter);
        }
    });
    var assassinProfile = findAssassinProfile(profileId);
    if (assassinProfile == null){
        assassinProfile = getAssassinProfileObj(profileId, profileId);
        assassinObj.profiles.push(assassinProfile);
    }
    assassinProfile.players = filteredArray;
    writeMRObject(assassinObj, MR.MR_ASSASSIN_FILE);
}

function getAssassinProfileObj(id, name){
    return {"id": id, "name": name, "players": []};
}

function findAssassinProfile(id){
    var foundAssassinProfile = null;
    for (var i=0; i < assassinObj.profiles.length; i++){
        var assassinProfile = assassinObj.profiles[i];
        if (assassinProfile.id == id){
            foundAssassinProfile = assassinProfile;
        }
    }
}

function profileAttack(array, fighterType){
    var refresh = false;
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    logV2(INFO, "FIGHT", "Assassin-a-Nator: Nr Of Fighters: " + array.length);
    for (var i=0; i < array.length; i++) {
        var arrayItem = array[i];
        if (!arrayItem.active){
            continue;
        }
        logObj(INFO, arrayItem);
        if (isAllyGang(friendObj.gangs, arrayItem.gangId)){
            logV2(INFO, "FIGHT", "Friendly Gang Found for fighter " + arrayItem.id + " - " + arrayItem.name);
            continue;
        }
        addMacroSetting("ID", arrayItem.id);
        var retCode = playMacro(FIGHT_FOLDER, "80_Profile_Attack_Init.iim", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS) {
            if (!arrayItem.skip) {
                logV2(INFO, "FIGHT", "Profile Fighting Player " + arrayItem.id + " - " + arrayItem.name);
                var statusObj = attack(arrayItem, fighterType);
                switch (statusObj.status) {
                    case FIGHTERCONSTANTS.ATTACKSTATUS.OK :
                        // do nothing, continue with next fighter
                        break;
                    case FIGHTERCONSTANTS.ATTACKSTATUS.PROBLEM :
                        logV2(INFO, "FIGHT", "Problem With Fighter. Skipping...");
                        break;
                    case FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA :
                        logV2(INFO, "FIGHT", "Out Of Stamina. Exiting Profile Fighters List");
                        status = FIGHTERCONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        refresh = true;
                        break;
                    case FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT :
                        logV2(INFO, "FIGHT", "Stamina Limit. Exiting Profile Fighters List");
                        status = FIGHTERCONSTANTS.ATTACKSTATUS.STAMINALIMIT;
                        refresh = true;
                        break;
                    case FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                        logV2(INFO, "FIGHT", "AutoHeal Disabled. Exit Profile Fighers List");
                        status = FIGHTERCONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        refresh = true;
                        break;
                    case FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP:
                        status = FIGHTERCONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                        refresh = true;
                        break;
                }
            }
            else {
                logV2(INFO, "FIGHT", "Skipping Stronger Opponent: " + arrayItem.id);
            }
            if (refresh) break;
        }
        else {
            logV2(INFO, "FIGHT", "Assassin-a-Nator Return Status: " + status);
        }
    }
    return status;
}

function homeFeedAttack(){
    var status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    if (!assassinObj.homeFeedAttack){
        logV2(INFO, "FIGHT", "Homefeed Attack disabled");
        status = FIGHTERCONSTANTS.ATTACKSTATUS.OK;
    }
    else {
        if (assassinObj.checkMiniHomeFeed) {
            checkMiniHomeFeed(profileObj, globalSettings.profile.id, friendObj, fightersToExclude, fighterObj);
        }
        logV2(INFO, "FIGHT", "Start Fight List Using Home Feed");
        var list = [];
        fighterObj.fighters.forEach(function (fighter) {
            if (fighter.hasOwnProperty("homefeed") && fighter.homefeed != null) {
                list.push(fighter);
            }
        });

        // sort list by most recent first
        list.sort(function (a, b) {
            return strcmp(b.homefeed, a.homefeed);
        });
        list = list.slice(0, 1);

        logV2(INFO, "FIGHT", "Nr of Homefeed Fighters Found: " + list.length);
        var status = profileAttack(list, FIGHTERCONSTANTS.FIGHTERTPE.HOMEFEED);
    }
    return status;
}

function performHealthCheck(message, autoHeal, stamina){

    if (typeof stamina == 'undefined'){
        var staminaObj = getStaminaForFighting(configMRObj.global.stopWhenStaminaBelow, !STOP_SCRIPT);
        stamina = staminaObj.leftOver;
    }
    var HEAL_CAT = "HEAL_" + message;
    var tries = 0;
    dummyBank();
    //var health = getHealthV2(globalSettings);
    var health = getHealth();
    var healthObj = {"refresh": false, "continueFighting": false, "message": message, autoHeal: false, "health": -1};
    healthObj.autoHeal = autoHeal;
    if (autoHeal) {
        while (health < configMRObj.fight.heal) {
            if (!globalSettings.forceHealing) {
                if (health == 0) {
                    if (homefeedCheck()){
                        logV2(INFO, HEAL_CAT, "Refresh After Homefeed check");
                        healthObj.refresh = true;
                    }
                }
            }
            if (stamina >= configMRObj.fight.minStaminaToHeal) {
                logV2(INFO, HEAL_CAT, "health: " + health);
                heal();
            }
            else {
                logV2(INFO, HEAL_CAT, "Not Enough Stamina To Heal");
                break;
            }
            tries++;
            if (tries > 2){
                logV2(INFO, HEAL_CAT, "Retries: " + tries);
                //waitV2("1");
            }
            dummyBank();
            health = getHealth();
        }
        if (health > configMRObj.fight.heal){
            globalSettings.heals++;
        }
    }
    else {
        if (stamina >= configMRObj.fight.minStaminaToHeal) {
            while (health == 0) {
                logV2(INFO, HEAL_CAT, "No health and AutoHeal Disabled. Waiting 20 seconds");
                waitV2("20");
                dummyBank();
                health = getHealth();
            }
        }
    }
    if (health > 0){
        healthObj.continueFighting = true;
    }
    globalSettings.forceHealing = false;
    healthObj.health = health;
    logObj(INFO, HEAL_CAT, healthObj);
    return healthObj;
}

function homefeedCheck(){
    var checked = false;
    var processHomefeedLines = assassinObj.processHomefeedLines;
    if (processHomefeed(processHomefeedLines)){
        checked = true;
    }
    var bullied = underAttack(configMRObj, processHomefeedLines);
    if (!bullied) {
        waitV2("60");
    }
    logV2(INFO, "HOMEFEEDCHECK", "checked: " + checked);
    return checked;
}
