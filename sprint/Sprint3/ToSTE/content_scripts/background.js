// background.js

var temp = {}

function setBadge(content) {
	var message = (typeof content !== 'string') ? (content).toString() : content
	browser.browserAction.setBadgeText({text: message});
}

browser.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.type) {
            case "setContent":
            	temp[sender.tab.id] = (temp[sender.tab.id] != null) ? temp[sender.tab.id] : []
            	temp[sender.tab.id].push(message.content);

            	let curNum = temp[sender.tab.id].length;
            	setBadge(curNum)

            	sendResponse(curNum)
            	break;
            case "getContent":
            	sendResponse(temp[message.id]);
            	break;
            default:
                console.error("Unrecognised message: ", message);
        }
    }
);