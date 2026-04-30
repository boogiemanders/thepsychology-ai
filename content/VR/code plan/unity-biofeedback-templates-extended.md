# Unity Code Templates: Extended Classes

Continuation of unity-biofeedback-templates.md. Adds EEG Neurofeedback Visualizer and Session Manager. Code formatting was corrupted in source transmission. Use as scaffolding, not literal copy-paste.

## 2D. EEGNeurofeedbackVisualizer

Visualizes EEG band powers and provides neurofeedback. Alpha training is "probably efficacious" for attention. [1]

```csharp
// EEGNeurofeedbackVisualizer.cs
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class EEGNeurofeedbackVisualizer : MonoBehaviour
{
    [SerializeField] private BiofeedbackReceiver biofeedbackReceiver;

    [Header("Band Power Bars")]
    [SerializeField] private Slider deltaBar, thetaBar, alphaBar, smrBar, betaBar;

    [Header("Neurofeedback Target")]
    [SerializeField] private NeurofeedbackProtocol protocol = NeurofeedbackProtocol.AlphaUp;
    [SerializeField] private float targetThreshold = 0.3f;
    [SerializeField] private float rewardDuration = 0.5f;

    [Header("Visual Feedback")]
    [SerializeField] private ParticleSystem rewardParticles;
    [SerializeField] private Light feedbackLight;
    [SerializeField] private Color belowThresholdColor = Color.red;
    [SerializeField] private Color aboveThresholdColor = Color.green;
    [SerializeField] private Transform feedbackOrb;
    [SerializeField] private float minOrbScale = 0.3f;
    [SerializeField] private float maxOrbScale = 1.5f;

    [Header("Audio Feedback")]
    [SerializeField] private AudioSource feedbackAudio;
    [SerializeField] private AudioClip rewardSound;
    [SerializeField] private float minPitch = 0.5f, maxPitch = 2f;

    [Header("UI")]
    [SerializeField] private TextMeshProUGUI protocolText;
    [SerializeField] private TextMeshProUGUI scoreText;
    [SerializeField] private Slider progressBar;

    private float currentScore = 0f;
    private float targetMetric = 0f;
    private float smoothedMetric = 0f;
    private float timeAboveThreshold = 0f;
    private int rewardCount = 0;

    public enum NeurofeedbackProtocol
    {
        AlphaUp,           // Increase alpha (relaxation)
        SMRUp,             // Increase SMR (focus, ADHD)
        AlphaThetaRatio,   // Increase alpha/theta (attention)
        BetaDown,          // Decrease beta (anxiety reduction)
        FrontalAsymmetry   // Shift frontal asymmetry (depression)
    }

    void Start()
    {
        if (biofeedbackReceiver != null)
            biofeedbackReceiver.OnEEGDataReceived += HandleEEGData;
        UpdateProtocolUI();
    }

    void HandleEEGData(EEGData data)
    {
        UpdateBandPowerBars(data);
        targetMetric = CalculateTargetMetric(data);
        smoothedMetric = Mathf.Lerp(smoothedMetric, targetMetric, Time.deltaTime * 5f);

        bool aboveThreshold = smoothedMetric >= targetThreshold;
        if (aboveThreshold)
        {
            timeAboveThreshold += Time.deltaTime;
            if (timeAboveThreshold >= rewardDuration)
            {
                TriggerReward();
                timeAboveThreshold = 0f;
            }
        }
        else
        {
            timeAboveThreshold = Mathf.Max(0, timeAboveThreshold - Time.deltaTime * 0.5f);
        }
        UpdateFeedbackVisuals(aboveThreshold);
        UpdateScore();
    }

    float CalculateTargetMetric(EEGData data)
    {
        switch (protocol)
        {
            case NeurofeedbackProtocol.AlphaUp: return data.alpha;
            case NeurofeedbackProtocol.SMRUp: return data.smr;
            case NeurofeedbackProtocol.AlphaThetaRatio: return data.alpha_theta_ratio / 3f;
            case NeurofeedbackProtocol.BetaDown: return 1f - data.beta;
            case NeurofeedbackProtocol.FrontalAsymmetry: return Mathf.Clamp01(data.frontal_asymmetry + 0.5f);
            default: return data.alpha;
        }
    }

    void UpdateBandPowerBars(EEGData data)
    {
        if (deltaBar != null) deltaBar.value = data.delta;
        if (thetaBar != null) thetaBar.value = data.theta;
        if (alphaBar != null) alphaBar.value = data.alpha;
        if (smrBar != null) smrBar.value = data.smr;
        if (betaBar != null) betaBar.value = data.beta;
    }

    void UpdateFeedbackVisuals(bool aboveThreshold)
    {
        if (feedbackLight != null)
        {
            Color targetColor = aboveThreshold ? aboveThresholdColor : belowThresholdColor;
            feedbackLight.color = Color.Lerp(feedbackLight.color, targetColor, Time.deltaTime * 3f);
            feedbackLight.intensity = Mathf.Lerp(0.5f, 2f, smoothedMetric);
        }
        if (feedbackOrb != null)
        {
            float targetScale = Mathf.Lerp(minOrbScale, maxOrbScale, smoothedMetric);
            feedbackOrb.localScale = Vector3.Lerp(feedbackOrb.localScale, Vector3.one * targetScale, Time.deltaTime * 5f);
        }
        if (progressBar != null)
            progressBar.value = timeAboveThreshold / rewardDuration;
    }

    void TriggerReward()
    {
        rewardCount++;
        currentScore += 10f;
        if (rewardParticles != null) rewardParticles.Emit(50);
        if (feedbackAudio != null && rewardSound != null) feedbackAudio.PlayOneShot(rewardSound);
    }

    void UpdateScore()
    {
        if (scoreText != null)
            scoreText.text = $"Score: {currentScore:F0}\nRewards: {rewardCount}";
    }

    void UpdateProtocolUI()
    {
        if (protocolText == null) return;
        string name = protocol switch
        {
            NeurofeedbackProtocol.AlphaUp => "Alpha Enhancement (Relaxation)",
            NeurofeedbackProtocol.SMRUp => "SMR Enhancement (Focus)",
            NeurofeedbackProtocol.AlphaThetaRatio => "Alpha/Theta Training (Attention)",
            NeurofeedbackProtocol.BetaDown => "Beta Reduction (Calm)",
            NeurofeedbackProtocol.FrontalAsymmetry => "Frontal Asymmetry (Mood)",
            _ => "Unknown Protocol"
        };
        protocolText.text = $"Protocol: {name}\nTarget: {targetThreshold:P0}";
    }

    public void SetProtocol(NeurofeedbackProtocol newProtocol)
    {
        protocol = newProtocol;
        currentScore = 0f;
        rewardCount = 0;
        UpdateProtocolUI();
    }
}
```

## 2E. TherapySessionManager

Manages therapy sessions, logs data for outcomes tracking.

```csharp
// TherapySessionManager.cs
using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

public class TherapySessionManager : MonoBehaviour
{
    [SerializeField] private float sessionDurationMinutes = 15f;
    [SerializeField] private string participantId = "P001";
    [SerializeField] private BiofeedbackReceiver biofeedbackReceiver;
    [SerializeField] private BreathingPacer breathingPacer;
    [SerializeField] private TMPro.TextMeshProUGUI sessionTimerText;
    [SerializeField] private TMPro.TextMeshProUGUI sessionStatusText;

    private bool sessionActive = false;
    private float sessionStartTime;
    private float sessionElapsedTime;
    private List<SessionDataPoint> sessionData = new List<SessionDataPoint>();
    private string dataDirectory;

    [Serializable]
    public class SessionDataPoint
    {
        public float timestamp;
        public float heartRate;
        public float rmssd;
        public float coherence;
        public float alpha, theta, beta;
        public float frontalAsymmetry;
        public string breathPhase;
        public int breathCount;
    }

    [Serializable]
    public class SessionSummary
    {
        public string participantId;
        public string sessionId;
        public DateTime startTime, endTime;
        public float durationMinutes;
        public float avgHeartRate, avgRmssd, avgCoherence;
        public float startRmssd, endRmssd, rmssdChange;
        public int totalBreaths;
        public int dataPoints;
    }

    void Start()
    {
        dataDirectory = Path.Combine(Application.persistentDataPath, "SessionData");
        if (!Directory.Exists(dataDirectory)) Directory.CreateDirectory(dataDirectory);

        if (biofeedbackReceiver != null)
        {
            biofeedbackReceiver.OnHRVDataReceived += LogHRVData;
            biofeedbackReceiver.OnEEGDataReceived += LogEEGData;
        }
    }

    public void StartSession()
    {
        sessionActive = true;
        sessionStartTime = Time.time;
        sessionElapsedTime = 0f;
        sessionData.Clear();
        if (breathingPacer != null) breathingPacer.StartBreathing();
        if (sessionStatusText != null) sessionStatusText.text = "Session Active";
    }

    public void EndSession()
    {
        if (!sessionActive) return;
        sessionActive = false;
        if (breathingPacer != null) breathingPacer.StopBreathing();
        SessionSummary summary = GenerateSessionSummary();
        SaveSessionData(summary);
        if (sessionStatusText != null)
            sessionStatusText.text = $"Session Complete\nRMSSD Change: {summary.rmssdChange:+0.0;-0.0}";
    }

    void Update()
    {
        if (!sessionActive) return;
        sessionElapsedTime = Time.time - sessionStartTime;
        if (sessionTimerText != null)
        {
            float remaining = (sessionDurationMinutes * 60f) - sessionElapsedTime;
            int min = Mathf.FloorToInt(remaining / 60f);
            int sec = Mathf.FloorToInt(remaining % 60f);
            sessionTimerText.text = $"{min:00}:{sec:00}";
        }
        if (sessionElapsedTime >= sessionDurationMinutes * 60f) EndSession();
    }

    void LogHRVData(HRVData data)
    {
        if (!sessionActive) return;
        SessionDataPoint point = GetOrCreateCurrentDataPoint();
        point.heartRate = data.heart_rate;
        point.rmssd = data.rmssd;
        point.coherence = data.coherence;
        if (breathingPacer != null)
        {
            point.breathPhase = breathingPacer.GetCurrentPhase().ToString();
            point.breathCount = breathingPacer.GetBreathCount();
        }
    }

    void LogEEGData(EEGData data)
    {
        if (!sessionActive) return;
        SessionDataPoint point = GetOrCreateCurrentDataPoint();
        point.alpha = data.alpha;
        point.theta = data.theta;
        point.beta = data.beta;
        point.frontalAsymmetry = data.frontal_asymmetry;
    }

    SessionDataPoint GetOrCreateCurrentDataPoint()
    {
        float currentTime = sessionElapsedTime;
        if (sessionData.Count > 0)
        {
            var last = sessionData[sessionData.Count - 1];
            if (currentTime - last.timestamp < 0.1f) return last;
        }
        var newPoint = new SessionDataPoint { timestamp = currentTime };
        sessionData.Add(newPoint);
        return newPoint;
    }

    SessionSummary GenerateSessionSummary()
    {
        var summary = new SessionSummary
        {
            participantId = participantId,
            sessionId = Guid.NewGuid().ToString(),
            endTime = DateTime.Now,
            durationMinutes = sessionElapsedTime / 60f,
            dataPoints = sessionData.Count
        };
        // Aggregate averages, start/end RMSSD, etc.
        // (omitted for brevity — reconstruct per original logic)
        return summary;
    }

    void SaveSessionData(SessionSummary summary)
    {
        string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string summaryPath = Path.Combine(dataDirectory, $"{participantId}_{timestamp}_summary.json");
        File.WriteAllText(summaryPath, JsonUtility.ToJson(summary, true));

        string dataPath = Path.Combine(dataDirectory, $"{participantId}_{timestamp}_data.csv");
        using (StreamWriter writer = new StreamWriter(dataPath))
        {
            writer.WriteLine("timestamp,heart_rate,rmssd,coherence,alpha,theta,beta,frontal_asymmetry,breath_phase,breath_count");
            foreach (var p in sessionData)
            {
                writer.WriteLine($"{p.timestamp:F2},{p.heartRate:F1},{p.rmssd:F2},{p.coherence:F2},{p.alpha:F3},{p.theta:F3},{p.beta:F3},{p.frontalAsymmetry:F3},{p.breathPhase},{p.breathCount}");
            }
        }
    }
}
```

## References

1. Castanho L, et al. The Efficacy of VR-Based EEG Neurofeedback. Applied Psychophysiology and Biofeedback. 2025.
2. Lüddecke R, Felnhofer A. VR Biofeedback in Health: Scoping Review. Applied Psychophysiology and Biofeedback. 2022;47(1):1-15.
3. Cho Y, et al. VR-Based Biofeedback for Depressive and Anxiety Symptoms: RCT. Journal of Affective Disorders. 2024;361:392-398.
