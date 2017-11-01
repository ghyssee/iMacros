/** MyConstants
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
var INFO = 0; var ERROR = 1; WARNING = 2;
var BASE_DIR = "c:\\My Programs\\iMacros\\";
var LOG_DIR = BASE_DIR + "logs\\";
var SCREENSHOT_DIR = BASE_DIR + "screenshots\\";
var GENERAL_DATASOURCE_DIR = BASE_DIR + "Datasources\\";
var DATASOURCE_DIR = BASE_DIR + "Datasources\\";
var SCRIPT_DIR = DATASOURCE_DIR;
var CONFIG_DIR = BASE_DIR + "config\\";
var CONFIG_ONEDRIVE_DIR = BASE_DIR + "config\\";
var TMP_DIR = BASE_DIR + "tmp\\";
var QUEUE_DIR = DATASOURCE_DIR + "Queues\\";
var QUEUE_STOP_PROCESS_FILE = DATASOURCE_DIR + "processQueues.disabled";
var BACKUP_DIR = DATASOURCE_DIR + "old";
var ERROR_TIMEOUT = -802;
var ENABLE_LOGGING = 1;
var DISABLE_LOGGING = 0;
var CANCELED_BY_USER = -101;
var SEPERATOR = ",";

var PROFILE_JSON_FILE = new ConfigFile(CONFIG_DIR, "profilesV3.json");
var LOGIN_JSON_FILE = new ConfigFile(CONFIG_DIR, "login.json");
var CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "config.json");
var MAFIAWARS_JSON_FILE = new ConfigFile(CONFIG_DIR, "MafiaWarsV2.json");
var LOCAL_CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "localconfig.json");
var CRAFTMANIA_JSON_FILE = new ConfigFile(CONFIG_DIR, "craftMania.json");
var SCRIPT_ONEDRIVE_DIR = new ConfigFile("c:\\My Programs\\SkyDrive\\", "datasources");
var FIREFOX_FILE = new ConfigFile(CONFIG_DIR, "FirefoxInstances.json");
var ERROR_LOG = new LogFile(LOG_DIR, "ERROR");
var LOG_FILE = new LogFile(LOG_DIR, "INIT");

var PROFILE_ERIC = "00_ERIC";
var PROFILE_AMALIN = "01_AMALIN";
var PROFILE_AARON = "02_AARON";
var PROFILE_AJORIS = "03_AJORIS";
var PROFILE_EG = "04_EG";
var PROFILE_MT = "05_MT";

var LOG_ERROR_ENABLED = true;
var LOG_ERROR_DISABLED = false;
