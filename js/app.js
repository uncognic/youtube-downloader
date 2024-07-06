document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");
  const updateApiKeyButton = document.getElementById("updateApiKeyButton");
  const musicButton = document.getElementById("music");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const urlInput = document.getElementById("urlInput");
  const urlForm = document.getElementById("urlForm");
  const audioInput = document.getElementById("audio");

  const playerContainer = document.getElementById("player-container");
  const videoPlayer = document.getElementById("video-player");
  const audioPlayer = document.getElementById("audio-player");

  let apiKey = localStorage.getItem("youtubeApiKey");
  let nextPageToken = "";
  let isMusicOnly = false;

  loadMoreButton.style.display = "none";

  if (!apiKey) {
    apiKey = prompt(
      "Please enter your YouTube API key (if you don't know what this is, just message me):"
    );
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const query = apiKeyInput.value.trim();
    if (isValidYouTubeUrl(query)) {
      handleUrlInput(query);
    } else {
      performSearch(query);
    }
  });

  updateApiKeyButton.addEventListener("click", () => {
    apiKey = prompt("Enter a new YouTube API key:");
    if (apiKey) {
      localStorage.removeItem("youtubeApiKey");
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  });

  musicButton.addEventListener("click", () => {
    isMusicOnly = true;
    performSearch();
  });

  loadMoreButton.addEventListener("click", () => {
    if (nextPageToken) {
      performSearch(null, nextPageToken);
    }
  });

  function performSearch(query = "music", pageToken = "") {
    if (!apiKey) return;

    let url;
    if (isMusicOnly) {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&pageToken=${pageToken}&key=${apiKey}`;
    } else {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=20&pageToken=${pageToken}&key=${apiKey}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        nextPageToken = data.nextPageToken || "";
        const videoIds = data.items.map((item) => item.id.videoId).join(",");
        return fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        displayResults(data.items);
        loadMoreButton.style.display = nextPageToken ? "block" : "none";
      })
      .catch((error) => console.error("Error fetching data:", error));
  }

  function handleUrlInput(url) {
    const videoId = extractVideoIdFromUrl(url);
    if (videoId) {
      showVideoOverlay(videoId);
    } else {
      alert("Invalid YouTube URL");
    }
  }

  function showVideoOverlay(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const video = data.items[0].snippet;
          const overlay = document.createElement("div");
          overlay.className = "video-overlay";

          overlay.innerHTML = `
                <div class="overlay-content">
                  <button class="close-btn" onclick="closeOverlay()">×</button>
                  <img src="${video.thumbnails.high.url}" alt="${video.title}" class="thumbnail">
                  <h3>${video.title}</h3>
                  <button class="download-btn" onclick="downloadVideo('${videoId}', 'true')">Download MP3</button>
                  <button class="download-btn" onclick="downloadVideo('${videoId}', 'false')">Download MP4</button>
                  <button class="download-btn" onclick="viewOnline('${videoId}', 'audio')">View Online MP3</button>
                  <button class="download-btn" onclick="viewOnline('${videoId}', 'video')">View Online MP4</button>
                </div>
              `;

          document.body.appendChild(overlay);
          document.body.classList.add("blurred");
          setTimeout(() => {
            overlay.classList.add("visible");
          }, 10);
        } else {
          alert("Video not found");
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }

  function extractVideoIdFromUrl(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  function isValidYouTubeUrl(url) {
    return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/gi.test(url);
  }

  window.closeOverlay = function () {
    const overlay = document.querySelector(".video-overlay");
    if (overlay) {
      overlay.classList.add("fade-out");

      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.classList.remove("blurred");
      }, 300);
    }
  };
});
