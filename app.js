// Get HTML elements
const playback = document.getElementById("playback");
const recordButton = document.getElementById("recordBtn");
const stopButton = document.getElementById("stopBtn");
const statusText = document.getElementById("status");
const archiveSelect = document.getElementById("archiveSelect");
const archivePlayer = document.getElementById("archivePlayer");
let recorder;
let stream;

// Start recording
recordButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.textContent = "Your browser does not support audio recording.";
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        recorder = new RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/wav',
            recorderType: RecordRTC.StereoAudioRecorder,
        });

        recorder.startRecording();

        statusText.textContent = "Recording...";
        recordButton.disabled = true;
        stopButton.disabled = false;

        // Automatically stop recording after 5 seconds
        setTimeout(() => {
            if (recorder && recorder.getState() === "recording") {
                stopRecording();
            }
        }, 5000);

    } catch (error) {
        statusText.textContent = "Microphone access denied. Please enable it and try again.";
        console.error("Error accessing microphone:", error);
    }
});

// Stop recording manually
stopButton.addEventListener("click", () => {
    if (recorder && recorder.getState() === "recording") {
        stopRecording();
    }
});

function stopRecording() {
    recorder.stopRecording(async () => {
        const blob = recorder.getBlob();

        // Set playback source to the recorded audio for preview
        if (playback) {
            playback.src = URL.createObjectURL(blob);
            playback.play();
        }

        // Upload audio to the backend
        try {
            const formData = new FormData();
            formData.append("audio", blob, `audio_${Date.now()}.wav`);

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

        // Clean up
        recorder.destroy();
        recorder = null;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        recordButton.disabled = false;
        stopButton.disabled = true;
    });

    statusText.textContent = "Stopped recording";
}

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

            // Use the display name from the backend
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
