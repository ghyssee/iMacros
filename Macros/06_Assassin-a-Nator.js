var ONEDRIVEPATH = getOneDrivePath();
var MACROS_PATH = getMacrosPath();
eval(readScript(MACROS_PATH + "\\js\\MyUtils-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MyFileUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MyConstants-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\MacroUtils-0.0.4.js"));
eval(readScript(MACROS_PATH + "\\js\\DateAdd.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloaded-0.0.1.js"));
eval(readScript(MACROS_PATH + "\\js\\MafiaReloadedFight.js"));

var localConfigObject = null;
setMRPath("MRAssassin-a-Nator");
var MACRO_INFO_LOGGING = LOG_INFO_DISABLED;

var CONSTANTS = Object.freeze({
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
        "STOPONLEVELUP": 6
    },
    "FIGHTERTPE" : {
        "ASSASSIN" : 0,
        "HOMEFEED" : 1
    }
});

init();

var assassinObj = initMRObject(MR.MR_ASSASSIN_FILE);
var friendObj = initMRObject(MR.MR_FRIENDS_FILE);
var fighterObj = initMRObject(MR.MR_FIGHTERS_FILE);
var fightersToExclude = initMRObject(MR.MR_FIGHTERS_EXCLUDE_FILE);
var configMRObj = initMRObject(MR.MR_CONFIG_FILE);
var globalSettings = {"kills": 0, "heals": 0};

startScript();


function startScript(){
    try {
        startMafiaReloaded();
        globalSettings.currentLevel = getLevel();
        logV2(INFO, "LEVEL", "Starting Level: " + globalSettings.currentLevel);
        do  {
            if (globalSettings.stopOnLevelUp){
                logV2(INFO, "FIGHT", "You Leveled Up and setting stopOnLevelUp is enabled");
                waitV2("60");
            }
            else {
                waitTillEnoughStamina();
                // if (health is 0, don't check for underAttack, it's already checked
                globalSettings.forceHealing = true;
                configMRObj = initMRObject(MR.MR_CONFIG_FILE);
                if (checkHealth(configMRObj.fight.autoHeal)) {
                    fight();
                    logV2(INFO, "FIGHT", "Updating statistics");
                    //writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
                }
                else {
                    logV2(INFO, "FIGHT", "AutoHeal Disabled. Waiting till enough health again if autoheal disabled or stamina if minimum stamina has reached");
                }
            }
        }
        while (true);
    }
    catch (ex) {
        if (ex instanceof UserCancelError){
            //writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
            // do nothing
        }
        else {
            logError(ex);
        }
        logV2(INFO, "SUMMARY", "Total Kills: " + globalSettings.kills);
        logV2(INFO, "SUMMARY", "Heals: " + globalSettings.heals);
    }
}

function continueFighting(status){
    var cont = false;
    if (status != CONSTANTS.ATTACKSTATUS.NOSTAMINA && status != CONSTANTS.ATTACKSTATUS.HEALINGDISABLED
        && status != CONSTANTS.ATTACKSTATUS.STOPONLEVELUP){
        cont = true;
    }
    logV2(INFO, "FIGHT", "continueFighting: " + cont + " / Status = " + status);
    return cont;
}

function fight(){

    var exitLoop = false;
    var status = CONSTANTS.ATTACKSTATUS.OK;
    do {
        configMRObj = initMRObject(MR.MR_CONFIG_FILE);
        status = profileAttack(assassinObj.players, CONSTANTS.FIGHTERTPE.ASSASSIN);
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
    do {
        // refreshing stats (health / exp / stamina / energy)
        playMacro(FIGHT_FOLDER, "20_Extract_Start.iim", MACRO_INFO_LOGGING);
        stamina = getStamina();
        energy = getEnergy();
        var health = getHealth();
        total = stamina + energy;
        var exp = getExperience();
        if (exp > 0){
            var staminaNeeded = exp / (4.3);
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
            else if (stamina >= configMRObj.fight.minStaminaToFight){
                logV2(INFO, "WAIT", "Enough Stamina to start fighting again");
                break;
            }
            else if (health > 0 && stamina > 20){
                logV2(INFO, "WAIT", "Enough Health to fight");
                break;
            }
            waitV2("60");
        }
        else {
            logV2(WARNING, "WAIT", "Problem getting experience");
        }
    }
    while (true);
    logV2(INFO, "WAIT", "Leaving wait");
}

function attack(fighter, fighterType){
    logV2(INFO, "FIGHT", "Attacking " + fighter.id);
    // ADD 15/11
    var statusObj = getStatusObject();
    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
    var retCode = SUCCESS;
    if (!checkHealth(configMRObj.fight.autoHeal)){
        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
        return statusObj;
    }
    retCode = playMacro(FIGHT_FOLDER, "81_Profile_Attack_Start.iim", MACRO_INFO_LOGGING);
    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
        statusObj.status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
    }
    else if (retCode == SUCCESS){
        retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status", MACRO_INFO_LOGGING);
        if (retCode == SUCCESS){
            var msg = getLastExtract(1, "Attack Status", "You WON The Fight");
            //var msg = prompt("FIRST ATTACK","You WON");
            var status = evaluateAttackMessage(msg);
            switch (status){
                case CONSTANTS.OPPONENT.NOHEALTH:
                    checkHealth(configMRObj.fight.autoHeal);
                    break;
                case CONSTANTS.OPPONENT.FRIEND :
                    removeItemFromArray(MR.MR_FIGHTERS_FILE, fighterObj, fighter.id);
                    addFriend(fighter);
                    statusObj.status = CONSTANTS.ATTACKSTATUS.SKIP;
                    break;
                case CONSTANTS.OPPONENT.WON :
                    // ADD 15/11
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                    addValueToProperty(fighter, "alive", 1);
                    var attackStatusObj = attackTillDeath(fighter);
                    if (checkIfLevelUp() && configMRObj.fight.stopOnLevelUp){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
                    }
                    else if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.NOSTAMINA){
                        // no stamina
                        statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                    }
                    else if (attackStatusObj.status == CONSTANTS.ATTACKSTATUS.HEALINGDISABLED){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                    }
                    else {
                        statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
                    }
                    updateStatistics(fighter, fighterType);
                    break;
                case CONSTANTS.OPPONENT.DEAD :
                    addValueToProperty(fighter, "dead", 1);
                    logV2(INFO, "FIGHT", "Opponent is dead. Move on to the next one");
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
                    globalSettings.stolenIces++;
                    fighter.lastAttacked = formatDateToYYYYMMDDHHMISS(new Date());
                    updateStatistics(fighter, fighterType);
                    break;
                case CONSTANTS.OPPONENT.LOST :
                    getVictimHealth(fighter);
                    logV2(INFO, "FIGHT", "Add Stronger Opponent: " + fighter.id);
                    removeItemFromArray(MR.MR_FIGHTERS_FILE, fighterObj, fighter.id);
                    addStrongerOpponent(fighter);
                    fighter.skip = true;
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
                    break;
                default :
                    statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
                    logV2(INFO, "FIGHT", "Attack First Time Problem");
                    break;
            }
        }
        else {
            logV2(INFO, "FIGHT", "Problem getting status for Fighter: " + fighter.id);
            statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
        }
    }
    else {
        logV2(INFO, "FIGHT", "Fighter Not Found: " + fighter.id + " / Profile Problem ???" );
        statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
    }
    return statusObj;
}

function getVictimHealth(fighter){
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
                checkIfIced(fighter);
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
    do {
        victimHealed = false;
        if (health > -1){
            if (firstAttack) {
                originalHealth = health;
                // MOD 15/11
                health = getVictimHealth(fighter);
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
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
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
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
                    break;
                }
                else if (nrOfHeals > configMRObj.fight.numberOfHealsLimit && health > configMRObj.fight.attackTillDiedHealth){
                    logV2(INFO, "ATTACK", "Victim Heals too fast. Skipping...");
                    globalSettings.maxHealed++;
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
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
                    statusObj.status = CONSTANTS.ATTACKSTATUS.OK;
                    fighter.bigHealth = true;
                    break;
                }
                else {
                    // MOD 15/11
                    var stamina = getStamina();
                    if (!checkHealth(configMRObj.fight.autoHeal, stamina)){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        logV2(INFO, "ATTACK", "Healing Disabled");
                        alive = false;
                        break;
                    }
                    if (stamina < 5){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        break;
                    }
                    addMacroSetting("ID", fighter.id);
                    retCode = playMacro(FIGHT_FOLDER, "41_Victim_Attack", MACRO_INFO_LOGGING);
                    firstAttack = false;
                    statusObj.totalStamina += 5;
                    nrOfAttacks++;
                    bigHealthAttacks++;
                    globalSettings.money +=checkSaldo();
                    health = getVictimHealth(fighter);

                    if (retCode != SUCCESS){
                        statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
                        break;
                    }
                }
            }
        }
        else {
            // Problem with script
            statusObj.status = CONSTANTS.ATTACKSTATUS.PROBLEM;
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

// MOD 15/11
function checkIfIced(fighter){
    iced = false;
    var retCode = playMacro(FIGHT_FOLDER, "31_Attack_Status.iim", MACRO_INFO_LOGGING);
    if (retCode == SUCCESS){
        var msg = getLastExtract(1, "Ice Status", "Riki just Killed blabla. Your Kill Count is now 777").toUpperCase();
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
        // MOD 15/11
        fighter.iced++;
        fighter.lastIced = formatDateToYYYYMMDDHHMISS(new Date());
    }
    return iced;
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

function addFighter(fighter){
    if (!findFighter(fighterObj.fighters, fighter.id)){
        fighterObj.fighters.push(fighter);
        writeMRObject(fighterObj, MR.MR_FIGHTERS_FILE);
    }
}

function evaluateAttackMessage(msg){
    logV2(INFO, "ATTACK", "Msg = " + msg);
    if (isNullOrBlank(msg)){
        return CONSTANTS.OPPONENT.UNKNOWN;
    }
    msg= msg.toUpperCase();
    if (msg.startsWith("YOU LOST")){
        return CONSTANTS.OPPONENT.LOST;
    }
    else if (msg.startsWith("YOU WON")){
        return CONSTANTS.OPPONENT.WON;
    }
    else if (msg.startsWith("YOU CANNOT ATTACK YOUR FRIEND")){
        return CONSTANTS.OPPONENT.FRIEND;
    }
    else if (msg.startsWith("IT LOOKS LIKE")){
        return CONSTANTS.OPPONENT.DEAD;
    }
    else if (msg.startsWith("YOU DO NOT FEEL HEALTHY")){
        return CONSTANTS.OPPONENT.NOHEALTH;
    }
    else {
        return CONSTANTS.OPPONENT.UNKNOWN;
    }
}

// MOD 22/11
function checkHealth(autoHeal, stamina){
    autoHeal = typeof autoHeal !== 'undefined' ? autoHeal : configMRObj.fight.autoHeal;
    var tries = 0;
    if (typeof stamina == 'undefined'){
        stamina = getStamina();
    }
    logV2(DEBUG, "FIGHT", "Checking Health");
    var health = getHealth();
    // MOD 22/11
    if (autoHeal) {
        if (stamina >= configMRObj.fight.minStaminaToHeal) {
            while (health < configMRObj.fight.heal) {
                logV2(INFO, "FIGHT", "Health = " + health);
                tries++;
                if (!globalSettings.forceHealing) {
                    if (tries > 1 || health < 300) {
                        logV2(INFO, "FIGHT", tries + " attempt(s) to heal. Possible under attack");
                        waitV2("1");
                        dummyBank();
                        health = getHealth();
                        logV2(INFO, "FIGHT", "Health = " + health);
                    }
                    if (health == 0) {
                        logV2(INFO, "FIGHT", "Killed by another player");
                        autoHeal = false;
                        if (underAttack(configMRObj)) {
                            // Went To Home page;
                            // interrupt Attack / Boss Fight => disable autoHeal switch
                        }
                        // when it's your first heal => don't wait
                        waitV2("60");
                        break;
                    }
                }
                heal();
                health = getHealth();
            }
        }
        else if (health == 0){
            logV2(INFO, "FIGHT", "Not Enough Stamina To Heal: " + stamina);
            autoHeal = false;
        }
    }
    else if (health > 0) {
        autoHeal = true;
    }
    else {
        logV2(INFO, "FIGHT", "Auto Heal disabled");
    }
    if (autoHeal) {
        health = getHealth();
        if (health > configMRObj.fight.heal) {
            globalSettings.heals++;
        }
    }
    globalSettings.forceHealing = false;
    logV2(DEBUG, "FIGHT", "Check Health Exit: " + autoHeal);
    return autoHeal;
}

function getStatusObject(){
    return {"status":null,
        "totalStamina":0,
        "iced": 0
    };
}

// ADD 15/11
function updateStatistics(fighter, fighterType){
    logV2(INFO, "FIGHT", "Updating statistics for " + fighter.id);
    logV2(INFO, "FIGHT", "Fighter: " + JSON.stringify(fighter));
    var found = false;
    var list = [];
    if (fighterType == CONSTANTS.FIGHTERTPE.ASSASSIN){
        list = assassinObj.players;
    }
    else {
        list = assassinObj.homefeedPlayers;
    }
    logV2(INFO, "FIGHT", "Fighter Update List: " + JSON.stringify(list));
    if (fighterType == CONSTANTS.FIGHTERTPE.HOMEFEED) {
        // only update statistics for fighters coming from homefeed
        // assassin type (coming from list players): object is already updated
        for (var i = 0; i < list.length; i++) {
            var fighterItem = list[i];
            if (fighterItem.id == fighter.id) {
                if (fighter.lastAttacked != null) {
                    fighterItem.lastAttacked = fighter.lastAttacked;
                }
                fighterItem.bigHealth = fighter.bigHealth;
                if (fighter.lastIced != null) {
                    fighterItem.lastIced = fighter.lastIced;
                }
                if (valueNotNullAndGreaterThan(fighter.iced, 0)) {
                    addValueToProperty(fighterItem, "iced", 1);
                }
                if (valueNotNullAndGreaterThan(fighter.alive, 0)) {
                    addValueToProperty(fighterItem, "alive", 1);
                }
                if (valueNotNullAndGreaterThan(fighter.dead, 0)) {
                    addValueToProperty(fighterItem, "dead", 1);
                }
                fighterItem.gangId = fighter.gangId;
                fighterItem.gangName = fighter.gangName;
                found = true;
                logV2(INFO, "FIGHT", JSON.stringify(fighterItem));
                break;
            }
        }
    }
    else {
        found = true;
    }
    if (!found){
        if (fighterType == CONSTANTS.FIGHTERTPE.ASSASSIN) {
            logV2(INFO, "FIGHT", "Problem Updating statistics for " + fighter.id);
        }
        else {
            assassinObj.homefeedPlayers.push(fighter);
        }
    }
    writeMRObject(assassinObj, MR.MR_ASSASSIN_FILE);
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

function profileAttack(array, fighterType){
    var refresh = false;
    var status = CONSTANTS.ATTACKSTATUS.OK;
    logV2(INFO, "FIGHT", "Assassin-a-Nator: Nr Of Fighters: " + array.length);
    for (var i=0; i < array.length; i++) {
        var arrayItem = array[i];
        logV2(INFO, JSON.stringify(arrayItem));
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
                    case CONSTANTS.ATTACKSTATUS.OK :
                        // do nothing, continue with next fighter
                        break;
                    case CONSTANTS.ATTACKSTATUS.PROBLEM :
                        logV2(INFO, "FIGHT", "Problem With Fighter. Skipping...");
                        break;
                    case CONSTANTS.ATTACKSTATUS.NOSTAMINA :
                        logV2(INFO, "FIGHT", "Out Of Stamina. Exiting Profile Fighters List");
                        status = CONSTANTS.ATTACKSTATUS.NOSTAMINA;
                        refresh = true;
                        break;
                    case CONSTANTS.ATTACKSTATUS.HEALINGDISABLED :
                        logV2(INFO, "FIGHT", "AutoHeal Disabled. Exit Profile Fighers List");
                        status = CONSTANTS.ATTACKSTATUS.HEALINGDISABLED;
                        refresh = true;
                        break;
                    case CONSTANTS.ATTACKSTATUS.STOPONLEVELUP:
                        status = CONSTANTS.ATTACKSTATUS.STOPONLEVELUP;
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
    var status = CONSTANTS.ATTACKSTATUS.OK;
    if (!configMRObj.fight.homefeedAttack){
        logV2(INFO, "FIGHT", "Homefeed Attack disabled");
        status = CONSTANTS.ATTACKSTATUS.OK;
    }
    else {
        if (assassinObj.checkMiniHomeFeed) {
            checkMiniHomeFeed(friendObj, fightersToExclude, fighterObj);
        }
        logV2(INFO, "FIGHT", "Start Fight List Using Home Feed");
        var list = [];
        fighterObj.fighters.forEach(function (fighter) {
            if (fighter.hasOwnProperty("homefeed") && fighter.homefeed != null) {
                list.push(clone(fighter));
            }
        });

        // sort list by most recent first
        list.sort(function (a, b) {
            return strcmp(b.homefeed, a.homefeed);
        });
        list = list.slice(0, 2);
        list.forEach(function (fighter) {
            logV2(INFO, "FIGHT", fighter.id + ": " + fighter.homefeed);
            // reset statistics
            fighter.lastIced = null;
            fighter.lastAttacked = null;
            fighter.dead = 0;
            fighter.alive = 0;
            fighter.iced = 0;
        });
        logV2(INFO, "FIGHT", "List: " + JSON.stringify(list));

        logV2(INFO, "FIGHT", "Nr of Homefeed Fighters Found: " + list.length);
        var status = profileAttack(list, CONSTANTS.FIGHTERTPE.HOMEFEED);
    }
    return status;
}
