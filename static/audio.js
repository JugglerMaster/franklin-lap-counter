// biome-ignore lint/correctness/noUnusedVariables: used via <script> include from HTML pages
const FranklinAudio = (() => {
	let audioCtx = null;
	let bitcrusherNode = null;
	let bitcrusherGainNode = null;
	let pulseWave = null;

	let soundEnabled = true;
	let soundStyle = localStorage.getItem("franklin_sound_style") || "classic";

	function initBitcrusher() {
		if (!audioCtx) return;
		if (bitcrusherNode) return;
		const shaper = audioCtx.createWaveShaper();
		const curve = new Float32Array(2048);
		for (let i = 0; i < 2048; i++) {
			const x = (i / 2047) * 2 - 1;
			curve[i] = Math.round(x * 8) / 8;
		}
		shaper.curve = curve;
		shaper.oversample = "2x";
		bitcrusherNode = shaper;
		bitcrusherGainNode = audioCtx.createGain();
		bitcrusherGainNode.gain.value = 3.0;
		bitcrusherNode.connect(bitcrusherGainNode);
		bitcrusherGainNode.connect(audioCtx.destination);
	}

	function initPulseWave() {
		if (!audioCtx) return;
		if (pulseWave) return;
		const real = new Float32Array([0, 0, 0, 0.5, 0.5, 0, 0, 0]);
		const imag = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
		pulseWave = audioCtx.createPeriodicWave(real, imag);
	}

	function play8BitNote(freq, startTime, duration, vol = 0.3) {
		if (!audioCtx) return;
		try {
			initPulseWave();
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.setPeriodicWave(pulseWave);
			osc.frequency.setValueAtTime(freq, startTime);
			gain.gain.setValueAtTime(0, startTime);
			gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
			osc.connect(gain);
			if (bitcrusherNode) {
				gain.connect(bitcrusherNode);
			} else {
				gain.connect(audioCtx.destination);
			}
			osc.start(startTime);
			osc.stop(startTime + duration);
		} catch (_) {}
	}

	function play8BitNoise(startTime, duration, vol = 0.1) {
		if (!audioCtx) return;
		try {
			const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
			const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				data[i] = (Math.random() * 2 - 1) * (i / bufferSize);
			}
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;
			const gain = audioCtx.createGain();
			gain.gain.setValueAtTime(vol, startTime);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
			source.connect(gain);
			if (bitcrusherNode) {
				gain.connect(bitcrusherNode);
			} else {
				gain.connect(audioCtx.destination);
			}
			source.start(startTime);
			source.stop(startTime + duration);
		} catch (_) {}
	}

	function play8BitReadySound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			initBitcrusher();
			const t = audioCtx.currentTime;
			play8BitNote(130.81, t, 0.15, 0.3);
			play8BitNote(130.81, t + 0.25, 0.15, 0.3);
			play8BitNote(130.81, t + 0.5, 0.15, 0.3);
		} catch (_) {}
	}

	function play8BitSetSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			initBitcrusher();
			const t = audioCtx.currentTime;
			play8BitNote(196.0, t, 0.4, 0.3);
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.type = "square";
			osc.frequency.setValueAtTime(196.0, t);
			osc.frequency.linearRampToValueAtTime(392.0, t + 0.4);
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
			gain.gain.linearRampToValueAtTime(0, t + 0.4);
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.start(t);
			osc.stop(t + 0.4);
			play8BitNoise(t, 0.4, 0.08);
		} catch (_) {}
	}

	function play8BitGoSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			initBitcrusher();
			const t = audioCtx.currentTime;
			const notes = [261.63, 293.66, 329.63, 392.0, 523.25, 659.25, 1046.5];
			notes.forEach((freq, i) => {
				play8BitNote(freq, t + i * 0.05, 0.06, 0.25);
			});
			play8BitNoise(t, 0.4, 0.12);
		} catch (_) {}
	}

	function play8BitFinishSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			initBitcrusher();
			const t = audioCtx.currentTime + 0.05;
			const notes = [987.77, 783.99, 659.25, 587.33, 523.25];
			notes.forEach((freq, i) => {
				play8BitNote(freq, t + i * 0.1, 0.15, 0.3);
			});
			play8BitNoise(t, 0.6, 0.25);
		} catch (_) {}
	}

	function beep(freq, durationMs) {
		if (!soundEnabled) return;
		try {
			if (!audioCtx)
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			if (audioCtx.state === "suspended") {
				audioCtx.resume().catch(() => {});
				return;
			}
			const t = audioCtx.currentTime;
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.type = "sine";
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.4, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.start(t);
			osc.stop(t + durationMs / 1000);
		} catch (_) {}
	}

	function playNote(freq, startTime, duration, type = "square", vol = 0.3) {
		if (!audioCtx) return;
		try {
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.type = type;
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, startTime);
			gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
			osc.connect(gain);
			gain.connect(audioCtx.destination);
			osc.start(startTime);
			osc.stop(startTime + duration);
		} catch (_) {}
	}

	function playNoise(startTime, duration, vol = 0.15) {
		if (!audioCtx) return;
		try {
			const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
			const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;
			const gain = audioCtx.createGain();
			gain.gain.setValueAtTime(vol, startTime);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
			source.connect(gain);
			gain.connect(audioCtx.destination);
			source.start(startTime);
			source.stop(startTime + duration);
		} catch (_) {}
	}

	function playReadySound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			const t = audioCtx.currentTime;
			for (const freq of [174.61, 220.0, 261.63, 349.23]) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = "square";
				osc.frequency.setValueAtTime(freq, t);
				gain.gain.setValueAtTime(0, t);
				gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
				gain.gain.linearRampToValueAtTime(0, t + 0.9);
				osc.connect(gain);
				gain.connect(audioCtx.destination);
				osc.start(t);
				osc.stop(t + 0.9);
			}
		} catch (_) {}
	}

	function playSetSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			const t = audioCtx.currentTime;
			for (const freq of [174.61, 220.0, 261.63, 349.23]) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = "square";
				osc.frequency.setValueAtTime(freq, t);
				gain.gain.setValueAtTime(0, t);
				gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
				gain.gain.linearRampToValueAtTime(0, t + 0.9);
				osc.connect(gain);
				gain.connect(audioCtx.destination);
				osc.start(t);
				osc.stop(t + 0.9);
			}
		} catch (_) {}
	}

	function playGoSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			const t = audioCtx.currentTime;
			for (const freq of [196.0, 246.94, 293.66, 392.0]) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = "square";
				osc.frequency.setValueAtTime(freq, t);
				gain.gain.setValueAtTime(0, t);
				gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
				gain.gain.linearRampToValueAtTime(0, t + 2.0);
				osc.connect(gain);
				gain.connect(audioCtx.destination);
				osc.start(t);
				osc.stop(t + 2.0);
			}
		} catch (_) {}
	}

	function playFinishSound() {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			const t = audioCtx.currentTime + 0.05;
			const notes = [783.99, 659.25, 523.25, 392.0, 261.63];
			notes.forEach((freq, i) => {
				playNote(freq, t + i * 0.08, 0.06, "square", 0.25);
			});
			playNoise(t, 0.4, 0.15);
			const hornStart = t + 0.55;
			for (const freq of [261.63, 329.63, 392.0, 523.25]) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = "square";
				osc.frequency.setValueAtTime(freq, hornStart);
				gain.gain.setValueAtTime(0, hornStart);
				gain.gain.linearRampToValueAtTime(0.25, hornStart + 0.05);
				gain.gain.linearRampToValueAtTime(0, hornStart + 2.0);
				osc.connect(gain);
				gain.connect(audioCtx.destination);
				osc.start(hornStart);
				osc.stop(hornStart + 2.0);
			}
		} catch (_) {}
	}

	function dispatch(name) {
		if (!soundEnabled || !audioCtx || audioCtx.state === "suspended") return;
		try {
			if (soundStyle === "8bit") {
				switch (name) {
					case "ready":
						play8BitReadySound();
						break;
					case "set":
						play8BitSetSound();
						break;
					case "go":
						play8BitGoSound();
						break;
					case "finish":
						play8BitFinishSound();
						break;
				}
			} else {
				switch (name) {
					case "ready":
						playReadySound();
						break;
					case "set":
						playSetSound();
						break;
					case "go":
						playGoSound();
						break;
					case "finish":
						playFinishSound();
						break;
				}
			}
		} catch (_) {}
	}

	return {
		async init() {
			if (!audioCtx)
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			if (audioCtx.state === "suspended") await audioCtx.resume();
		},

		isReady() {
			return audioCtx !== null && audioCtx.state !== "suspended";
		},

		playReady() {
			dispatch("ready");
		},
		playSet() {
			dispatch("set");
		},
		playGo() {
			dispatch("go");
		},
		playFinish() {
			dispatch("finish");
		},

		beep(freq, durationMs) {
			beep(freq, durationMs);
		},

		setEnabled(enabled) {
			soundEnabled = enabled;
		},

		getEnabled() {
			return soundEnabled;
		},

		setStyle(style) {
			soundStyle = style;
			localStorage.setItem("franklin_sound_style", style);
		},

		getStyle() {
			return soundStyle;
		},
	};
})();
