/**
 * Name:        SearchResultsFunctions
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Search Results Functions
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  20/October/2020
 * CR:          CHG000010656864
 * Description:
 *  updated function search -> Added logic to clear table filters
 *  updated function modifyResultsForDisplay -> Added logic for Physical, LST and multiple IFUs Verifications and Final Verification
 *  added function toggleDisplay
 */
/**
 * Perform search for results
 */

 function search() {
    let oSearchParams = modelpnlSearchParams.getData();
    oSearchParams.vasType = lblfrmDetailVasTypeComboBox.getSelectedKeys().toString();

    const { suggestion, ...searchParamsWithoutSuggestionArray } = oSearchParams;
    clearResultsFilters();
    callSearchVerifications(searchParamsWithoutSuggestionArray);
}


/**
 * Refresh the record count text
 */
function refreshRecordsCount() {
    let iLength = modeltblResults.getData().length;
    let sCount = iLength ? iLength : "";
    tabFilterResults.setCount(sCount);
}


/**
 * Clears the results table
 */
function refreshResultsTable() {
    modeltblResults.setData([]);
    refreshRecordsCount();
    search();
}

/**
 * Clears the filters on the results table
 */
function clearResultsFilters() {
    let aColumns = tblResults.getColumns() || [];
    aColumns.forEach(function (col, i) {
        tblResults.filter(col, null);
    });
}

/**
 * Updates the results with any UI specific modifications
 * - User friendly date string
 * - Status String
 * - Sterile Yes/No
 * - Is JnJ Yes/No
 * - Is EU Yes/No
 */
function modifyResultsForDisplay() {
    const currResults = modeltblResults.getData();

    if (Array.isArray(currResults)) {
        const modifiedResults = currResults.map(r => {

            r.docVerification_verificationClosedAtString = generateDatabaseDateTime(r.docVerification_verificationClosedAt);
            r.docVerification_statusString = formatTaskStatus(r.docVerification_status);
            r.docVerification_trackwiseNo = r.docVerification_trackwiseNo.length > 1 ? concatArray(r.docVerification_trackwiseNo) : r.docVerification_trackwiseNo;

            formatMultipleForDisplay(r, r.ifus, "ifu", "ifu_ifuRef", "ifu_ifuRev", r.affectsIfuVerification);

            formatMultipleForDisplay(r, r.extras, "extra", "extra_extravfRef", "extra_extravfRev", r.extra_extravfRef);

            r.physVerification_verificationClosedAtString = generateDatabaseDateTime(r.physVerification_verificationClosedAt);
            r.physVerification_statusString = formatTaskStatus(r.physVerification_status);

            r.physVerification_trackwiseNo = r.physVerification_trackwiseNo.length > 1 ? concatArray(r.physVerification_trackwiseNo) : r.physVerification_trackwiseNo;
           
            r.vasVerification_verificationClosedAtString = generateDatabaseDateTime(r.vasVerification_verificationClosedAt);
            r.vasVerification_statusString = formatTaskStatus(r.vasVerification_status);
            r.vasVerification_trackwiseNo = r.vasVerification_trackwiseNo.length > 1 ? concatArray(r.vasVerification_trackwiseNo) : r.vasVerification_trackwiseNo;

            r.countryVerification_verificationClosedAtString = generateDatabaseDateTime(r.countryVerification_verificationClosedAt);
            r.countryVerification_statusString = formatTaskStatus(r.countryVerification_status);
            r.countryVerification_trackwiseNo = r.countryVerification_trackwiseNo.length > 1 ? concatArray(r.countryVerification_trackwiseNo) : r.countryVerification_trackwiseNo;

            formatMultipleForDisplay(r, r.pils, "pil", "pil_reference", "pil_revision", r.affectsPilVerification);

            r.finalVerificationStatusString = formatTaskStatus(r.finalVerificationStatus);
            r.finalVerificationCompletedDateString = (r.finalVerificationStatusString === "Not Completed") ? "" : generateDatabaseDateTime(r.finalVerificationCompletedDate);

            r.docVerification_arStatusString = r.arVerification_status === "" ? "" : formatTaskStatus(r.arVerification_status);

            r.product_wetString = formatBooleanText(r.sku_isWet);
            r.product_isSterileString = formatBooleanText(r.sku_isSterile);
            r.legalEntity_isEUString = formatBooleanText(r.legalEntity_isEU);
            r.legalEntity_isJNJString = formatBooleanText(r.legalEntity_isJNJ);
            r.product_npiString = r.product_npi != null || r.product_npi === "" ? changeWordWithIntialCaps(r.product_npi) : r.product_npi;


            return r;
        });

        modeltblResults.setData(modifiedResults);
    }
}

/**
 * Show/Hide Result columns
 * Toggles all columns where it's text/number binding starts with sGroup (i.e. the fieldname!)
 * 
 * @param {Boolean} bShow - true:Show; false:Hide
 * @param {String} sGroup - the group of fields to toggle
 */
function toggleDisplay(bShow, sGroup) {
    let aColumns = tblResults.getColumns() || [];

    aColumns.forEach(function (oCol, i) {
        let aAlwaysOnColumns = ["product_sku", "product_variant", "doc_docRef", "doc_docRev", "ifu_ifuRef", "ifu_ifuRev", "product_ifuType", "product_pilType", "physVerification_siteLocationName", "product_countryLimitations", "extra_extravfRef", "extra_extravfRev", "docVerification_arStatusString", sGroup + "_statusString", "product_vasType"];
        let sTextPath = oCol.getTemplate().getBindingPath("text");
        if (!sTextPath) {
            sTextPath = oCol.getTemplate().getBindingPath("number");
        }

        if ((!aAlwaysOnColumns.includes(sTextPath) || bShow) && sTextPath && sTextPath.startsWith(sGroup)) {
            oCol.setVisible(bShow);
        }
    });
}

/**
 * formatMultipleForDisplay
 * @param {Object} - record
 * @param {Object} - documents
 * @param {String} - prefix
 * @param {String} - referenceName
 * @param {String} - revisionName
 * @param {Boolean} - typeAffects
 * @return Void
 */
function formatMultipleForDisplay(record, documents, prefix, referenceName, revisionName, typeAffects) {
    const allVerifications = documents.map(document => document.verification);

    record[referenceName] = concatArray(documents.map(document => document.reference));
    record[revisionName] = concatArray(documents.map(document => document.revision));

    const statusForDocument = record[`${prefix}Verification_status`];
    record[`${prefix}Verification_statusString`] = typeAffects ? getStatusForMultiple(allVerifications, statusForDocument) : "N/A";

    const date = getMaxCloseDate(allVerifications);
    record[`${prefix}Verification_verificationClosedAtString`] = date === 0 ? "" : generateDatabaseDateTime(date);
    record[`${prefix}Verification_duration`] = getDurationForMultiple(allVerifications);
    record[`${prefix}Verification_trackwiseNo`] = getTrackwiseNumberForMultiple(allVerifications);

    const otherFields = ["taskRecordNo", "strategyId", "taskTypeId", "updatedBy", "comments", "strategyDescription"];
    setMultipleFields(record, allVerifications, otherFields, `${prefix}Verification_`);
}