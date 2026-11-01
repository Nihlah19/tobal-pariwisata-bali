import numpy as np
import wave
import struct
import os

# Create audio directory if not exists
os.makedirs('public/audio', exist_ok=True)

sample_rate = 44100
bpm = 72  # Calm, slow relaxing tempo
beat_duration = 60.0 / bpm
bars = 16  # 4 beats per bar = 64 beats
total_duration = bars * 4 * beat_duration  # ~53.3 seconds
num_samples = int(total_duration * sample_rate)

time = np.linspace(0, total_duration, num_samples, endpoint=False)

# Stereo buffers
left = np.zeros(num_samples, dtype=np.float32)
right = np.zeros(num_samples, dtype=np.float32)

# 1. Background nature atmosphere: Soft river stream & gentle breeze (filtered noise)
np.random.seed(42)
noise = np.random.normal(0, 0.04, num_samples)
# Smooth rolling average for water murmur
window_size = 80
water_stream = np.convolve(noise, np.ones(window_size)/window_size, mode='same')
left += water_stream * 0.35
right += np.roll(water_stream, 200) * 0.35

# 2. Balinese Pelog Selisir Frequencies (Hz)
# Ding, Dong, Deng, Dung, Dang
scale = {
    'ding3': 130.8,
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
}

# Function to synthesize a single Rindik Bamboo Bar Strike
def add_rindik_note(freq, start_time, duration=2.2, velocity=0.5, pan=0.0):
    start_idx = int(start_time * sample_rate)
    note_samples = int(duration * sample_rate)
    if start_idx >= num_samples:
        return
    actual_samples = min(note_samples, num_samples - start_idx)
    t = np.linspace(0, actual_samples / sample_rate, actual_samples, endpoint=False)

    # Mallet strike envelope: quick attack (3ms), exponential decay
    attack = np.minimum(t / 0.004, 1.0)
    decay = np.exp(-t * 2.8)
    env = attack * decay * velocity

    # Balinese Ombak: 2 pipes paired ~5.5 Hz apart for shimmering acoustic interference
    f1 = freq
    f2 = freq + 5.5
    # Bamboo harmonic ratios: 1x, 2.76x, 5.4x (tubular bamboo column acoustics)
    osc1 = 0.65 * np.sin(2 * np.pi * f1 * t) + 0.25 * np.sin(2 * np.pi * f1 * 2.76 * t) * np.exp(-t * 6)
    osc2 = 0.65 * np.sin(2 * np.pi * f2 * t) + 0.25 * np.sin(2 * np.pi * f2 * 2.76 * t) * np.exp(-t * 6)
    tone = (osc1 + osc2) * 0.5 * env

    # Stereo panning (-1.0 = left, 1.0 = right)
    gain_l = np.cos((pan + 1) * np.pi / 4)
    gain_r = np.sin((pan + 1) * np.pi / 4)

    left[start_idx : start_idx + actual_samples] += tone * gain_l
    right[start_idx : start_idx + actual_samples] += tone * gain_r

# Function to synthesize a deep soothing Gong / Kempur
def add_gong_note(freq=65.4, start_time=0.0, duration=7.5, velocity=0.7):
    start_idx = int(start_time * sample_rate)
    note_samples = int(duration * sample_rate)
    if start_idx >= num_samples:
        return
    actual_samples = min(note_samples, num_samples - start_idx)
    t = np.linspace(0, actual_samples / sample_rate, actual_samples, endpoint=False)
    
    decay = np.exp(-t * 0.55)
    env = np.minimum(t / 0.02, 1.0) * decay * velocity
    # Deep fundamental + warm octave + bronze shimmer
    tone = (
        0.7 * np.sin(2 * np.pi * freq * t) +
        0.35 * np.sin(2 * np.pi * freq * 2.01 * t) +
        0.15 * np.sin(2 * np.pi * freq * 3.4 * t) * np.exp(-t * 1.5)
    ) * env
    left[start_idx : start_idx + actual_samples] += tone * 0.5
    right[start_idx : start_idx + actual_samples] += tone * 0.5

# Function to synthesize a soothing Suling Bali (Bamboo Flute)
def add_suling_phrase(notes, start_time, note_duration=1.8, velocity=0.28):
    for i, note_name in enumerate(notes):
        if note_name is None:
            continue
        freq = scale.get(note_name, 440.0)
        t_start = start_time + i * note_duration * 0.85
        start_idx = int(t_start * sample_rate)
        actual_dur = note_duration * 1.1
        note_samples = int(actual_dur * sample_rate)
        if start_idx >= num_samples:
            break
        act = min(note_samples, num_samples - start_idx)
        t = np.linspace(0, act / sample_rate, act, endpoint=False)
        
        # Flute breath envelope (gentle swell and fade)
        env = np.sin(np.pi * np.clip(t / actual_dur, 0, 1)) ** 1.3 * velocity
        # Gentle vibrato 5.2 Hz
        vibrato = 1.0 + 0.015 * np.sin(2 * np.pi * 5.2 * t)
        # Suling timbre: breath noise + odd harmonics
        flute = (
            np.sin(2 * np.pi * freq * vibrato * t) +
            0.28 * np.sin(2 * np.pi * freq * 2 * vibrato * t) +
            0.15 * np.sin(2 * np.pi * freq * 3 * vibrato * t)
        ) * env
        # Slight breath air
        breath = np.random.normal(0, 0.02, act) * env * 0.4
        flute_sound = flute + breath
        left[start_idx : start_idx + act] += flute_sound * 0.48
        right[start_idx : start_idx + act] += flute_sound * 0.52

# Compose Calming Balinese Rindik Melody (Kotekan - Interlocking Bamboo Melodies)
# Pattern A: Gentle peaceful rhythm
melody_pattern = [
    ('ding4', 0.0, -0.4), ('dong4', 0.5, -0.2), ('deng4', 1.0, 0.2), ('dung4', 1.5, 0.4),
    ('dang4', 2.0, 0.3),  ('dung4', 2.5, 0.1),  ('deng4', 3.0, -0.2), ('ding4', 3.5, -0.4),
    ('dong4', 4.0, -0.3), ('ding4', 4.5, -0.1), ('dung3', 5.0, 0.0),  ('ding4', 5.5, -0.2),
    ('deng4', 6.0, 0.2),  ('dong4', 6.5, -0.1), ('ding4', 7.0, -0.4), ('dung3', 7.5, 0.0),
]

melody_pattern_b = [
    ('deng5', 0.0, 0.3),  ('dung4', 0.5, 0.1),  ('dang4', 1.0, 0.4),  ('dung4', 1.5, 0.2),
    ('deng4', 2.0, -0.1), ('dong4', 2.5, -0.3), ('ding4', 3.0, -0.4), ('dong4', 3.5, -0.2),
    ('deng4', 4.0, 0.1),  ('dung4', 4.5, 0.3),  ('dang4', 5.0, 0.4),  ('ding5', 5.5, 0.2),
    ('dang4', 6.0, 0.3),  ('dung4', 6.5, 0.1),  ('deng4', 7.0, -0.1), ('ding4', 7.5, -0.3),
]

# Step through 16 bars (4 beats each = 8 half-beats per bar)
for bar in range(bars):
    bar_start = bar * 4 * beat_duration
    
    # Deep Gong every 4 bars (bar 0, 4, 8, 12)
    if bar % 4 == 0:
        add_gong_note(65.4, bar_start, duration=6.5, velocity=0.65)
    elif bar % 2 == 0:
        # Soft kempur (mid gong) every 2 bars
        add_gong_note(98.0, bar_start, duration=4.0, velocity=0.45)
        
    # Interlocking rindik accompaniment
    pattern = melody_pattern if (bar // 4) % 2 == 0 else melody_pattern_b
    for note, rel_beat, pan in pattern:
        note_time = bar_start + (rel_beat * beat_duration * 0.5)
        vel = 0.38 if rel_beat % 1.0 == 0 else 0.26
        add_rindik_note(scale[note], note_time, duration=1.6, velocity=vel, pan=pan)

    # Upper sparkling chime every offbeat
    if bar % 2 == 1:
        add_rindik_note(scale['ding5'], bar_start + 1.5 * beat_duration, duration=1.2, velocity=0.22, pan=0.5)
        add_rindik_note(scale['dung5'], bar_start + 3.5 * beat_duration, duration=1.2, velocity=0.22, pan=-0.5)

# Add Suling bamboo flute phrases on bars 2-6 and 10-14
add_suling_phrase(['dang4', 'dung4', 'deng4', 'dong4', 'ding4'], start_time=8 * beat_duration, note_duration=1.7, velocity=0.32)
add_suling_phrase(['ding5', 'dang4', 'dung4', 'dang4'], start_time=18 * beat_duration, note_duration=1.9, velocity=0.34)
add_suling_phrase(['deng4', 'dung4', 'dang4', 'dung4', 'deng4'], start_time=40 * beat_duration, note_duration=1.8, velocity=0.33)

# Master Normalization & Soft Limiter
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
if max_val > 0.01:
    left = (left / max_val) * 0.88
    right = (right / max_val) * 0.88

# Fade in and fade out for seamless looping
fade_samples = int(sample_rate * 2.0)
fade_in = np.linspace(0, 1, fade_samples)
fade_out = np.linspace(1, 0, fade_samples)

left[:fade_samples] *= fade_in
right[:fade_samples] *= fade_in
left[-fade_samples:] *= fade_out
right[-fade_samples:] *= fade_out

# Convert to 16-bit PCM WAV
left_pcm = (left * 32767).astype(np.int16)
right_pcm = (right * 32767).astype(np.int16)

# Interleave stereo
stereo_pcm = np.empty((num_samples * 2,), dtype=np.int16)
stereo_pcm[0::2] = left_pcm
stereo_pcm[1::2] = right_pcm

wav_path = 'public/audio/balinese-rindik.wav'
with wave.open(wav_path, 'wb') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    wf.writeframes(stereo_pcm.tobytes())

file_size_mb = os.path.getsize(wav_path) / (1024 * 1024)
print(f"Generated Balinese Rindik Music: {wav_path} ({file_size_mb:.2f} MB, {total_duration:.1f}s)")
