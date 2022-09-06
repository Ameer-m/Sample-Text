/**
 * VerificationService
 * Created By:  vnavassa
 */

/**
 * setMultipleFields
 * @param {Object} - record
 * @param {[Object]} - verifications
 * @param {[String]} - fields
 * @param {String} - prefix
 * @return Void
 */
 function setMultipleFields(record, verifications, fields, prefix) {
    fields.forEach(field => {
        record[`${prefix}${field}`] = concatArray(verifications.map(verification => verification === null ? "" : verification[field]));
    });
}

/**
 * getDurationForMultiple
 * @param {[Object]} - verifications
 * @return {String} - duration
 */
function getDurationForMultiple(verifications) {
    if (verifications.length === 1) {
        const verification = verifications[0];
        return verification === null ? "" : verification.duration;
    }

    const hasIncompletedVerifications = verifications.some(verification => verification === null);

    if (hasIncompletedVerifications) {
        return "";
    }

    const durations = verifications.filter(verification => verification !== null && verification.duration !== null).map(verification => verification.duration);
    if (durations.length === 0) {
        return "";
    }
    return durations.reduce((a, b) => Number(a) + Number(b)) / durations.length;
}

/**
 * getStatusForMultiple
 * @param {[Object]} - verifications
 * @param {[Object]} - statusForDocument
 * @return {String} - statuses
 */
function getStatusForMultiple(verifications, statusForDocument) {
    if (verifications.length === 0) {
        return formatTaskStatus("N");
    }

    if (statusForDocument === "N/A") {
        return "N/A";
    }
    return concatArray(verifications.map(verification => verification !== null ? formatTaskStatus(verification.status) : formatTaskStatus("N")));
}

/**
 * getTrackwiseNumberForMultiple
 * @param {[Object]} - verifications
 * @return {String} - trackwiseNumbers
 */
function getTrackwiseNumberForMultiple(verifications) {
    if (verifications.length === 0) {
        return " ";
    }
    return concatArray(verifications.map(verification => verification !== null ? concatArray(verification.trackwiseNo) : ""));
}

/**
 * getMaxCloseDate
 * @param {[Object]} - verifications
 * @return {String} - maxCloseDates
 */
function getMaxCloseDate(verifications) {
    const closeDates = verifications.map(verification => verification !== null ? verification.verificationClosedAt : 0);
    return closeDates.length ? Math.max(...closeDates) : "";
}

/**
 * concatArray
 * @param {[Object]} - array
 * @return {String} - concatString
 */
function concatArray(array) {
    const concatString = " | ";
    const dateVal= array === "" ? "" : array;
    return dateVal.join(concatString);
}

/**
 * verificatiocCSV
 * @param {[Object]} - verificationDate
 * @return {String} - epoch timestamp
 */
function verificatiocCSV(csvDate) {
 
 const vDate=Math.round(new Date(csvDate).getTime()/1000);
 
 return vDate;
}