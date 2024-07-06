// Initialize variables and elements
document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const updateApiKeyButton = document.getElementById("updateApiKeyButton");
  const musicButton = document.getElementById("music");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const urlInput = document.getElementById("urlInput");
  const urlButton = document.getElementById("urlButton");
  const searchForm = document.getElementById("searchForm");
  const urlForm = document.getElementById("urlForm");
  const playerContainer = document.getElementById("player-container");

  let youtubeApiKey = localStorage.getItem("youtubeApiKey");
  let nextPageToken = "";
  let isMusicOnly = false;

  // Hide load more button initially
  loadMoreButton.style.display = "none";

  // Prompt for YouTube API key if not saved
  if (!youtubeApiKey) {
    youtubeApiKey = prompt(
      "Please enter your YouTube API key (if you don't know what this is, just message me):"
    );
    if (youtubeApiKey) {
      localStorage.setItem("youtubeApiKey", youtubeApiKey);
    }
  }

  // Event listeners for search and URL input
  searchButton.addEventListener("click", performSearch);
  urlButton.addEventListener("click", handleUrlInput);
  updateApiKeyButton.addEventListener("click", () => {
    youtubeApiKey = prompt("Enter a new YouTube API key:");
    if (youtubeApiKey) {
      localStorage.setItem("youtubeApiKey", youtubeApiKey);
    }
  });

  // Event listener for music mode
  musicButton.addEventListener("click", () => {
    isMusicOnly = true;
    performSearch();
  });

  // Prevent default form submission for search and URL input
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    performSearch();
  });

  urlForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleUrlInput();
  });

  // Event listener for loading more results
  loadMoreButton.addEventListener("click", () => {
    if (nextPageToken) {
      performSearch(false, nextPageToken);
    }
  });

  // Handle URL input to show video overlay
  function handleUrlInput() {
    const url = urlInput.value.trim();
    if (url) {
      const videoId = extractVideoIdFromUrl(url);
      if (videoId) {
        showVideoOverlay(videoId);
      } else {
        alert("Invalid YouTube URL");
      }
    }
  }

  // Show video overlay with video details
  function showVideoOverlay(videoId) {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`;

    fetch(youtubeUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const video = data.items[0].snippet;
          const overlay = createVideoOverlay(video);
          document.body.appendChild(overlay);
          document.body.classList.add("blurred");
          setTimeout(() => {
            overlay.classList.add("visible");
          }, 10);
        } else {
          alert("Video not found");
        }
      })
      .catch((error) => console.error("Error fetching YouTube data:", error));
  }

  // Create video overlay HTML
  function createVideoOverlay(video) {
    const overlay = document.createElement("div");
    overlay.className = "video-overlay";

    overlay.innerHTML = `
      <div class="overlay-content">
        <button class="close-btn" onclick="closeOverlay()">×</button>
        <img src="${video.thumbnails.high.url}" alt="${video.title}" class="thumbnail">
        <h3>${video.title}</h3>
        <button class="download-btn" onclick="downloadVideo('${video.id}', true)">Download MP3</button>
        <button class="download-btn" onclick="downloadVideo('${video.id}', false)">Download MP4</button>
        <button class="view-online-btn" onclick="viewOnline('${video.id}', 'audio')">View Online MP3</button>
        <button class="view-online-btn" onclick="viewOnline('${video.id}', 'video')">View Online MP4</button>
      </div>
    `;

    return overlay;
  }

  // Close video overlay
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

  // Perform YouTube search
  function performSearch() {
    const query = apiKeyInput.value.trim();
    if (!query && !isMusicOnly) return;

    let url;
    if (isMusicOnly) {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&pageToken=${nextPageToken}&key=${youtubeApiKey}`;
    } else {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=20&pageToken=${nextPageToken}&key=${youtubeApiKey}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        nextPageToken = data.nextPageToken || "";
        const videoIds = data.items.map((item) => item.id.videoId).join(",");
        return fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        displayResults(data.items);
        loadMoreButton.style.display = nextPageToken ? "block" : "none";
      })
      .catch((error) => console.error("Error fetching YouTube data:", error));
  }

  // Display search results
  function displayResults(videos) {
    resultsDiv.innerHTML = "";

    videos.forEach((video) => {
      const { title, thumbnails } = video.snippet;
      const videoId = video.id.videoId;
      const thumbnailUrl = thumbnails.high.url;

      const videoDuration = video.contentDetails
        ? formatDuration(video.contentDetails.duration)
        : "Unknown";

      const videoElement = document.createElement("div");
      videoElement.className = "video-item";

      videoElement.innerHTML = `
        <div class="thumbnail-container">
          <img src="${thumbnailUrl}" alt="${title}" class="thumbnail">
          <span class="duration">${videoDuration}</span>
          <div class="download-buttons">
            <button class="download-btn" onclick="downloadVideo('${videoId}', true)">Download MP3</button>
            <button class="download-btn" onclick="downloadVideo('${videoId}', false)">Download MP4</button>
            <button class="view-online-btn" onclick="viewOnline('${videoId}', 'audio')">View Online MP3</button>
            <button class="view-online-btn" onclick="viewOnline('${videoId}', 'video')">View Online MP4</button>
          </div>
        </div>
        <div class="video-info">
          <h3>${title}</h3>
        </div>
      `;

      resultsDiv.appendChild(videoElement);
    });
  }

  // Extract video ID from YouTube URL
  function extractVideoIdFromUrl(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  // View online audio or video
  window.viewOnline = function (videoId, type) {
    const link = `https://www.youtube.com/watch?v=${videoId}`;
    const container = document.getElementById("player-container");

    container.innerHTML = `
      <${type === "audio" ? "audio" : "video"} controls>
        <source src="${link}" type="${type === "audio" ? "audio/mp3" : "video/mp4"}">
        Your browser does not support the ${type === "audio" ? "audio" : "video"} element.
      </${type === "audio" ? "audio" : "video"}>
    `;
  };

  // Initialize from URL parameters
  function initFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    const musicOnly = params.get("musicOnly") === "true";

    if (query) {
      apiKeyInput.value = query;
    }

    isMusicOnly = musicOnly;
    performSearch();
  }

  initFromUrlParams();
});

// Format duration from YouTube API format (PT..H..M..S)
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  let formattedDuration = "";

  if (hours > 0) {
    formattedDuration += hours + ":";
  }

  formattedDuration +=
    (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

  return formattedDuration;
}

// Download video using Cobalt API
window.downloadVideo = function (videoId, isAudio) {
  const format = isAudio ? "mp3" : "mp4";
  const link = `https://cobalt.tools/api/download/${videoId}/${format}`;
  window.open(link, "_blank");
};
