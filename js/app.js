document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const updateApiKeyButton = document.getElementById("updateApiKeyButton");
  const musicButton = document.getElementById("music");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const playerContainer = document.getElementById("player-container");
  const videoPlayer = document.getElementById("video-player");
  const audioPlayer = document.getElementById("audio-player");

  let apiKey = localStorage.getItem("youtubeApiKey");
  let nextPageToken = "";
  let isMusicOnly = false;

  loadMoreButton.style.display = "none";

  if (!apiKey) {
    apiKey = prompt("Please enter your YouTube API key:");
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  searchButton.addEventListener("click", (event) => handleSearch(event));
  searchForm.addEventListener("submit", (event) => handleSearch(event));
  musicButton.addEventListener("click", () => {
    isMusicOnly = true;
    performSearch();
  });
  updateApiKeyButton.addEventListener("click", () => updateApiKey());

  loadMoreButton.addEventListener("click", () => {
    if (nextPageToken) {
      performSearch(false, nextPageToken);
    }
  });

  function handleSearch(event) {
    event.preventDefault();
    const query = apiKeyInput.value.trim();
    if (query === "") return;

    if (isYouTubeUrl(query)) {
      handleUrlInput(query);
    } else {
      performSearch();
    }
  }

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
            <img src="${thumbnailUrl}" alt="${title}" class="thumbnail">
            <h3>${title}</h3>
            <button class="download-btn" onclick="downloadVideo('${videoId}', true)">Download MP3</button>
            <button class="download-btn" onclick="downloadVideo('${videoId}', false)">Download MP4</button>
            <button class="play-btn" onclick="playVideo('${videoId}')">Play</button>
        `;

      resultsDiv.appendChild(videoElement);
    });
  }

  function handleUrlInput(url) {
    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    showVideoOverlay(videoId);
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
                  <button class="download-btn" onclick="downloadVideo('${videoId}', true)">Download MP3</button>
                  <button class="download-btn" onclick="downloadVideo('${videoId}', false)">Download MP4</button>
                  <button class="play-btn" onclick="playVideo('${videoId}')">Play</button>
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

  function downloadVideo(videoId, isAudio) {
    const cobaltApiUrl = "https://api.cobalt.tools/api/json";

    fetch(cobaltApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        isAudioOnly: isAudio,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const downloadUrl = data.url;
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        } else {
          alert("Unable to find download link. Sorry.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error fetching download link.");
      });
  }

  function playVideo(videoId) {
    const cobaltApiUrl = "https://api.cobalt.tools/api/json";

    fetch(cobaltApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const playUrl = data.url;
        if (playUrl) {
          videoPlayer.src = playUrl;
          videoPlayer.style.display = "block";
          audioPlayer.style.display = "none";
          playerContainer.style.display = "block";
          videoPlayer.play();
        } else {
          alert("Unable to play video. Sorry.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error playing video.");
      });
  }

  function closeOverlay() {
    const overlay = document.querySelector(".video-overlay");
    if (overlay) {
      overlay.classList.remove("visible");
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.classList.remove("blurred");
      }, 300);
    }
  }

  function updateApiKey() {
    apiKey = prompt("Please enter a new YouTube API key:");
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  function isYouTubeUrl(url) {
    return (
      url.toLowerCase().includes("youtube.com") ||
      url.toLowerCase().includes("youtu.be")
    );
  }

  function extractVideoIdFromUrl(url) {
    const regExp =
      /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  }
});
