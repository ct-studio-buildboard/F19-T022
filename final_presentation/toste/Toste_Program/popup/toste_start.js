var tabData = null;
var is_working = false;
var sidebar = document.getElementById("toste_sidebar");
var mainContent = {
  container: document.getElementById("toste_popup_content"),
  default_message_element: document.getElementById("toste_popup_content_default_message"),
  default_message: "Click on \"ToSTE\" on the top left corner once your data has loaded!",
  loading_preprocess_message: "Hold on, ToSTE is parsing your webpage right now..."
}
var responseDiv = document.getElementById("popup_response");
var errorDiv = {
  container: document.getElementById("toste_error_content"),
  error_message: document.getElementById("toste_error_main"),
  error_content: document.getElementById("toste_error_response"),
  default_error_message: "Can't ToSTE this web page.<br/>Try a different page, or contact the developers."
}

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

 function preparePopup() {
  // Empty sidebar
  sidebar.innerHTML = "";

  // Reset error div and hide it
  errorDiv.container.classList.add("hidden");
  errorDiv.error_message.innerHTML = errorDiv.default_error_message;
  errorDiv.error_content.innerHTML = "";

  // show main content with appropriate message, remove any possible parsed segments existing
  clearPopupContent();
  mainContent.default_message_element.innerHTML = mainContent.loading_preprocess_message;
  mainContent.default_message_element.classList.remove("hidden");
  mainContent.container.classList.remove("hidden");

  // Return for next sequence in chain of promises
  return;
}

function clearPopupContent() {
  var existing_parsed_segments = mainContent.container.getElementsByClassName("toste_parsed_segment");
  while (existing_parsed_segments[0]) {
    mainContent.container.removeChild(existing_parsed_segments[0]);
  }
}

function printPopupError(message,content) {
  errorDiv.error_message.innerHTML = message;
  errorDiv.error_content.innerHTML = content;
  mainContent.container.classList.add("hidden");
  errorDiv.container.classList.remove("hidden");
}

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
  else {
    tabData = res.responseData;
  }

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
    var newT = t.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    toPrintText.appendChild(make(["p",newT]))
  }

  toPrint.addEventListener("click", function() {
    this.classList.toggle("opened");
  });

  sidebar.appendChild(toPrint);
}

function printParsed(segment) {
  var header = segment.header;
  var text = segment.text.join('\n');
  var new_parsed_segment = make(["div",{class:"toste_parsed_segment"},["p",{class:"toste_parsed_header"},header]]);
  var new_parsed_segment_text = make(["p",{class:"toste_parsed_text"},text]);
  new_parsed_segment_text.innerHTML = text.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  new_parsed_segment.appendChild(new_parsed_segment_text);
  mainContent.container.appendChild(new_parsed_segment);
  return;
}

function listenForClicks() {
  /*
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
        var server_result = JSON.parse(res.response)
        console.log(server_result)
      }
        else {
        //server_result = JSON.parse(res.responseText)
        console.error(res)
      }
    });
  }
  */

  function handleRequestFromPython(res) {
    if (res.status == 200) {
      console.log("Successful response from ToSTE server.");
      // The parsed returns
      var server_result = JSON.parse(res.responseText);

      // remove existing toste_parsed_sgements already existing inside, for good measure
      clearPopupContent();
      mainContent.default_message_element.classList.add("hidden");
      for (var item of server_result) {
        printParsed(item);
      }

      console.log(server_result);
    }
    else {
      console.error(res.responseText);
      printPopupError("Uh Oh! Cannot connect to ToSTE Servers!", res.responseText);
    }
  }

  function mouseActions(e) {
    if (e.target.classList.contains("toste_button")) {
      console.log("Sending Data to ToSTE Server");
      // Copy the data in case of mutation
      full_res = JSON.parse(JSON.stringify(tabData));
      // prepare response
      data_to_send = {'input':JSON.stringify(full_res)}
      // Print appropriate message on popup
      clearPopupContent();
      mainContent.default_message_element.innerHTML = mainContent.loading_preprocess_message;
      mainContent.default_message_element.classList.remove("hidden");
      // Send result, pipe return to "handleRequestFromPython(res)"
      sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded', handleRequestFromPython);
    }
    else if (e.target.classList.contains("toste_reset")) {
      console.log("Resetting")
      tabData = null;
      main();
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

  mainContent.default_message_element.innerHTML = mainContent.default_message;
  errorDiv.container.classList.add("hidden");
  mainContent.container.classList.remove("hidden");

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
  console.error(`Failed to execute content script: ${error.message}`);
  printPopupError("Something's Wrong With ToSTE!", error.message);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */

function main() {
  browser.tabs.executeScript({file: "/content_scripts/toste.js"})
  .then(preparePopup)
  .then(initializeTabs)
  .then(extractTabContent)
  .then(parseTabContent)
  .then(listenForClicks)
  .then(printPreview)
  .catch(reportExecuteScriptError);
}

main();