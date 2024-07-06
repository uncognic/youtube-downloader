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
      "Please enter your YouTube API key (if you don't know what this is, just message me):"
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
        alert("Error fetching download link.");
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
            "This is a live video. Please wait for the broadcast to end and try again."
          );
          return;
        }

        const downloadUrl = data.url;
        if (downloadUrl) {
          if (type === "video") {
            videoPlayer.src = downloadUrl;
            videoPlayer.style.display = "block";
            audioPlayer.style.display = "none";
          } else {
            audioPlayer.crossOrigin = "anonymous";
            audioPlayer.src = downloadUrl;
            audioPlayer.style.display = "block";
            videoPlayer.style.display = "none";
            audioPlayer.load();
            startVis(audioPlayer);
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
  };

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

// 3d visualizer code here
function clearScene() {
  const canvas = area.firstElementChild;
  area.removeChild(canvas);
}

function startVis(audioPlayer) {
  const area = document.getElementById("visualizer");
  if (!area) {
    console.error("Element with ID 'visualizer' not found.");
    return;
  }

  const context = new AudioContext();
  const source = context.createMediaElementSource(audioPlayer);
  const analyser = context.createAnalyser();
  source.connect(analyser);
  analyser.connect(context.destination);
  analyser.fftSize = 512;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 100;
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor("#1e1e2e");

  area.appendChild(renderer.domElement);

  const geometry = new THREE.IcosahedronGeometry(20, 3);
  const material = new THREE.MeshLambertMaterial({
    color: "#696969",
    wireframe: true,
  });
  const sphere = new THREE.Mesh(geometry, material);

  const light = new THREE.DirectionalLight("#ffffff", 0.8);
  light.position.set(0, 50, 100);
  scene.add(light);
  scene.add(sphere);

  area.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function render() {
    analyser.getByteFrequencyData(dataArray);

    const lowerHalf = Array.from(dataArray.slice(0, dataArray.length / 2 - 1));
    const upperHalf = Array.from(
      dataArray.slice(dataArray.length / 2 - 1, dataArray.length - 1)
    );

    const lowerMax = Math.max(...lowerHalf);
    const upperAvg = upperHalf.reduce((a, b) => a + b, 0) / upperHalf.length;

    const lowerMaxFr = modulate(
      Math.pow(lowerMax / lowerHalf.length, 0.8),
      0,
      1,
      0,
      8
    );
    const upperAvgFr = modulate(upperAvg / upperHalf.length, 0, 1, 0, 4);

    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.003;
    sphere.rotation.z += 0.005;

    WarpSphere(sphere, lowerMaxFr, upperAvgFr);
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function WarpSphere(mesh, bassFr, treFr) {
    let noise = new SimplexNoise();
    mesh.geometry.vertices.forEach(function (vertex, i) {
      var offset = mesh.geometry.parameters.radius;
      var amp = 0.7;
      var time = window.performance.now();
      vertex.normalize();
      var rf = 0.0001;
      var distance =
        offset +
        bassFr +
        noise.noise3D(
          vertex.x + time * rf * 4,
          vertex.y + time * rf * 6,
          vertex.z + time * rf * 7
        ) *
          amp *
          treFr *
          2;
      vertex.lerp(vertex.clone().multiplyScalar(distance), 1.5);
    });
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.comput;
  }
  render();
}

function modulate(value, minInput, maxInput, minOutput, maxOutput) {
  const inputRange = maxInput - minInput;
  const outputRange = maxOutput - minOutput;

  value = Math.min(Math.max(value, minInput), maxInput);

  const normalizedValue = (value - minInput) / inputRange;

  const outputValue = normalizedValue * outputRange + minOutput;

  return outputValue;
}
