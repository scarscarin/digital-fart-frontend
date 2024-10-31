const recordButton = document.getElementById("recordBtn");
const statusText = document.getElementById("status");
const archiveButton = document.getElementById('archive-button');

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

function stopRecording() {
    recorder.stopRecording(async () => {
        const blob = recorder.getBlob();

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

        statusText.textContent = "Recording stopped and uploaded.";
    });
}

// Archive button functionality
archiveButton.addEventListener('click', () => {
    window.location.href = 'archive.html'; // Adjust the path if necessary
});
