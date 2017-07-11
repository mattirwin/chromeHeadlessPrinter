'use strict';

const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const del = require('del');
let colors = require('colors/safe');

colors.setTheme({
  input: 'grey',
  prompt: 'grey',
  info: 'green',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

const loadPages = require('./loadPages');

// Optional: set logging level of launcher to see its output.
// const log = require('lighthouse-logger');
// log.setLevel('info');

/**
 * Launches a debugging instance of Chrome.
 * @param {boolean=} headless True (default) launches Chrome in headless mode.
 *     False launches a full version of Chrome.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless=true) {
  return chromeLauncher.launch({
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--window-size=412,732',
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}

/**
 * Returns a set timeout wrapped in a promise
 * using to mock delays from ui updates without setting up ext. listeners
 * @param {ms=} ms 100 (default) number of milliseconds to delay
 * @return {Promise}
 */
function timeout(ms=100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function() {

const chrome = await launchChrome();
const protocol = await CDP({port: chrome.port});
const pdfDir = path.normalize('./pdfs');
const sjsDelay = 250;

let sindex = 0, jurl;

const {Page, Runtime} = protocol; // Destructure only what is needed from CDP
await Promise.all([Page.enable(), Runtime.enable()]); // Then enable it

// Listen for page load event to begin doing things
Page.loadEventFired(async () => {
  console.log(`  Loaded page : ` + colors.info(`${jurl.value.url}`))
  if (jurl.value.sjs) { // If there is js to execute...
    for(let [ind, cmd] of jurl.value.sjs.entries()) {
      await Runtime.evaluate({expression: cmd});
      await timeout(sjsDelay);
    }
  }

  // Now Print
  const cpdf = await Page.printToPDF();
  sindex++;
  let pdfpath = path.normalize(`./pdfs/p${sindex}_${jurl.value.ptitle}.pdf`);
  fs.writeFile(pdfpath, cpdf.data, 'base64', (err) => {
    if (err) throw err;
    console.log('  PDF file has been saved');
    nextURL();
  });

});

/**
 * Loads the next value from the loadPages iterator navigates to that page
 * when there are no more values closw the browser
 * @return null
 */
function nextURL() {
  jurl = loadPages.next();
  console.log('');
  if (!jurl.done) {
    Page.navigate({url: jurl.value.url})
  } else {
    protocol.close();
    chrome.kill();
  }
}

// Create PDF directory, if not there
try {
  fs.mkdirSync(pdfDir);
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

// Remove existing PDFs from Directory and report
console.log('');
const dpaths = await del([path.join(pdfDir,'*.pdf')]);
console.log('  '+ colors.help('Deleted pdf files:\n '),dpaths.join('\n  '));
// Start Printing URLs
nextURL();

})();