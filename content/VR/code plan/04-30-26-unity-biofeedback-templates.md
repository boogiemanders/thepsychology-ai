# Unity Code Templates for VR Biofeedback Integration

Practical code templates and architecture patterns for integrating HRV biofeedback and EEG neurofeedback into Unity-based VR therapy applications.

Note: formatting in code blocks below was partially corrupted in source transmission (stray asterisks). Treat as reference scaffolding, not literal copy-paste. Re-type variable names cleanly when implementing.

## Architecture Overview

Recommended architecture: Python backend for signal processing connected to Unity via WebSocket. Most common approach in VR-biofeedback research. [1][2][3] Separation allows real-time biosignal processing in Python (mature libraries) while Unity handles VR rendering.

```
Polar H10 (HRV/ECG) ──Bluetooth──> Python Backend (HeartPy, MNE-Python, pylsl, FastAPI)
OpenBCI (EEG)       ──LSL/Serial─> Python Backend
                                   │
                                   WebSocket
                                   │
                                   Unity 3D (VR Scene, Meta XR SDK, Biofeedback Visuals)
```

## Part 1: Python Backend

### 1A. HRV Processing with Polar H10

```python
# hrv_server.py
# Real-time HRV processing and WebSocket server

import asyncio
import json
from bleak import BleakClient, BleakScanner
from collections import deque
import numpy as np
import websockets

# Polar H10 UUIDs
HR_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
HR_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

class HRVProcessor:
    def __init__(self, window_size=60):
        """
        Initialize HRV processor.
        Window size of 60 seconds for short-term HRV.
        Resonance frequency breathing typically 4-7 breaths/min. [4]
        """
        self.rr_intervals = deque(maxlen=window_size * 2)
        self.connected_clients = set()

    def calculate_hrv_metrics(self):
        """
        Calculate real-time HRV metrics.
        RMSSD is primary metric for parasympathetic activity. [4]
        """
        # Extract RR intervals, compute RMSSD, SDNN, coherence
        # (code body omitted due to source corruption — reconstruct with HeartPy)
        pass

    def parse_polar_data(self, data):
        """Parse Polar H10 heart rate notification packets. [4]"""
        # Flag byte parsing: hr_format, rr_present
        # Extract RR intervals (1/1024 seconds) when present
        pass
```

### 1B. EEG Processing with OpenBCI

```python
# eeg_server.py
# Real-time EEG band power processing

from scipy.signal import butter, filtfilt, welch
from collections import deque
import numpy as np

class EEGProcessor:
    def __init__(self, sample_rate=250, window_seconds=2):
        """
        2-second windows balance responsiveness with stability. [5]
        """
        self.sample_rate = sample_rate
        self.window_size = sample_rate * window_seconds
        self.channels = {}
        for ch in ['Fp1', 'Fp2', 'F3', 'F4', 'Cz']:
            self.channels[ch] = deque(maxlen=self.window_size)

    def bandpass_filter(self, data, lowcut, highcut, order=4):
        nyq = 0.5 * self.sample_rate
        b, a = butter(order, [lowcut/nyq, highcut/nyq], btype='band')
        return filtfilt(b, a, data)

    def notch_filter(self, data, freq=60, q=30):
        """Remove line noise (60 Hz US, 50 Hz EU)."""
        nyq = 0.5 * self.sample_rate
        w0 = freq / nyq
        b, a = butter(2, [w0 - w0/q, w0 + w0/q], btype='bandstop')
        return filtfilt(b, a, data)

    def calculate_band_powers(self, channel_name='Fp1'):
        """
        Bands relevant for biofeedback: [6][7]
        - Alpha (8-12 Hz): relaxation, calm alertness
        - SMR (12-15 Hz): focused attention, motor inhibition
        - Theta (4-8 Hz): drowsiness, meditation
        - Beta (15-30 Hz): active thinking, anxiety
        """
        # Welch's method to compute PSD, then integrate per band
        pass

    def calculate_frontal_asymmetry(self):
        """
        Frontal alpha asymmetry (AF8 - AF7).
        Positive = left frontal dominance = approach/positive affect.
        Negative = right frontal dominance = withdrawal/anxiety.
        Depression biomarker. [8]
        """
        pass
```

## Part 2: Unity Integration

### 2A. BiofeedbackReceiver (WebSocket Client)

```csharp
// BiofeedbackReceiver.cs
// Connects to Python backend, relays HRV + EEG events to Unity scripts

using System;
using UnityEngine;
using WebSocketSharp;

public class BiofeedbackReceiver : MonoBehaviour
{
    [SerializeField] private string hrvServerUrl = "ws://localhost:8765";
    [SerializeField] private string eegServerUrl = "ws://localhost:8766";

    public event Action<HRVData> OnHRVDataReceived;
    public event Action<EEGData> OnEEGDataReceived;

    public HRVData currentHRV;
    public EEGData currentEEG;

    private WebSocket hrvSocket;
    private WebSocket eegSocket;
    private readonly object lockObj = new object();
    private HRVData pendingHRV;
    private EEGData pendingEEG;
    private bool hasNewHRV = false;
    private bool hasNewEEG = false;

    void Start() { ConnectToServers(); }

    void ConnectToServers()
    {
        hrvSocket = new WebSocket(hrvServerUrl);
        hrvSocket.OnMessage += (sender, e) => HandleHRVMessage(e.Data);
        hrvSocket.ConnectAsync();

        eegSocket = new WebSocket(eegServerUrl);
        eegSocket.OnMessage += (sender, e) => HandleEEGMessage(e.Data);
        eegSocket.ConnectAsync();
    }

    void HandleHRVMessage(string json)
    {
        var wrapper = JsonUtility.FromJson<BiofeedbackMessageWrapper>(json);
        var hrvData = JsonUtility.FromJson<HRVData>(wrapper.data);
        lock (lockObj) { pendingHRV = hrvData; hasNewHRV = true; }
    }

    void HandleEEGMessage(string json)
    {
        var wrapper = JsonUtility.FromJson<BiofeedbackMessageWrapper>(json);
        var eegData = JsonUtility.FromJson<EEGData>(wrapper.data);
        lock (lockObj) { pendingEEG = eegData; hasNewEEG = true; }
    }

    void Update()
    {
        // Process on main thread (Unity API requires it)
        lock (lockObj)
        {
            if (hasNewHRV) { currentHRV = pendingHRV; OnHRVDataReceived?.Invoke(currentHRV); hasNewHRV = false; }
            if (hasNewEEG) { currentEEG = pendingEEG; OnEEGDataReceived?.Invoke(currentEEG); hasNewEEG = false; }
        }
    }

    void OnDestroy() { hrvSocket?.Close(); eegSocket?.Close(); }
}

[Serializable]
public class BiofeedbackMessageWrapper { public string type; public string data; }
```

### 2B. HRVEnvironmentController

```csharp
// HRVEnvironmentController.cs
// Environment responds to HRV. Based on validated VR-biofeedback designs. [9][10][11]

using UnityEngine;
using UnityEngine.Rendering;

public class HRVEnvironmentController : MonoBehaviour
{
    [SerializeField] private BiofeedbackReceiver biofeedbackReceiver;
    [SerializeField] private Volume postProcessVolume;

    [Header("Fog")]
    [SerializeField] private ParticleSystem fogParticles;
    [SerializeField] private float maxFogEmission = 100f;
    [SerializeField] private float minFogEmission = 5f;

    [Header("Lighting")]
    [SerializeField] private Light sunLight;
    [SerializeField] private Color stressedLightColor = new Color(0.8f, 0.7f, 0.6f);
    [SerializeField] private Color relaxedLightColor = new Color(1f, 0.95f, 0.9f);
    [SerializeField] private float minLightIntensity = 0.5f;
    [SerializeField] private float maxLightIntensity = 1.2f;

    [Header("Audio")]
    [SerializeField] private AudioSource ambientAudio;
    [SerializeField] private AudioSource heartbeatAudio;

    [Header("Biofeedback Thresholds")]
    [SerializeField] private float lowRMSSD = 20f;
    [SerializeField] private float highRMSSD = 60f;
    [SerializeField] private float targetCoherence = 0.7f;
    [SerializeField] private float transitionSpeed = 2f;

    private float currentRelaxationLevel = 0.5f;
    private float targetRelaxationLevel = 0.5f;

    void Start()
    {
        if (biofeedbackReceiver != null)
            biofeedbackReceiver.OnHRVDataReceived += HandleHRVData;
    }

    void HandleHRVData(HRVData data)
    {
        float rmssdNorm = Mathf.InverseLerp(lowRMSSD, highRMSSD, data.rmssd);
        float coherenceNorm = data.coherence / targetCoherence;
        targetRelaxationLevel = Mathf.Clamp01(rmssdNorm * 0.7f + coherenceNorm * 0.3f);

        if (heartbeatAudio != null)
        {
            heartbeatAudio.pitch = data.heart_rate / 60f;
            heartbeatAudio.volume = Mathf.Lerp(0.5f, 0f, currentRelaxationLevel);
        }
    }

    void Update()
    {
        currentRelaxationLevel = Mathf.Lerp(currentRelaxationLevel, targetRelaxationLevel, Time.deltaTime * transitionSpeed);
        UpdateEnvironment();
    }

    void UpdateEnvironment()
    {
        // Fog dissipates as relaxation increases [9]
        if (fogParticles != null)
        {
            var emission = fogParticles.emission;
            emission.rateOverTime = Mathf.Lerp(maxFogEmission, minFogEmission, currentRelaxationLevel);
        }
        // Lighting warmer/brighter with relaxation
        if (sunLight != null)
        {
            sunLight.color = Color.Lerp(stressedLightColor, relaxedLightColor, currentRelaxationLevel);
            sunLight.intensity = Mathf.Lerp(minLightIntensity, maxLightIntensity, currentRelaxationLevel);
        }
        // Ambient audio louder with relaxation
        if (ambientAudio != null)
            ambientAudio.volume = Mathf.Lerp(0.3f, 1f, currentRelaxationLevel);
    }
}
```

### 2C. BreathingPacer

```csharp
// BreathingPacer.cs
// Visual breathing guide for resonance frequency training.
// Target: 4-7 breaths/minute for optimal HRV biofeedback. [4]

using UnityEngine;
using TMPro;

public class BreathingPacer : MonoBehaviour
{
    [Range(4f, 10f)]
    [SerializeField] private float breathsPerMinute = 6f;
    [SerializeField] private float inhaleRatio = 1f;
    [SerializeField] private float exhaleRatio = 2f;
    [SerializeField] private float holdRatio = 0.5f;

    [SerializeField] private Transform breathingSphere;
    [SerializeField] private float minScale = 0.5f;
    [SerializeField] private float maxScale = 1.5f;
    [SerializeField] private Material sphereMaterial;
    [SerializeField] private Color inhaleColor = new Color(0.3f, 0.7f, 1f);
    [SerializeField] private Color exhaleColor = new Color(0.2f, 0.5f, 0.8f);
    [SerializeField] private Color holdColor = new Color(0.4f, 0.6f, 0.9f);

    [SerializeField] private TextMeshProUGUI instructionText;
    [SerializeField] private TextMeshProUGUI timerText;
    [SerializeField] private AudioSource breathAudio;
    [SerializeField] private AudioClip inhaleSound;
    [SerializeField] private AudioClip exhaleSound;

    private enum BreathPhase { Inhale, HoldIn, Exhale, HoldOut }
    private BreathPhase currentPhase = BreathPhase.Inhale;
    private float phaseTimer = 0f;
    private float currentPhaseDuration = 0f;
    private int breathCount = 0;
    private bool isActive = false;

    private float inhaleDuration, holdInDuration, exhaleDuration, holdOutDuration;

    void Start() { CalculateBreathingDurations(); }

    void CalculateBreathingDurations()
    {
        float cycleTime = 60f / breathsPerMinute;
        float totalRatio = inhaleRatio + holdRatio + exhaleRatio + holdRatio;
        inhaleDuration = (inhaleRatio / totalRatio) * cycleTime;
        holdInDuration = (holdRatio / totalRatio) * cycleTime;
        exhaleDuration = (exhaleRatio / totalRatio) * cycleTime;
        holdOutDuration = (holdRatio / totalRatio) * cycleTime;
    }

    public void StartBreathing()
    {
        isActive = true;
        currentPhase = BreathPhase.Inhale;
        phaseTimer = 0f;
        currentPhaseDuration = inhaleDuration;
        breathCount = 0;
    }

    public void StopBreathing() { isActive = false; }

    void Update()
    {
        if (!isActive) return;
        phaseTimer += Time.deltaTime;
        if (phaseTimer >= currentPhaseDuration) TransitionToNextPhase();
        UpdateBreathingVisuals();
    }

    void TransitionToNextPhase()
    {
        phaseTimer = 0f;
        switch (currentPhase)
        {
            case BreathPhase.Inhale:
                currentPhase = BreathPhase.HoldIn; currentPhaseDuration = holdInDuration; break;
            case BreathPhase.HoldIn:
                currentPhase = BreathPhase.Exhale; currentPhaseDuration = exhaleDuration; break;
            case BreathPhase.Exhale:
                currentPhase = BreathPhase.HoldOut; currentPhaseDuration = holdOutDuration; breathCount++; break;
            case BreathPhase.HoldOut:
                currentPhase = BreathPhase.Inhale; currentPhaseDuration = inhaleDuration; break;
        }
        PlayPhaseAudio();
    }

    void UpdateBreathingVisuals()
    {
        float progress = phaseTimer / currentPhaseDuration;
        float targetScale = minScale;
        Color targetColor = holdColor;

        switch (currentPhase)
        {
            case BreathPhase.Inhale:
                targetScale = Mathf.Lerp(minScale, maxScale, EaseInOutSine(progress));
                targetColor = Color.Lerp(exhaleColor, inhaleColor, progress); break;
            case BreathPhase.HoldIn: targetScale = maxScale; targetColor = holdColor; break;
            case BreathPhase.Exhale:
                targetScale = Mathf.Lerp(maxScale, minScale, EaseInOutSine(progress));
                targetColor = Color.Lerp(inhaleColor, exhaleColor, progress); break;
            case BreathPhase.HoldOut: targetScale = minScale; targetColor = holdColor; break;
        }

        if (breathingSphere != null)
            breathingSphere.localScale = Vector3.one * targetScale;
        if (sphereMaterial != null)
        {
            sphereMaterial.SetColor("_EmissionColor", targetColor * 2f);
            sphereMaterial.color = targetColor;
        }
    }

    void PlayPhaseAudio()
    {
        if (breathAudio == null) return;
        if (currentPhase == BreathPhase.Inhale && inhaleSound != null) breathAudio.PlayOneShot(inhaleSound);
        else if (currentPhase == BreathPhase.Exhale && exhaleSound != null) breathAudio.PlayOneShot(exhaleSound);
    }

    float EaseInOutSine(float t) { return -(Mathf.Cos(Mathf.PI * t) - 1f) / 2f; }

    public BreathPhase GetCurrentPhase() => currentPhase;
    public int GetBreathCount() => breathCount;
}
```

## References

1. Moon J, Jeong M, Oh S, Laine TH, Seo J. Data Collection Framework for Context-Aware VR in Unity: Case of Avatar Embodiment. Sensors. 2022;22(12):4623.
2. Weibel RP, Grübel J, Zhao H, et al. VR Experiments With Physiological Measures. JoVE. 2018;(138).
3. Joshi J, Wang K, Cho Y. PhysioKit: An Open-Source, Low-Cost Physiological Computing Toolkit. Sensors. 2023;23(19):8244.
4. Lalanza JF, Lorente S, Bullich R, et al. Methods for HRV Biofeedback: Systematic Review and Guidelines. Applied Psychophysiology and Biofeedback. 2023;48(3):275-297.
5. Ocklenburg S, Peterburs J. Monitoring Brain Activity in VR: EEG and Neuroimaging. Current Topics in Behavioral Neurosciences. 2023;65:47-71.
6. Kober SE, Wood G, Berger LM. Controlling VR With Brain Signals. Applied Psychophysiology and Biofeedback. 2024.
7. Castanho L, Martinho DV, Saial AC, et al. The Efficacy of VR-Based EEG Neurofeedback. Applied Psychophysiology and Biofeedback. 2025.
8. Melnikov MY. Current Evidence Levels for Biofeedback and Neurofeedback in Treating Depression. Neural Plasticity. 2021;2021:8878857.
9. Xu Q, Gu Y, Hu X. Brief Interactive VR Mindfulness Training With Real-Time Biofeedback for Anxiety Reduction. Applied Psychophysiology and Biofeedback. 2025.
10. Daniel-Watanabe L, Cook B, Leung G, et al. Using a VR Game to Train Biofeedback-Based Regulation Under Stress Conditions. Psychophysiology. 2025;62(1):e14705.
11. Michela A, van Peer JM, Brammer JC, et al. Deep-Breathing Biofeedback Trainability in a VR Action Game. Frontiers in Psychology. 2022;13:806163.
