
"use strict";

/* TOZRA FREE BROWSER VOICE v4 */
(() => {
  let voiceSession = null;

  const $ = id => document.getElementById(id);

  function setStatus(message, target) {
    if (target) target.textContent = message || "";
    const label = $("voiceScreenStatus");
    if (label && message) {
      label.textContent = message;
      const screen = $("tozraVoiceScreen");
      if (screen) {
        screen.classList.toggle("is-speaking", /konuşuyor/i.test(message));
        screen.classList.toggle("is-listening", /dinliyorum|seni dinliyorum|hazır/i.test(message));
        screen.classList.toggle("is-thinking", /hazırlıyor|bağlanıyor/i.test(message));
      }
    }
  }

  let voiceScreenHideTimer = null;
  function showVoiceScreen() {
    const screen = $("tozraVoiceScreen");
    if (!screen) return;
    if (voiceScreenHideTimer) { clearTimeout(voiceScreenHideTimer); voiceScreenHideTimer = null; }
    screen.hidden = false;
    document.body.classList.add("voice-screen-open");
    screen.classList.remove("is-visible");
    // Allow the initial hidden state to paint before animating into view.
    requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add("is-visible")));
  }
  function hideVoiceScreen() {
    const screen = $("tozraVoiceScreen");
    if (!screen) return;
    screen.classList.remove("is-visible");
    document.body.classList.remove("voice-screen-open");
    if (voiceScreenHideTimer) clearTimeout(voiceScreenHideTimer);
    voiceScreenHideTimer = setTimeout(() => {
      screen.hidden = true;
      voiceScreenHideTimer = null;
    }, window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
  }

  function attachVoiceVisualizer(session, stream) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || !stream) return;
      const context = new AudioContextClass();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      session.visualContext = context;
      session.visualAnalyser = analyser;
      if (context.state === "suspended") context.resume().catch(() => {});
      const tick = () => {
        if (voiceSession !== session || !session.visualAnalyser) return;
        analyser.getByteFrequencyData(samples);
        let total = 0;
        for (let i = 0; i < samples.length; i++) total += samples[i];
        const level = Math.min(1, (total / samples.length) / 110);
        const screen = $("tozraVoiceScreen");
        if (screen) {
          screen.style.setProperty("--voice-level", level.toFixed(3));
          screen.style.setProperty("--voice-scale", (1 + level * .22).toFixed(3));
          screen.style.setProperty("--voice-ring-scale", (1 + level * .14).toFixed(3));
        }
        session.visualFrame = requestAnimationFrame(tick);
      };
      session.visualFrame = requestAnimationFrame(tick);
    } catch (error) { console.debug("TOZRA ses görselleştirme kullanılamıyor:", error); }
  }

  function getVoiceTarget() {
    const projectPage = $("projectPage");
    const isProject =
      projectPage?.classList.contains("active") || false;

    if (isProject) {
      const project = getCurrentProject();

      if (!project) {
        throw new Error("Önce bir proje açmalısın.");
      }

      return {
        scope: "project",
        projectId: project.id,
        button: $("projectVoiceButton"),
        status: $("projectVoiceStatus"),
        history: project.messages || [],
        projectContext:
          typeof buildProjectContext === "function"
            ? buildProjectContext(project)
            : ""
      };
    }

    return {
      scope: "general",
      button: $("voiceButton"),
      status: $("voiceStatus"),
      history:
        typeof conversation !== "undefined"
          ? conversation || []
          : [],
      projectContext: ""
    };
  }

  function getPersonalMemory() {
    try {
      if (
        window.TozraMemory &&
        typeof window.TozraMemory.getAll === "function"
      ) {
        return window.TozraMemory.getAll()
          .filter(item =>
            item &&
            typeof item.content === "string"
          )
          .slice(-30)
          .map(item => ({
            category:
              typeof item.category === "string"
                ? item.category.slice(0, 60)
                : "genel",
            content: item.content.slice(0, 1500)
          }));
      }
    } catch (error) {
      console.warn("TOZRA hafızası okunamadı:", error);
    }

    return [];
  }

  function updateButton(target, active) {
    if (!target.button) return;

    target.button.classList.toggle("recording", active);
    target.button.textContent = active
      ? "■ Görüşmeyi bitir"
      : "🎙 Sesli sohbet";

    target.button.setAttribute(
      "aria-pressed",
      String(active)
    );
  }

  function addVoiceMessage(session, role, content, messageId) {
    const text = String(content || "").trim();

    if (!text) return;

    const uniqueId =
      messageId || `${role}-${text}`;

    if (session.savedMessages.has(uniqueId)) return;

    session.savedMessages.add(uniqueId);

    try {
      if (session.scope === "project") {
        const project = projects.find(
          item => item.id === session.projectId
        );

        if (!project) return;

        project.messages = project.messages || [];

        project.messages.push({
          id: Date.now(),
          role,
          content: text
        });

        project.updatedAt = Date.now();

        addMessage(
          $("projectMessages"),
          role,
          text
        );

        saveProjects();
        renderProjectInfo(project);

        return;
      }

      conversation.push({
        id: Date.now(),
        role,
        content: text
      });

      if ($("welcome")) {
        $("welcome").style.display = "none";
      }

      addMessage($("messages"), role, text);
      saveGeneralConversation();

    } catch (error) {
      console.error("Mesaj kaydetme hatası:", error);
    }
  }

  async function stopVoiceSession(showMessage = true) {
    const session = voiceSession;

    if (!session) return;

    voiceSession = null;

    if (session.browserFallback) {
      try {
        if (session.recognition) {
          session.recognition.onend = null;
          session.recognition.onerror = null;
          session.recognition.onresult = null;
          session.recognition.stop();
        }
        if (session.recorder && session.recorder.state !== "inactive") {
          session.recorder.onstop = null;
          session.recorder.stop();
        }
        if (session.localStream) session.localStream.getTracks().forEach(track => track.stop());
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch (error) {
        console.warn("Tarayıcı ses oturumu kapatılırken:", error);
      }
      updateButton(session.target, false);
      if (showMessage) setStatus("Sesli görüşme sona erdi.", session.target.status);
      return;
    }

    try {
      if (session.dataChannel) {
        session.dataChannel.close();
      }

      if (session.pc) {
        session.pc.close();
      }

      if (session.localStream) {
        session.localStream
          .getTracks()
          .forEach(track => track.stop());
      }

      if (session.audioElement) {
        session.audioElement.pause();
        session.audioElement.srcObject = null;
        session.audioElement.remove();
      }
      if (session.visualFrame) cancelAnimationFrame(session.visualFrame);
      if (session.visualContext && session.visualContext.state !== "closed") await session.visualContext.close();
      const screen = $("tozraVoiceScreen");
      if (screen) {
        screen.style.setProperty("--voice-level", "0");
        screen.style.setProperty("--voice-scale", "1");
        screen.style.setProperty("--voice-ring-scale", "1");
      }

    } catch (error) {
      console.warn(
        "Ses bağlantısı kapatılırken:",
        error
      );
    }

    updateButton(session.target, false);

    if (showMessage) {
      setStatus(
        "Sesli görüşme sona erdi.",
        session.target.status
      );
    }
  }


  const BrowserSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function speakBrowserReply(text, session) {
    if (!window.speechSynthesis || !text) {
      setStatus("Yanıt hazır. Tarayıcın sesli okumayı desteklemiyor.", session.target.status);
      return;
    }
    window.speechSynthesis.cancel();
    // Emojileri yalnızca seslendirme metninden çıkar; ekrandaki yanıt aynen kalır.
    const speechText = String(text)
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u20E3]/gu, " ")
      .replace(/[ \\t]{2,}/g, " ")
      .replace(/\\s+([,.!?;:])/g, "$1")
      .trim();
    if (!speechText) {
      if (voiceSession === session && !session.muted) startBrowserRecognition(session);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = "tr-TR";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setStatus("TOZRA konuşuyor…", session.target.status);
    utterance.onend = () => {
      if (voiceSession === session && !session.muted) {
        setStatus("Seni dinliyorum…", session.target.status);
        if (session.mediaRecorderMode) startMediaRecorderCapture(session);
        else startBrowserRecognition(session);
      }
    };
    utterance.onerror = () => {
      if (voiceSession === session) setStatus("Yanıt hazır. Tekrar konuşabilirsin.", session.target.status);
    };
    window.speechSynthesis.speak(utterance);
  }

  async function answerBrowserVoice(transcript, session) {
    const prompt = String(transcript || "").trim();
    if (!prompt || voiceSession !== session) return;
    setStatus("TOZRA yanıt hazırlıyor…", session.target.status);
    const history = session.scope === "project"
      ? (projects.find(item => item.id === session.projectId)?.messages || []).slice(-20)
      : (typeof conversation !== "undefined" ? conversation : []).slice(-20);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await window.TozraAuth.authHeaders()) },
        body: JSON.stringify({
          prompt,
          history,
          images: [],
          videoFrames: [],
          personalMemory: getPersonalMemory(),
          agentMode: false
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "TOZRA yanıt veremedi.");
      if (voiceSession !== session) return;
      addVoiceMessage(session, "user", prompt, `browser-user-${Date.now()}`);
      addVoiceMessage(session, "assistant", data.answer || "Şu an yanıt oluşturamadım.", `browser-assistant-${Date.now()}`);
      const transcriptNode = $("voiceScreenTranscript");
      if (transcriptNode) transcriptNode.textContent = data.answer || "Yanıt oluşturulamadı.";
      speakBrowserReply(data.answer || "Şu an yanıt oluşturamadım.", session);
    } catch (error) {
      console.error("TOZRA ücretsiz sesli sohbet:", error);
      setStatus("Yanıt alınamadı: " + (error.message || "Bağlantı hatası"), session.target.status);
      if (voiceSession === session) startBrowserRecognition(session);
    }
  }

  function startBrowserRecognition(session) {
    if (voiceSession !== session || session.muted || session.processing) return;
    if (!BrowserSpeechRecognition) {
      setStatus("Bu tarayıcı ücretsiz ses tanımayı desteklemiyor. Chrome veya Edge deneyebilirsin.", session.target.status);
      return;
    }
    try {
      const recognition = new BrowserSpeechRecognition();
      session.recognition = recognition;
      recognition.lang = "tr-TR";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      let finalTranscript = "";
      recognition.onstart = () => setStatus("Seni dinliyorum…", session.target.status);
      recognition.onresult = event => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) finalTranscript += piece;
          else interim += piece;
        }
        const node = $("voiceScreenTranscript");
        if (node) node.textContent = finalTranscript || interim || "Seni dinliyorum…";
      };
      recognition.onerror = event => {
        if (voiceSession !== session) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setStatus("Mikrofon izni verilmedi. Tarayıcı ayarlarından mikrofon iznini aç.", session.target.status);
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          setStatus("Ses tanıma hatası: " + event.error, session.target.status);
        }
      };
      recognition.onend = () => {
        if (voiceSession !== session) return;
        if (finalTranscript.trim()) {
          session.processing = true;
          answerBrowserVoice(finalTranscript.trim(), session).finally(() => { session.processing = false; });
        } else if (!session.muted && !session.processing) {
          setStatus("Ses algılanmadı. Tekrar konuşabilirsin.", session.target.status);
          setTimeout(() => startBrowserRecognition(session), 350);
        }
      };
      recognition.start();
    } catch (error) {
      setStatus("Mikrofon başlatılamadı: " + (error.message || "Bilinmeyen hata"), session.target.status);
    }
  }

  async function transcribeRecordedAudio(blob, session) {
    if (!blob || !blob.size || voiceSession !== session) return;
    setStatus("Konuşman yazıya dönüştürülüyor…", session.target.status);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Ses kaydı okunamadı."));
        reader.readAsDataURL(blob);
      });
      const base64 = dataUrl.split(",")[1] || "";
      const mimeType = (blob.type || session.mimeType || "audio/mp4").split(";")[0];
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await window.TozraAuth.authHeaders()) },
        body: JSON.stringify({ audio: base64, mimeType })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success || !data.text) throw new Error(data.error || "Ses yazıya dönüştürülemedi.");
      await answerBrowserVoice(data.text, session);
    } catch (error) {
      console.error("TOZRA mobil ses dönüştürme:", error);
      setStatus("Ses işlenemedi: " + (error.message || "Bağlantını kontrol et."), session.target.status);
      if (voiceSession === session && !session.muted) {
        setStatus("Tekrar konuşmak için mikrofon düğmesine bas.", session.target.status);
      }
    }
  }

  async function startMediaRecorderCapture(session) {
    if (voiceSession !== session || session.muted || session.processing || session.recorder?.state === "recording") return;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setStatus("Bu cihazda mikrofon kaydı desteklenmiyor. Safari/Chrome izinlerini kontrol et.", session.target.status);
        return;
      }
      if (!session.localStream) {
        session.localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      }
      const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      const mimeType = candidates.find(type => !MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(session.localStream, mimeType ? { mimeType } : undefined);
      session.recorder = recorder;
      session.mimeType = recorder.mimeType || mimeType || "audio/mp4";
      session.audioChunks = [];
      recorder.ondataavailable = event => { if (event.data?.size) session.audioChunks.push(event.data); };
      recorder.onerror = event => setStatus("Mikrofon kayıt hatası: " + (event.error?.message || "Tekrar deneyebilirsin."), session.target.status);
      recorder.onstop = async () => {
        const blob = new Blob(session.audioChunks || [], { type: session.mimeType });
        session.audioChunks = [];
        if (voiceSession !== session) return;
        if (!blob.size) {
          setStatus("Ses algılanmadı. Mikrofon düğmesine basıp tekrar konuş.", session.target.status);
          return;
        }
        session.processing = true;
        try { await transcribeRecordedAudio(blob, session); }
        finally { session.processing = false; }
      };
      recorder.start();
      setStatus("Seni dinliyorum. Konuşman bitince mikrofon düğmesine bas.", session.target.status);
      const mic = $("voiceScreenMic");
      mic?.classList.remove("is-muted");
      mic?.setAttribute("aria-label", "Konuşmayı gönder");
    } catch (error) {
      console.error("TOZRA MediaRecorder:", error);
      setStatus("Mikrofon açılamadı: " + (error.message || "Mikrofon iznini kontrol et."), session.target.status);
    }
  }

  async function startBrowserVoice() {
    let target;
    try {
      target = getVoiceTarget();
      if (!target.button || !target.status) throw new Error("Sesli sohbet arayüzü bulunamadı.");
    } catch (error) { alert(error.message); return; }

    if (!window.TozraAuth?.getSession?.()?.access_token) {
      setStatus("Sesli sohbet için önce hesabına giriş yapmalısın.", target.status);
      if (typeof window.showModal === "function") window.showModal("login");
      return;
    }
    if (!BrowserSpeechRecognition && (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia)) {
      showVoiceScreen();
      setStatus("Bu tarayıcı sesli sohbeti desteklemiyor. Mikrofon izni ve güncel Safari/Chrome gerekli.", target.status);
      return;
    }
    if (!window.speechSynthesis) {
      showVoiceScreen();
      setStatus("Tarayıcının sesli yanıt özelliği desteklenmiyor.", target.status);
      return;
    }
    showVoiceScreen();
    const session = {
      browserFallback: true,
      target,
      scope: target.scope,
      projectId: target.projectId,
      savedMessages: new Set(),
      muted: false,
      processing: false,
      recognition: null,
      mediaRecorderMode: !BrowserSpeechRecognition,
      recorder: null,
      localStream: null
    };
    voiceSession = session;
    updateButton(target, true);
    $("voiceScreenMic")?.classList.remove("is-muted");
    $("voiceScreenMic")?.setAttribute("aria-label", "Mikrofonu kapat");
    setStatus("Ücretsiz sesli sohbet hazırlanıyor…", target.status);
    if (session.mediaRecorderMode) startMediaRecorderCapture(session);
    else startBrowserRecognition(session);
  }

  /* Mevcut mikrofon düğmelerini tam ekran görüşme arayüzüne bağla. */
  const generalButton = $("voiceButton");
  const projectButton = $("projectVoiceButton");
  const startFromButton = async () => {
    if (voiceSession) { showVoiceScreen(); await stopVoiceSession(); return; }

    // Do not check the in-memory session before Supabase has restored it.
    // This was the reason Google users were incorrectly sent to the login modal.
    try {
      if (!window.TozraAuth) throw new Error("Hesap servisi yüklenemedi.");
      await window.TozraAuth.init();
      const currentSession = window.TozraAuth.getSession();
      if (!currentSession?.access_token) {
        if (typeof window.showModal === "function") window.showModal("login");
        return;
      }
    } catch (authError) {
      console.error("TOZRA sesli sohbet oturum kontrolü:", authError);
      setStatus("Hesap oturumu doğrulanamadı. Tekrar deneyebilirsin.", $("voiceStatus"));
      return;
    }

    await startBrowserVoice();
  };
  window.startTozraVoiceFromHome = startFromButton;
  const homeVoiceButton = $("homeVoiceButton");
  if (homeVoiceButton) {
    homeVoiceButton.type = "button";
    homeVoiceButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      startFromButton();
    });
  }
  if (generalButton) {
    generalButton.onclick = startFromButton;
    generalButton.textContent = "🎙 Sesli sohbet";
  }
  if (projectButton) {
    projectButton.onclick = startFromButton;
    projectButton.textContent = "🎙 Sesli sohbet";
  }

  const finishAndClose = async () => { await stopVoiceSession(); hideVoiceScreen(); };
  $("voiceScreenEnd")?.addEventListener("click", finishAndClose);
  $("voiceScreenClose")?.addEventListener("click", finishAndClose);
  $("voiceScreenClose2")?.addEventListener("click", finishAndClose);
  $("voiceScreenMic")?.addEventListener("click", () => {
    if (voiceSession?.browserFallback) {
      const session = voiceSession;
      if (session.mediaRecorderMode) {
        if (session.recorder?.state === "recording") {
          try { session.recorder.stop(); } catch {}
          $("voiceScreenMic")?.classList.add("is-muted");
          $("voiceScreenMic")?.setAttribute("aria-label", "Mikrofonu aç");
          setStatus("Konuşman gönderiliyor…", session.target.status);
        } else {
          session.muted = false;
          startMediaRecorderCapture(session);
        }
        return;
      }
      session.muted = !session.muted;
      if (session.muted) {
        try { session.recognition?.stop(); } catch {}
        window.speechSynthesis?.cancel();
      } else {
        startBrowserRecognition(session);
      }
      $("voiceScreenMic").classList.toggle("is-muted", session.muted);
      $("voiceScreenMic").setAttribute("aria-label", session.muted ? "Mikrofonu aç" : "Mikrofonu kapat");
      setStatus(session.muted ? "Mikrofon kapalı." : "Mikrofon açık. Seni dinliyorum…", session.target.status);
      return;
    }
    if (!voiceSession?.localStream) return;
    const tracks = voiceSession.localStream.getAudioTracks();
    const currentlyEnabled = tracks.some(track => track.enabled);
    tracks.forEach(track => { track.enabled = !currentlyEnabled; });
    $("voiceScreenMic").classList.toggle("is-muted", currentlyEnabled);
    $("voiceScreenMic").setAttribute("aria-label", currentlyEnabled ? "Mikrofonu aç" : "Mikrofonu kapat");
    setStatus(currentlyEnabled ? "Mikrofon kapalı." : "Mikrofon açık. Seni dinliyorum…", voiceSession.target.status);
  });

  window.stopTozraVoice = stopVoiceSession;

  window.addEventListener("pagehide", () => {
    stopVoiceSession(false);
  });

})();
