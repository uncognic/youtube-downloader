document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const urlForm = document.getElementById("urlForm");
    const urlInput = document.getElementById("urlInput");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const updateApiKeyButton = document.getElementById("updateApiKeyButton");
    const loadMoreButton = document.getElementById("loadMoreButton");
    const loadMusicButton = document.getElementById("loadMusicButton");
    const resultsContainer = document.getElementById("resultsContainer");
    const warningCloseButton = document.querySelector(".close-warning");

    let apiKey = localStorage.getItem("youtubeApiKey") || "";
    let nextPageToken = "";

    apiKeyInput.value = apiKey;

    warningCloseButton.addEventListener("click", () => {
        document.querySelector(".warning").style.display = "none";
    });

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        performSearch();
    });

    urlForm.addEventListener("submit", (event) => {
        event.preventDefault();
        handleUrlInput();
    });

    updateApiKeyButton.addEventListener("click", (event) => {
        event.preventDefault();
        updateApiKey();
    });

    loadMoreButton.addEventListener("click", () => {
        performSearch(false, nextPageToken);
    });

    loadMusicButton.addEventListener("click", () => {
        performSearch(true);
    });

    async function performSearch(isMusic = false, pageToken = "") {
        const query = searchInput.value.trim();
        if (!apiKey) {
            alert("Please update the API key.");
            return;
        }

        let url;
        if (isMusic) {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&pageToken=${pageToken}&key=${apiKey}`;
        } else {
            const searchQuery = query || "music";
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
                searchQuery
            )}&type=video&maxResults=20&pageToken=${pageToken}&key=${apiKey}`;
        }

        try {
            const data = await fetchData(url);
            const videoIds = data.items.map((item) => item.id.videoId).join(",");
            const videoData = await fetchData(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`);
            displayResults(videoData.items);
            nextPageToken = data.nextPageToken || "";
            loadMoreButton.style.display = nextPageToken ? "block" : "none";
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function handleUrlInput() {
        const url = urlInput.value.trim();
        if (!url) {
            alert("Please enter a valid URL.");
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            alert("Invalid YouTube URL.");
            return;
        }

        showVideoOverlay(videoId);
    }

    function updateApiKey() {
        apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert("Please enter a valid API key.");
            return;
        }
        localStorage.setItem("youtubeApiKey", apiKey);
        alert("API key updated successfully!");
    }

    function extractVideoId(url) {
        const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
        return videoIdMatch ? videoIdMatch[1] : null;
    }

    async function showVideoOverlay(videoId) {
        try {
            const videoData = await fetchData(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
            displayResults(videoData.items);
        } catch (error) {
            console.error("Error fetching video data:", error);
        }
    }

    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return await response.json();
    }

    function displayResults(items) {
        resultsContainer.innerHTML = "";
        items.forEach((item) => {
            const videoElement = document.createElement("div");
            videoElement.classList.add("video-item");
            videoElement.innerHTML = `
                <img src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}">
                <div class="video-info">
                    <h3>${item.snippet.title}</h3>
                    <p>${item.snippet.description}</p>
                    <button onclick="showVideoOverlay('${item.id}')">Watch</button>
                </div>
            `;
            resultsContainer.appendChild(videoElement);
        });
    }
});
