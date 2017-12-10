/** MyConstants
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
var BASE_DIR = "c:\\My Programs\\iMacros\\";
var ORIG_LOG_DIR = BASE_DIR + "logs\\";
var LOG_DIR = ORIG_LOG_DIR;
var SCREENSHOT_DIR = BASE_DIR + "screenshots\\";
var GENERAL_DATASOURCE_DIR = BASE_DIR + "Datasources\\";
var DATASOURCE_DIR = BASE_DIR + "Datasources\\";
var SCRIPT_DIR = DATASOURCE_DIR;
var CONFIG_DIR = BASE_DIR + "config\\";
var CONFIG_ONEDRIVE_DIR = BASE_DIR + "config\\";
var TMP_DIR = BASE_DIR + "tmp\\";
var QUEUE_DIR = DATASOURCE_DIR + "Queues\\";
var OUTPUT_DIR = BASE_DIR + "output\\";
var BACKUP_DIR = DATASOURCE_DIR + "old";
var ERROR_TIMEOUT = -802;
var ENABLE_LOGGING = 1;
var DISABLE_LOGGING = 0;
var SEPERATOR = ",";
var ONEDRIVE_DIR = getOneDrivePath() + "\\";

var PROFILE_JSON_FILE = new ConfigFile(CONFIG_DIR, "profilesV3.json");
var LOGIN_JSON_FILE = new ConfigFile(CONFIG_DIR, "login.json");
var CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "config.json");
var LOCAL_CONFIG_JSON_FILE = new ConfigFile(CONFIG_DIR, "localconfig.json");
var SCRIPT_ONEDRIVE_DIR = new ConfigFile("c:\\My Programs\\SkyDrive\\", "datasources");
var FIREFOX_FILE = new ConfigFile(CONFIG_DIR, "FirefoxInstances.json");

var ERROR_LOG = new LogFile(LOG_DIR, "ERROR", NODE_ID);
var LOG_FILE = new LogFile(LOG_DIR, "INIT", NODE_ID);

var PROFILE_ERIC = "00_ERIC";
var PROFILE_AMALIN = "01_AMALIN";
var PROFILE_AARON = "02_AARON";
var PROFILE_AJORIS = "03_AJORIS";
var PROFILE_EG = "04_EG";
var PROFILE_MT = "05_MT";

var LOG_ERROR_ENABLED = true;
var LOG_ERROR_DISABLED = false;

var LOG_DEBUG = false;

var NEWLINE = "\r\n";


var PATH_BASEDIR = "mp3Processor";
var PATH_ALBUM = "album";
var PATH_TMP = "tmp";
var PATH_JAVA = "java";
var PATH_PREPROCESS = "preprocess";
var PATH_PROCESS = "process";
var PATH_NEW = "new";
var PATH_ONEDRIVE = "oneDrive";
var PATH_CONFIG = "config";
var PATH_DATA = "data";
var PATH_PLAYLIST = "playlist";
var PATH_LOCAL_CONFIG = "localConfig";

var pathObject = null;
