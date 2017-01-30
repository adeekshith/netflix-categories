/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

const minSearchStringLength = 3;
let popupEventListenerAddedFlag = false;

let searchInputID = "main-search-keyword-input";

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

                chrome.tabs.query( { active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.update(tabs.id, {
                        url: searchUrl
                    });
                });
            } else if (thisEvent.target.classList.contains("btn-pin-this-item")) {
                let thisSearchID = thisEvent.target.getAttribute("search-id");
                thisUserConfig.toggleSearchEnginePinnedById(thisSearchID);
                if (document.getElementById(searchInputID).value.length >= minSearchStringLength) {
                    renderItemListByType("pinned-search-engines-list", "searchInput");
                } else {
                    renderItemListByType("pinned-search-engines-list", "pinned");
                }

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
    function onSearchInputChanged() {
        let currentSearchInput = document.getElementById(searchInputID).value;
        if (currentSearchInput.length >= minSearchStringLength) {
            renderItemListByType("pinned-search-engines-list", "searchInput");
        } else {
            renderItemListByType("pinned-search-engines-list", "pinned");
        }

        thisUserConfig.setLastSearchInput(currentSearchInput);

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

    function renderItemListByType(parentID, filterType) {
        function generateSearchEnginePinnedListNode(searchEngineItem) {
            let pinnedSearchNodeHtml = `
            <a id="featured-search-item-open-in-tab-${searchEngineItem.id}" class="list-group-item clearfix" search-id="${searchEngineItem.id}" href="#" > ${searchEngineItem.name}
                <span class="pull-right">
                    <i class="btn btn-sm fa ${searchEngineItem.pinned? "fa-star": "fa-star-o"} btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}"
                    title=${searchEngineItem.pinned? "Remove_from_favorites": "Add_to_Favourites"}></i>
                </span>
            </a>
            `;

            return pinnedSearchNodeHtml;
        }

        let pinnedSearchListingHTML =
            (filterType == "searchInput"?
                thisUserConfig.getSearchEnginesBySearchMatch(document.getElementById(searchInputID).value):
                thisUserConfig.getSearchEnginesPinned())
            .reduce((previousHtml, searchEngineItem) => {
                return previousHtml+generateSearchEnginePinnedListNode(searchEngineItem);
            }, "");

        let pinnedSearchEngineListNode = document.getElementById(parentID);
        if (pinnedSearchEngineListNode !== null) {
            pinnedSearchEngineListNode.innerHTML = pinnedSearchListingHTML;
            if (!popupEventListenerAddedFlag) { // Hack to prevent registering event multiple times
                document.getElementById(parentID).addEventListener("click", processPinnedSearchListingButtonClick);
                popupEventListenerAddedFlag = !popupEventListenerAddedFlag;
            }
        }
    }

    renderItemListByType("pinned-search-engines-list", "pinned");
}

document.addEventListener('DOMContentLoaded', function() {
    getDefPrefsRestorePopupOptions();
});
