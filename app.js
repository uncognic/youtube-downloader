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

  let apiKey = localStorage.getItem("youtubeApiKey");
  let nextPageToken = "";
  let isMusicOnly = false;

  loadMoreButton.style.display = "none";

  const existingOverlay = document.querySelector(".video-overlay");
  const existingWarning = document.querySelector(".warning");

  if (!apiKey) {
    apiKey = prompt(
      "Por favor coloque sua chave do youtube (se não saber o que é, só mande mensagem pra mim):"
    );
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  searchButton.addEventListener("click", () => performSearch());

  urlButton.addEventListener("click", () => handleUrlInput());

  updateApiKeyButton.addEventListener("click", () => {
    apiKey = prompt("Coloque uma chave nova do youtube:");
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
        alert("URL do YouTube inválido");
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
                  <button class="download-btn" onclick="downloadVideo('${videoId}', 'true')">Baixar MP3</button>
                  <button class="download-btn" onclick="downloadVideo('${videoId}', 'false')">Baixar MP4</button>
                  <button class="download-btn" onclick="viewOnline('${videoId}', 'audio')">Ver Online MP3</button>
                  <button class="download-btn" onclick="viewOnline('${videoId}', 'video')">Ver Online MP4</button>
                </div>
              `;

          document.body.appendChild(overlay);
          document.body.classList.add("blurred");
          setTimeout(() => {
            overlay.classList.add("visible");
          }, 10);
        } else {
          alert("Vídeo não encontrado");
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
                <button class="download-btn" onclick="downloadVideo('${videoId}', 'true')">Baixar MP3</button>
                <button class="download-btn" onclick="downloadVideo('${videoId}', 'false')">Baixar MP4</button>
                <button class="download-btn" onclick="viewOnline('${videoId}', 'audio')">Ver Online MP3</button>
                <button class="download-btn" onclick="viewOnline('${videoId}', 'video')">Ver Online MP4</button>
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
          alert("Não foi possível encontrar o link para download. Desculpe.");
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao tentar buscar o link de download.");
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
            "Este é um vídeo ao vivo. Aguarde o término da transmissão e tente novamente."
          );
          return;
        }

        const downloadUrl = data.url;
        if (downloadUrl) {
          const playerContainer = document.getElementById("player-container");
          const videoPlayer = document.getElementById("video-player");
          const audioPlayer = document.getElementById("audio-player");

          if (type === "video") {
            videoPlayer.src = downloadUrl;
            videoPlayer.style.display = "block";
            audioPlayer.style.display = "none";
          } else {
            audioPlayer.src = downloadUrl;
            audioPlayer.style.display = "block";
            videoPlayer.style.display = "none";
          }

          playerContainer.style.display = "flex"; // Show the player container
        } else {
          alert("Não foi possível encontrar o link para reprodução. Desculpe.");
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao tentar buscar o link de reprodução.");
      });
  };

  // Check URL parameters and initialize search if needed
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
