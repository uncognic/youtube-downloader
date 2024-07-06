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
  let area;

  loadMoreButton.style.display = "none";

  if (!apiKey) {
    apiKey = prompt(
      "Please enter your YouTube API key (if you don't know what this is, please contact me):"
    );
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  searchButton.addEventListener("click", () => performSearch());

  urlButton.addEventListener("click", () => handleUrlInput());

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

  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    performSearch();
  });

  urlForm.addEventListener("submit", function (e) {
    e.preventDefault();
    handleUrlInput();
  });

  loadMoreButton.addEventListener("click", () => {
    if (nextPageToken) {
      performSearch(false, nextPageToken);
    }
  });

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

  window.closeWarning = function () {
    const overlay = document.querySelector(".warning");
    if (overlay) {
      overlay.classList.add("fade-out");

      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }
  };

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

  function extractVideoIdFromUrl(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  window.downloadVideo = function (videoId, audio) {
    const cobaltApiUrl = "https://api.cobalt.tools/api/json";

    fetch(cobaltApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        isAudioOnly: audio === "true",
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
        alert("Error while trying to fetch download link.");
      });
  };

  window.viewOnline = function (videoId, type) {
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
            "This is a live video. Please wait until the broadcast ends and try again."
          );
          return;
        }

        const playUrl = data.url;
        if (playUrl) {
          if (type === "video") {
            videoPlayer.src = playUrl;
            videoPlayer.style.display = "block";
            audioPlayer.style.display = "none";
          } else {
            audioPlayer.crossOrigin = "anonymous";
            audioPlayer.src = playUrl;
            audioPlayer.style.display = "block";
            videoPlayer.style.display = "none";
            audioPlayer.load();
            startVisualization(audioPlayer);
          }
          playerContainer.style.display = "flex";
        } else {
          alert("Could not find online play link. Sorry.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error while trying to fetch online play link.");
      });
  };

  function formatDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    let formattedDuration = "";

    if (hours > 0) {
      formattedDuration += hours + ":";
    }

    if (minutes < 10) {
      formattedDuration += "0" + minutes + ":";
    } else {
      formattedDuration += minutes + ":";
    }

    if (seconds < 10) {
      formattedDuration += "0" + seconds;
    } else {
      formattedDuration += seconds;
    }

    return formattedDuration;
  }

  function startVisualization(audio) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.getElementById("audio-canvas");
    const canvasCtx = canvas.getContext("2d");

    function draw() {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = "rgb(0, 0, 0)";
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    }

    draw();
  }
});
