/**
 * Name:        onInit
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: On Init Event
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  20/October/2020
 * CR:          CHG000010656864
 * Description: added logic to show/hide initial columns (based on toggle buttons)
 *  Added custom Context Menu for date columns
 */
/**
 * Changed By:  Donncahdh O'Leary
 * Changed At:  19/October/2021
 * CR:          X
 * Description: added logic to facilitate Products Pending Physical Verification
 * report to run this in dialog
 */
/**
 * Changed By:  Anuradha Gurram
 * Changed At:  03/May/2022
 * CR:          X
 * Description: added logic to facilitate Extra VF Verification report
 */
 callGetBusinessUnit();
 callGetLegalEntity();
 callGetRegulatoryClass();
 callGetPhySiteLocation();
 setVasTypeToComboBox();
 
 //Initial setting of column display (show/hide columns)
 toggleDisplay(butToggleProduct.getPressed(), 'product');
 toggleDisplay(butToggleProduct.getPressed(), 'legalEntity');
 toggleDisplay(butToggleProduct.getPressed(), 'sku');
 toggleDisplay(butToggleProduct.getPressed(), 'bucode');
 toggleDisplay(butToggleDOC.getPressed(), 'docVerification');
 toggleDisplay(butToggleIFU.getPressed(), 'ifuVerification');
 toggleDisplay(butTogglePhysical.getPressed(), 'physVerification');
 toggleDisplay(butToggleLST.getPressed(), 'vasVerification');
 toggleDisplay(butToggleCountry.getPressed(), 'countryVerification');
 toggleDisplay(butTogglePil.getPressed(), 'pilVerification');
 toggleDisplay(butToggleExtraVF.getPressed(), 'extraVerification');
 
 //Custom Column Menu for Dates
 addCustomDateColumnMenu(coltblResultsdocVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultsifuVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultsphysVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultslstVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultscountryVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultsPilVerificationClosedAt);
 addCustomDateColumnMenu(coltblResultsfinalVerificationCompletedDate);
 addCustomDateColumnMenu(coltblResultsextraVerificationClosedAt);
 
 //Logic for pending physical report ato run this in dialog
 if (AppCache.LoadOptions.startParams) {
     pnlSearchParams.setExpanded(false);
     inSearchParamssku.setValue(AppCache.LoadOptions.startParams.sku);
     inSearchParamsvariant.setValue(AppCache.LoadOptions.startParams.variant);
     search();
 }
 