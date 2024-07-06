// app.js

const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKeyButton');
const youtubeInput = document.getElementById('youtubeInput');
const searchOrDownloadButton = document.getElementById('searchOrDownloadButton');
const resultsDiv = document.getElementById('resultsDiv');

let apiKey = '';

function validateApiKey(apiKey) {
  const regex = /^[A-Za-z0-9-_]{39}$/;
  return regex.test(apiKey);
}

saveApiKeyButton.addEventListener('click', () => {
  const apiKeyValue = apiKeyInput.value.trim();
  if (!validateApiKey(apiKeyValue)) {
    alert('Invalid API key format. Please enter a valid API key.');
    return;
  }
  apiKey = apiKeyValue;
  localStorage.setItem('apiKey', apiKey);
  alert('API key saved!');
});

searchOrDownloadButton.addEventListener('click', () => {
  if (!apiKey) {
    alert('Please enter and save your API key first!');
    return;
  }

  const userInput = youtubeInput.value.trim();

  if (userInput.startsWith('https://www.youtube.com/watch?v=')) {
    // User entered a YouTube link
    const videoId = extractVideoIdFromUrl(userInput);
    downloadVideo(videoId, false); // Download video in MP4 format
  } else {
    // User entered a search query
    performSearch(userInput);
  }
});

function performSearch(query) {
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${query}&key=${apiKey}`;
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        const results = data.items;
        const resultsHtml = results.map(result => {
          return `<li><a href="https://www.youtube.com/watch?v=${result.id.videoId}" target="_blank">${result.snippet.title}</a></li>`;
        }).join('');
        resultsDiv.innerHTML = `<ul>${resultsHtml}</ul>`;
      })
      .catch(error => {
        console.error(error);
        alert('Error searching for videos: ' + error.message);
      });
  } catch (error) {
    console.error(error);
    alert('Error searching for videos: ' + error.message);
  }
}

function downloadVideo(videoId, audioOnly) {
  try {
    const apiUrl = `https://cobalt.io/api/download?url=https://www.youtube.com/watch?v=${videoId}&format=mp4`;
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        const downloadUrl = data.download_url;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${videoId}.mp4`;
        a.click();
      })
      .catch(error => {
        console.error(error);
        alert('Error downloading video: ' + error.message);
      });
  } catch (error) {
    console.error(error);
    alert('Error downloading video: ' + error.message);
  }
}

function extractVideoIdFromUrl(url) {
  const regex = /^https:\/\/www\.youtube\.com\/watch\?v=([^&]+)/;
  const match = url.match(regex);
  return match[1];
}

// Retrieve saved API key from local storage
apiKey = localStorage.getItem('apiKey');
if (apiKey) {
  apiKeyInput.value = apiKey;
}
