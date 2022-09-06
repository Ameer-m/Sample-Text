/**
 * Name:        FormatterFunctions
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Formatter Functions
 */
/**
 * Changed By:  Siobhán Murray 
 * Changed At:  20/October/2020
 * CR:          CHG000010656864
 * Description:
 *  updated function formatTaskStatus -> Updated NEW text and added logic for INCOMPLETE text
 */
 /**
 * Changed By:  vnavassa
 * Changed At:  28/01/2021
 * CR:          CHG000010665210
 * Description: Changed logic for function formatBooleanText
 */
 
/**
 * Format Boolean value to Yes or No text
 * 
 * @param {Boolean} sKey
 * @returns {String} sText
 */
 function formatBooleanText(sKey) {
    const yesNoText = sKey === true ? txtTransYes.getText() : txtTransNo.getText();
    return sKey === null ? '' : yesNoText;
}

/**
 * Format Verification Task Status text from the Status value
 * 
 * @param {String} sKey
 * @returns {String} sText
 */
 function formatTaskStatus(sStatus){
    var sText = "";
    switch(sStatus){
        case goTaskStatus.HOLD: sText = txtTransStatusInProgress.getText(); break;
        case goTaskStatus.PASS: sText = txtTransStatusPass.getText(); break;
        case goTaskStatus.FAIL: sText = txtTransStatusFail.getText(); break;
        case goTaskStatus.NEW:
        case null: 
        case "": sText = txtTransStatusNotStarted.getText(); break;
        case goTaskStatus.INCOMPLETE: sText = txtTransStatusIncomplete.getText(); break;
        case goTaskStatus.ERROR_DOC_MULTIPLE_LM: sText = txtTransStatusErrorDoCMultipleLM.getText(); break;
        case goTaskStatus.ERROR_DOC_MULTIPLE_VERIFICATIONS: sText = txtTransErrorDoCMultipleVerifications.getText(); break;
        default: sText = sStatus;
    }
    return sText;
}

/**
 * Format Verification Task Status State based on the Status value
 * 
 * @param {String} sKey
 * @returns {sap.ui.core.ValueState} sState
 */
function formatTaskStatusState(sKey){
    var sState = "";
    switch(sKey){
        case goTaskStatus.NEW: sState = sap.ui.core.ValueState.None; break;
        case goTaskStatus.HOLD: sState = sap.ui.core.ValueState.Warning; break;
        case goTaskStatus.PASS: sState = sap.ui.core.ValueState.Success; break;
        case goTaskStatus.FAIL: sState = sap.ui.core.ValueState.Error; break;
        case goTaskStatus.ERROR_DOC_MULTIPLE_LM:
        case goTaskStatus.ERROR_DOC_MULTIPLE_VERIFICATIONS: sState = sap.ui.core.ValueState.Error; break;
        default: sState = sap.ui.core.ValueState.None;
    }
    return sState;
}


/**
 * Format a date
 * 
 * @param {Number} date
 * @returns {String} formattedDate
 */
function formatDate(date) {
    if (!date) { 
        return "";
    }
    
    var dateNumberOrString = Number(date) || date;
    
    jQuery.sap.require("sap.ui.core.format.DateFormat");
    var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance();
    var formattedDate = oDateFormat.format(new Date(dateNumberOrString));
    
    return formattedDate;
}


/**
 * Format a date
 * For Verification Result
 * @param {Number} date
 * @returns {String} formattedDate YYYY-MM-DD hh:mm:ss
 */
function generateDatabaseDateTime(date) {
  let dateNumberOrString = date;
  const p = new Intl.DateTimeFormat('en', {
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hour12: false
  }).formatToParts(dateNumberOrString).reduce((acc, part) => {
    acc[part.type] = part.value;
      return acc;
  }, {});

    let chgDate=`${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
    let flDate;
    if (dateNumberOrString = (date === "1970-01-01 05:30:00") ? "" : date) {
        flDate=chgDate;
    } else {
        flDate="";
    }


  return flDate;
}

