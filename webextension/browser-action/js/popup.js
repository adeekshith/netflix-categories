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
    /**
     * Initial Setup
     */
    if (!thisUserConfig.isInitialSetupCompleted()) {
        thisUserConfig.assignUniqueIDsToAllSearchEngines();
        thisUserConfig.setInitialSetupCompleted(true);

        chrome.storage.local.set({
            user_config: JSON.stringify(thisUserConfig.getPreferences())
        }, function () {
        });
    }

    /**
     * Search Input
     */
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

    /**
     * Search Engine Listing
     */

    function generateSearchEnginePinnedListNode(searchEngineItem) {
        let pinnedSearchNodeHtml = `
            <a class="list-group-item clearfix" href="${searchEngineItem.api.replace(/\%s/,encodeURIComponent(thisUserConfig.getLastSearchInput()))}">
                ${searchEngineItem.name}
                <span class="pull-right">
                    <button class="btn btn-xs btn-primary btn-pin-this-item" item-pinned-toggle="${searchEngineItem.id}"><span class="glyphicon glyphicon-pushpin"></span></button>
                </span>
            </a>
            `;

        return pinnedSearchNodeHtml;
    }

    let pinnedSearchListingHTML = thisUserConfig.getSearchEnginesPinned().reduce((previousHtml, searchEngineItem) => {
        return previousHtml+generateSearchEnginePinnedListNode(searchEngineItem);
    }, "");

    document.getElementById("pinned-search-engines-list").innerHTML = pinnedSearchListingHTML;
}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupOptions);
