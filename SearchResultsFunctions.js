/**
 * Name:        EU_MDR_SearchVerificationsResults
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Given a selection criteria, get the combined results of verifications and additional info
 *  in the system for the following Verifications: DoC, IFU
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  19/October/2020
 * CR:          CHG000010656864
 * Description: Added Physical and LST Verifications Results.
 *  Added Final Verification Status Usage Decision.
 *  Combined multiple IFUs for a single SKU/Variant.
 */

/**
 * Changed By:  vnavassa
 * Changed At:  14/04/2021
 * Description: Adapt query and filter using SKU table
 */

/**
 * Changed By:  vnavassa, Donnchadh O'Leary
 * Changed At:  31/05/2021
 * CR:
 * Description: Added Country Verifications Results, Added PIL Results, Calculate Final Verification Status based on IFU/PIL Type
 */
/**
 * Changed By:  Donnchadh O'Leary
 * Changed At:  09/06/2021
 * CR:
 * Description: View latest status
 */
/**
 * Changed By:  efinn3
 * Changed At:  16/06/2021
 * CR:
 * Description: Calculate Country Config Verification Status based on Country Limitation removals and Country Config submission
 */

/**
 * Changed By:  vnavassa
 * Changed At:  06/07/2021
 * CR:
 * Description:
 * - Added multiple PILs
 * - Refactor multiple IFUs to hangle the same logic as PILs
 * - Required refactor was needed due to reuse the same logic for both PILs and IFUs
 * - Refactored filters for status, IFU Reference and PIL Reference in query parameteres as there was returning incosisting PILs and IFUs linked to a product
 *
 */
/**
 * Changed By:  dolear14
 * Changed At:  28/09/2021
 * CR: X
 * Description: Country status bugfix AGXH-3493, merge
 */
/**
 * Changed By:  agurram1
 * Changed At:  28/04/2021
 * CR: X
 * Description: Enhancement change of AGXH-4924 & AGXH-5083, merge
 */

 const gsDocReference = req.query.docReference || "";
 //PRODUCT
 const gsLegalEntity = req.query.legalEntity || "";
 const gsEU = req.query.eu || "";
 const gsJnJ = req.query.jnj || "";
 const gsSKU = req.query.sku || "";
 const gsVariant = req.query.variant || "";
 const gsSterile = req.query.sterile || "";
 const gsRegClass = req.query.regClass || "";
 const gsBuCode = req.query.businessUnit || "";
 const gsarStatus = req.query.arStatus || "";
 const gsextraStatus = req.query.extraStatus || "";
 
 //USER
 const gsLanguage = req.query.language || "EN";
 
 //PHYSICAL
 const gsPhysSiteLocationId = req.query.physSiteLocation || "";
 
 const gsVasType = req.query.vasType || "";
 const gsNpi = req.query.npi || "";
 
 //Global variables
 const NA_STRING = "N/A";
 
 const FinalVerificationStatus = {
   Passed: "P",
   Failed: "F",
   Incomplete: "I",
   ErrorDoCMultipleLM: "ERROR_DOC_MULTIPLE_LM"
 };
 
 const VerificationStatus = {
   Passed: "P",
   Failed: "F",
   NotStarted: "N",
   Hold: "H",
   ErrorDoCMultipleLM: "ERROR_DOC_MULTIPLE_LM",
   ErrorDoCMultipleVerifications: "ERROR_DOC_MULTIPLE_VERIFICATIONS"
 };
 
 const PilIfuTypes = {
   digitalAndPaper: "digitalAndPaper",
   onlyPaper: "onlyPaper",
   onlyDigital: "onlyDigital",
   no: "no"
 };
 
 const aVerificationFields = ["taskRecordNo", "strategyId", "taskTypeId", "status", "updatedBy", "comments", "verificationStartedAt", "verificationClosedAt", "id"];
 const aPhysicalVerificationFields = aVerificationFields.concat("siteLocation");
 const aCountryExtraVerificationFields = aVerificationFields.concat("updatedAt");
 
 const [aStrategies, aSiteLocations, aBusinessUnits, countries, queryResults, nonConformities, countryLimitationRemovals] = await Promise.all([
   await getStrategies(gsLanguage),
   await getSiteLocations(),
   await getBusinessUnits(),
   await globals.countryLimitations.getCountriesList(),
   await executeAndGetSearchQuery(),
   await entities.eu_mdr_non_conformities.find(),
   await getCountryLimitationRemovals()
 ]);
 
 const ifusWithVerifications = getDocumentsWithVerifications(queryResults, "ifu_ifuRef", "ifu_ifuRev", "ifuVerification_", nonConformities);
 const extrasWithVerifications = getDocumentsWithVerifications(queryResults, "extra_extravfRef", "extra_extravfRev", "extraVerification_", nonConformities);
 const pilsWithVerifications = getDocumentsWithVerifications(queryResults, "pil_reference", "pil_revision", "pilVerification_", nonConformities);
 
 const aARDocs = getUniqueARDoCsInResults(queryResults);
 const aProductInfoByARDoC = await getProductsInformationByDoC(aARDocs);
 const aARVerificationsByDoC = await getARVerificationsByDoC(aARDocs);
 
 const countryLimitations = await getCombinedCountryLimitations(queryResults);
 
 const formattedResults = getFormatedResultsRemovingDuplicatesBySkuVariant(
   queryResults,
   countryLimitations,
   countryLimitationRemovals,
   pilsWithVerifications,
   ifusWithVerifications,
   extrasWithVerifications,
   aProductInfoByARDoC,
   aARVerificationsByDoC,
   nonConformities
 );
 
 const filteredResultsByQueryParams = req.query ? filterResultsByQueryParams(formattedResults, req.query) : formattedResults;
 
 result = {
   statusCode: 200,
   data: filteredResultsByQueryParams
 };
 
 
 complete();
 
 /**
  * getSkusFromProducts
  *
  * @param {[String]} skus
  * @returns {[Object]} uniqueProducts
  */
 function getSkusFromProducts(products) {
   return uniqueArrayOfObjects(products.map(product => product.sku));
 }
 
 /**
  * filterResultsByQueryParams
  * @param {[Object]} formattedResults
  * @param {Object} query
  * @returns {[Object]} filteredResults
  */
 function filterResultsByQueryParams(formattedResults, query) {
   let filteredResults = [...formattedResults];
 
   if (query.ifuReference) {
     filteredResults = filterDocumentsByReference(filteredResults, query.ifuReference, "ifus");
   }
 
   if (query.extraReference) {
     filteredResults = filterDocumentsByReference(filteredResults, query.extraReference, "extras");
   }
 
   if (query.pilReference) {
     filteredResults = filterDocumentsByReference(filteredResults, query.pilReference, "pils");
   }
 
   if (query.ifuStatus) {
     filteredResults = filterDocumentsByStatus(filteredResults, query.ifuStatus, "ifus", "ifuVerification_status");
   }
 
   if (query.extraStatus) {
     filteredResults = filterDocumentsByStatus(filteredResults, query.extraStatus, "extras", "extraVerification_status");
   }
 
   if (query.pilStatus) {
     filteredResults = filterDocumentsByStatus(filteredResults, query.pilStatus, "pils", "pilVerification_status");
   }
 
   return filterResultsByDynamicQueryParams(filteredResults, query);
 }
 
 /**
  * filterResultsByDynamicQueryParams
  *
  * @param  {[Object]} results
  * @param  {Object} query
  * @return {[Object]} filteredResults
  */
 function filterResultsByDynamicQueryParams(results, query) {
   let filters = {
     docVerification_status: query.docStatus ? docVerification_status => docVerification_status === query.docStatus : null,
     arVerification_status: query.arStatus ? arVerification_status => arVerification_status === query.arStatus : null,
     physVerification_status: query.physStatus ? physVerification_status => physVerification_status === query.physStatus : null,
     vasVerification_status: query.vasStatus ? vasVerification_status => vasVerification_status === query.vasStatus && vasVerification_status !== NA_STRING : null,
     finalVerificationStatus: query.finalStatus ? finalVerificationStatus => finalVerificationStatus === query.finalStatus : null
   };
 
   return filterArray(results, filters);
 }
 
 /**
  * Filters an array of objects using custom predicates.
  *
  * https://gist.github.com/jherax/f11d669ba286f21b7a2dcff69621eb72
  * @param  {Array}  array: the array to filter
  * @param  {Object} filters: an object with the filter criteria
  * @return {Array}
  */
 function filterArray(array, filters) {
   const filterKeys = Object.keys(filters);
   return array.filter(item => {
     // validates all filter criteria
     return filterKeys.every(key => {
       // ignores non-function predicates
       if (typeof filters[key] !== "function") return true;
       return filters[key](item[key]);
     });
   });
 }
 
 /**
  * filterDocumentsByReference
  *
  * @param {[Object]} originalResults
  * @param {String} reference
  * @param {String} fieldNameDocuments
  * @returns {[Object]} filteredResults
  */
 function filterDocumentsByReference(originalResults, reference, fieldNameDocuments) {
   return originalResults.filter(record => shouldRecordBeDisplayedByReference(record[fieldNameDocuments], reference));
 }
 
 /**
  * shouldRecordBeDisplayedByReference
  *
  * @param {[Object]} documents
  * @param {String} referenceToFilter
  * @returns {Boolean} shouldRecordBeDisplayed
  */
 function shouldRecordBeDisplayedByReference(documents, referenceToFilter) {
   let shouldRecordBeDisplayed = false;
 
   documents.forEach(originalDocument => {
     if (originalDocument.reference === referenceToFilter) {
       shouldRecordBeDisplayed = true;
     }
   });
 
   return shouldRecordBeDisplayed;
 }
 
 /**
  * filterDocumentsByStatus
  *
  * @param {[Object]} originalResults
  * @param {String} statusToFilter
  * @param {String} fieldNameDocuments i.e. "ifus"
  * @param {String} documentStatusFieldName
  * @returns {Boolean} filteredResults
  */
 function filterDocumentsByStatus(originalResults, statusToFilter, fieldNameDocuments, documentStatusFieldName) {
   let filteredResults = [];
 
   originalResults.forEach(record => {
     const recordAffectsStatus = record[documentStatusFieldName] !== NA_STRING;
 
     if (recordAffectsStatus && shouldRecordBeDisplayedByStatus(record[fieldNameDocuments], statusToFilter)) {
       filteredResults.push(record);
     }
   });
 
   return filteredResults;
 }
 
 /**
  * shouldRecordBeDisplayedByStatus
  *
  * @param {[Object]} documents
  * @param {String} statusToFilter
  * @returns {Boolean} shouldRecordBeDisplayed
  */
 function shouldRecordBeDisplayedByStatus(documents, statusToFilter) {
   let shouldRecordBeDisplayed = false;
 
   documents.forEach(originalDocument => {
     const isNotStarted = originalDocument.verification === null;
     if (isNotStarted) {
       const isStatusToFilterNotStarted = statusToFilter === VerificationStatus.NotStarted;
       if (isStatusToFilterNotStarted) {
         shouldRecordBeDisplayed = true;
       }
     } else if (originalDocument.verification.status === statusToFilter) {
       shouldRecordBeDisplayed = true;
     }
   });
 
   return shouldRecordBeDisplayed;
 }
 
 /**
  * getCountryLimitationForVerificationResult
  *
  * @param {Object} record
  * @param {[Object]} countryLimitations: {countryLimitationForSkus, countryLimitationForIfus, countryLimitationForPils}
  * @returns {Object} countries
  */
 function getCountryLimitationForVerificationResult(record, countryLimitations) {
   const countryLimitationCodesForSku = countryLimitations.countryLimitationForSkus
     .filter(countryLimitation => countryLimitation.sku === record.product_sku && countryLimitation.variant === record.product_variant)
     .map(limitationSku => limitationSku.country);
 
   const countryLimitationCodesForIfu = countryLimitations.countryLimitationForIfus
     .filter(countryLimitation => countryLimitation.reference === record.ifu_ifuRef && countryLimitation.revision === record.ifu_ifuRev)
     .map(limitationIfu => limitationIfu.country);
 
   const countryLimitationCodesForPil = countryLimitations.countryLimitationForPils
     .filter(countryLimitation => countryLimitation.reference === record.pil_reference && countryLimitation.revision === record.pil_revision)
     .map(limitationIfu => limitationIfu.country);
 
   const combinedCodeLimitations = [...new Set(countryLimitationCodesForSku.concat(countryLimitationCodesForIfu).concat(countryLimitationCodesForPil))];
   combinedCodeLimitations.sort((a, b) => a.localeCompare(b));
 
   const countryLimitationsObjects = combinedCodeLimitations.map(code => {
     const country = countries.find(country => country.key === code);
     return {
       code: code,
       text: country.text
     };
   });
 
   return countryLimitationsObjects;
 }
 
 /**
  * getNonConformitiesForRecord
  * 
  * @params {Object} recordVerificationId
  * @params {{Object}} nonConformities
  * @returns {Object} nonConformitiesForRecord
  */
 function getNonConformitiesForRecord(recordVerificationId, nonConformities) {
   const nonConformitiesForRecord = nonConformities
     .filter(nonConformity => nonConformity.verificationId === recordVerificationId)
     .map(nonConformity => nonConformity.trackwiseNumber)
   return nonConformitiesForRecord;
 }
 
 /**
  * isJnjNonEu
  *
  * @param {Object} record
  * @returns {Boolean} - isJnjNonEu
  */
 function isJnjNonEu(record) {
   return record.legalEntity_isJNJ && !record.legalEntity_isEU;
 }
 
 /**
  * isNonJnjOrIsEu
  *
  * @param {Object} record
  * @returns {Boolean} - isNonJnjOrIsEu
  */
 function isNonJnjOrIsEu(record) {
   return !record.legalEntity_isJNJ || record.legalEntity_isEU;
 }
 
 /**
  * hasArVerification
  *
  * @param {Object} record
  * @returns {Boolean} - hasArVerification
  */
 function hasArVerification(record) {
   const isNullOrUndefinied = record.arVerification_status === null || record.arVerification_status === undefined;
   return !isNullOrUndefinied;
 }
 
 /**
  * shouldUseArInsteadOfDoc
  *
  * @param {Object} record
  * @param {Boolean} arDoCHasMultipleVerifications
  * @returns {Boolean} - shouldUseArInsteadOfDoc
  */
 function shouldUseArInsteadOfDoc(record, arDoCHasMultipleVerifications) {
   return isJnjNonEu(record) && hasArVerification(record) && !arDoCHasMultipleVerifications;
 }
 
 /**
  * getFormatedResultsRemovingDuplicatesBySkuVariant
  *
  * @param {[Object]} queryResult
  * @param {[Object]} countryLimitations
  * @param {[Object]} countryLimitationRemovals
  * @param {[Object]} pilsWithVerifications
  * @param {[Object]} ifusWithVerifications
  * @param {[Object]} extrasWithVerifications
  * @param {[Object]} aProductInfoByARDoC
  * @param {[Object]} aARVerificationsByDoC
  * @param {[Object]} nonConformities
  * @returns {Array} formatedResultsRemovingDuplicatesBySkuVariant
  */
 function getFormatedResultsRemovingDuplicatesBySkuVariant(queryResult, countryLimitations, countryLimitationRemovals, pilsWithVerifications, ifusWithVerifications, extrasWithVerifications, aProductInfoByARDoC, aARVerificationsByDoC, nonConformities) {
   if (queryResult.length === 0) {
     return [];
   }
 
   const aFormattedResults = queryResult.map(record => {
     const aProductInfoBySingleARDoC = hasArVerification(record) ? aProductInfoByARDoC.filter(doc => doc.docRef === record.doc_docRef && doc.docRev === record.doc_docRev) : [];
     const aARVerificationsBySingleDoC = hasArVerification(record) ? aARVerificationsByDoC.filter(doc => doc.docReference === record.doc_docRef && doc.docRevision === record.doc_docRev) : [];
 
     return getFormatedRecord(record, countryLimitations, countryLimitationRemovals, pilsWithVerifications, ifusWithVerifications, extrasWithVerifications, aProductInfoBySingleARDoC, aARVerificationsBySingleDoC, nonConformities);
   });
   return removeDuplicatesBySkuAndVariant(aFormattedResults);
 }
 
 /**
  * getFormatedRecord
  *
  * @param {Object} record
  * @param {[Object]} countryLimitations
  * @param {[Object]} countryLimitationRemovals
  * @param {[Object]} pilsWithVerifications
  * @param {[Object]} ifusWithVerifications
  * @param {[Object]} extrasWithVerifications
  * @param {[Object]} aProductInfoByARDoC
  * @param {[Object]} aARVerificationsByDoC
  * @param {[Object]} nonConformities
  * @returns {[Object]} formatedRecord
  */
 function getFormatedRecord(record, countryLimitations, countryLimitationRemovals, pilsWithVerifications, ifusWithVerifications, extrasWithVerifications, aProductInfoBySingleARDoC, aARVerificationsBySingleDoC, nonConformities) {
   const arDoCHasMultipleLMs = aProductInfoBySingleARDoC.some(doc => doc.legalManufacture !== record.product_legalManufacture);
 
   const arDoCHasMultipleVerifications = aARVerificationsBySingleDoC.length > 1 && aARVerificationsBySingleDoC.some(doc => doc.sku !== record.product_sku);
   const useArDoc = shouldUseArInsteadOfDoc(record, arDoCHasMultipleVerifications);
   const isLstRequired = isLSTRequired(record);
   const affectsIfuVerification = typeAffectsFinalVerification(record.product_ifuType, true);
   const affectsPilVerification = typeAffectsFinalVerification(record.product_pilType, false);
   const countryLimitationsCodes = getCountryLimitationForVerificationResult(record, countryLimitations);
   const hasCountryLimitations = countryLimitationsCodes.length > 0;
   const isCountryCompletedAfterLastRemoval = isCountryVerificationCompletedAfterLastUpdate(record, countryLimitationRemovals);
   const arVerificationSubmitted = hasArVerification(record);
   const isJnJNonEu = isJnjNonEu(record);
 
   record.docVerification_strategyDescription = getStrategyDescription(record.docVerification_strategyId);
   record.docVerification_duration = record.docVerification_verificationStartedAt ? getTimeBetween(record.docVerification_verificationStartedAt, record.docVerification_verificationClosedAt) : "";
   record.docVerification_trackwiseNo = getNonConformitiesForRecord(record.docVerification_id, nonConformities);
 
   record.pils = pilsWithVerifications.filter(pil => pil.sku === record.product_sku);
   record.affectsPilVerification = affectsPilVerification;
   const withoutPils = record.pils.length === 0;
   record.pilVerification_status = !affectsPilVerification ? NA_STRING : withoutPils ? VerificationStatus.NotStarted : getOveralStatusForDocument(record.pils);
 
   record.ifus = ifusWithVerifications.filter(ifu => ifu.sku === record.product_sku);
   record.affectsIfuVerification = affectsIfuVerification;
   const withoutIfus = record.ifus.length === 0;
   record.ifuVerification_status = !affectsIfuVerification ? NA_STRING : withoutIfus ? VerificationStatus.NotStarted : getOveralStatusForDocument(record.ifus);
 
   record.extras = extrasWithVerifications.filter(extra => extra.sku === record.product_sku && extra.variant === record.product_variant);
   const withoutExtras = record.extras.length === 0;
   record.extraVerification_status = withoutExtras ? NA_STRING : getOveralStatusForDocument(record.extras);
 
   record.physVerification_strategyDescription = getStrategyDescription(record.physVerification_strategyId);
   record.physVerification_siteLocationName = getSiteLocationName(record.physVerification_siteLocation);
   record.physVerification_duration = record.physVerification_verificationStartedAt ? getTimeBetween(record.physVerification_verificationStartedAt, record.physVerification_verificationClosedAt) : "";
   record.physVerification_trackwiseNo = getNonConformitiesForRecord(record.physVerification_id, nonConformities);
 
   record.vasVerification_status = isLstRequired ? record.vasVerification_status : NA_STRING;
   record.vasVerification_strategyDescription = getStrategyDescription(record.vasVerification_strategyId);
   record.vasVerification_duration = record.vasVerification_verificationStartedAt ? getTimeBetween(record.vasVerification_verificationStartedAt, record.vasVerification_verificationClosedAt) : "";
   record.vasVerification_trackwiseNo = getNonConformitiesForRecord(record.vasVerification_id, nonConformities);
 
   record.countryVerification_strategyDescription = getStrategyDescription(record.countryVerification_strategyId);
   record.countryVerification_duration = record.countryVerification_verificationStartedAt ? getTimeBetween(record.countryVerification_verificationStartedAt, record.countryVerification_verificationClosedAt) : "";
   record.countryVerification_trackwiseNo = getNonConformitiesForRecord(record.countryVerification_id, nonConformities);
 
   record.countryVerification_status = hasCountryLimitations ? (isCountryCompletedAfterLastRemoval ? record.countryVerification_status : VerificationStatus.NotStarted) : NA_STRING;
   record.countryVerification_isCompletedAfterLastRemoval = isCountryCompletedAfterLastRemoval;
 
   record.product_countryLimitations = hasCountryLimitations ? getCountryLimitationsDescription(countryLimitationsCodes, countries) : "No country limitation";
   record.hasCountryLimitations = hasCountryLimitations;
 
   const docStatusWhenIsJnJNonEu = false ? (arDoCHasMultipleLMs ? VerificationStatus.ErrorDoCMultipleLM : NA_STRING) : record.docVerification_status;
   record.docVerification_status = record.latestVerification === "DOC" ? isJnJNonEu ? docStatusWhenIsJnJNonEu : record.docVerification_status : NA_STRING;
 
   const arStatusWhenIsNonJnJOrIsEu = arVerificationSubmitted ?
     (arDoCHasMultipleVerifications ? VerificationStatus.ErrorDoCMultipleVerifications
       : arDoCHasMultipleLMs ? VerificationStatus.ErrorDoCMultipleLM
         : record.arVerification_status)
     : "";
 
   record.arVerification_status = record.latestVerification === "AR" ? arStatusWhenIsNonJnJOrIsEu : NA_STRING
   record.arVerificationSubmitted = arVerificationSubmitted;
 
   const verificationsStatusAndDate = getVerificationsStatusAndDate(record);
   const finalStatusAndCompleteDate = getFinalStatusAndCompleteDate(isLstRequired, useArDoc, hasCountryLimitations, affectsPilVerification, affectsIfuVerification, verificationsStatusAndDate);
   record.finalVerificationStatus = finalStatusAndCompleteDate.finalStatus;
   record.finalVerificationCompletedDate = finalStatusAndCompleteDate.finalDate;
 
   removePropertiesForMultipleLinkedDocuments(record, "pil");
   removePropertiesForMultipleLinkedDocuments(record, "ifu");
   return record;
 }
 
 /**
  * isCountryVerificationCompletedAfterLastUpdate
  *
  * @param {Object} record
  * @param {[Number]} countryLimitationRemovals (timestamps)
  * @returns {Boolean} isCountryVerificationCompletedAfterLastUpdate
  */
 function isCountryVerificationCompletedAfterLastUpdate(record, countryLimitationRemovals) {
   const latestVerificationRemoval = Math.max(...getCountryLimitationRemovalTimestampsForRecord(record, countryLimitationRemovals));
   return record.countryVerification_updatedAt >= latestVerificationRemoval;
 }
 
 /**
  * getCountryLimitationsDescription
  *
  * @param {[String]} countryLimitationsCodes
  * @param {[Object]} countries
  * @returns {String} countryLimitationsDescription
  */
 function getCountryLimitationsDescription(countryLimitationsCodes, countries) {
   return countryLimitationsCodes.map(countryLimitation => countries.find(country => country.key === countryLimitation.code).text).join(" | ");
 }
 
 /**
  * getVerificationsStatusAndDate
  *
  * @param {Object} record
  * @returns {Object} verficationWithStatusAndDate {status, closedAt}
  */
 function getVerificationsStatusAndDate(record) {
   return {
     physical: getStatusAndDate(record.physVerification_status, record.physVerification_verificationClosedAt),
     ar: getStatusAndDate(record.arVerification_status, record.arVerification_verificationClosedAt),
     doc: getStatusAndDate(record.docVerification_status, record.docVerification_verificationClosedAt),
     vas: getStatusAndDate(record.vasVerification_status, record.vasVerification_verificationClosedAt),
     country: getStatusAndDate(record.countryVerification_status, record.countryVerification_verificationClosedAt),
     pil: getStatusAndDate(record.pilVerification_status, record.pilVerification_verificationClosedAt),
     ifu: getStatusAndDate(record.ifuVerification_status, record.ifuVerification_verificationClosedAt),
     extra: getStatusAndDate(record.extraVerification_status, record.extraVerification_verificationClosedAt)
   };
 }
 
 /**
  * getStatusAndDate
  *
  * @param {String (eNum)} status
  * @param {String} date (timestamp)
  * @returns {Object} verfication {status, closedAt}
  */
 function getStatusAndDate(status, date) {
   return {
     status: status,
     closedAt: date
   };
 }
 
 /**
  * getCountryLimitationRemovalTimestampsForRecord
  *
  * 
  * @param {Object} record
  * @param {[Object]} countryLimitationRemovals
  * @returns {[Number]} removalTimestamps
  */
 function getCountryLimitationRemovalTimestampsForRecord(record, countryLimitationRemovals) {
   const skuRemovals = countryLimitationRemovals.countryRemovalsForSkus.filter(removal => removal.sku === record.product_sku && removal.variant === record.product_variant);
   const ifuRemovals = countryLimitationRemovals.countryRemovalsForIfus.filter(removal => removal.reference === record.ifu_ifuRef && removal.revision === record.ifu_ifuRev);
   const pilRemovals = countryLimitationRemovals.countryRemovalsForPils.filter(removal => removal.reference === record.pil_reference && removal.revision === record.pil_revision);
 
   const skuRemovalsTimestamps = skuRemovals.map(removal => removal.createdAt);
   const ifuRemovalsTimestamps = ifuRemovals.map(removal => removal.createdAt);
   const pilRemovalsTimestamps = pilRemovals.map(removal => removal.createdAt);
 
   return [...skuRemovalsTimestamps, ...ifuRemovalsTimestamps, ...pilRemovalsTimestamps];
 }
 
 /**
  * Get time between two dates
  *
  * @param {Number|String} timeFrom - Time From in milliseconds
  * @param {Number|String} timeTo (optional, defaults to now) - Time To in milliseconds
  * @returns {Number} - Time in Minutes
  */
 function getTimeBetween(timeFrom, timeTo) {
   if (!timeTo) {
     timeTo = Date.now();
   }
 
   return (Number(timeTo) - Number(timeFrom)) / 60000; // In Minutes (1m = 60000ms)
 }
 
 /**
  * Get a strategy given the id
  *
  * @param {String} sStrategyId
  * @returns {String} sDescription - Strategy Description
  */
 function getStrategyDescription(sStrategyId) {
   const oStrategy = aStrategies.find(s => s.strategyId === sStrategyId);
   const sDescription = oStrategy ? oStrategy.description : "";
   return sDescription;
 }
 
 /**
  * getFinalStatusAndCompleteDate
  *
  * @param {Boolean} isLstRequired,
  * @param {Boolean} useArDoc,
  * @param {Boolean} hasCountryLimitations,
  * @param {Boolean} affectsPilType,
  * @param {Boolean} affectsIfuType,
  * @param {Object} verifications,
  * @returns {Object} finalStatusAndDate {finalStatus, finalDate}
  */
 function getFinalStatusAndCompleteDate(isLstRequired, useArDoc, hasCountryLimitations, affectsPilType, affectsIfuType, verifications) {
   const verificationToConsiderForFinal = [verifications.physical];
 
   verificationToConsiderForFinal.push(useArDoc ? verifications.ar : verifications.doc);
 
   if (verifications.extra.status !== NA_STRING) {
     verificationToConsiderForFinal.push(verifications.extra);
   }
 
   if (isLstRequired) {
     verificationToConsiderForFinal.push(verifications.vas);
   }
 
   if (hasCountryLimitations) {
     verificationToConsiderForFinal.push(verifications.country);
   }
 
   if (affectsPilType) {
     verificationToConsiderForFinal.push(verifications.pil);
   }
 
   if (affectsIfuType) {
     verificationToConsiderForFinal.push(verifications.ifu);
   }
 
   const someWithoutVerifications = verificationToConsiderForFinal.some(verification => verification === null);
   const allVerificationsPass = verificationToConsiderForFinal.every(verification => verification.status === FinalVerificationStatus.Passed);
   const someVerificationFail = verificationToConsiderForFinal.some(verification => verification.status === FinalVerificationStatus.Failed);
   const someErrors = verificationToConsiderForFinal.some(verification => verification.status === FinalVerificationStatus.ErrorDoCMultipleLM);
 
   const statusIfAllCompleted =
     allVerificationsPass ? FinalVerificationStatus.Passed
       : someVerificationFail ? FinalVerificationStatus.Failed
         : FinalVerificationStatus.Incomplete;
 
   const finalStatus =
     someErrors ? FinalVerificationStatus.ErrorDoCMultipleLM
       : someWithoutVerifications ? FinalVerificationStatus.Incomplete
         : statusIfAllCompleted;
   const finalDate = Math.max.apply(Math, verificationToConsiderForFinal.map(verification => Number(verification.closedAt)));
 
   return {
     finalStatus: finalStatus,
     finalDate: finalDate
   };
 }
 
 /**
  * Calculate the final verification status based on the status of all verifications
  *
  * @param {Object} oRecord - The Record containing all verifications
  * @returns {Boolean} bIsRequired
  */
 function isLSTRequired(oRecord) {
   const bBUNeedsLST = aBusinessUnits.filter(bu => bu.vasRequired && bu.code === oRecord.product_businessUnit).length;
   const bIsRequired = bBUNeedsLST && oRecord.legalEntity_isJNJ;
   const vasRequired = oRecord.product_vasType != null && oRecord.product_vasType != "" && oRecord.product_vasType != "No VAS"
 
   return vasRequired ? vasRequired : (vasRequired && bIsRequired);
 }
 
 /**
  * Get the Site Location name for given the id
  *
  * @param {String} sId
  * @returns {String} sName - Site Location Name
  */
 function getSiteLocationName(sId) {
   const oSite = aSiteLocations.find(s => s.id === sId);
   return oSite ? oSite.siteLocationName : "";
 }
 
 /**
  * Checks if the given status is a Completed one
  *
  * @param {String} sStatus
  * @returns {Boolean} - true = completed; false = not complete
  */
 function isCompleted(sStatus) {
   return [VerificationStatus.Passed, VerificationStatus.Failed].includes(sStatus);
 }
 
 /**
  * Determine for PIL/IFU only relevant components of PIL verifications
  * are considered as part of the final release of a product
  *
  * @param {Object} typeField - The IFU or PIL type
  * @param {Boolean} isIfu
  * @returns {Boolean} pilTypeRecordAffectsFinal
  */
 function typeAffectsFinalVerification(typeField, isIfu) {
   const typesThatAffectFinal = [PilIfuTypes.digitalAndPaper, PilIfuTypes.onlyDigital];
   return (pilTypeRecordAffectsFinal = typeField === null ? isIfu : typesThatAffectFinal.includes(typeField));
 }
 
 /**
  * getDocumentsWithVerifications
  *
  * @param {[Object]} queryResults
  * @param {String} referenceName
  * @param {String} revisionName
  * @param {String} prefix
  * @param {[Object]} nonConformities
  * @returns {[Objects]} verificationWithDurationAndStrategy
  */
 function getDocumentsWithVerifications(queryResults, referenceName, revisionName, prefix, nonConformities) {
   const uniqueDocuments = getUniqueDocuments(queryResults, referenceName, revisionName, prefix);
 
   return uniqueDocuments.map(document => {
     const verification = verificationForDocument(document.reference, document.revision, document.sku, queryResults, referenceName, revisionName, prefix);
     const verificationWithDurationAndStrategyAndNonConformities = verification ? getVerificationWithDurationAndStrategyAndNonConformities(verification, nonConformities) : null;
     return {
       ...document,
       verification: verificationWithDurationAndStrategyAndNonConformities
     };
   });
 }
 
 /**
  * getUniqueDocuments
  *
  * @param {[Object]} queryResults
  * @param {String} referenceName
  * @param {String} revisionName
  * @param {String} prefix
  * @returns {[Object]} uniqueDocuments
  */
 function getUniqueDocuments(queryResults, referenceName, revisionName, prefix) {
   const uniqueDocuments = uniqueArrayOfObjects(
     queryResults
       .map(result => {
         return {
           reference: result[referenceName],
           revision: result[revisionName],
           sku: result.product_sku,
           variant: prefix === "extraVerification_" ? result.product_variant : ""
         };
       })
       .filter(document => document.reference !== null)
   );
   return uniqueDocuments;
 }
 
 /**
  * verificationForDocument
  *
  * @param {String} reference
  * @param {String} revision
  * @param {String} sku
  * @param {[Object]} queryResults
  * @param {String} referenceName
  * @param {String} revisionName
  * @param {String} prefix
  * @returns {Object} verificationForDocument
  */
 function verificationForDocument(reference, revision, sku, queryResults, referenceName, revisionName, prefix) {
   const recordForDocument = queryResults.find(record => record[referenceName] === reference && record[revisionName] === revision && record.product_sku === sku && record[`${prefix}taskRecordNo`] !== null);
   return recordForDocument ? getVerificationObjectFromIdentifier(recordForDocument, prefix, aVerificationFields) : null;
 }
 
 /**
  * getVerificationWithDurationAndStrategyAndNonConformities
  *
  * @param {Object} verification
  * @returns {Object} VerificationWithDurationAndStrategyAndNonConformities
  */
 function getVerificationWithDurationAndStrategyAndNonConformities(verification, nonConformities) {
   return {
     ...verification,
     duration: verification.verificationStartedAt ? getTimeBetween(verification.verificationStartedAt, verification.verificationClosedAt) : "",
     strategyDescription: getStrategyDescription(verification.strategyId),
     trackwiseNo: getNonConformitiesForRecord(verification.id, nonConformities)
   };
 }
 
 /**
  * getVerificationObjectFromIdentifier
  *
  * @param {Object} queryRecord
  * @param {String} verificationIdentifier
  * @param {[String]} verificationFields
  * @returns {Object} verificationObject
  */
 function getVerificationObjectFromIdentifier(queryRecord, identifier, verificationFields) {
   return verificationFields.reduce((acc, cur) => ({ ...acc, [cur]: queryRecord[`${identifier}${cur}`] }), {});
 }
 
 /**
  * getOveralStatusForStatuses
  *
  * @param {[String]} statuses
  * @returns {String(eNum)} Status
  */
 function getOveralStatusForStatuses(statuses) {
   if (statuses.every(status => status === VerificationStatus.Passed)) {
     return VerificationStatus.Passed;
   }
 
   if (statuses.some(status => status === VerificationStatus.Failed)) {
     return VerificationStatus.Failed;
   }
 
   return VerificationStatus.Hold;
 }
 
 /**
  * removePropertiesForMultipleLinkedDocuments
  *
  * @param {Object} record
  * @param {String} prefix
  * @returns Void
  */
 function removePropertiesForMultipleLinkedDocuments(record, prefix) {
   const filedsToRemove = ["ifu_ifuRef", "ifu_ifuRev", "pil_reference", "pil_revision"];
   filedsToRemove.forEach(field => delete record[`${field}`]);
 
   const verificationFieldsToRemove = ["updatedBy", "comments", "strategyDescription", "strategyId", "taskTypeId"];
   verificationFieldsToRemove.forEach(field => delete record[`${prefix}Verification_${field}`]);
 }
 
 /**
  * getOveralStatusForDocument
  *
  * @param {[Object]} documents
  * @returns {String} status
  */
 function getOveralStatusForDocument(documents) {
   if (documents.length === 0) {
     return VerificationStatus.NotStarted;
   }
 
   const allDocumentNotStarted = documents.every(verification => verification === null || verification.verification === null);
   if (allDocumentNotStarted) {
     return VerificationStatus.NotStarted;
   }
 
   const verificationStatuses = documents.map(document => document.verification).map(verification => (verification === null ? null : verification.status));
 
   return getOveralStatusForStatuses(verificationStatuses);
 }
 
 /**
  * uniqueArrayOfObjects
  *
  * @param {[Object]} originalArray
  * @returns {[Object]} uniqueArray
  */
 function uniqueArrayOfObjects(originalArray) {
   return originalArray.filter((v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i);
 }
 
 /**
  * removeDuplicatesBySkuAndVariant
  *
  * @param {[Object]} results
  * @returns {[Object]} resultsRemovedDuplicates
  */
 function removeDuplicatesBySkuAndVariant(results) {
   return results.filter((origObj, origIdx, origArr) => origArr.findIndex(record => record.product_sku === origObj.product_sku && record.product_variant === origObj.product_variant) === origIdx);
 }
 
 /**
  * Get a list of unique AR DoCs from the query results
  * 
  * @param {Array} - queryResults
  * @returns {[{docRef, docRev}]} aDocuments - Array of DoC documents
  */
 function getUniqueARDoCsInResults(queryResults) {
   const aRecordsWithARVerification = queryResults.filter(r => hasArVerification(r));
   const aDocuments = uniqueArrayOfObjects(aRecordsWithARVerification.map(r => ({
     docRef: r.doc_docRef,
     docRev: r.doc_docRev
   })));
   return aDocuments;
 }
 
 
 // ******************************************************************************
 // DB Queries
 // ******************************************************************************
 
 /**
  * Get all strategies for a language
  *
  * @param {String} sLanguage
  * @returns {Array} - Strategies list
  */
 async function getStrategies(sLanguage) {
   return await entities.eu_mdr_strategy_text.find({
     where: {
       language: sLanguage
     },
     order: {
       strategyId: "ASC"
     }
   });
 }
 
 /**
  * Get all site locations
  *
  * @returns {Array} - Sites list
  */
 async function getSiteLocations() {
   return await entities.eu_mdr_site_location.find({
     order: {
       id: "ASC"
     }
   });
 }
 
 /**
  * Get all business unites
  *
  * @returns {Array} - Sites list
  */
 async function getBusinessUnits() {
   return await entities.eu_mdr_business_unit.find({
     order: {
       id: "ASC"
     }
   });
 }
 
 /**
  * getCountryLimitationRemovals
  *
  * @param {[String]} skus
  * @param {[Object]} ifus
  * @param {[Object]} pils
  * @returns {[Object]} countryLimitationRemovalsForSkus
  */
 async function getCountryLimitationRemovals() {
   const countryRemovalsForSkus = await getCountryLimitationRemovalsForSkus();
   const countryRemovalsForIfus = await getCountryLimitationRemovalsForDocuments(true);
   const countryRemovalsForPils = await getCountryLimitationRemovalsForDocuments(false);
 
   return { countryRemovalsForSkus, countryRemovalsForIfus, countryRemovalsForPils };
 }
 
 /**
  * getCountryLimitationRemovalsForSkus
  *
  * @returns {[Object]} countryLimitationRemovalsForSkus
  */
 async function getCountryLimitationRemovalsForSkus() {
   return await entities.eu_mdr_country_limitations_sku_history.find({
     select: ["sku", "variant", "createdAt"]
   });
 }
 
 /**
  * getCountryLimitationRemovalsForDocuments
  *
  * @param {Boolean} isForIfu
  * @returns {[Object]} countryLimitationRemovalsForDocuments
  */
 async function getCountryLimitationRemovalsForDocuments(isForIfu) {
   const countryRemovalsForDocuments = await entities.eu_mdr_country_limitations_doc_history.find({
     select: ["reference", "revision", "createdAt"],
     where: {
       taskTypeId: isForIfu ? "EV_IFU" : "EV_PIL"
     }
   });
 
   return countryRemovalsForDocuments;
 }
 
 /**
  * getCombinedCountryLimitations
  *
  * @param {[Object]} records
  * @returns {[Object]} countryLimitationForSkus, countryLimitationForIfus, countryLimitationForPils
  */
 async function getCombinedCountryLimitations(records) {
   const { In } = operators;
 
   if (records.length === 0) {
     return [];
   }
 
   const countryLimitationForSkus = await entities.countryLimitationSkus.find({
     sku: In(records.map(record => record.product_sku))
   });
 
   const countryLimitationForIfus = await entities.countryLimitationDocs.find({
     reference: In(records.map(record => record.ifu_ifuRef)),
     taskTypeId: "EV_IFU"
   });
 
   const countryLimitationForPils = await entities.countryLimitationDocs.find({
     reference: In(records.map(record => record.pil_reference)),
     taskTypeId: "EV_PIL"
   });
 
   return { countryLimitationForSkus, countryLimitationForIfus, countryLimitationForPils };
 }
 
 /**
  * Get Product Information for DoC documents
  * 
  * @param {[{docRef, docRev}]} aDocuments - Array of DoC documents
  * @returns {[{docRef, docRev, sku, variant, legalManufacture}]}
  */
 async function getProductsInformationByDoC(aDocuments) {
   const oQuery = entities.eu_mdr_doc_master.createQueryBuilder("doc")
     .select("doc.docRef, doc.docRev, doc.sku, product.variant, product.legalManufacture")
     .leftJoin("eu_mdr_productmaster", "product", "product.sku = doc.sku");
 
   aDocuments.forEach((doc, idx) => {
     const sWhere = `doc.docRef = :reference${idx} AND doc.docRev = :revision${idx}`;
     const oParam = {};
     oParam[`reference${idx}`] = doc.docRef;
     oParam[`revision${idx}`] = doc.docRev;
     if (idx > 0) {
       oQuery.orWhere(sWhere, oParam);
     } else {
       oQuery.where(sWhere, oParam);
     }
   });
 
   const aProductInformationByDoC = await oQuery.getRawMany();
   return aProductInformationByDoC;
 }
 
 /**
  * Get all AR Verifications done for a list of DoCs
  * 
  * @param {[{docRef, docRev}]} aDocuments - Array of DoC documents
  * @returns {[{docReference, docRevision, docSku}]}
  */
 async function getARVerificationsByDoC(aDocuments) {
   const aARTaskDocuments = aDocuments.map(doc => ({
     docReference: doc.docRef,
     docRevision: doc.docRev
   }));
 
   const aARTasks = await entities.eu_mdr_auth_rep_task.find({
     select: ["docReference", "docRevision", "docSku"],
     where: aARTaskDocuments,
     order: {
       docSku: "ASC"
     }
   });
 
   return aARTasks;
 }
 
 /**
  * executeAndGetSearchQuery
  *
  * @returns {Array} aResult - The raw result list
  */
 async function executeAndGetSearchQuery() {
   const getFieldsWithAlias = (sTableAlias, aFields) => aFields.map(field => `${sTableAlias}.${field}`);
   const getSelectFields = aFields => aFields.map(field => (field.includes(".") ? `${field} AS \"${field.replace(".", "_")}\"` : field)).join(" , ");
 
   //Create FIELDS List for Selection
   const aProductFields = ["product.sku", "product.variant", "product.legalManufacture", "product.businessUnit", "product.ifuType", "product.pilType", "product.vasType", "product.npi"];
   const aSkuFields = ["sku.regulatoryClass", "sku.isSterile", "sku.isWet"];
   const aLegalEntityFields = ["legalEntity.name", "legalEntity.eovLMId", "legalEntity.isEU", "legalEntity.isJNJ"];
   const aDocFields = ["doc.docRef", "doc.docRev"];
   const aIfuFields = ["ifu.ifuRef", "ifu.ifuRev", "ifu.sku"];
   const aExtraFields = ["extra.extravfRef", "extra.extravfRev", "extra.sku", "extra.variant"];
   const aPilFields = ["pil.reference", "pil.revision"];
   const aBucodeFields = ["bucode.code", "bucode.UDIDescription"];
   const aDocVerificationFields = getFieldsWithAlias("docVerification", aVerificationFields);
   const aIFUVerificationFields = getFieldsWithAlias("ifuVerification", aVerificationFields);
   const aEtraVerificationFields = getFieldsWithAlias("extraVerification", aVerificationFields);
   const aPhysVerificationFields = getFieldsWithAlias("physVerification", aPhysicalVerificationFields);
   const aVASVerificationFields = getFieldsWithAlias("vasVerification", aVerificationFields);
   const aCountryVerificationFields = getFieldsWithAlias("countryVerification", aCountryExtraVerificationFields);
   const aPilFieldsVerification = getFieldsWithAlias("pilVerification", aVerificationFields);
   const aArFields = ["arVerification.status", "arVerification.verificationClosedAt"];
 
   const distintOnFields = ["product.sku", "product.variant", "ifu.ifuRef", "ifu.ifuRev", "bucode.code", "bucode.UDIDescription", "extra.extravfRef", "extra.extravfRev", "pil.reference", "pil.revision"];
   const selectOnString = `DISTINCT ON (${distintOnFields.join(", ")})`;
 
   const selectFields = [
     getSelectFields(aProductFields),
     getSelectFields(aSkuFields),
     getSelectFields(aLegalEntityFields),
     getSelectFields(aDocFields),
     getSelectFields(aIfuFields),
     getSelectFields(aExtraFields),
     getSelectFields(aDocVerificationFields),
     getSelectFields(aIFUVerificationFields),
     getSelectFields(aEtraVerificationFields),
     getSelectFields(aPhysVerificationFields),
     getSelectFields(aVASVerificationFields),
     getSelectFields(aCountryVerificationFields),
     getSelectFields(aPilFieldsVerification),
     getSelectFields(aPilFields),
     getSelectFields(aBucodeFields),
     getSelectFields(aArFields)
   ];
 
   // the SELECT string - only select distinct combinations of distintOnFields array
   const sSelectString = `${selectOnString} ${selectFields.join(", ")}`;
 
   //the QUERY - gets SKU/Variant combinations i.e. products. Then per product gets related Legal Entity, DoC and IFU data. Then gets all verifications (one join per verification type) for the Product/DoC/IFU if there is one in the system
   // Ordering verificationClosedAt date by nulls last is important as it allows actually completed verification records to be selected first, and only if there is no completed verification will it select the null record
   const oQuery = entities.eu_mdr_productmaster
     .createQueryBuilder("product")
     .innerJoin("eu_mdr_legal_entities", "legalEntity", "legalEntity.eovLMId = product.legalManufacture")
     .leftJoin("eu_mdr_sku", "sku", "sku.sku = product.sku")
     .leftJoin("eu_mdr_doc_master", "doc", "doc.sku = product.sku")
     .leftJoin("eu_mdr_ifu_master", "ifu", "ifu.sku = product.sku")
     .leftJoin("eu_mdr_extravf_master", "extra", "extra.sku = product.sku AND extra.variant = product.variant")
     .leftJoin("eu_mdr_pil_sku_master", "pil", "pil.sku = product.sku")
     .leftJoin("eu_mdr_business_unit", "bucode", "bucode.code = product.businessUnit")
     .leftJoin("eu_mdr_auth_rep_task", "arVerification", "arVerification.docReference = doc.docRef AND arVerification.docRevision = doc.docRev")
     .leftJoin("eu_mdr_verification_task", "docVerification", "docVerification.taskTypeId = :docVerificationTaskType AND docVerification.reference = doc.docRef  AND docVerification.revision = doc.docRev")
     .leftJoin("eu_mdr_verification_task", "physVerification", "physVerification.taskTypeId = :physVerificationTaskType AND physVerification.sku = product.sku  AND physVerification.variant = product.variant")
     .leftJoin("eu_mdr_verification_task", "vasVerification", "vasVerification.taskTypeId = :vasVerificationTaskType AND vasVerification.sku = product.sku  AND vasVerification.variant = product.variant")
     .leftJoin("eu_mdr_verification_task", "countryVerification", "countryVerification.taskTypeId = :countryVerificationTaskType AND countryVerification.sku = product.sku  AND countryVerification.variant = product.variant")
     .leftJoin("eu_mdr_verification_task", "ifuVerification", "ifuVerification.taskTypeId = :ifuVerificationTaskType AND ifuVerification.reference = ifu.ifuRef  AND ifuVerification.revision = ifu.ifuRev")
     .leftJoin("eu_mdr_verification_task", "extraVerification", "extraVerification.taskTypeId = :extraVerificationTaskType AND extraVerification.reference = extra.extravfRef AND extraVerification.revision = extra.extravfRev")
     .leftJoin("eu_mdr_verification_task", "pilVerification", "pilVerification.taskTypeId = :pilVerificationTaskType AND pilVerification.reference = pil.reference  AND pilVerification.revision = pil.revision")
     .select(sSelectString)
     .orderBy({
       "product.sku": "ASC",
       "product.variant": "ASC",
       "ifu.ifuRef": "ASC",
       "ifu.ifuRev": "ASC",
       "extra.extravfRef": "ASC",
       "extra.extravfRev": "ASC",
       "pil.reference": "ASC",
       "pil.revision": "ASC",
       "bucode.code": "ASC",
       "bucode.UDIDescription": "ASC",
       "docVerification.taskTypeId": "ASC",
       "docVerification.reference": "ASC",
       "docVerification.verificationClosedAt": "DESC",
       "ifuVerification.taskTypeId": "ASC",
       "ifuVerification.reference": "ASC",
       "ifuVerification.verificationClosedAt": "DESC",
       "extraVerification.taskTypeId": "ASC",
       "extraVerification.reference": "ASC",
       "extraVerification.verificationClosedAt": "DESC",
       "physVerification.taskTypeId": "ASC",
       "physVerification.verificationClosedAt": "DESC",
       "vasVerification.taskTypeId": "ASC",
       "vasVerification.verificationClosedAt": "DESC",
       "countryVerification.taskTypeId": "ASC",
       "countryVerification.verificationClosedAt": "DESC",
       "pilVerification.taskTypeId": "ASC",
       "pilVerification.reference": "ASC",
       "pilVerification.verificationClosedAt": "DESC",
       "arVerification.verificationClosedAt": "DESC"
     })
     .setParameter("docReference", gsDocReference)
     .setParameter("sku", gsSKU)
     .setParameter("variant", gsVariant)
     .setParameter("regClass", gsRegClass)
     .setParameter("businessUnit", gsBuCode)
     .setParameter("legalEntityId", gsLegalEntity)
     .setParameter("physVerification_siteLocation", gsPhysSiteLocationId)
     .setParameter("extraStatus", gsextraStatus)
     .setParameter("arstatus", gsarStatus)
     .setParameter("sterile", gsSterile)
     .setParameter("eu", gsEU)
     .setParameter("jnj", gsJnJ)
     .setParameter("docVerificationTaskType", "EV_DOC")
     .setParameter("ifuVerificationTaskType", "EV_IFU")
     .setParameter("extraVerificationTaskType", "EV_EXTRA_VF")
     .setParameter("physVerificationTaskType", "PV_PHYSICAL")
     .setParameter("vasVerificationTaskType", "PV_LST")
     .setParameter("countryVerificationTaskType", "EV_COUNTRY_CONFIG")
     .setParameter("pilVerificationTaskType", "EV_PIL")
     .setParameter("npi", gsNpi);
 
   //Optional where/andWhere parameters
   const whereParams = getWhereQueryParams(oQuery);
 
   whereParams.forEach((element, index) => {
     index === 0 ? oQuery.where(element) : oQuery.andWhere(element);
   });
 
   const aResults = await oQuery.getRawMany();
 
   let promises = await getDataWithLatestDocStatus(aResults);
 
   return Promise.all(promises).then(function (aResults) {
     console.log(aResults)
 
     if (gsVasType) {
       const filteredData = aResults.map((item) => {
         const productVasTypString = item.product_vasType;
         const productVasTypArr = productVasTypString != null ? productVasTypString.split(',') : [];
         const reqVasTypeArr = gsVasType.split(',');
 
         const intersection = productVasTypArr.filter(element => reqVasTypeArr.includes(element));
         return intersection.length > 0 ? item : null
       }).filter(function (el) {
         return el != null;
       });
 
       return filteredData;
 
     }
 
     return aResults;
   })
 
 }
 
 /*
  * getWhereQueryParams
  * @param {Object} oQuery
  * @returns {String} whereQueryParams
  */
 function getWhereQueryParams(oQuery) {
   let aWhereParams = [];
 
   if (gsSKU) {
     aWhereParams.push("product.sku = :sku");
   }
 
   if (gsVariant) {
     aWhereParams.push("product.variant = :variant");
   }
 
   if (gsRegClass) {
     aWhereParams.push("sku.regulatoryClass = :regClass");
   }
 
   if (gsLegalEntity) {
     aWhereParams.push("legalEntity.eovLMId = :legalEntityId");
   }
 
   if (gsBuCode) {
     aWhereParams.push("product.businessUnit = :businessUnit");
   }
   if (gsPhysSiteLocationId) {
     aWhereParams.push("physVerification.siteLocation = :physVerification_siteLocation");
   }
 
   if (gsarStatus) {
     aWhereParams.push("arVerification.status = :arstatus");
   }
 
   if (gsSterile) {
     aWhereParams.push("sku.isSterile = :sterile");
   }
 
   if (gsEU) {
     aWhereParams.push("legalEntity.isEU = :eu");
   }
 
   if (gsJnJ) {
     aWhereParams.push("legalEntity.isJNJ = :jnj");
   }
 
   if (gsDocReference) {
     aWhereParams.push("doc.docRef = :docReference");
   }
 
   if (gsNpi) {
     aWhereParams.push("product.npi = :npi");
   }
 
   return aWhereParams;
 }
 
 /* getDataWithLatestDocStatus
  *
  * @returns {Array} finalResult - The raw with latest AR Verification Status and Latest DOC verification Status.
 */
 async function getDataWithLatestDocStatus(aResults) {
 
   const finalResult = aResults.map(async function (obj) {
 
     obj.latestVerification = "";
 
     if (obj.product_vasType === null || obj.product_vasType === "") {
       obj.product_vasType = "No VAS"
     }
 
     if (obj.doc_docRef != null) {
       const latestAr = await entities.eu_mdr_auth_rep_task.createQueryBuilder("arVerification")
         .where("arVerification.docReference = :docReference", { docReference: obj.doc_docRef })
         .orderBy({ "arVerification.updatedAt": "DESC" })
         .getOne();
 
       const latestDoc = await entities.eu_mdr_verification_task.createQueryBuilder("docVerification")
         .where("docVerification.reference = :reference", { reference: obj.doc_docRef })
         .andWhere("docVerification.taskTypeId = :taskTypeId", { taskTypeId: "EV_DOC" })
         .orderBy({ "docVerification.updatedAt": "DESC" })
         .getOne();
 
       const latestDocRev = await entities.eu_mdr_doc_master.createQueryBuilder("docMaster")
         .where("docMaster.sku = :sku", { sku: obj.product_sku })
         .orderBy({ "docMaster.updatedAt": "DESC" })
         .getOne();
 
       if (latestAr && latestDoc) {
         if (latestAr.updatedAt > latestDoc.updatedAt) {
           obj.latestVerification = "AR";
           obj.doc_docRef = latestAr.docReference;
           obj.doc_docRev = latestAr.docRevision;
           obj.arVerification_status = latestAr.status;
           obj.arVerification_verificationClosedAt = latestAr.verificationClosedAt;
 
           const latestDocDetails = await entities.eu_mdr_verification_task.createQueryBuilder("docVerification")
             .where({ reference: latestAr.docReference, revision: latestAr.docRevision })
             .orderBy({ "docVerification.updatedAt": "DESC" })
             .getOne();
 
           if (latestDocDetails) {
             obj.docVerification_taskRecordNo = latestDocDetails.taskRecordNo;
             obj.docVerification_strategyId = latestDocDetails.strategyId;
             obj.docVerification_taskTypeId = latestDocDetails.taskTypeId;
             obj.docVerification_status = latestDocDetails.status;
             obj.docVerification_updatedBy = latestDocDetails.updatedBy;
             obj.docVerification_comments = latestDocDetails.comments;
             obj.docVerification_verificationStartedAt = latestDocDetails.verificationStartedAt;
             obj.docVerification_verificationClosedAt = latestDocDetails.verificationClosedAt;
             obj.docVerification_id = latestDocDetails.id;
           } else {
             obj.docVerification_taskRecordNo = null;
             obj.docVerification_strategyId = null;
             obj.docVerification_taskTypeId = null;
             obj.docVerification_status = null;
             obj.docVerification_updatedBy = null;
             obj.docVerification_comments = null;
             obj.docVerification_verificationStartedAt = null;
             obj.docVerification_verificationClosedAt = null;
             obj.docVerification_id = null;
           }
         } else {
           obj.latestVerification = "DOC";
           if (obj.doc_docRev === latestDoc.revision) {
             obj.doc_docRef = latestDoc.reference;
             obj.doc_docRev = latestDoc.revision;
             obj.docVerification_taskRecordNo = latestDoc.taskRecordNo;
             obj.docVerification_strategyId = latestDoc.strategyId;
             obj.docVerification_taskTypeId = latestDoc.taskTypeId;
             obj.docVerification_status = latestDoc.status;
             obj.docVerification_updatedBy = latestDoc.updatedBy;
             obj.docVerification_comments = latestDoc.comments;
             obj.docVerification_verificationStartedAt = latestDoc.verificationStartedAt;
             obj.docVerification_verificationClosedAt = latestDoc.verificationClosedAt;
             obj.docVerification_id = latestDoc.id;
           }
 
           const latestArDetails = await entities.eu_mdr_auth_rep_task.createQueryBuilder("docVerification")
             .where({ docReference: latestDoc.reference, docRevision: obj.doc_docRev })
             .orderBy({ "docVerification.updatedAt": "DESC" })
             .getOne();
 
           if (latestArDetails) {
             obj.arVerification_status = latestArDetails.status;
             obj.arVerification_verificationClosedAt = latestArDetails.verificationClosedAt;
           }
         }
       } else {
         if (latestAr && !latestDoc) {
           obj.latestVerification = "AR";
           if (obj.doc_docRev === latestAr.docRevision) {
             obj.arVerification_status = latestAr.status;
             obj.arVerification_verificationClosedAt = latestAr.verificationClosedAt;
             obj.doc_docRef = latestAr.docReference;
             obj.doc_docRev = latestAr.docRevision;
           } else {
             if (obj.arVerification_status === null) {
               obj.doc_docRev = latestDocRev.docRev;
             } else {
               obj.doc_docRev = obj.doc_docRev;
             }
           }
         } else if (!latestAr && latestDoc) {
           obj.latestVerification = "DOC";
           if (obj.doc_docRev === latestDoc.revision) {
             obj.doc_docRef = latestDoc.reference;
             obj.doc_docRev = latestDoc.revision;
             obj.docVerification_taskRecordNo = latestDoc.taskRecordNo;
             obj.docVerification_strategyId = latestDoc.strategyId;
             obj.docVerification_taskTypeId = latestDoc.taskTypeId;
             obj.docVerification_status = latestDoc.status;
             obj.docVerification_updatedBy = latestDoc.updatedBy;
             obj.docVerification_comments = latestDoc.comments;
             obj.docVerification_verificationStartedAt = latestDoc.verificationStartedAt;
             obj.docVerification_verificationClosedAt = latestDoc.verificationClosedAt;
             obj.docVerification_id = latestDoc.id;
             obj.docVerification_strategyId = latestDoc.strategyId;
           } else {
             if (obj.docVerification_status === null) {
               obj.doc_docRev = latestDocRev.docRev;
             } else {
               obj.doc_docRev = obj.doc_docRev;
             }
           }
         } else {
           obj.doc_docRev = latestDocRev.docRev;
         }
       }
       obj.product_businessCode = obj.bucode_UDIDescription;
       obj.product_class = obj.sku_regulatoryClass;
       return obj;
     } else {
       return obj;
     }
   })
   return finalResult;
 }
 
 