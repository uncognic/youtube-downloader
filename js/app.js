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
  const audioInput = document.getElementById("audio");
  const playerContainer = document.getElementById("player-container");
  const videoPlayer = document.getElementById("video-player");
  const audioPlayer = document.getElementById("audio-player");

  let apiKey = localStorage.getItem("youtubeApiKey");
  let nextPageToken = "";
  let isMusicOnly = false;

  // Hide load more button initially
  loadMoreButton.style.display = "none";

  // Prompt for API key if not saved
  if (!apiKey) {
    apiKey = prompt(
      "Please enter your YouTube API key (if you don't know what this is, just message me):"
    );
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  // Event listeners for search and URL input
  searchButton.addEventListener("click", () => performSearch());
  urlButton.addEventListener("click", () => handleUrlInput());
  updateApiKeyButton.addEventListener("click", () => {
    apiKey = prompt("Enter a new YouTube API key:");
    if (apiKey) {
      localStorage.removeItem("youtubeApiKey");
      localStorage.setItem("youtubeApiKey", apiKey);
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
    const url = urlInput.value;
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

  // Close warning overlay
  window.closeWarning = function () {
    const overlay = document.querySelector(".warning");
    if (overlay) {
      overlay.classList.add("fade-out");

      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }
  };

  // Perform YouTube search
  function performSearch(isMusic = false, pageToken = "") {
    const query = apiKeyInput.value;
    if (!apiKey) return;

    let url;
    if (isMusic) {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&pageToken=${pageToken}&key=${apiKey}`;
    } else {
      const searchQuery = query ? query : "music";
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
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

  // Display search results
  function displayResults(videos) {
    resultsDiv.innerHTML = "";

    videos.forEach((video) => {
      const { title, thumbnails } = video.snippet;
      const videoId = video.id;
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
            <button class="download-btn" onclick="downloadVideo('${videoId}', 'true')">Download MP3</button>
            <button class="download-btn" onclick="downloadVideo('${videoId}', 'false')">Download MP4</button>
            <button class="download-btn" onclick="viewOnline('${videoId}', 'audio')">View Online MP3</button>
            <button class="download-btn" onclick="viewOnline('${videoId}', 'video')">View Online MP4</button>
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

  // Initialize from URL parameters
  function initFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    const musicOnly = params.get("musicOnly") === "true";

    if (query) {
      apiKeyInput.value = query;
    }

    isMusicOnly = musicOnly;
    performSearch(isMusicOnly);
  }

  initFromUrlParams();
});

// Format duration from YouTube API format (PT..H..M..S)
function formatDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (match) {
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    let formattedDuration = "";

    if (hours > 0) {
      formattedDuration += hours + ":";
    }

    formattedDuration +=
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    return formattedDuration;
  }

  return "Unknown";
}

// Download or view video/audio online
window.downloadVideo = function (videoId, audio) {
  const type = audio === "true" ? "audio" : "video";
  const link = `https://www.youtube.com/watch?v=${videoId}`;
  const format = audio === "true" ? "mp3" : "mp4";
  const quality = "highest";
  const container = document.getElementById("player-container");

  if (audio === "true") {
    container.innerHTML = `
      <audio controls>
        <source src="${link}" type="audio/mp3">
        Your browser does not support the audio element.
      </audio>
    `;
  } else {
    container.innerHTML = `
      <video controls>
        <source src="${link}" type="video/mp4">
        Your browser does not support the video element.
      </video>
    `;
  }
};

// View online audio or video
window.viewOnline = function (videoId, audio) {
  const type = audio === "audio" ? "audio" : "video";
  const link = `https://www.youtube.com/watch?v=${videoId}`;
  const container = document.getElementById("player-container");

  if (audio === "audio") {
    container.innerHTML = `
      <audio controls>
        <source src="${link}" type="audio/mp3">
        Your browser does not support the audio element.
      </audio>
    `;
  } else {
    container.innerHTML = `
      <video controls>
        <source src="${link}" type="video/mp4">
        Your browser does not support the video element.
      </video>
    `;
  }
};
