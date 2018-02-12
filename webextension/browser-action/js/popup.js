/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

const changelogURL = "https://github.com/adeekshith/netflix-categories#whats-new";
const minSearchStringLength = 1;
let popupEventListenerAddedFlag = false;

let searchInputID = "main-search-keyword-input";

const allCategoriesListItem = `
    <a class="main-pinned-item" href="popup-list-all-search-engines.html">
        All Categories <span class="icon-right-open pull-right" aria-hidden="true"></span>
    </a>`;

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
    }

    let searchInputNode = document.getElementById(searchInputID);

    if (searchInputNode !== null) {
        searchInputNode.addEventListener("input", onSearchInputChanged);
    }

    /**
     * Search Engine Listing
     */

    function renderItemListByType(parentID, filterType) {
        function generateSearchEnginePinnedListNode(searchEngineItem) {
            let pinnedSearchNodeHtml = `
            <div id="featured-search-item-open-in-tab-block-${searchEngineItem.id}" class="main-pinned-item" search-id="${searchEngineItem.id}">
                <a id="featured-search-item-open-in-tab-${searchEngineItem.id}" class="pinned-item-category-name" search-id="${searchEngineItem.id}" > ${searchEngineItem.name}
                </a>
                <i class="${searchEngineItem.pinned? "icon-heart": "icon-heart-empty"} btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}"
                    title=${searchEngineItem.pinned? "Unfavorite": "Favorite"}></i>
            </div>
            `;

            return pinnedSearchNodeHtml;
        }

        let pinnedSearchListingFrag = document.createDocumentFragment();
        (filterType == "searchInput" ?
            thisUserConfig.getSearchEnginesBySearchMatch(document.getElementById(searchInputID).value) :
            thisUserConfig.getSearchEnginesPinned())
            .forEach((searchEngineItem) => {
                pinnedSearchListingFrag.appendChild(document.createRange().createContextualFragment(generateSearchEnginePinnedListNode(searchEngineItem)));
            });

        let pinnedSearchEngineListNode = document.getElementById(parentID);
        while (pinnedSearchEngineListNode.firstChild) { // Delete all children previously rendered
            pinnedSearchEngineListNode.removeChild(pinnedSearchEngineListNode.firstChild);
        }
        if (pinnedSearchEngineListNode !== null) {
            if (filterType !== "searchInput") {
                pinnedSearchListingFrag.appendChild(document.createRange().createContextualFragment(allCategoriesListItem));
            }
            pinnedSearchEngineListNode.appendChild(pinnedSearchListingFrag);
            if (!popupEventListenerAddedFlag) { // Hack to prevent registering event multiple times
                document.getElementById(parentID).addEventListener("click", processPinnedSearchListingButtonClick);
                popupEventListenerAddedFlag = !popupEventListenerAddedFlag;
            }
        }
    }

    renderItemListByType("pinned-search-engines-list", "pinned");

    /*
    * Manage Changelog Link Footer
    * */
    document.getElementById("changelog-link").addEventListener("click", (thisEvent) => {
        chrome.tabs.create({
            url: changelogURL
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    getDefPrefsRestorePopupOptions();
});
