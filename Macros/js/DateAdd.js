
/**
 * @bit
 * @name dateAdd
 * @description Adds the given amount of time to a provided date object. Day, week, month, and year increments maintain the same hour for changes that pass through daylight saving time.
 * @param {Object} original The date object
 * @param {number} increment The amount of time to add (or subtract if negative)
 * @param {string} unit (optional) The time unit to use. Defaults to milliseconds
 * @returns {Object} An updated date object
 * @example
 * ```js
 * var originalDate = new Date('July 1, 2016 18:45:10');
 *
 * dateAdd(originalDate, 6000, 'milliseconds');  // => 'July 1, 2016 18:45:16'
 * dateAdd(originalDate, 5, 'seconds');          // => 'July 1, 2016 18:45:15'
 * dateAdd(originalDate, 5, 'minutes');          // => 'July 1, 2016 18:45:10'
 * dateAdd(originalDate, 5, 'hours');            // => 'July 1, 2016 23:45:10'
 * dateAdd(originalDate, 5, 'days');             // => 'July 6, 2016 18:45:10'
 * dateAdd(originalDate, 2, 'weeks');            // => 'July 15, 2016 18:45:10'
 * dateAdd(originalDate, 2, 'months');           // => 'September 1, 2016 18:45:10'
 * dateAdd(originalDate, 5, 'years');            // => 'July 1, 2021 18:45:10'
 * dateAdd(originalDate, -1, 'days');            // => 'June 30, 2016 18:45:16'

 * dateAdd(originalDate, 6000);                  // => 'July 1, 2016 18:45:16' - Defaults to ms
 *
 */

function dateAdd(original, increment, unit) {

    // Return undefiend if first argument isn't a Date object
    if (!(original instanceof Date)) {
        return(undefined);
    }

    switch(unit) {
        case 'seconds':
            // Add number of secodns to current date (ms*1000)
            var newDate = new Date(original);
            newDate.setTime(original.getTime() + (increment*1000));
            return newDate;
            break;
        case 'minutes':
            // Add number of minutes to current date (ms*1000*60)
            var newDate = new Date(original);
            newDate.setTime(original.getTime() + (increment*1000*60));
            return newDate;
            break;
        case 'hours':
            // Add number of hours to current date (ms*1000*60*60)
            var newDate = new Date(original);
            newDate.setTime(original.getTime() + (increment*1000*60*60));
            return newDate;
            break;
        case 'days':
            // Add number of days to current date
            var newDate = new Date(original);
            newDate.setDate(original.getDate() + increment);
            return newDate;
            break;
        case 'weeks':
            // Add number of weeks to current date
            var newDate = new Date(original);
            newDate.setDate(original.getDate() + (increment*7));
            return newDate;
            break;
        case 'months':
            // Get current date
            var oldDate = original.getDate();

            // Increment months (handles year rollover)
            var newDate = new Date(original);
            newDate.setMonth(original.getMonth() + increment);

            // If new day and old day aren't equal, set new day to last day of last month
            // (handles edge case when adding month to Jan 31st for example. Now goes to Feb 28th)
            if (newDate.getDate() != oldDate) {
                newDate.setDate(0);
            }

            // Handle leap years
            // If old date was Feb 29 (leap year) and new year isn't leap year, set new date to Feb 28
            if (original.getDate() == 29 && !isLeapYear(newDate.getFullYear())) {
                newDate.setMonth(1);
                newDate.setDate(28);
            }

            return newDate;
            break;
        case 'years':
            // Increment years
            var newDate = new Date(original);
            newDate.setFullYear(original.getFullYear() + increment);

            // Handle leap years
            // If old date was Feb 29 (leap year) and new year isn't leap year, set new date to Feb 28
            if (original.getDate() == 29 && !isLeapYear(newDate.getFullYear())) {
                newDate.setMonth(1);
                newDate.setDate(28);
            }

            return newDate;
            break;
        // Defaults to milliseconds
        default:
            var newDate = new Date(original);
            newDate.setTime(original.getTime() + increment);
            return newDate;
    }
};

function isLeapYear(year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
}