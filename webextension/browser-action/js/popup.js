/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

let popupEventListenerAddedFlag = false;

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
    function processPinnedSearchListingButtonClick(thisEvent) {
        if (thisEvent.target !== thisEvent.currentTarget) {
            let searchButtonID = thisEvent.target.id;
            if (searchButtonID !== null && searchButtonID.startsWith("featured-search-item-open-in-tab-")){
                let searchUrl = thisUserConfig.getSearchEngineById(
                    thisEvent.target.getAttribute("search-id")
                ).api.replace(/\%s/,encodeURIComponent(thisUserConfig.getLastSearchInput()));
                chrome.tabs.create({
                    url: searchUrl
                });
            } else if (thisEvent.target.classList.contains("btn-pin-this-item")) {
                let thisSearchID = thisEvent.target.getAttribute("search-id");
                thisUserConfig.toggleSearchEnginePinnedById(thisSearchID);
                renderPinnedSearchEngineList("pinned-search-engines-list");

                chrome.storage.local.set({
                    user_config: JSON.stringify(thisUserConfig.getPreferences())
                }, function () {
                });
            }
        }
    }

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

    let searchInputNode = document.getElementById(searchInputID);

    if (searchInputNode !== null) {
        searchInputNode.value = thisUserConfig.getLastSearchInput();
        searchInputNode.addEventListener("input", onSearchInputChanged);
    }

    /**
     * Search Engine Listing
     */

    function renderPinnedSearchEngineList(parentID) {
        function generateSearchEnginePinnedListNode(searchEngineItem) {
            let pinnedSearchNodeHtml = `
            <a id="featured-search-item-open-in-tab-${searchEngineItem.id}" class="list-group-item clearfix" search-id="${searchEngineItem.id}" href="#" >
                ${searchEngineItem.category} - ${searchEngineItem.name}
                <span class="pull-right">
                    <button class="btn btn-xs btn-primary btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}">
                        &#128204;
                    </button>
                </span>

            </a>
            `;

            return pinnedSearchNodeHtml;
        }

        let pinnedSearchListingHTML = thisUserConfig.getSearchEnginesPinned().reduce((previousHtml, searchEngineItem) => {
            return previousHtml+generateSearchEnginePinnedListNode(searchEngineItem);
        }, "");

        let pinnedSearchEngineListNode = document.getElementById("pinned-search-engines-list");
        if (pinnedSearchEngineListNode !== null) {
            pinnedSearchEngineListNode.innerHTML = pinnedSearchListingHTML;
            if (!popupEventListenerAddedFlag) { // Hack to prevent registering event multiple times
                document.getElementById("pinned-search-engines-list").addEventListener("click", processPinnedSearchListingButtonClick);
                popupEventListenerAddedFlag = !popupEventListenerAddedFlag;
            }
        }
    }

    renderPinnedSearchEngineList("pinned-search-engines-list");
}

document.addEventListener('DOMContentLoaded', function() {
    getDefPrefsRestorePopupOptions();
});
