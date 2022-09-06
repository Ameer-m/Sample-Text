/**
 * Name:        GlobalVariables
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Global Variables
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  20/October/2020
 * CR:          CHG000010656864
 * Description: Added INCOMPLETE status I
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  12/August/2021
 * CR:          
 * Description: Added ERROR_DOC_MULTIPLE_LM and ERROR_DOC_MULTIPLE_VERIFICATIONS statuses
 */

 
 // goTaskStatus: Possible statuses of a Verification Task
 const goTaskStatus = {
    NEW: "N",
    HOLD: "H",
    PASS: "P",
    FAIL: "F",
    INCOMPLETE: "I",
    ERROR_DOC_MULTIPLE_LM: "ERROR_DOC_MULTIPLE_LM",
    ERROR_DOC_MULTIPLE_VERIFICATIONS: "ERROR_DOC_MULTIPLE_VERIFICATIONS"
};


var goColumnForDateFilter = {};

const goReferenceType = {
    DOC: "{docRef}",
    IFU: "{ifuRef}",
    Extra: "{extravfRef}",
    PIL: "{reference}",
    SKU: "{product_sku}"
}

//VasType Items = It should be displayed as prepopulated list. 
const vasType = [
  { "vasType": "Outserting" },
  { "vasType": "Relabeling" },
  { "vasType": "U-code" },
  { "vasType": "Bid&Tender" },
  { "vasType": "SwissRep" },
  { "vasType": "No VAS" }
];