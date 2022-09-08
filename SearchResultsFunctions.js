/**
 * Name:        API
 * Created By:  vnavassa, SMurra35
 * CR:          CHG000010665210
 */
/**
 * Changed By:  Siobhán Murray
 * Changed At:  20/January/2021
 * CR:          
 * Description: Added APIs validateProduct and saveProduct
 */
/**
 * Changed By:  Eva Finn / Siobhán Murray
 * Changed At:  15/February/2021
 * CR:          
 * Description: Allow WET, isSterile and Implantable to save Blank value in callSaveProduct and callValidateProduct.
 *  Added Delete functionality
 */

/**
 * Call API getLegalManufacture
 */
 function callGetLegalManufacture() {
  let oOrder = {
      "name": "ASC"
  };

  let options = {
      parameters: {
          "order": JSON.stringify(oOrder)
      }
  };
  apigetLegalManufacture(options);
}

/**
* On Success API getLegalManufacture
*/
function onSuccessGetLegalManufacture() {
  oApp.setBusy(false);
  populateDropdownLegalManufacture();
}

/**
* On Error getLegalManufacture
* 
* @param {Object} xhr
*/
function onErrorGetLegalManufacture(xhr) {
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
* Call API getRegulatoryClass
*/
function callGetRegulatoryClass() {
  let oOrder = {
      "description": "ASC"
  };

  let options = {
      parameters: {
          "order": JSON.stringify(oOrder)
      }
  };
  apigetRegulatoryClass(options);
}

/**
* On Success API getRegulatoryClass
*/
function onSuccessGetRegulatoryClass() {
  oApp.setBusy(false);
  populateDropdownRegulatoryClass();
}

/**
* On Error getRegulatoryClass
* 
* @param {Object} xhr
*/
function onErrorGetRegulatoryClass(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* Call API getProducts
* 
* @param {Object} oOrder
* @param {String} sku
*/
function callGetProducts(oOrder, sku) {
  const options = {
      parameters: {
          "where": JSON.stringify({
              "sku": encodeURIComponent(`Like(%${sku}%)`)
          }),
          "take": "100",
          "order": JSON.stringify(oOrder)
      }

  };
  apigetProducts(options);
}

/**
* On Success API getProducts
*/
function onSuccessGetProducts() {
  setMasterTitle();
  oApp.setBusy(false);
  if (AppCache.LoadOptions.dialogShow) {
      const searchedDataArr = oList.getModel().oData;
      const selectedObj = AppCache.LoadOptions.startParams;
      const selectedItemObj = searchedDataArr.filter((item) => item.sku === selectedObj.sku && item.variant === selectedObj.variant);
      listItemPressed(selectedItemObj[0]);
      var filteredDataModel = new sap.ui.model.json.JSONModel(selectedItemObj);
      oList.setModel(filteredDataModel);
  }
}

/**
* On Error API getProducts
* 
* @param {Object} xhr
*/
function onErrorGetProducts(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

async function getSku(sku) {

  const options = {
      parameters: {
          "where": JSON.stringify({
              "sku": sku,
          })
      }

  };

  const result = await apigetSku(options);
  return result[0];
}

/**
* Call API getProductDetails
* 
* @param {String} sSKU
* @param {String} sVariant
*/
function callGetProductDetails(sSKU, sVariant) {
  const options = {
      parameters: {
          "where": JSON.stringify({
              "sku": sSKU,
              "variant": sVariant
          })
      }

  };
  apigetProductDetails(options);
}

/**
* On Success API getProductDetails
* 
* @param {Object} xhr
*/
async function onSuccessGetProductDetails(xhr) {

  const product = xhr.responseJSON[0];
  const combinedVariantSku = await getCombinedSkuVariant(product)

  if (!combinedVariantSku.sku_sku) {
      sap.m.MessageToast.show('SKU Not found in the system, please add the sku information!');
  }

  modeloPageDetail.setData(combinedVariantSku);
  oApp.setBusy(false);
}

/**
* On Error API getProductDetails
* 
* @param {Object} xhr
*/
function onErrorGetProductDetails(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* Calls the API to Save Product data
* 
*/
function callSaveProduct(oProduct) {

  oApp.setBusy(true);

  var optionsProduct = {
      data: {
          "data": [getCsvProductFormat(oProduct)]
      }
  };


  apisaveProduct(optionsProduct);

}

/**
* On Success API saveProduct
*/
function onSuccessSaveProduct() {
  oApp.setBusy(false);
  saveKpiReporting();

  changeDisplayMode(DisplayMode.DISPLAY);
  refreshListSettings(oListSetting);

  const updatedProduct = modeloPageDetail.getData();

  callGetProductDetails(updatedProduct.sku, updatedProduct.variant);

  sap.m.MessageToast.show(txtSaved.getText());
}

/**
* On Error API saveProduct
* 
* @param {Object} xhr
*/
function onErrorSaveProduct(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* Calls the API to Validate the Product
* 
* @param {Array} aProducts
*/
function callValidateProduct(aProducts) {
  oApp.setBusy(true);
  const options = {
      data: aProducts.map(product => getCsvProductFormat(product))
  };

  apivalidateProduct(options);
}


/**
* On Success API validateProduct
* 
* @param {Object} xhr
*/
function onSuccessValidateProduct(xhr) {
  oApp.setBusy(false);

  const aValidationResult = xhr.responseJSON.data;

  //Collect any messages
  let aMessages = [];
  aValidationResult.forEach(result => {
      aMessages = aMessages.concat(buildProductErrors(result));
  });

  const hasErrors = aMessages.some(msg => msg.status === sap.ui.core.MessageType.Error);
  const hasWarnings = aMessages.some(msg => msg.status === sap.ui.core.MessageType.Warning);

  if (aMessages.length) {
      //Show Messages
      showMessages(aMessages);
  }

  if (!hasErrors) {
      if (hasWarnings) {
          setTimeout(function () {
              oPopoverSaveWithWarnings.openBy(butSave);
          }, 501);
      } else {
          callSaveProduct(modeloPageDetail.getData());
      }
  }
}

/**
* On Error API validateProduct
* 
* @param {Object} xhr
*/
function onErrorValidateProduct(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* Calls the API to Validate Delete Products
* 
* @param {Array} aProductsToDelete
*/
function callValidateDeleteProducts(aProductsToDelete) {
  if (!aProductsToDelete.length) {
      sap.m.MessageToast.show(txtNothingToDelete.getText());
      return;
  }

  oApp.setBusy(true);

  const options = {
      data: aProductsToDelete
  };

  modeldiaConfirmDelete.setData(aProductsToDelete); //Save for confim dialog

  apivalidateDeleteProducts(options);
}


/**
* On Success API validateDeleteProducts
* 
* @param {Object} xhr
*/
function onSuccessValidateDeleteProducts(xhr) {
  oApp.setBusy(false);

  const aResponse = xhr.responseJSON;
  const aMessages = buildProductDeleteErrors(aResponse);

  //Prepare Confirm Delete Dialog
  modeldeleteValidationList.setData(aMessages);
  const hasErrors = aMessages.some(msg => msg.type === sap.ui.core.MessageType.Error);

  const state = hasErrors ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.Warning;
  diaConfirmDelete.setState(state);
  diaConfirmDelete.setTitle(`${txtConfirmDeleteDialogTitle.getText()}(${modeldiaConfirmDelete.getData().length})`);
  butConfirmDelete.setVisible(!hasErrors);
  txtDeleteWarning.setVisible(!hasErrors);
  butConfirmDelete.setEnabled(false);

  diaConfirmDelete.open();
}

/**
* On Error API validateDeleteProducts
* 
* @param {Object} xhr
*/
function onErrorValidateDeleteProducts(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* Calls the API to Delete Products
* 
* @param {Array} aProductsToDelete
*/
function callDeleteProducts(aProductsToDelete) {
  oApp.setBusy(true);
  var options = {
      data: aProductsToDelete
  };

  apideleteProducts(options);
}


/**
* On Success API deleteProducts
*/
function onSuccessDeleteProducts() {
  oApp.setBusy(false);

  oList.removeSelections(true);
  resetDetailPageData();
  oApp.backDetailToPage(oPageStart);
  butSync.firePress();

  sap.m.MessageToast.show(txtDeleteSuccessful.getText());
}

/**
* On Error API deleteProducts
* 
* @param {Object} xhr
*/
function onErrorDeleteProducts(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}

/**
* callSaveKpiReporting
* 
* @param {String} sku
* @param {String} variant
* @param {String} rightFirstTime
* @param {String} dateExpected
* @param {String} dateUnexpected
* @param {String} comments
*/
function callSaveKpiReporting(sku, variant, rightFirstTime, dateExpected, dateUnexpected, comments) {
  oApp.setBusy(true);
  const options = {
      data: {
          "data": {
              "sku": sku,
              "variant": variant,
              "rightFirstTime": rightFirstTime,
              "dateExpected": dateExpected,
              "dateUnexpected": dateUnexpected,
              "comments": comments
          }
      }
  };

  apisaveKpiReporting(options);
}

/**
* onSuccessSaveKpiReporting
*/
async function onSuccessSaveKpiReporting() {
  oApp.setBusy(false);
  const product = modeloPageDetail.getData();
  await callGetKpiReporting(product.sku, product.variant)

  changeDisplayMode(DisplayMode.DISPLAY);
  refreshListSettings(oListSetting);

  sap.m.MessageToast.show(txtSaved.getText());
}

/**
* onErrorSaveKpiReporting
* 
* @param {Object} xhr
*/
function onErrorSaveKpiReporting(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}


/**
* callGetKpiReporting
* 
* @param {String} sku
* @param {String} variant
*/
async function callGetKpiReporting(sku, variant) {
  oApp.setBusy(true);
  const options = {
      parameters: {
          "sku": sku,
          "variant": variant

      }
  };

  await apigetKpiReporting(options);
}

/**
* onSuccessGetKpiReporting
*/
function onSuccessGetKpiReporting(xhr) {
  oApp.setBusy(false);
  const response = xhr.responseJSON[0];
  response ? modelfrmKpiMain.setData(response) : modelfrmKpiMain.setData({});
}

/**
* onErrorGetKpiReporting
* 
* @param {Object} xhr
*/
function onErrorGetKpiReporting(xhr) {
  oApp.setBusy(false);
  handleServerError(xhr);
}