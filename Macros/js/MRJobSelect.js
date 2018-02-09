var JOBSELECT_LOG = true;

var JOBSELECT = Object.freeze({
    "FILTER" : {
        "YES": 0,
        "NO": 1,
        "WHATEVER" : 2,
        "ENERGY" : "ENERGY",
        "STAMINA": "STAMINA"
    },
    "SELECTTYPES" : {
        "EVENT" : 1,
        "MONEY": 2,
        "MONEYCOST": 3,
        "CONSUMABLECOST": 4,
        "JOBTYPE": 5,
        "ENERGYRANGE": 6,
        "EXPRANGE": 7,
        "DISTRICT": 8,
        "CHAPTER": 9,
        "MONEYRATIO": 10
    },
    "SORTING" : {
        "MONEY" : "moneyRatio",
        "RATIO": "ratio",
        "ENERGY": "energy",
        "EXP": "exp",
        "ASCENDING": 1,
        "DESCENDING": 2
    }
});

function logJob2(job, title, selectable){
    logV2(INFO, "JOB", title);
    logV2(INFO, "JOB", "ID: " + job.id);
    logV2(INFO, "JOB", "Name: " + job.description);
    logV2(INFO, "JOB", "District: " + job.districtId + " - " + job.districtName);
    logV2(INFO, "JOB", "Chapter: " + job.chapter);
    logV2(INFO, "JOB", "Type: " + job.type);
    logV2(INFO, "JOB", "Energy: " + job.energy);
    logV2(INFO, "JOB", "Experience: " + job.exp);
    logV2(INFO, "JOB", "Money: " + job.money);
    logV2(INFO, "JOB", "Selectable: " + selectable);
    logV2(INFO, "JOB", "Money Ratio: " + job.moneyRatio);
    logV2(INFO, "JOB", "Ratio: " + job.ratio);
    logV2(INFO, "JOB", "============================================================================");
}

function addFilter(type, value, min, max){
    var selectType = {"type": type, "value": value, "min": min, "max": max};
    return selectType;
}

function convertBooleanToFilterType(value){
    if (value){
        return JOBSELECT.FILTER.YES;
    }
    else {
        return JOBSELECT.FILTER.NO;
    }
}

function isJobSelectable(filters, district, job){
    var valid = true;
    for (var i=0; i < filters.length; i++){
        var typeObj = filters[i];
        // 338-164=  error line start: 174
        switch (typeObj.type) {
            case JOBSELECT.SELECTTYPES.EVENT:
                if (typeObj.value == JOBSELECT.FILTER.WHATEVER || convertBooleanToFilterType(district.event) == typeObj.value){
                    //alert("NO EVENT");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.MONEY:
                if (typeObj.value == JOBSELECT.FILTER.WHATEVER || convertBooleanToFilterType(job.money > 0) == typeObj.value){
                    //alert("MONEY");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.MONEYCOST:
                if (typeObj.value == JOBSELECT.FILTER.WHATEVER || (convertBooleanToFilterType(job.money < 0) == typeObj.value)){
                    //   alert("COSTS NO MONEY");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.CONSUMABLECOST:
                if (typeObj.value == JOBSELECT.FILTER.WHATEVER || (convertBooleanToFilterType(job.consumableCost) == typeObj.value)){
                    // alert("COSTS NO CONSUMABLE");
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.JOBTYPE:
                if (typeObj.value == JOBSELECT.FILTER.WHATEVER || job.type == typeObj.value){
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.ENERGYRANGE:
                if ((typeObj.value == JOBSELECT.FILTER.WHATEVER || typeObj.value == JOBSELECT.FILTER.YES)
                    && job.energy >= typeObj.min && isMaxRange(job.energy, typeObj.max) //job.energy <= typeObj.max
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.EXPRANGE:
                if ((typeObj.value == JOBSELECT.FILTER.WHATEVER || typeObj.value == JOBSELECT.FILTER.YES)
                    && job.exp >= typeObj.min && isMaxRange(job.exp, typeObj.max)
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.DISTRICT:
                if ((typeObj.value == JOBSELECT.FILTER.WHATEVER || typeObj.value == JOBSELECT.FILTER.YES)
                    && district.id == typeObj.min
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.MONEYRATIO:
                var moneyRatio = getMoneyRatio(job);
                if ((typeObj.value == JOBSELECT.FILTER.WHATEVER || typeObj.value == JOBSELECT.FILTER.YES)
                    && moneyRatio >= typeObj.min
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
            case JOBSELECT.SELECTTYPES.CHAPTER:
                //logV2(INFO, "RANGE", "Chapter: " + typeObj.min);
                //logV2(INFO, "RANGE", "Chapter: " + typeObj.max);
                //logV2(INFO, "RANGE", "Chapter Job: " + job.chapter);
                var chapter = parseInt(job.chapter);
                if ((typeObj.value == JOBSELECT.FILTER.WHATEVER || typeObj.value == JOBSELECT.FILTER.YES)
                    && chapter >= typeObj.min && isMaxRange(chapter, typeObj.max)
                )
                {
                    valid = valid && true;
                }
                else {
                    valid = false;
                }
                break;
        }
    }
    return valid;
}

function isMaxRange(value, maxRange){
    var valid = false;
    if (isUndefined(maxRange)){
        valid = true;
    }
    else if (maxRange == null){
        valid = true;
    }
    else {
        valid = (value <= maxRange);
    }
    return valid;
}

function getJobs(districts, filters, logging, file, sorting, order){
    var selectedJobs = [];
    if (isUndefined(order)){
        order = JOBSELECT.SORTING.DESCENDING;
    }
    var length = districts.length;
    for (var i=0; i < length; i++){
        var district = districts[i];
        var nrOfJobs = district.jobs.length;
        for (var j=0; j < nrOfJobs; j++){
            var job = district.jobs[j];
            var test = isJobSelectable(filters, district, job);
            if (logging) {
                logJob2(job, "SELECTABLE", test);
            }
            if (test) {
                job.ratio = getRatio(job);
                job.moneyRatio = getMoneyRatio(job);
                job.districtId = district.id;
                job.districtName = district.description;
                selectedJobs.push(job);
            }
        }
    }
    switch (order) {
        case JOBSELECT.SORTING.DESCENDING:
            selectedJobs.sort(function(a, b) {
                return b[sorting] - a[sorting];
            });
            break;
        case JOBSELECT.SORTING.ASCENDING:
            selectedJobs.sort(function(a, b) {
                return a[sorting] - b[sorting];
            });
            break;
    }
    var profile = getProfile();
    if (file != null) {
        file = DATASOURCE_DIR + (isNullOrBlank(profile) ? "": profile + "_") + file;
        deleteFile(file);
        for (var i = 0; i < selectedJobs.length; i++) {
            writeObjectToCSV(selectedJobs[i], file);
        }
        if (selectedJobs.length == 0){
            save(file, "");
        }
        logV2(INFO, "JOBSELECT", "Result written to: " + file);
    }
    return selectedJobs;

}

function getRatio(job){
    var ratio = job.exp / job.energy;
    return ratio;
}

function getMoneyRatio(job){
    var ratio = job.money / job.energy;
    return ratio;
}

