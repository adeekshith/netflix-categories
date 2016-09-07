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

        function generateSearchEngineCategoryListNodes(category) {
            let collapseID = `search-category-${generateUuid()}`;
            let categoryHtml = `
            <div class="panel panel-default">
                    <div class="list-group status search-list-category">
                        <a class="list-group-item list-group-item-info" data-toggle="collapse" data-parent="#accordion" href="#${collapseID}">
                            <span class="glyphicon glyphicon-chevron-right category-list-menu-collapse-indicator pull-right" aria-hidden="true"></span>${category}
                        </a>
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

    /**
     * Highlight Search Engine Category Item On Click
     */
    $('.search-list-category').on('click','> a', function(e) {
        var $this = $(this);
        let wasAlreadyActive = e.target.classList.contains("active");
        $('.search-list-category').find('.active').find('.category-list-menu-collapse-indicator').removeClass('glyphicon-chevron-down');
        $('.search-list-category').find('.active').find('.category-list-menu-collapse-indicator').addClass('glyphicon-chevron-right');
        $('.search-list-category').find('.active').removeClass('active');
        if (!wasAlreadyActive) {
            $this.addClass('active');
            $this.find('.category-list-menu-collapse-indicator').addClass('glyphicon-chevron-down');
        }
    });
}

document.addEventListener('DOMContentLoaded', getDefPrefsRestorePopupListAllSearchEnginesOptions);
