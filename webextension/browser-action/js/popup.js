/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

function getDefPrefsRestorePopupOptions () {
    textFileLoad(chrome.extension.getURL("data/user-preferences-default.json")).then(function(response) {
        // The first runs when the promise resolves, with the request.reponse
        // specified within the resolve() method.
        restorePopupOptions(response);
        // The second runs when the promise
        // is rejected, and logs the Error specified with the reject() method.
    }, function(Error) {
        console.log(Error);
    });
}


function restorePopupOptions (userPrefDefaultJsonStr) {
    // Read from saved preferences and restore options.
    //$('#toggle-enable-dov').bootstrapToggle('off');
    chrome.storage.local.get({
        user_config: userPrefDefaultJsonStr
    }, function (items) {
        let thisUserPreferences = JSON.parse(items.user_config);
        let thisUserConfig = new UserConfig(thisUserPreferences);
        //var thisUserIsDovIconEnabled = thisUserConfig.isIconBesideDocLinksEnabled();
    });
}

// document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupOptions);
