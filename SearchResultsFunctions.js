/**
 * Name:        APIFunctions
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: API Functions to call the API and handle success/error events
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  09/November/2020
 * CR:          CHG000010656864
 * Description: Added getRegulatoryClass API
 */

/**
 * Calls API getLegalEntity
 */
 function callGetLegalEntity() {
    let oOrder = {
        "name": "ASC"
    };

    let options = {
        parameters: {
            "order": JSON.stringify(oOrder)
        }
    };

    oApp.setBusy(true);
    apigetLegalEntity(options);
}

/**
 * On Success API getLegalEntity
 */
function onSuccessGetLegalEntity() {
    oApp.setBusy(false);
    setLegalEntityDropdown();
}

/**
 * On Error API getLegalEntity
 * 
 * @param {Object} xhr
 */
function onErrorGetLegalEntity(xhr) {
    oApp.setBusy(false);
    handleServerError(xhr);
}

/**
 * Call API getBusinessUnit
 */
function callGetBusinessUnit() {
    let oOrder = {
        "UDIDescription": "ASC"
    };

    let options = {
        parameters: {
            "order": JSON.stringify(oOrder)
        }
    };
    apigetBusinessUnit(options);
}

/**
 * On Success API getBusinessUnit
 */
function onSuccessGetBusinessUnit() {
    oApp.setBusy(false);
    populateDropdownBusinessUnit();
}

/**
 * On Error getBusinessUnit
 * 
 * @param {Object} xhr
 */
function onErrorGetBusinessUnit(xhr) {
    oApp.setBusy(false);
    handleServerError(xhr);
}

/**
 * Call API PhysicalSiteLocation
 */
function callGetPhySiteLocation() {
    let oOrder = {
        "siteLocationName": "ASC"
    };

    let options = {
        parameters: {
            "order": JSON.stringify(oOrder)
        }
    };
    apigetPhysicalSiteLocation(options);
}

/**
 * On Success API getBusinessUnit
 */
function onSuccessGetPhySiteLocation() {
    oApp.setBusy(false);
    populateDropdownPhySiteLocation();
}

/**
 * On Error getBusinessUnit
 * 
 * @param {Object} xhr
 */
function onErrorGetPhySiteLocation(xhr) {
    oApp.setBusy(false);
    handleServerError(xhr);
}

/**
 * Calls API getRegulatoryClass
 */
function callGetRegulatoryClass() {
    let oOrder = {
        "type": "ASC"
    };

    let options = {
        parameters: {
            "order": JSON.stringify(oOrder)
        }
    };

    oApp.setBusy(true);
    apigetRegulatoryClass(options);
}

/**
 * On Success API getRegulatoryClass
 */
function onSuccessGetRegulatoryClass() {
    oApp.setBusy(false);
    setRegulatoryClassDropdown();
}

/**
 * On Error API getRegulatoryClass
 * 
 * @param {Object} xhr
 */
function onErrorGetRegulatoryClass(xhr) {
    oApp.setBusy(false);
    handleServerError(xhr);
}

/**
 * Calls API searchVerifications
 * 
 * @param {Object} oSearchParams
 */
function callSearchVerifications(oSearchParams) {

    if ("vasType" in oSearchParams) {
        oSearchParams.vasType = oSearchParams.vasType.replace('&', '%26')
    }

    if ("docReference" in oSearchParams) {
        oSearchParams.docReference = oSearchParams.docReference.replace('#', '%23')
    }

    if ("sku" in oSearchParams) {
        oSearchParams.sku = oSearchParams.sku.replace('#', '%23')
    }

    var options = {
        parameters: oSearchParams
    };

    tblResults.setBusy(true);
    apisearchVerifications(options);
}

/**
 * On Success API searchVerifications
 */
function onSuccessSearchVerifications() {
    modifyResultsForDisplay();
    tblResults.setBusy(false);
    refreshRecordsCount();

    //Show Message Toast
    let recordCount = modeltblResults.getData().length;
    let sMsg = (recordCount) ? recordCount + " " + txtTransRecordsFound.getText() : txtTransNoRecordsFound.getText();
    sap.m.MessageToast.show(sMsg);

}

/**
 * On Error API searchVerifications
 * 
 * @param {Object} xhr
 */
function onErrorSearchVerifications(xhr) {
    tblResults.setBusy(false);
    handleServerError(xhr);

}

/**
 * Call API getAllDocs or all docs with a given reference
 * @param {String} reference
 */
async function getAllDocs(reference) {
    const options = {
        parameters: {
            "docRef": reference
        }
    };
    options.parameters.docRef = options.parameters.docRef.replace('#', '%23');
    try {
        await apigetDocList(options);
    } catch (err) {
        handleServerError(err);
    }
}

/**
 * Call API getAllIfus or all ifus with a given reference
 * @param {String} reference
 */
async function getAllIfus(reference) {
    const options = {
        parameters: {
            "ifuRef": reference
        }
    };

    try {
        await apigetIfuList(options);
    } catch (err) {
        handleServerError(err);
    }
}

/**
 * Call API getAllPils or all pils with a given reference
 * @param {String} reference
 */
async function getAllPils(reference) {
    const options = {
        parameters: {
            "reference": reference
        }
    };

    try {
        await apigetPilList(options);
    } catch (err) {
        handleServerError(err);
    }
}

/**
 * Call API getAllExtraVF or all extravf with a given reference
 * @param {String} reference
 */
async function getAllExtraVF(reference) {
    const options = {
        parameters: {
            "extravfRef": reference
        }
    };

    try {
        await apigetExtraVFList(options);
    } catch (err) {
        handleServerError(err);
    }
}

/**
 * getProduct
 * @param {String} sku
 */
async function getAllProducts(sku) {
    const options = {
        parameters: {
            "sku": sku
        }
    };

    try {
        await apigetProductList(options);
    } catch (err) {
        handleServerError(err);
    }
}

/**
 * addSuggestionsToField
 * 
 * @param {Object} xhr
 * @param {String} searchFieldType
 */
function addSuggestionsToField(xhr, searchFieldType) {
    const searchFieldSuggestion = {
        "suggestion": xhr.responseJSON
    };
    const searchParamsModelWithSuggestions = { ...modelpnlSearchParams.getData(), ...searchFieldSuggestion }
    modelpnlSearchParams.setData(searchParamsModelWithSuggestions);
    const suggestionItem = new sap.m.SuggestionItem("suggestionItem", {
        text: searchFieldType
    });

    switch (searchFieldType) {
        case goReferenceType.DOC:
            inSearchParamsdocReference.bindAggregation("suggestionItems", "/suggestion", suggestionItem);
            toggleVal = true;
            break;
        case goReferenceType.IFU:
            inSearchParamsifuReference.bindAggregation("suggestionItems", "/suggestion", suggestionItem);
            toggleVal = true;
            break;
        case goReferenceType.PIL:
            inSearchParamsPilReference.bindAggregation("suggestionItems", "/suggestion", suggestionItem);
            toggleVal = true;
            break;
        case goReferenceType.SKU:
            inSearchParamssku.bindAggregation("suggestionItems", "/suggestion", suggestionItem);
            toggleVal = true;
            break;
        case goReferenceType.Extra:
            inSearchParamsextraReference.bindAggregation("suggestionItems", "/suggestion", suggestionItem);
            toggleVal = true;
            break;
    }
}
