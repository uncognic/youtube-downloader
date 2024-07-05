document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const updateApiKeyButton = document.getElementById("updateApiKeyButton");

  // Load API key from local storage
  let apiKey = localStorage.getItem("youtubeApiKey");
  if (!apiKey) {
    apiKey = prompt(
      "Por favor coloque sua chave do youtube (se não saber o que é, só mande mensagem pra mim):"
    );
    if (apiKey) {
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  }

  searchButton.addEventListener("click", performSearch);
  apiKeyInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") performSearch();
  });

  urlButton.addEventListener("click", handleUrlInput);
  urlInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") handleUrlInput();
  });

  updateApiKeyButton.addEventListener("click", () => {
    apiKey = prompt("Coloque uma chave nova do youtube:");
    if (apiKey) {
      localStorage.removeItem("youtubeApiKey");
      localStorage.setItem("youtubeApiKey", apiKey);
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
                            </div>
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
      overlay.classList.remove("visible");
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.classList.remove("blurred");
      }, 300);
    }
  };
  function performSearch() {
    const query = apiKeyInput.value;
    if (!query || !apiKey) return;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&maxResults=20&key=${apiKey}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        displayResults(data.items);
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
                <div class="video-info">
                    <h3>${title}</h3>
                    <div class="download-buttons">
                        <button class="download-btn" onclick="downloadVideo('${videoId}', 'true')">Baixar MP3</button>
                        <button class="download-btn" onclick="downloadVideo('${videoId}', 'false')">Baixar MP4</button>
                    </div>
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
});
