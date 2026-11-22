
"use strict";

/* TOZRA REALTIME VOICE v3 - PERSONAL MEMORY */
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

  function handleRealtimeEvent(event, session) {
    if (!event || !session) return;

    switch (event.type) {

      case "session.created":
      case "session.updated":
        setStatus(
          "TOZRA hazır. Seni dinliyorum…",
          session.target.status
        );
        break;

      case "input_audio_buffer.speech_started":
        const transcriptNode = $("voiceScreenTranscript");
        if (transcriptNode) { transcriptNode.textContent = "Seni dinliyorum…"; transcriptNode.dataset.role = "user"; }
        setStatus(
          "Seni dinliyorum…",
          session.target.status
        );
        break;

      case "input_audio_buffer.speech_stopped":
        setStatus(
          "TOZRA yanıt hazırlıyor…",
          session.target.status
        );
        break;

      case "output_audio_buffer.started":
        setStatus(
          "TOZRA konuşuyor…",
          session.target.status
        );
        break;

      case "output_audio_buffer.stopped":
        setStatus(
          "Dinliyorum…",
          session.target.status
        );
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const transcriptNode = $("voiceScreenTranscript");
        if (transcriptNode && event.transcript) transcriptNode.textContent = event.transcript;
        const itemId = event.item_id;

        addVoiceMessage(
          session,
          "user",
          event.transcript,
          itemId ? `user-${itemId}` : null
        );

        break;
      }

      case "response.output_audio_transcript.delta": {
        const transcriptNode = $("voiceScreenTranscript");
        if (transcriptNode && event.delta) {
          if (transcriptNode.dataset.role !== "assistant") { transcriptNode.textContent = ""; transcriptNode.dataset.role = "assistant"; }
          transcriptNode.textContent += event.delta;
        }
        const id = event.response_id || "response";

        session.assistantDrafts.set(
          id,
          (session.assistantDrafts.get(id) || "") +
            (event.delta || "")
        );

        break;
      }

      case "response.output_audio_transcript.done": {
        const id =
          event.response_id ||
          event.item_id ||
          `assistant-${Date.now()}`;

        const finalText =
          event.transcript ||
          session.assistantDrafts.get(id) ||
          "";

        addVoiceMessage(
          session,
          "assistant",
          finalText,
          `assistant-${id}`
        );

        session.assistantDrafts.delete(id);

        break;
      }

      case "conversation.item.input_audio_transcription.failed":
        setStatus(
          "Konuşman anlaşılamadı. Tekrar deneyebilirsin.",
          session.target.status
        );
        break;

      case "error":
        console.error("TOZRA Realtime error:", event);

        setStatus(
          event.error?.message ||
            "Sesli görüşmede bir hata oluştu.",
          session.target.status
        );
        break;

      case "response.done":
        if (
          session.pc &&
          session.pc.connectionState === "connected"
        ) {
          setStatus(
            "Dinliyorum…",
            session.target.status
          );
        }
        break;
    }
  }

  async function stopRealtimeVoice(showMessage = true) {
    const session = voiceSession;

    if (!session) return;

    voiceSession = null;

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

  async function startRealtimeVoice() {
    if (voiceSession) {
      await stopRealtimeVoice();
      return;
    }

    let target;

    try {
      target = getVoiceTarget();

      if (!target.button || !target.status) {
        throw new Error(
          "Sesli sohbet arayüzü bulunamadı."
        );
      }

    } catch (error) {
      alert(error.message);
      return;
    }

    if (!window.TozraAuth?.getSession?.()) {
      setStatus("Sesli sohbet için önce hesabına giriş yapmalısın.", target.status);
      if (typeof window.showModal === "function") window.showModal("login");
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.RTCPeerConnection
    ) {
      setStatus(
        "Tarayıcın gerçek zamanlı sesli görüşmeyi desteklemiyor.",
        target.status
      );
      return;
    }

    const session = {
      target,
      scope: target.scope,
      projectId: target.projectId,
      pc: null,
      dataChannel: null,
      localStream: null,
      audioElement: null,
      savedMessages: new Set(),
      assistantDrafts: new Map()
    };

    voiceSession = session;
    $("voiceScreenMic")?.classList.remove("is-muted");
    $("voiceScreenMic")?.setAttribute("aria-label", "Mikrofonu kapat");

    updateButton(target, true);

    setStatus(
      "Sesli görüşme hazırlanıyor…",
      target.status
    );

    try {
      /*
       * Mikrofon izni.
       */
      session.localStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

      if (voiceSession !== session) {
        session.localStream
          .getTracks()
          .forEach(track => track.stop());

        return;
      }
      attachVoiceVisualizer(session, session.localStream);

      /*
       * WebRTC bağlantısı.
       */
      session.pc = new RTCPeerConnection();

      session.localStream
        .getAudioTracks()
        .forEach(track => {
          session.pc.addTrack(
            track,
            session.localStream
          );
        });

      /*
       * TOZRA'nın sesini oynat.
       */
      session.pc.ontrack = async event => {
        const remoteStream =
          event.streams?.[0] ||
          new MediaStream([event.track]);

        let audio = session.audioElement;

        if (!audio) {
          audio = document.createElement("audio");

          audio.autoplay = true;
          audio.playsInline = true;
          audio.muted = false;
          audio.volume = 1;
          audio.setAttribute("playsinline", "");
          audio.setAttribute("webkit-playsinline", "");
          audio.setAttribute("autoplay", "");
          audio.setAttribute("aria-label", "TOZRA ses çıkışı");
          audio.style.position = "fixed";
          audio.style.width = "1px";
          audio.style.height = "1px";
          audio.style.opacity = "0";
          audio.style.pointerEvents = "none";

          document.body.appendChild(audio);

          session.audioElement = audio;
        }

        audio.srcObject = remoteStream;

        try {
          await audio.play();

          setStatus(
            "TOZRA'nın sesi hazır. Konuşabilirsin.",
            target.status
          );

        } catch (error) {
          console.warn("Ses oynatma engellendi:", error);

          audio.controls = true;
          audio.style.display = "block";

          setStatus(
            "Sesi başlatmak için oynat düğmesine dokun.",
            target.status
          );
        }
      };

      /*
       * Bağlantı durumları.
       */
      session.pc.oniceconnectionstatechange = () => {
        const iceState = session.pc?.iceConnectionState;
        if (iceState === "failed") {
          setStatus("Ses bağlantısı kurulamadı. Ağını veya VPN ayarını kontrol edip tekrar dene.", target.status);
        }
      };

      session.pc.onconnectionstatechange = () => {
        const state =
          session.pc?.connectionState;

        if (state === "connected") {
          setStatus(
            "Bağlantı kuruldu. Seni dinliyorum…",
            target.status
          );
        }

        if (state === "failed") {
          setStatus(
            "Bağlantı başarısız oldu. Tekrar deneyebilirsin.",
            target.status
          );
        }

        if (state === "disconnected") {
          setStatus(
            "Bağlantı kesiliyor…",
            target.status
          );
        }
      };

      /*
       * Realtime olay kanalı.
       */
      session.dataChannel =
        session.pc.createDataChannel("oai-events");

      session.dataChannel.onopen = () => {
        setStatus(
          "TOZRA hazır. Seni dinliyorum…",
          target.status
        );
        // The first greeting confirms that both audio directions are alive.
        try {
          session.dataChannel.send(JSON.stringify({ type: "response.create" }));
        } catch (error) {
          console.warn("TOZRA ilk sesli yanıt isteği gönderilemedi:", error);
        }
      };

      session.dataChannel.onmessage = message => {
        try {
          const event = JSON.parse(message.data);

          handleRealtimeEvent(event, session);

        } catch (error) {
          console.warn(
            "Realtime olayı okunamadı:",
            error
          );
        }
      };

      session.dataChannel.onerror = error => {
        console.error(
          "Realtime data channel:",
          error
        );

        setStatus(
          "Sesli sohbet veri bağlantısında hata oluştu.",
          target.status
        );
      };

      /*
       * Önceki sohbet bağlamını sunucuya gönder.
       */
      const history = target.history
        .slice(-8)
        .map(item => ({
          role: item.role,
          content: String(item.content || "")
        }))
        .filter(item =>
          ["user", "assistant"].includes(item.role) &&
          item.content.trim()
        );

      /*
       * Kişisel hafıza kayıtlarını al.
       */
      const personalMemory = getPersonalMemory();

      /*
       * Oturum anahtarını al.
       */
      const tokenResponse = await fetch(
        "/api/realtime-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await TozraAuth.authHeaders())
          },
          body: JSON.stringify({
            history,
            projectContext: target.projectContext,
            personalMemory
          })
        }
      );

      const tokenData =
        await tokenResponse.json().catch(() => ({}));

      if (
        !tokenResponse.ok ||
        !tokenData.success ||
        !tokenData.client_secret
      ) {
        throw new Error(
          tokenData.error ||
            "Sesli görüşme anahtarı alınamadı."
        );
      }

      if (voiceSession !== session) return;

      /*
       * SDP teklifi oluştur.
       */
      const offer =
        await session.pc.createOffer();

      await session.pc.setLocalDescription(offer);

      /*
       * OpenAI Realtime bağlantısı.
       */
      const rtcResponse = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            "Authorization":
              `Bearer ${tokenData.client_secret}`,
            "Content-Type": "application/sdp"
          },
          body: session.pc.localDescription.sdp
        }
      );

      const answerSdp =
        await rtcResponse.text();

      if (!rtcResponse.ok) {
        throw new Error(
          "Realtime bağlantısı reddedildi: " +
          answerSdp.slice(0, 400)
        );
      }

      if (voiceSession !== session) return;

      await session.pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp
      });

      setStatus(
        "Bağlanıyor… Birazdan konuşabilirsin.",
        target.status
      );

    } catch (error) {
      console.error(
        "TOZRA sesli sohbet hatası:",
        error
      );

      if (voiceSession === session) {
        await stopRealtimeVoice(false);
      }

      const readableError = error?.message || "Bilinmeyen hata";
      setStatus("Sesli sohbet başlatılamadı: " + readableError, target.status);
      const transcript = $("voiceScreenTranscript");
      if (transcript) transcript.textContent = readableError;
    }
  }

  /* Mevcut mikrofon düğmelerini tam ekran görüşme arayüzüne bağla. */
  const generalButton = $("voiceButton");
  const projectButton = $("projectVoiceButton");
  const startFromButton = async () => {
    if (voiceSession) { showVoiceScreen(); await stopRealtimeVoice(); return; }

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

    showVoiceScreen();
    await startRealtimeVoice();
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

  const finishAndClose = async () => { await stopRealtimeVoice(); hideVoiceScreen(); };
  $("voiceScreenEnd")?.addEventListener("click", finishAndClose);
  $("voiceScreenClose")?.addEventListener("click", finishAndClose);
  $("voiceScreenClose2")?.addEventListener("click", finishAndClose);
  $("voiceScreenMic")?.addEventListener("click", () => {
    if (!voiceSession?.localStream) return;
    const tracks = voiceSession.localStream.getAudioTracks();
    const currentlyEnabled = tracks.some(track => track.enabled);
    tracks.forEach(track => { track.enabled = !currentlyEnabled; });
    $("voiceScreenMic").classList.toggle("is-muted", currentlyEnabled);
    $("voiceScreenMic").setAttribute("aria-label", currentlyEnabled ? "Mikrofonu aç" : "Mikrofonu kapat");
    setStatus(currentlyEnabled ? "Mikrofon kapalı." : "Mikrofon açık. Seni dinliyorum…", voiceSession.target.status);
  });

  window.stopTozraVoice = stopRealtimeVoice;

  window.addEventListener("pagehide", () => {
    stopRealtimeVoice(false);
  });

})();
