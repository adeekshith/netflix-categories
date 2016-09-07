/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

function getDefPrefsRestorePopupOptions () {
    textFileLoad(chrome.extension.getURL("../../data/data.json")).then(function(response) {
        chrome.storage.local.get({
            user_config: response
        }, function (items) {
            restorePopupOptions(
                new UserConfig(JSON.parse(items.user_config))
            );
        });
    }, function(Error) {
        console.log(Error);
    });
}


function restorePopupOptions (thisUserConfig) {
    let searchInputID = "main-search-keyword-input";
    function onSearchInputChanged() {
        thisUserConfig.setLastSearchInput(document.getElementById(searchInputID).value);

        chrome.storage.local.set({
            user_config: JSON.stringify(thisUserConfig.getPreferences())
        }, function () {
            // Callback function executed after options are saved
        });
    }

    document.getElementById(searchInputID).value = thisUserConfig.getLastSearchInput();
    document.getElementById(searchInputID).addEventListener("input", onSearchInputChanged);

}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupOptions);
