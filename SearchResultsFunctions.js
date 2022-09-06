/**
 * Name:        UtilityFunctions
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Utility Functions
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  11/November/2020
 * CR:          CHG000010656864
 * Description: added function downloadResults
 */

/**
 * Get the users Language
 * 
 * @returns {String} sLanguage - The users language if run through launchpad; otherwise null
 */
 function getLanguage() {
    var sLanguage;
    if (sap.n) {
        sLanguage = AppCache.userInfo.language;
    }
    return sLanguage;
}

/**
 * Handle Errors returned from the Server
 * 
 * @param {Object} xhr
 */
function handleServerError(xhr) {
    var sMsgText = "";
    var sStatusCode = xhr.status;
    switch (sStatusCode) {
        case 401: //Not authorised
            sMsgText = txtTransServerMsg401.getText();
            reloadPage();
            break;
        case 500:
            sMsgText = txtTransServerMsg500.getText();
            break;
        case 502:
            sMsgText = txtTransServerMsg502.getText();
            break;
        case 503:
            sMsgText = txtTransServerMsg503.getText();
            break;
        case 504:
            sMsgText = txtTransServerMsg504.getText();
            break;
        default:
            sMsgText = txtTransServerMsgError.getText();
    }
    if (sMsgText) {
        sap.m.MessageToast.show(sMsgText);
    }

}


/**
 * Reload the Page 
 */
function reloadPage() {
    setTimeout(function () {
        location.reload();
    }, 3000);
}


/**
 * Add a Custom Column Menu for Dates
 * - Sort Ascending
 * - Sort Descending
 * - Filter with Date Picker
 * 
 * @param {Object} oColumn - the column object to add the menu to
 */
function addCustomDateColumnMenu(oColumn) {
    let oMenu = new sap.ui.unified.Menu();

    //Sort Ascending
    let oMenuItemSortAsc = new sap.ui.unified.MenuItem({
        text: txtTransSortAscending.getText(),
        icon: "sap-icon://sort-ascending",
        select: function (oEvent) {
            oColumn.sort(false, oEvent.getParameter("ctrlKey") === true);
        }
    });
    oMenu.addItem(oMenuItemSortAsc);

    //Sort Descending
    let oMenuItemSortDesc = new sap.ui.unified.MenuItem({
        text: txtTransSortDescending.getText(),
        icon: "sap-icon://sort-descending",
        select: function (oEvent) {
            oColumn.sort(true, oEvent.getParameter("ctrlKey") === true);
        }
    });
    oMenu.addItem(oMenuItemSortDesc);

    //Filter Date
    let oMenuItemFilter = new sap.ui.unified.MenuItem({
        text: txtTransFilter.getText(),
        icon: "sap-icon://filter",
        select: function (oEvent) {
            goColumnForDateFilter = oColumn;
            diaFilterDate.openBy(oColumn);
        }
    });
    oMenu.addItem(oMenuItemFilter);

    oMenu.setPageSize(oMenu.getItems().length);
    oColumn.setMenu(oMenu);
}


/**
 * Download results
 */
function downloadResults() {
    const aTableDataArr = modeltblResults.getData();

    // get the visible indexes which is showing in table with and without filter
    var bindingRow = tblResults.getBinding().aIndices;
    let oNewArrVal = [];
    bindingRow.forEach(function (oCol, i) {
        oNewArrVal.push(aTableDataArr[oCol]);
    });
    const aTableData = oNewArrVal;

    if (aTableData.length) {
        const aFields = tblResults.getColumns().filter(col => col.getVisible()).map(
            visibleCol => {
                const oTemplate = visibleCol.getTemplate();
                return oTemplate.getBindingPath("text") || oTemplate.getBindingPath("number");
            });

        const aDownloadData = aTableData.map(row => {
            let oNewObj = {};
            let oNewObjList = {};
            aFields.forEach(field => oNewObj[field] = row[field]);

            for (var k in oNewObj) {
                if (k.includes('finalVerificationCompletedDateString') || k.includes('_verificationClosedAtString') || k.includes('_CompletedDateString')) {
                    const dateVal = oNewObj[k] === "" ? "" : verificatiocCSV(oNewObj[k]);
                    oNewObjList[k] = dateVal;

                } else if (k.includes('_trackwiseNo') || k.includes('_trackwiseNoString')) {
                    let trackArr = oNewObj[k];
                    if (trackArr.length === 0) {
                        oNewObjList[k] = "";
                    } else {
                        oNewObjList[k] = oNewObj[k].toString();
                    }
                
                } else if (k.includes('_statusString') || k.includes('finalVerificationStatusString')) {
                    const statusError = (oNewObj[k] === "Error – Multiple Legal Manufactures linked to same DoC") ? "Error-Multiple Legal Manufactures linked to same DoC" : oNewObj[k];
                    oNewObjList[k] = statusError;
                } else {
                    oNewObjList[k] = oNewObj[k]; 
                }
            }

            oNewObjList.product_vasType = row.product_vasType.replaceAll(',', ' | ');

            return oNewObjList;
        });

        downloadFile(getCSV(aDownloadData), `${Date.now()}.csv`);
    }
}

/**
 * changeWordWithIntialCaps : This function will accept the string and convert first character to UpperCase.
 * @param {Object} xhr
 * return String
 */
function changeWordWithIntialCaps(text) {
    if (typeof text === "undefined" || text === null || text === "") { return; }
    const txtString = text.toString()
    return txtString.charAt(0).toUpperCase() + txtString.slice(1);
}