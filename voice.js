
"use strict";

/* TOZRA REALTIME VOICE */
(() => {
  let voiceSession = null;

  const setStatus = (message, target) => {
    if (target) target.textContent = message || "";
  };

  function getVoiceTarget() {
    const isProject = $("projectPage").classList.contains("active");

    if (isProject) {
      const project = getCurrentProject();
      if (!project) throw new Error("Önce bir proje açmalısın.");

      return {
        scope: "project",
        projectId: project.id,
        button: $("projectVoiceButton"),
        status: $("projectVoiceStatus"),
        history: project.messages || [],
        projectContext: buildProjectContext(project)
      };
    }

    return {
      scope: "general",
      button: $("voiceButton"),
      status: $("voiceStatus"),
      history: conversation || [],
      projectContext: ""
    };
  }

  function updateButton(target, active) {
    target.button.classList.toggle("recording", active);
    target.button.textContent = active ? "■ Görüşmeyi bitir" : "🎙 Sesli sohbet";
    target.button.setAttribute("aria-pressed", String(active));
  }

  function addVoiceMessage(session, role, content) {
    const text = String(content || "").trim();
    if (!text) return;

    if (session.scope === "project") {
      const project = projects.find(p => p.id === session.projectId);
      if (!project) return;

      project.messages = project.messages || [];
      project.messages.push({ role, content: text });
      project.updatedAt = Date.now();

      addMessage($("projectMessages"), role, text);
      saveProjects();
      renderProjectInfo(project);
      return;
    }

    if (role === "user" && !conversation.length) {
      conversation.push({
        id: Date.now(),
        role,
        content: text
      });
    } else {
      conversation.push({ role, content: text });
    }

    $("welcome").style.display = "none";
    addMessage($("messages"), role, text);
    saveGeneralConversation();
  }

  function handleRealtimeEvent(event, session) {
    if (!event || !session) return;

    switch (event.type) {
      case "session.created":
      case "session.updated":
        setStatus("Bağlantı hazır. Konuşabilirsin.", session.target.status);
        break;

      case "input_audio_buffer.speech_started":
        setStatus("Seni dinliyorum…", session.target.status);
        break;

      case "input_audio_buffer.speech_stopped":
        setStatus("TOZRA yanıt hazırlıyor…", session.target.status);
        break;

      case "output_audio_buffer.started":
        setStatus("TOZRA konuşuyor…", session.target.status);
        break;

      case "output_audio_buffer.stopped":
        setStatus("Dinliyorum…", session.target.status);
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const itemId = event.item_id || event.event_id;
        if (itemId && session.userItems.has(itemId)) break;
        if (itemId) session.userItems.add(itemId);

        addVoiceMessage(session, "user", event.transcript);
        break;
      }

      case "response.output_audio_transcript.delta": {
        const id = event.response_id || "default";
        session.assistantDrafts.set(
          id,
          (session.assistantDrafts.get(id) || "") + (event.delta || "")
        );
        break;
      }

      case "response.output_audio_transcript.done": {
        const id = event.response_id || event.item_id || "default";
        if (session.assistantItems.has(id)) break;
        session.assistantItems.add(id);

        const finalText =
          event.transcript || session.assistantDrafts.get(id) || "";

        addVoiceMessage(session, "assistant", finalText);
        session.assistantDrafts.delete(id);
        break;
      }

      case "conversation.item.input_audio_transcription.failed":
        setStatus("Konuşman yazıya dönüştürülemedi. Tekrar deneyebilirsin.", session.target.status);
        break;

      case "error":
        console.error("TOZRA Realtime error:", event);
        setStatus(
          event.error?.message || "Sesli görüşmede bir hata oluştu.",
          session.target.status
        );
        break;

      case "response.done":
        if (session.pc?.connectionState === "connected") {
          setStatus("Dinliyorum…", session.target.status);
        }
        break;
    }
  }

  async function stopRealtimeVoice(showMessage = true) {
    const session = voiceSession;
    if (!session) return;

    voiceSession = null;

    try {
      session.dataChannel?.close();
      session.pc?.close();

      session.localStream?.getTracks().forEach(track => track.stop());

      if (session.remoteSource) {
        try { session.remoteSource.disconnect(); } catch (_) {}
      }

      if (session.audioElement) {
        session.audioElement.pause();
        session.audioElement.srcObject = null;
        session.audioElement.remove();
      }

      if (session.audioContext && session.audioContext.state !== "closed") {
        await session.audioContext.close();
      }
    } catch (error) {
      console.warn("Ses bağlantısı kapatılırken:", error);
    }

    updateButton(session.target, false);

    if (showMessage) {
      setStatus("Sesli görüşme sona erdi.", session.target.status);
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
    } catch (error) {
      alert(error.message);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setStatus("Bu tarayıcı gerçek zamanlı sesli görüşmeyi desteklemiyor.", target.status);
      return;
    }

    const session = {
      target,
      scope: target.scope,
      projectId: target.projectId,
      pc: null,
      dataChannel: null,
      localStream: null,
      audioContext: null,
      remoteSource: null,
      audioElement: null,
      userItems: new Set(),
      assistantItems: new Set(),
      assistantDrafts: new Map()
    };

    voiceSession = session;
    updateButton(target, true);
    setStatus("Sesli görüşme hazırlanıyor…", target.status);

    try {
      /*
       * Ses motorunu kullanıcı düğmeye basmışken başlat.
       * Bu, özellikle iPhone Safari'de ses oynatma izni için önemlidir.
       */
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      let audioResume = Promise.resolve();

      if (AudioContextClass) {
        session.audioContext = new AudioContextClass();
        audioResume = session.audioContext.resume().catch(() => {});
      }

      session.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (voiceSession !== session) return;

      session.pc = new RTCPeerConnection();

      session.localStream.getAudioTracks().forEach(track => {
        session.pc.addTrack(track, session.localStream);
      });

      /*
       * TOZRA'nın sesini karşı taraftan gelen WebRTC ses akışından oynat.
       */
      session.pc.ontrack = event => {
        const remoteStream =
          event.streams?.[0] || new MediaStream([event.track]);

        if (session.audioContext) {
          try {
            session.remoteSource =
              session.audioContext.createMediaStreamSource(remoteStream);

            session.remoteSource.connect(session.audioContext.destination);
            session.audioContext.resume().catch(() => {});
            setStatus("TOZRA'nın ses bağlantısı hazır.", target.status);
          } catch (error) {
            console.error("Ses oynatma hatası:", error);
            setStatus("TOZRA'nın sesi oynatılamadı.", target.status);
          }
        } else {
          const audio = document.createElement("audio");
          audio.autoplay = true;
          audio.playsInline = true;
          audio.srcObject = remoteStream;
          audio.style.display = "none";
          document.body.appendChild(audio);
          session.audioElement = audio;

          audio.play().catch(() => {
            setStatus("Sesi açmak için ekrana bir kez dokun.", target.status);
          });
        }
      };

      session.pc.onconnectionstatechange = () => {
        const state = session.pc?.connectionState;

        if (state === "connected") {
          setStatus("Bağlantı kuruldu. Konuşabilirsin.", target.status);
        } else if (state === "failed") {
          setStatus("Bağlantı kurulamadı. Tekrar deneyebilirsin.", target.status);
        } else if (state === "disconnected") {
          setStatus("Bağlantı kesiliyor…", target.status);
        }
      };

      session.dataChannel = session.pc.createDataChannel("oai-events");

      session.dataChannel.onopen = () => {
        setStatus("TOZRA hazır. Seni dinliyorum…", target.status);
      };

      session.dataChannel.onmessage = message => {
        try {
          const event = JSON.parse(message.data);
          handleRealtimeEvent(event, session);
        } catch (error) {
          console.warn("Realtime olayı okunamadı:", error);
        }
      };

      session.dataChannel.onerror = error => {
        console.error("Realtime data channel:", error);
        setStatus("Sohbet veri bağlantısında hata oluştu.", target.status);
      };

      await audioResume;

      /*
       * Önce sunucudan kısa ömürlü istemci anahtarı al.
       * Ana API anahtarı tarayıcıya gönderilmez.
       */
      const tokenResponse = await fetch("/api/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: target.history.slice(-10).map(item => ({
            role: item.role,
            content: item.content
          })),
          projectContext: target.projectContext
        })
      });

      const tokenData = await tokenResponse.json().catch(() => ({}));

      if (!tokenResponse.ok || !tokenData.success || !tokenData.client_secret) {
        throw new Error(tokenData.error || "Sesli görüşme anahtarı alınamadı.");
      }

      if (voiceSession !== session) return;

      /*
       * WebRTC bağlantısını OpenAI Realtime API'ye kur.
       */
      const offer = await session.pc.createOffer();
      await session.pc.setLocalDescription(offer);

      const rtcResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.client_secret}`,
          "Content-Type": "application/sdp"
        },
        body: session.pc.localDescription.sdp
      });

      const answerSdp = await rtcResponse.text();

      if (!rtcResponse.ok) {
        throw new Error(
          "Realtime bağlantısı reddedildi: " +
          answerSdp.slice(0, 350)
        );
      }

      if (voiceSession !== session) return;

      await session.pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp
      });

      setStatus("Bağlanıyor… Mikrofonunu kullanabilirsin.", target.status);

    } catch (error) {
      console.error("TOZRA sesli sohbet hatası:", error);

      if (voiceSession === session) {
        await stopRealtimeVoice(false);
      }

      setStatus(
        "Sesli sohbet başlatılamadı: " + (error.message || "Bilinmeyen hata"),
        target.status
      );
    }
  }

  /*
   * Mevcut kayıt düğmelerinin eski tıklama işlevlerini değiştir.
   */
  $("voiceButton").onclick = startRealtimeVoice;
  $("projectVoiceButton").onclick = startRealtimeVoice;

  $("voiceButton").textContent = "🎙 Sesli sohbet";
  $("projectVoiceButton").textContent = "🎙 Sesli sohbet";

  window.stopTozraVoice = stopRealtimeVoice;

  window.addEventListener("pagehide", () => {
    stopRealtimeVoice(false);
  });

})();
