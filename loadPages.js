// List of URLs to be printed, along with any follow up js to be executed on page load
module.exports = [
  {
    'url':'https://www.google.com',
    'ptitle': 'Google'
  },
  {
    'url':'https://www.amazon.com',
    'ptitle': 'Amazon'
  },
  {
    'url':'https://www.doubleclickbygoogle.com/',
    'ptitle': 'DoubleClick_wMod',
    'sjs': [
      `let pfNode = document.querySelector('#main > header > *:first-child'); let sp1 = document.createElement('h1'); sp1.innerHTML = 'check it';`,
      `let prrNode = pfNode.parentNode; prrNode.insertBefore(sp1,pfNode);`
    ]
  }
][Symbol.iterator]()