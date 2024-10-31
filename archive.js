// archive.js

document.addEventListener('DOMContentLoaded', () => {
    const audioGrid = document.getElementById('audio-grid');
    let audioElements = [];

    // Fetch the archive data from the backend
    async function fetchArchive() {
        try {
            const response = await fetch("https://api.leoscarin.com/archive");
            if (!response.ok) {
                throw new Error("Failed to fetch archive");
            }
            const data = await response.json();
            displayAudioRectangles(data.entries);
        } catch (error) {
            console.error("Error fetching archive:", error);
            audioGrid.innerHTML = "<p>Failed to load archive.</p>";
        }
    }

    // Display the audio rectangles
    function displayAudioRectangles(entries) {
        entries.forEach((entry, index) => {
            const rectangle = document.createElement('div');
            rectangle.classList.add('audio-rectangle');
            rectangle.dataset.index = index;

            const title = document.createElement('div');
            title.classList.add('title');
            title.textContent = entry.name;

            const progressOverlay = document.createElement('div');
            progressOverlay.classList.add('progress-overlay');

            rectangle.appendChild(progressOverlay);
            rectangle.appendChild(title);
            audioGrid.appendChild(rectangle);

            // Create an audio element
            const audio = new Audio(entry.link);
            audioElements.push(audio);

            // Add click and touch event listeners
            rectangle.addEventListener('click', () => {
                playAudio(index);
            });

            rectangle.addEventListener('touchstart', () => {
                playAudio(index);
            });

            // Update progress overlay during playback
            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressOverlay.style.width = `${progress}%`;
            });

            // Reset overlay when playback ends
            audio.addEventListener('ended', () => {
                progressOverlay.style.width = '0%';
            });

            // Handle audio errors
            audio.addEventListener('error', (e) => {
                alert('Audio failed to play. Please try again later.');
                console.error('Audio error:', e);
            });
        });
    }

    // Play the audio corresponding to the rectangle
    function playAudio(index) {
        // Pause all other audios
        audioElements.forEach((audio, idx) => {
            if (idx !== index) {
                audio.pause();
                audio.currentTime = 0;
                // Reset progress overlay
                const rectangle = document.querySelector(`.audio-rectangle[data-index='${idx}']`);
                const overlay = rectangle.querySelector('.progress-overlay');
                overlay.style.width = '0%';
            }
        });

        const currentAudio = audioElements[index];

        // If the audio is already playing, pause it
        if (!currentAudio.paused) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            const rectangle = document.querySelector(`.audio-rectangle[data-index='${index}']`);
            const overlay = rectangle.querySelector('.progress-overlay');
            overlay.style.width = '0%';
            return;
        }

        // Play selected audio
        currentAudio.play();
    }

    // Back button functionality
    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'index.html'; // Adjust the path if necessary
    });

    // Fetch and display the archive on page load
    fetchArchive();
});
