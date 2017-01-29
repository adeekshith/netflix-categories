/**
 * Created by Deekshith Allamaneni on 11/28/15.
 * Copyright 2016 Deekshith Allamaneni
 */

"use strict";

function getDefPrefsRestorePopupListAllSearchEnginesOptions () {
    textFileLoad(chrome.extension.getURL("../../data/data.json")).then(function(response) {
        chrome.storage.local.get({
            user_config: response
        }, function (items) {
            restoreListAllSearchEnginesPopupOptions(
                new UserConfig(JSON.parse(items.user_config))
            );
        });
    }, function(Error) {
        console.log(Error);
    });
}

function restoreListAllSearchEnginesPopupOptions (thisUserConfig) {
    function processSearchEngineButtonClick(thisEvent) {
        if (thisEvent.target !== thisEvent.currentTarget) {
            let searchButtonID = thisEvent.target.id;
            if (searchButtonID !== null && searchButtonID.startsWith("search-item-open-in-tab-")){
                let searchUrl = thisUserConfig.getSearchEngineById(
                    thisEvent.target.getAttribute("search-id")
                ).api.replace(/\%s/,encodeURIComponent(thisUserConfig.getLastSearchInput()));
                chrome.tabs.create({
                    url: searchUrl
                });
            } else if (thisEvent.target.classList.contains("btn-pin-this-item")) {
                let thisSearchID = thisEvent.target.getAttribute("search-id");
                thisUserConfig.toggleSearchEnginePinnedById(thisSearchID);
                let pinnedToggleBtnNode = document.getElementById("search-item-pinned-toggle-"+thisSearchID);

                pinnedToggleBtnNode.classList.remove("btn-primary");
                pinnedToggleBtnNode.classList.remove("btn-default");
                let thisSearchItem = thisUserConfig.getSearchEngineById(thisSearchID);
                pinnedToggleBtnNode.classList.add(thisSearchItem.pinned? "btn-primary": "btn-default");

                chrome.storage.local.set({
                    user_config: JSON.stringify(thisUserConfig.getPreferences())
                }, function () {
                });
            }
        }
    }

        function generateSearchEngineListNodes(searchEngineList) {
            return searchEngineList.reduce((listHTML, searchEngineItem) => {
                return listHTML +
                    `<a id="search-item-open-in-tab-${generateUuid()}" search-id="${searchEngineItem.id}" class="list-group-item" href="#">
                        ${searchEngineItem.name}
                        <span class="pull-right">
                            <button class="btn btn-xs ${searchEngineItem.pinned? "btn-primary": "btn-default"} btn-pin-this-item" search-id="${searchEngineItem.id}" id="search-item-pinned-toggle-${searchEngineItem.id}">
                                <i class="fa fa-thumb-tack"></i>
                            </button>
                        </span>
                     </a>`;
            },"");
        }

        document.getElementById("accordion").innerHTML= generateSearchEngineListNodes(thisUserConfig.getSearchEnginesByCategory("NetflixGenre"));
    document.getElementById("accordion").addEventListener("click", processSearchEngineButtonClick);

}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupListAllSearchEnginesOptions);
