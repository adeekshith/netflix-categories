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
            restoreListAllSearchEnginesPopupOptions(
                new UserConfig(JSON.parse(items.user_config))
            );
        });
    }, function(Error) {
        console.log(Error);
    });
}

function processSearchEngineButtonClick(thisEvent) {
    if (thisEvent.target !== thisEvent.currentTarget) {
        let searchUrl = thisEvent.target.href;
        let searchButtonID = thisEvent.target.id;
        if (searchButtonID !== null && searchButtonID.startsWith("search-item-")
            && searchUrl !== null && searchUrl.length >0) {
            chrome.tabs.create({
                url: searchUrl
            });
        }
    }
}

function restoreListAllSearchEnginesPopupOptions (thisUserConfig) {
        function generateSearchEngineListNodes(searchEngineList) {
            return searchEngineList.reduce((listHTML, searchEngineItem) => {
                return listHTML +
                    `<a id="search-item-${generateUuid()}" class="list-group-item" href="${searchEngineItem.api.replace(/\%s/,encodeURIComponent(thisUserConfig.getLastSearchInput()))}">
                        ${searchEngineItem.name}
                        <span class="pull-right">
                            <button class="btn btn-xs ${searchEngineItem.pinned? "btn-primary": "btn-default"} btn-pin-this-item"><span class="glyphicon glyphicon-pushpin"></span></button>
                        </span>
                     </a>`;
            },"");
        }

        function generateSearchEngineCategoryListNodes(category) {
            let collapseID = `search-category-${generateUuid()}`;
            let categoryHtml = `
            <div class="panel panel-default">
                    <div class="list-group status">
                        <button class="list-group-item btn btn-lg" data-toggle="collapse" data-parent="#accordion" href="#${collapseID}">
                            ${category}
                        </button>
                    </div>

                <div id="${collapseID}" class="panel-collapse collapse">
                    <div class="list-group">
                        ${generateSearchEngineListNodes(thisUserConfig.getSearchEnginesByCategory(category))}
                    </div>
                </div>
            </div>
            `;

            return categoryHtml;
        }

        let categoryNodes = thisUserConfig.getSearchEngineCategories()
            .reduce((previousHtml, eachSearchCategory) => {
                return previousHtml+generateSearchEngineCategoryListNodes(eachSearchCategory);
            }, "");
        document.getElementById("accordion").innerHTML=categoryNodes;
    document.getElementById("accordion").addEventListener("click", processSearchEngineButtonClick);
}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupOptions);
