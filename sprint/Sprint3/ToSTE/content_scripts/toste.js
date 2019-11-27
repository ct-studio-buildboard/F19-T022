// toste.js
// Injected into page script to facilitate detection of clicking, hovering, and adding to our toste machine
// --- Created by Ryan Kim, collaborated w/ Jerry Tsou, Arief Hutahaean, and Emile Burton ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL VARIABLES ---

var prev, prev_background_style;  // hold reference and background style information of what we're hovering over
var currently_working = false;    // boolean to check if toste is doing something right now.

// --- END GLOBAL VARIABLES ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL FUNCTIONS ---

function handleResponse(response) {
  // runs when an action is completed by "background.js"
  currently_working = false;

  if (typeof response === 'undefined') {
    console.error("Response message from background not returned - check for possible errors");
    return;
  }

  let message = JSON.parse(response);

  if (message.status != 200) {
    console.error("ERROR: " + message.responseText);
  }
  else if (message.responseText != null) {
    console.log(message.responseText);
    if (message.responseData) {
      console.log(message.responseData);
    }
  } else {
    console.log("Status 200 recieved");
  }
}

function toste_mouseover_controller(event) {
  // AddListenerEvent function that controls hovering over objects
  if (event.target === document.body || (prev && prev === event.target)) {
    return;
  }
  if (prev) {
    if (prev.style.removeProperty) {
      prev.style.backgroundColor = prev_background_style
    } else {
      prev.style.backgroundColor = prev_background_style
    }
    prev = undefined;
    prev_background_style = undefined;
  }
  if (event.target) {
    prev = event.target;
    prev_background_style = prev.style.backgroundColor;
    prev.style.backgroundColor = 'rgba(0,0,0,0.1)';
  }
}

function toste_click_controller(event) {
  if (!currently_working) {
    currently_working = true;
    var sending = browser.runtime.sendMessage({
      type: 'addTabContent',
      content: event.target.innerHTML
    }, handleResponse);
  }
}

function main() {
  // Main function - controls everything

  // Adds event listener for hover
  if (document.body.addEventListener) {
    document.body.addEventListener('mouseover', toste_mouseover_controller, false);
  }
  else if (document.body.attachEvent) {
    document.body.attachEvent('mouseover', function(e) {
      return toste_mouseover_controller(e || window.event);
    });
  }
  else {
    document.body.onmouseover = toste_mouseover_controller;
  }

  // Adds event listener for clicking
  document.addEventListener("click", toste_click_controller);

}

// --- END GLOBAL FUNCTIONS ---

// -------------------------------------------------------------------------------------- //

// --- RUNTIME ---
main();