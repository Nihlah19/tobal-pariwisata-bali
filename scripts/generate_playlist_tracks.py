import numpy as np
import wave
import struct
import os

os.makedirs('public/audio', exist_ok=True)
sample_rate = 32000

# Balinese Pelog Selisir Frequencies (Hz)
scale = {
    'ding3': 130.8,
    'dong3': 146.8,
    'deng3': 164.8,
    'dung3': 196.0,
    'dang3': 220.0,
    'ding4': 261.6,
    'dong4': 293.7,
    'deng4': 329.6,
    'dung4': 392.0,
    'dang4': 440.0,
    'ding5': 523.2,
    'dong5': 587.3,
    'deng5': 659.2,
    'dung5': 784.0,
    'dang5': 880.0,
}

def save_wav(filename, left, right, rate=32000):
    # Normalize
    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if max_val > 0.001:
        left = (left / max_val) * 0.88
        right = (right / max_val) * 0.88

    # 1.8s fade in/out
    fade_len = int(rate * 1.8)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    left[:fade_len] *= fade_in
    right[:fade_len] *= fade_in
    left[-fade_len:] *= fade_out
    right[-fade_len:] *= fade_out

    left_pcm = (left * 32767).astype(np.int16)
    right_pcm = (right * 32767).astype(np.int16)
    num_samples = len(left)
    stereo_pcm = np.empty((num_samples * 2,), dtype=np.int16)
    stereo_pcm[0::2] = left_pcm
    stereo_pcm[1::2] = right_pcm

    filepath = os.path.join('public/audio', filename)
    with wave.open(filepath, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(stereo_pcm.tobytes())

    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"Generated: {filepath} ({size_mb:.2f} MB, {num_samples/rate:.1f}s)")

# ==============================================================================
# TRACK 2: Sekar Jepun Rindik Tradisional
# Joyful Balinese bamboo kotekan with bright accents and temple chimes
# ==============================================================================
def generate_track_2():
    bpm = 84
    beat_sec = 60.0 / bpm
    bars = 16  # 64 beats
    duration = bars * 4 * beat_sec
    num_samples = int(duration * sample_rate)

    left = np.zeros(num_samples, dtype=np.float32)
    right = np.zeros(num_samples, dtype=np.float32)

    # Ambient gentle breeze & forest atmosphere
    np.random.seed(101)
    noise = np.random.normal(0, 0.025, num_samples)
    w_size = 120
    breeze = np.convolve(noise, np.ones(w_size)/w_size, mode='same')
    left += breeze * 0.3
    right += np.roll(breeze, 150) * 0.3

    def strike_rindik(freq, t_start, dur=1.8, vel=0.45, pan=0.0):
        s_idx = int(t_start * sample_rate)
        n_samp = int(dur * sample_rate)
        if s_idx >= num_samples:
            return
        act = min(n_samp, num_samples - s_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        attack = np.minimum(t / 0.003, 1.0)
        decay = np.exp(-t * 3.2)
        env = attack * decay * vel
        f1 = freq
        f2 = freq + 5.8  # Ombak beat
        osc1 = 0.7 * np.sin(2 * np.pi * f1 * t) + 0.22 * np.sin(2 * np.pi * f1 * 2.75 * t) * np.exp(-t * 7)
        osc2 = 0.7 * np.sin(2 * np.pi * f2 * t) + 0.22 * np.sin(2 * np.pi * f2 * 2.75 * t) * np.exp(-t * 7)
        tone = (osc1 + osc2) * 0.5 * env
        gain_l = np.cos((pan + 1) * np.pi / 4)
        gain_r = np.sin((pan + 1) * np.pi / 4)
        left[s_idx : s_idx + act] += tone * gain_l
        right[s_idx : s_idx + act] += tone * gain_r

    def strike_gong(freq, t_start, dur=5.5, vel=0.6):
        s_idx = int(t_start * sample_rate)
        n_samp = int(dur * sample_rate)
        if s_idx >= num_samples:
            return
        act = min(n_samp, num_samples - s_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        env = np.minimum(t / 0.02, 1.0) * np.exp(-t * 0.65) * vel
        tone = (
            0.75 * np.sin(2 * np.pi * freq * t) +
            0.3 * np.sin(2 * np.pi * freq * 2.01 * t) +
            0.15 * np.sin(2 * np.pi * freq * 3.3 * t) * np.exp(-t * 1.5)
        ) * env
        left[s_idx : s_idx + act] += tone * 0.5
        right[s_idx : s_idx + act] += tone * 0.5

    # Sekar Jepun melody motifs (sangsit & polos kotekan)
    motif_polos = [
        ('ding4', 0.0, -0.3), ('dong4', 0.5, -0.2), ('deng4', 1.0, 0.0), ('dung4', 1.5, 0.2),
        ('dang4', 2.0, 0.4),  ('dung4', 2.5, 0.2),  ('deng4', 3.0, 0.0),  ('dong4', 3.5, -0.2),
    ]
    motif_sangsit = [
        ('deng5', 0.25, 0.4), ('dung5', 0.75, 0.3), ('dang4', 1.25, 0.1), ('deng5', 1.75, 0.4),
        ('dung4', 2.25, 0.2), ('deng4', 2.75, -0.1), ('dong4', 3.25, -0.3), ('ding4', 3.75, -0.4),
    ]

    for bar in range(bars):
        b_start = bar * 4 * beat_sec
        # Deep gong every 4 bars
        if bar % 4 == 0:
            strike_gong(65.4, b_start, dur=6.0, vel=0.65)
        elif bar % 2 == 0:
            strike_gong(98.0, b_start, dur=3.8, vel=0.45)

        # Polos layer
        for n, offset, pan in motif_polos:
            t = b_start + offset * beat_sec
            strike_rindik(scale[n], t, dur=1.4, vel=0.36, pan=pan)

        # Sangsit interlocking layer
        for n, offset, pan in motif_sangsit:
            t = b_start + offset * beat_sec
            strike_rindik(scale[n], t, dur=1.1, vel=0.28, pan=pan)

    save_wav('sekar-jepun-rindik.wav', left, right, sample_rate)

# ==============================================================================
# TRACK 3: Suling Suara Alam Dewata
# Meditative Balinese bamboo flute with mountain spring murmur & sacred bells
# ==============================================================================
def generate_track_3():
    bpm = 60
    beat_sec = 60.0 / bpm
    bars = 10  # 40 beats = 40 seconds
    duration = bars * 4 * beat_sec
    num_samples = int(duration * sample_rate)

    left = np.zeros(num_samples, dtype=np.float32)
    right = np.zeros(num_samples, dtype=np.float32)

    # Pure mountain spring water soundscape
    np.random.seed(202)
    stream_noise = np.random.normal(0, 0.035, num_samples)
    w_size = 70
    stream = np.convolve(stream_noise, np.ones(w_size)/w_size, mode='same')
    left += stream * 0.4
    right += np.roll(stream, 300) * 0.4

    # Ceremonial Bell / Gentha
    def ring_bell(freq, t_start, dur=3.5, vel=0.35, pan=0.3):
        s_idx = int(t_start * sample_rate)
        n_samp = int(dur * sample_rate)
        if s_idx >= num_samples:
            return
        act = min(n_samp, num_samples - s_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        env = np.exp(-t * 1.8) * vel
        bell = (
            0.6 * np.sin(2 * np.pi * freq * t) +
            0.35 * np.sin(2 * np.pi * freq * 2.76 * t) +
            0.15 * np.sin(2 * np.pi * freq * 5.4 * t)
        ) * env
        gain_l = np.cos((pan + 1) * np.pi / 4)
        gain_r = np.sin((pan + 1) * np.pi / 4)
        left[s_idx : s_idx + act] += bell * gain_l
        right[s_idx : s_idx + act] += bell * gain_r

    # Balinese Bamboo Suling
    def play_suling_note(freq, t_start, dur=2.4, vel=0.38, pan=0.0):
        s_idx = int(t_start * sample_rate)
        n_samp = int(dur * sample_rate)
        if s_idx >= num_samples:
            return
        act = min(n_samp, num_samples - s_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        # Gentle swell envelope
        env = (np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2) * vel
        # Delicate vibrato 5.1 Hz
        vib = 1.0 + 0.012 * np.sin(2 * np.pi * 5.1 * t)
        sound = (
            np.sin(2 * np.pi * freq * vib * t) +
            0.32 * np.sin(2 * np.pi * freq * 2 * vib * t) +
            0.18 * np.sin(2 * np.pi * freq * 3 * vib * t) +
            0.08 * np.sin(2 * np.pi * freq * 4 * vib * t)
        ) * env
        # Warm breath air
        breath = np.random.normal(0, 0.015, act) * env * 0.35
        out = sound + breath
        gain_l = np.cos((pan + 1) * np.pi / 4)
        gain_r = np.sin((pan + 1) * np.pi / 4)
        left[s_idx : s_idx + act] += out * gain_l
        right[s_idx : s_idx + act] += out * gain_r

    # Deep warm temple gong
    def warm_gong(freq, t_start, dur=7.0, vel=0.55):
        s_idx = int(t_start * sample_rate)
        n_samp = int(dur * sample_rate)
        if s_idx >= num_samples:
            return
        act = min(n_samp, num_samples - s_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        env = np.exp(-t * 0.5) * vel
        gong = (
            0.8 * np.sin(2 * np.pi * freq * t) +
            0.3 * np.sin(2 * np.pi * freq * 2.01 * t) +
            0.12 * np.sin(2 * np.pi * freq * 3.4 * t) * np.exp(-t * 2)
        ) * env
        left[s_idx : s_idx + act] += gong * 0.5
        right[s_idx : s_idx + act] += gong * 0.5

    # Meditative composition
    suling_melody = [
        ('dang4', 2.0, 3.2, 0.0),
        ('dung4', 5.5, 2.8, -0.1),
        ('deng4', 8.5, 3.5, 0.1),
        ('dong4', 12.2, 3.0, -0.1),
        ('ding4', 15.5, 4.0, 0.0),
        
        ('ding5', 20.0, 3.5, 0.2),
        ('dang4', 23.8, 3.0, 0.1),
        ('dung4', 27.0, 3.2, -0.1),
        ('deng4', 30.5, 3.5, 0.0),
        ('dong4', 34.2, 3.8, -0.2),
        ('ding4', 37.0, 2.5, 0.0),
    ]

    warm_gong(65.4, 0.5, dur=8.0, vel=0.6)
    warm_gong(65.4, 19.5, dur=8.0, vel=0.55)

    ring_bell(1200.0, 1.0, dur=4.0, vel=0.25, pan=0.4)
    ring_bell(1450.0, 10.0, dur=3.5, vel=0.22, pan=-0.4)
    ring_bell(1200.0, 20.0, dur=4.0, vel=0.25, pan=0.3)
    ring_bell(1450.0, 30.0, dur=3.5, vel=0.22, pan=-0.3)

    for n, t_start, dur, pan in suling_melody:
        play_suling_note(scale[n], t_start, dur=dur, vel=0.42, pan=pan)

    save_wav('suling-dewata.wav', left, right, sample_rate)

if __name__ == '__main__':
    generate_track_2()
    generate_track_3()
    print("All playlist tracks generated successfully!")
