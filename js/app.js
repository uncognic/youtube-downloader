document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");
  const updateApiKeyButton = document.getElementById("updateApiKeyButton");
  const musicButton = document.getElementById("music");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const urlInput = document.getElementById("urlInput");
  const searchForm = document.getElementById("searchForm");
  const urlForm = document.getElementById("urlForm"); // Ensure this exists in your HTML
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

  // Event listeners
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    performSearch();
  });

  if (urlForm) { // Check if urlForm exists before adding event listener
    urlForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleUrlInput();
    });
  }

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
      performSearch(false, nextPageToken);
    }
  });

  function performSearch(isMusic = false, pageToken = "") {
    const query = isMusic ? "music" : apiKeyInput.value.trim();
    if (!apiKey) return;

    let url;
    if (isMusic) {
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

  function displayResults(videos) {
    resultsDiv.innerHTML = "";

    videos.forEach((video) => {
      const { title, thumbnails } = video.snippet;
      const videoId = video.id.videoId;
      const thumbnailUrl = thumbnails.high.url;

      const videoElement = document.createElement("div");
      videoElement.className = "video-item";

      videoElement.innerHTML = `
            <div class="thumbnail-container">
              <img src="${thumbnailUrl}" alt="${title}" class="thumbnail">
              <div class="download-buttons">
                <button class="download-btn" onclick="showVideoOverlay('${videoId}')">Download MP3</button>
                <button class="download-btn" onclick="showVideoOverlay('${videoId}')">Download MP4</button>
                <button class="download-btn" onclick="showVideoOverlay('${videoId}', 'audio')">View Online MP3</button>
                <button class="download-btn" onclick="showVideoOverlay('${videoId}', 'video')">View Online MP4</button>
              </div>
            </div>
            <div class="video-info">
              <h3>${title}</h3>
            </div>
          `;

      resultsDiv.appendChild(videoElement);
    });
  }

  function handleUrlInput() {
    const url = urlInput.value.trim();
    const videoId = extractVideoIdFromUrl(url);
    if (videoId) {
      showVideoOverlay(videoId);
    } else {
      alert("Invalid YouTube URL");
    }
  }

  function showVideoOverlay(videoId, type) {
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
                  <button class="download-btn" onclick="downloadVideo('${videoId}', true)">Download MP3</button>
                  <button class="download-btn" onclick="downloadVideo('${videoId}', false)">Download MP4</button>
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

  function downloadVideo(videoId, audio) {
    const cobaltApiUrl = "https://api.cobalt.tools/api/json";

    fetch(cobaltApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        isAudioOnly: audio,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const downloadUrl = data.url;
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        } else {
          alert("Could not find download link. Sorry.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error fetching download link.");
      });
  }

  function viewOnline(videoId, type) {
    const cobaltApiUrl = "https://api.cobalt.tools/api/json";

    fetch(cobaltApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        isAudioOnly: type === "audio",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "error") {
          alert(
            "This is a live video. Please wait for the broadcast to end and try again."
          );
          return;
        }

        const playbackUrl = data.url;
        if (playbackUrl) {
          if (type === "video") {
            videoPlayer.src = playbackUrl;
            videoPlayer.style.display = "block";
            audioPlayer.style.display = "none";
          } else {
            audioPlayer.crossOrigin = "anonymous";
            audioPlayer.src = playbackUrl;
            audioPlayer.style.display = "block";
            videoPlayer.style.display = "none";
            audioPlayer.load();
          }
          playerContainer.style.display = "flex";
        } else {
          alert("Could not find playback link. Sorry.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error fetching playback link.");
      });
  }

});

function closeOverlay() {
  const overlay = document.querySelector(".video-overlay");
  if (overlay) {
    overlay.classList.add("fade-out");

    setTimeout(() => {
      document.body.removeChild(overlay);
      document.body.classList.remove("blurred");
    }, 300);
  }
}

function closeWarning() {
  const overlay = document.querySelector(".warning");
  if (overlay) {
    overlay.classList.add("fade-out");

    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  }
}
