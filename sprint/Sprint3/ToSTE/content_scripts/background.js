// background.js
// Runs behind the scenes of our toste machine, facilitates communication between the injected "toste.js" and the separate "toste_start.js"
// --- Created by Ryan Kim, collaborated w/ Jerry Tsou, Arief Hutahaean, and Emile Burton ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL VARIABLES ---
var storage = {};   // our storage for each tab data

// --- END GLOBAL VARIABLES ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL FUNCTIONS ---
function setBadge(content) {
    // Sets the badge on our extension icon
	var message = (typeof content === 'undefined') ? "" : (typeof content !== 'string') ? (content).toString() : content
	browser.browserAction.setBadgeText({text: message});
}

function resetTabContent(tabId) {
    // Resets our badge information
    if (typeof storage[tabId] === 'undefined' || storage[tabId].length > 0) {
        storage[tabId] = []
    }
    setBadge("");
}

function handleMessage(message, sender, sendResponse) {
    // Handles all messages from either "toste.js" or "toste_start.js"
    var currentCount = "";          // current number of elements saved for the current tab instance: default = ""
    var tabId = (typeof sender.tab !== 'undefined' && typeof sender.tab.id !== 'undefined') ? sender.tab.id : (typeof message.tabId !== 'undefined') ? message.tabId : null;      // the current tab's ID if applicable
    var response = {status: 200};   // response to send back - will be changed throughout switch statement

    if (tabId == null) {
        response.status = 400;
        response.responseText = "Unrecognised Tab ID";
        response.responseData = message;
    }
    else {
        storage[tabId] = (storage[tabId] != null) ? storage[tabId] : [];    // initializing this tab's storage if applicable

        // Switch statement to handle different message types depending on where they're coming from
        switch(message.type) {
            // Adding content from a tab into that tab's storage
            case "addTabContent":

                // If that tab's storage doesn't already include the content that wants to be added, it'll push it into storage
                if (!storage[tabId].includes(message.content)) {    storage[tabId].push(message.content);   }
                
                // Get the current count of the tab's stored items and print it as a badge
                currentCount = storage[tabId].length;
                setBadge(currentCount);

                // Set response values for return
                response.status = 200;
                response.responseText = currentCount;
                break;
            
            // Getting content for current tab
            case "getTabContent":
                
                // Set response values for return 
                response.status = 200;
                response.responseData = storage[tabId];
                break;

            // Getting content for all tabs
            case "getAllContent":

                // TODO: Add executive check

                // Set response values for return
                response.status = 200;
                response.responseText = storage;
                break;

            // Induce printing of badge
            case "printBadge":

                // Get the current count of the tab's stored items and print it as a badge
                currentCount = storage[tabId].length;
                setBadge(currentCount);
                
                // Set response values for return
                response.status = 200;
                response.responseText = currentCount
                break;

            // Resetting tab content
            case "resetTabContent":

                // Resetting badge and tab content
                resetTabContent(tabId);

                // Set response values for return
                response.status = 200;
                break;

            // By default, return an error message with an unrecognized message type parameter
            default:

                // Set response values for return
                response.status = 400;
                response.responseText = "Unrecognised message type";
                response.responseData = message;
        }
    }

    sendResponse(JSON.stringify(response));
}

browser.runtime.onMessage.addListener(handleMessage);

browser.browserAction.onClicked.addListener(function(tab) { 
    console.log('icon clicked')
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (typeof changeInfo.attention !== 'undefined') {
        if (storage[tabId] && storage[tabId].length > 0) {
            setBadge(storage[tabId].length);
        } else {
            resetTabContent(tabId);
        }
    }
    else if (changeInfo.status) {
        resetTabContent(tabId);
    }
});
