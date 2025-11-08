class TalkingTom{
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.currentSound = null;
        
        this.button = document.getElementById('voice-button');
        this.container = document.querySelector('.voice-assets-container'); // highlight ADDED (PLS CHECK HUHU)
        this.textDiv = this.button.querySelector('.text'); // highlight - ADDED (PLS CHECK HUHU)
        this.button.addEventListener('click', () => this.startFixedRecording());
        
        // Initialize Howler (optional but good practice)
        if (typeof Howl !== 'undefined') {
            Howler.volume(1.0);
        }
    }

    async startFixedRecording() {
        if (this.isRecording) return;
        
        // Disable button during recording and playback
        this.button.disabled = true;
        this.button.classList.add('recording');
        this.container.classList.add('active'); // highlight - ADDED (PLS CHECK HUHU)
        if (this.textDiv) this.textDiv.textContent = " Talking..."; // highlight - ADDED (PLS CHECK HUHU)
        // Call the existing startRecording method
        await this.startRecording();
        
        // Re-enable button after 10 seconds (5s recording + 5s playback)
        setTimeout(() => {
            this.button.disabled = false;
            this.button.classList.remove('recording');
            this.container.classList.remove('active'); // highlight - ADDED (PLS CHECK HUHU)
            if (this.textDiv) this.textDiv.textContent = " Talk to your chicken!"; // highlight - ADDED (PLS CHECK HUHU)
        }, 10000);
    }

    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.button.classList.add('recording');
            
            // Auto-stop after 3 seconds (Talking Tom style)
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopAndPlay();
                }
            }, 5000);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Microphone access denied!');
        }
    }

    async stopAndPlay() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            return;
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                await this.playWithHowler(audioUrl);
                
                // Cleanup
                this.stream.getTracks().forEach(track => track.stop());
                resolve();
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
            this.button.classList.remove('recording');
        });
    }

    async playWithHowler(audioUrl) {
        this.button.classList.add('playing');
        if (this.textDiv) this.textDiv.textContent = " Playing..."; // highlight - ADDED (PLS CHECK HUHU)

        // Try Web Audio API first for true pitch shift
        if (window.AudioContext) {
            await this.playWithTruePitchShift(audioUrl);
            return;
        }
        
        // Fallback to Howler with optimized rate
        this.currentSound = new Howl({
            src: [audioUrl],
            rate: 1.3, // Optimal Talking Tom rate
            volume: 0.8,
            onend: () => this.cleanupPlayback(audioUrl),
            onloaderror: () => this.cleanupPlayback(audioUrl)
        });
        
        this.currentSound.play();
    }

    cleanupPlayback(audioUrl) {
        URL.revokeObjectURL(audioUrl);
        this.button.classList.remove('playing');
        this.currentSound = null;
    }
    async playWithTruePitchShift(audioUrl) {
        window.app.uiSystem.roosters.updateSingleAvatar(true, "talking");
        // Play after 5000ms (5 seconds)
        setTimeout(() => {
            window.app.uiSystem.roosters.updateSingleAvatar(true);
        }, 5000);

        this.button.classList.add('playing');
        if (this.textDiv) this.textDiv.textContent = " Playing..."; // highlight - ADDED (PLS CHECK HUHU)

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Create all audio nodes
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            // Configure nodes
            source.buffer = audioBuffer;
            source.detune.value = 700;    // Higher pitch
            source.playbackRate.value = 1.0; // Normal speed
            
            //gainNode.gain.value = 1.8;    // 180% volume
            gainNode.gain.value = 2.5;    // 250% volume (even louder!)
            
            filter.type = 'highpass';
            filter.frequency.value = 300; // Make voice brighter
            
            // Connect: source → filter → gain → destination
            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            source.start();
            
            source.onended = () => {
                this.cleanupPlayback(audioUrl);
            };

        } catch (error) {
            console.error('Error with pitch shift:', error);
            this.cleanupPlayback(audioUrl);
        }
    }
    // Cleanup method
    destroy() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound.unload();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Initialize the button
