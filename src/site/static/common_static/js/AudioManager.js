import * as THREE from '../../lib/threejs/src/Three.js';

export default class AudioManager 
{
    /**
     * Initializes the AudioManager with default values.
     */
    constructor(camera) 
    {
        this.audio = undefined;
        this.listener = undefined;
        this.audioLoader = undefined;
        this.audioContext = undefined;
        this.camera = camera; // Pass the camera during instantiation
    }

    /**
     * Initializes the audio-related variables, including the listener and context.
     */
    initAudioVar() 
    {
        if (!this.camera) 
        {
            console.error("Camera is not defined. Ensure it is passed to the AudioManager.");
            return;
        }

        this.audioLoader = new THREE.AudioLoader();
        this.listener = new THREE.AudioListener();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
        THREE.AudioContext.setContext(this.audioContext);
        this.audio = new THREE.Audio(this.listener);

        this.camera.add(this.listener);
    }

    /**
     * Plays the audio from a given path with optional volume and loop settings.
     * @param {string} audioPath - The path to the audio file.
     * @param {Object} options - Audio settings.
     * @param {number} [options.volume=1.0] - The volume level (0.0 to 1.0).
     * @param {boolean} [options.loop=true] - Whether the audio should loop.
     */
    playAudio(audioPath, { volume = 1.0, loop = true } = {}) 
    {
        if (!this.audioLoader || !this.audio) 
        {
            console.error("AudioManager not initialized. Call `initAudioVar` first.");
            return;
        }

        const loadAndPlayAudio = () => {
            this.audioLoader.load(audioPath, (buffer) => {
                if (buffer) 
                {
                    this.audio.setBuffer(buffer);
                    this.audio.setLoop(loop);
                    this.audio.setVolume(volume);
                    this.audio.play();
                } 
                else 
                    console.error("Audio buffer not loaded.");
            });
        };

        const resumeAudioContext = () => {
            if (this.audioContext.state === 'suspended') 
            {
                this.audioContext.resume().then(() => {
                        loadAndPlayAudio();
                }).catch((error) => {
                    console.error("Error resuming AudioContext:", error);
                });
            } 
            else 
                loadAndPlayAudio();
        };

        document.addEventListener('click', resumeAudioContext, { once: true });
    }

    /**
     * Stops the currently playing audio.
     */
    stopAudio() 
    {
        if (this.audio && this.audio.isPlaying) 
            this.audio.stop();
        else
            console.warn("No audio is currently playing.");
    }
}
