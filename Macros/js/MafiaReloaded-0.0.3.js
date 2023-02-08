var COMMON_FOLDER = "MR/Common";
var MR_DIR =  ONEDRIVE_DIR + "Config\\MR\\";

function getMRFile(fileId){
    return new ConfigFile(MR_DIR, fileId);
}

function closePopup(){
    var retCode = simpleMacroPlayFolder("02_ClosePopup.iim", COMMON_FOLDER);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}

function closePopupByData(text){
	iimSet("TEXT", text);
    var retCode = simpleMacroPlayFolder("05_ClosePopupData.iim", COMMON_FOLDER);
    if (retCode == SUCCESS){
        logV2(INFO, "POPUP", "Popup Closed");
    }
    return (retCode == SUCCESS);
}


function heal(){
	logV2(INFO, CATEGORY, "Healing");
	// watch out. Pop up windows are closed when you use this healing function
	var retCode = simpleMacroPlayFolder("15_Heal.iim", COMMON_FOLDER);
	closePopupByData("pop-");
}


function getHealth(){
	var oSpan = window.content.document.querySelectorAll("span[class*=health]");
	var health = 0;
	if (oSpan.length >= 1){
		var healthInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check health: " + healthInfo);
		var items = healthInfo.split("/");
		if (items.length == 2){
			health = items[0].replace(",", "");
			health = Number(health);
			logV2(INFO, CATEGORY, "Health: " + health);
		}
	}
	return health;
}


function getCash(){
	var oSpan = window.content.document.querySelectorAll("span[class*=cash]");
	//var cash = 0;
	if (oSpan.length >= 1){
		var cashInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Cash: " + cashInfo);
	}
	return cashInfo;
}


function getStamina(){
	var oSpan = window.content.document.querySelectorAll("span[class*=stamina]");
	var stamina = 0;
	if (oSpan.length >= 1){
		var staminaInfo = oSpan[0].innerText;
		logV2(INFO, CATEGORY, "Check stamina: " + staminaInfo);
		var items = staminaInfo.split("/");
		if (items.length == 2){
			stamina = items[0].replace(",", "");
			stamina = Number(stamina);
			logV2(INFO, CATEGORY, "stamina: " + stamina);
		}
	}
	return stamina;
}