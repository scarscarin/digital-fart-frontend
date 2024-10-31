// Get HTML elements
const playback = document.getElementById("playback");
const recordButton = document.getElementById("recordBtn");
const stopButton = document.getElementById("stopBtn");
const statusText = document.getElementById("status");
const archiveSelect = document.getElementById("archiveSelect");
const archivePlayer = document.getElementById("archivePlayer");
let mediaRecorder;
let audioChunks = [];

// Start recording
recordButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        // Assign the onstop handler here
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            const formData = new FormData();
            formData.append("audio", audioBlob, `audio_${Date.now()}.wav`);

            // Set playback source to the recorded audio for preview
            if (playback) {
                playback.src = URL.createObjectURL(audioBlob);
                playback.play();
            }

            // Upload audio to the backend
            try {
                const response = await fetch("https://api.leoscarin.com/upload", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                const result = await response.json();
                statusText.textContent = result.message || "Upload complete";

                // Refresh the archive list after successful upload
                fetchArchive();
            } catch (error) {
                statusText.textContent = "Failed to upload audio. Please try again.";
                console.error("Error uploading audio:", error);
            }

            recordButton.disabled = false;
            stopButton.disabled = true;
        };

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
        statusText.textContent = "Recording...";
        recordButton.disabled = true;
        stopButton.disabled = false;

        // Automatically stop recording after 5 seconds
        setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                statusText.textContent = "Stopped recording";
                recordButton.disabled = false;
                stopButton.disabled = true;
            }
        }, 5000);
    } catch (error) {
        statusText.textContent = "Microphone access denied. Please enable it and try again.";
        console.error("Error accessing microphone:", error);
    }
});

// Stop recording manually
stopButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        statusText.textContent = "Stopped recording";
        recordButton.disabled = false;
        stopButton.disabled = true;
    }
});


// Archive Fetching Section
async function fetchArchive() {
    try {
        const response = await fetch("https://api.leoscarin.com/archive");

        if (!response.ok) {
            throw new Error("Failed to fetch archive");
        }

        const data = await response.json();
        archiveSelect.innerHTML = "";

        // Create a default option
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Select an audio";
        defaultOption.value = "";
        archiveSelect.appendChild(defaultOption);

        // Populate the select options
        data.entries.forEach((entry) => {
            const option = document.createElement("option");
            option.value = entry.link;
            option.textContent = entry.name;
            archiveSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching archive:", error);
        statusText.textContent = "Failed to load archive.";
    }
}

// Event listener for archive selection
archiveSelect.addEventListener("change", function() {
    const selectedLink = this.value;

    if (selectedLink) {
        archivePlayer.src = selectedLink;
        archivePlayer.play();
    } else {
        archivePlayer.pause();
        archivePlayer.src = "";
    }
});

// Call fetchArchive when the page loads
window.onload = function() {
    fetchArchive();
};