/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function install(_data, _reason) {}

async function startup({id, version, resourceURI, rootURI}, reason) {
  await Zotero.initializationPromise;
  Zotero.Dummy = true;
}

function shutdown({id, version, resourceURI, rootURI}, reason) {
  Zotero.Dummy = false;
}

function uninstall(data, reason) {}
