/**
 * Name:        DialogEventsDiaFilterDate
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010656864
 * Description: Dialog function for diaFilterDate
 */

/**
 * Before opening the dialog diaFilterDate
 */
 function beforeOpenDiaFilterDate(){
    let sFilterValue = goColumnForDateFilter.getFilterValue();
    let aLowHigh = sFilterValue.split("...");

    let low = aLowHigh[0] ? infrmFilterDateFrom._getFormatterInstance().format(new Date(Number(aLowHigh[0]))) : '';
    let high = aLowHigh[1] ? infrmFilterDateTo._getFormatterInstance().format(new Date(Number(aLowHigh[1]))) : '';

    infrmFilterDateFrom.setValue(low);
    infrmFilterDateTo.setValue(high);
}


/**
 * After closing the dialog diaFilterDate()
 */
function afterCloseDiaFilterDate(){
    goColumnForDateFilter = {};
}