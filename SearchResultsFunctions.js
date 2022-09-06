/**
 * Name:        SearchParamsFunctions
 * Created By:  Siobhán Murray
 * Created At:  23/September/2020
 * CR:          CHG000010639889
 * Description: Search Parameters Functions
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  20/October/2020
 * CR:          CHG000010656864
 * Description: added function onExpandpnlSearchParams.
 *  Added function setRegulatoryClassDropdown.
 */

/**
 * Populates the Legal Entity Dropdown from mdlLegalEntity
 */
 function setLegalEntityDropdown() {
    let aLegalEntity = modelmdlLegalEntity.getData() || [];

    inSearchParamslegalEntity.destroyItems();
    inSearchParamslegalEntity.addItem(new sap.ui.core.Item());
    aLegalEntity.forEach(function (data, i) {
        inSearchParamslegalEntity.addItem(
            new sap.ui.core.Item({
                key: data.eovLMId,
                text: data.name
            })
        );
    });

}

/**
 * Populate Dropdown: Business Unit inSearchParamsbusinessUnit
 */
function populateDropdownBusinessUnit() {
    let aBusinessUnits = modelmdlBusinessUnit.getData() || [];

    inSearchParamsbusinessUnit.destroyItems();
    inSearchParamsbusinessUnit.addItem(new sap.ui.core.Item());
    aBusinessUnits.forEach(function (data, i) {
        inSearchParamsbusinessUnit.addItem(
            new sap.ui.core.ListItem({
                key: data.code,
                text: data.UDIDescription,
                additionalText: data.code
            })
        );
    });
}

/**
 * Populate Dropdown: Physical Site Location inSearchParamsphysSiteLocation
 */
function populateDropdownPhySiteLocation() {
    let aPhySiteLocation = modelmdlPhysicalSiteLocation.getData() || [];
    inSearchParamsphysSiteLocation.destroyItems();
    inSearchParamsphysSiteLocation.addItem(new sap.ui.core.Item());
    aPhySiteLocation.forEach(function (data, i) {
        inSearchParamsphysSiteLocation.addItem(
            new sap.ui.core.ListItem({
                key: data.id,
                text: data.siteLocationName,
                additionalText: data.code
            })
        );
    });
}
/**
 * Populates the Regulatory Class Dropdown from mdlRegulatoryClass
 */
function setRegulatoryClassDropdown() {
    let aRegClass = modelmdlRegulatoryClass.getData() || [];

    inSearchParamsregClass.destroyItems();
    inSearchParamsregClass.addItem(new sap.ui.core.Item());
    aRegClass.forEach(function (data, i) {
        inSearchParamsregClass.addItem(
            new sap.ui.core.ListItem({
                key: data.type,
                text: data.description,
                additionalText: data.type
            })
        );
    });

}

/**
 * Clear Search Parameters of their values
 */
function clearSearch() {
    modelpnlSearchParams.setData({});
    lblfrmDetailVasTypeComboBox.clearSelection();
}

/**
 * When the Search Panel is opened or closed
 * 
 * @param {Object} oEvent
 */
function onExpandpnlSearchParams(oEvent) {
    const bExpand = oEvent.getParameter("expand");
    butClearSearchFields.setVisible(bExpand);
    butSearch.setVisible(bExpand);
}

/**
 * onInputChange
 * 
 * @param {Object} oEvent
 * @param {String} searchFieldType
 */
function onInputChange(oEvent, searchFieldType) {
    const filterValue = oEvent.getSource().getValue();
    const newValue = oEvent.getParameter("newValue");
    switch (searchFieldType) {
        case goReferenceType.DOC:
            getAllDocs(filterValue);
            inSearchParamsdocReference.setValue(newValue)
            break;
        case goReferenceType.IFU:
            getAllIfus(filterValue);
            inSearchParamsifuReference.setValue(newValue)
            break;
        case goReferenceType.PIL:
            getAllPils(filterValue);
            inSearchParamsPilReference.setValue(newValue)
            break;
        case goReferenceType.SKU:
            getAllProducts(filterValue);
            inSearchParamssku.setValue(newValue)
            break;
        case goReferenceType.Extra:
            getAllExtraVF(filterValue);
            inSearchParamsextraReference.setValue(newValue)
            break;
    }
}

/**
 * onSuggest - suggest items containing suggested character
 * 
 * @param {Object} oEvent
 * @param {String} bindingPath
 */
function onSuggest(oEvent, bindingPath) {
    const aFilters = [];
    const sTerm = oEvent.getParameter("suggestValue");
    if (sTerm) {
        aFilters.push(new sap.ui.model.Filter(bindingPath, sap.ui.model.FilterOperator.Contains, sTerm));
    }
    oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
    oEvent.getSource().setFilterSuggests(false);
}

/**
 * Set Pre Defined VasType List to the MultiComboBox.
*/
function setVasTypeToComboBox() {
    modellblfrmDetailVasTypeComboBox.setData(vasType);
}