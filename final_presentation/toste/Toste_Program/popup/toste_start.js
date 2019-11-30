var tabData = null;
var is_working = false;
var sidebar = document.getElementById("toste_sidebar");
var mainContents = document.getElementById("toste_contents");
var responseDiv = document.getElementById("popup_response");

function isArray(a) { return Object.prototype.toString.call(a) === "[object Array]";  }

function sendHTTPRequest(type, url, content, contenttype, next) {
  
  var urlEncodedData = "";
  var urlEncodedDataPairs = [];
  var name;

  if (content != null){
    for(name in content) {
      urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(content[name]));
    }
    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
  }

  var cType = (contenttype != null) ? contenttype : 'application/x-www-form-urlencoded';

  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(event) {
    next(xhr);
  });
  xhr.addEventListener('error', function(event) {
    console.log('Oops! Something goes wrong.');
  });
  xhr.open(type, url);
  xhr.setRequestHeader('Content-Type', cType);
  xhr.send(urlEncodedData);
}

function make(desc) {
  // Probably a good idea to check if 'desc' is an array, but this can be done later;
  if ( !isArray(desc) ) return false;
  var tag = desc[0], attributes = desc[1];
  var el = document.createElement(tag);
  var start = 1;
  if ( (attributes!=null) && (typeof attributes === 'object') && !isArray(attributes) ) {
    for (var attr in attributes) {
      switch(attr) {
        case 'class':
          el.className = attributes[attr];
          break;
        case 'checked':
          el.checked = attributes[attr];
          break;
        case 'html':
          el.innerHTML = attributes[attr];
          break;
        default:
          el.setAttribute(attr, attributes[attr]);
      }
    }
    start = 2;
  }
  for (var i = start; i < desc.length; i++) {
    if (isArray(desc[i])) el.appendChild(make(desc[i]));
    else el.appendChild(document.createTextNode(desc[i]));
  }
  return el;
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */

function initializeTabs() {
  return browser.tabs.query({active: true, currentWindow: true});
}

function extractTabContent(tabs) {
  var tab = tabs[0];
  return browser.tabs.sendMessage(tab.id, {type: "extractContent"});
}

function parseTabContent(res) {
  if (res.status !== 200) {
    tabData = null;
    console.error(res.responseText);
    if (res.responseData) {
      console.error(res.responseData);
    }
  }
  else if (res.responseData.length == 0) {
    console.error("NO TAB DATA PRESENT")
    tabData = [];
  }
  tabData = res.responseData;

  console.log(tabData);
  return;
}

function printPreview(textComponent) {

  if (typeof textComponent === "undefined") {
    return;
  }

  var toHeader, toPrint, toPrintText;
  var text = textComponent.text.split('\n');

  if (textComponent.header == null) {
    toHeader = text[0];
  } else {
    toHeader = textComponent.header.raw;
  }
  toPrint= make(["div",{class:"toste_sidebar_content"},["div",{class:"toste_sidebar_text"},["p",{class:"toste_sidebar_text_header"},toHeader]],["p",{class:"toste_sidebar_hovertext"},"Click to open/close"]])
  toPrintText = toPrint.getElementsByClassName("toste_sidebar_text")[0];

  for (var t of text) {
    toPrintText.appendChild(make(["p",t]))
  }

  toPrint.addEventListener("click", function() {
    this.classList.toggle("opened");
  });

  sidebar.appendChild(toPrint);
}

function listenForClicks() {

  // Log the error to the console.
  function reportError(error) {
    console.error(`Could not ToSTE: ${error}`);
  }

  function handleResponse(res) {
    var result = JSON.parse(res);
    if (result.status !== 200) {
      console.error(result.responseText);
      if (result.responseData) {
        console.error(result.responseData);
      }
      return;
    }
    else if (result.responseData.length == 0) {
      console.error("NO TABS PRESENT")
      return;
    }
      
    full_res = result.responseData[0]
    data_to_send = {'html':full_res}
    sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
      if (res.status == 200) {
        console.log(res.responseText)
      }
        else {
        //server_result = JSON.parse(res.responseText)
        console.error(res)
      }
    });
  }

  function mouseActions(e) {
    if (e.target.classList.contains("toste_button")) {
      console.log("Getting clicks")
      console.log(tabData)

      full_res = tabData;
      data_to_send = {'html':JSON.stringify(full_res)}
      sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
        if (res.status == 200) {
          console.log(res.responseText)
        }
          else {
          //server_result = JSON.parse(res.responseText)
          console.error(res)
        }
      });
      /*
      browser.tabs.query({active: true, currentWindow: true})
        .then(tosteGet)
        .catch(reportError);
      */
    }
    else if (e.target.classList.contains("toste_reset")) {
      console.log("Resetting")
      tabData = null;
      /*
      browser.tabs.query({active: true, currentWindow: true})
        .then(tosteTabReset)
        .catch(reportError);
      */
    }
     /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
     /*
    function beastify(tabs) {
      browser.tabs.insertCSS({code: hidePage}).then(() => {
        let url = beastNameToURL(e.target.dataset.id);
        browser.tabs.sendMessage(tabs[0].id, {
          command: "beastify",
          beastURL: url
        });
      });
    }
    */

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
     /*
    function reset(tabs) {
      browser.tabs.removeCSS({code: hidePage}).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
      });
    }
    */
  }

  for (var seg of tabData) {
    printPreview(seg);
  }

  document.addEventListener("click",mouseActions);

  /*
  function tosteGet(tabs) {
    var tab = tabs[0];
    browser.runtime.sendMessage({type: 'getTabContent', tabId:tab.id}, (res)=>{
      var result = JSON.parse(res);
      if (result.status !== 200) {
        console.error(result.responseText);
        if (result.responseData) {
          console.error(result.responseData);
        }
        return;
      }
      else if (result.responseData.length == 0) {
        console.error("NO TABS PRESENT")
        return;
      }
          
      full_res = result.responseData[0]
      data_to_send = {'html':full_res}
      sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
        if (res.status == 200) {
          console.log(res.responseText)
        }
        else {
          //server_result = JSON.parse(res.responseText)
          console.error(res)
        }
      });
    });
  }
  */
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */

function main() {
  browser.tabs.executeScript({file: "/content_scripts/toste.js"})
  .then(initializeTabs)
  .then(extractTabContent)
  .then(parseTabContent)
  .then(listenForClicks)
  .then(printPreview)
  .catch(reportExecuteScriptError);
}

main();