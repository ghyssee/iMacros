/** MafiaWarsUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
 
function getMwAddOnPath(firefoxObj){
	var basePath = "Data\\profile\\";
	var defaultPath = "mwa_scripts\\mws";
	if (firefoxObj.pathMWAddOn != null){
		defaultPath = firefoxObj.pathMWAddOn;
	}
	var path = firefoxObj.path + "\\" + basePath + defaultPath;
	logV2 (INFO, firefoxObj.name + " MWAddOn Path: " + path);
	return path;

}