function open_url(url, new_window = false) {
  if (new_window) {
    let a = document.createElement("a");
    a.href = url;
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    a.click();
    return;
  }
  window.location = url;
}
function getPageURL() {
  let url = window.location;
  let urlObject = {};
  urlObject.schoolName = url.hostname.split(".")[0];
  urlObject.fullPath = url.pathname.replace("/", "");
  urlObject.path = url.pathname.split("/")[1];
  if (url.pathname.includes("module")) {
    urlObject.moduleName = url.pathname.split("=")[1].split("&")[0];
  } else {
    urlObject.moduleName = null;
  }
  return urlObject;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms)); // no hate please 👉👈
}

async function clearsettings() {
  localStorage.clear();
  await browser.runtime.sendMessage({
    action: "clearLocalStorage",
  });
  console.log("Cleared settings!");
}

function unbloat() {
  document.body.innerHTML = "";
}

function getImage(name) {
  return chrome.runtime.getURL(`images/${name}`);
}
