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

  updateApiKeyButton.addEventListener("click", () => {
    apiKey = prompt("Coloque uma chave nova do youtube:");
    if (apiKey) {
      localStorage.removeItem("youtubeApiKey");
      localStorage.setItem("youtubeApiKey", apiKey);
    }
  });

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

  window.downloadVideo = function (videoId, audio) {
    const cobaltApiUrl = "https://api.cobalt.tools/v1/download"; // Update with the correct Cobalt API endpoint

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
