/**
 * Name:        GlobalVariables
 * Created By:  vnavassa, SMurra35
 * CR:          CHG000010665210
 */

//Modes which can be used to prepare the Screen - see function prepareScreenFields
const DisplayMode = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  DISPLAY: "DISPLAY"
};

//Authorisations used in this app - defined in function setAuthorisations onInt
const goAuthorisation = {};

const radioButtonIndex = {
  TRUE: 0,
  FALSE: 1,
  BLANK: 2
};

const radioButtonValue = {
  0: "TRUE",
  1: "FALSE",
  2: "BLANK"
};

const pilTypes = {
  onlyPaper: "Only Paper PIL",
  onlyDigital: "Only Digital PIL",
  digitalAndPaper: "Digital and Paper PIL",
  no: "No PIL"
};

const ifuTypes = {
  onlyPaper: "Only Paper IFU",
  onlyDigital: "Only Digital IFU",
  digitalAndPaper: "Digital and Paper IFU",
  no: "No IFU"
};

const rightFirstTimeOptions = {
  blank: "",
  rft: "RFT",
  expectedHold: "Expected Hold",
  unexpectedHold: "Unexpected Hold",
  both: "Both Expected and Unexpected Hold"
};

//VasType Items = It should be displayed as prepopulated list. 
const vasType = [
  { "vasType": "Outserting" },
  { "vasType": "Relabeling" },
  { "vasType": "U-code" },
  { "vasType": "Bid&Tender" },
  { "vasType": "SwissRep" }
];

//This variable is used to know whether to Show Vas Type Warning Dialog or Not.
const vasWarningVisible = {
  isVisible: true,
  hasInheritedVasType: false,
  activeElem: "",
  isItemDelated: false,
  itemDomTxt: "",
  fromArrow: false,
  tempDom: "",
  isBackSpace: false,
  selectedItemDom: "",
}

//This variable is use to store the keyboard button getting pressed. 
var keyPressTracker = [];

let isDisplayModeEdit = false;
