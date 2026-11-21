"use strict";

/* TOZRA ADVANCED MEMORY v2
   Local cache + Supabase account sync + prompt relevance retrieval.
   Requires an authenticated Supabase session for cloud sync.
*/
(() => {
  const STORAGE_KEY = "tozra-personal-memory-v2";
  const MAX_MEMORIES = 200;
  const MAX_LENGTH = 1500;
  const TABLE = "user_memories";
  const BLOCKED_PATTERNS = [
    /api[_ -]?key/i, /password|şifre|parola/i, /secret|token/i,
    /kredi kartı/i, /cvv/i, /güvenlik kodu/i
  ];

  let initialized = false;
  let syncState = "local";
  let syncMessage = "Hafıza bu cihazda saklanıyor.";
  let syncPromise = Promise.resolve();

  function storageKey() {
    return typeof window.tozraStorageKey === "function"
      ? window.tozraStorageKey(STORAGE_KEY)
      : `tozra-guest:${STORAGE_KEY}`;
  }

  function emit() {
    window.dispatchEvent(new CustomEvent("tozra:memory-updated", {
      detail: { state: syncState, message: syncMessage }
    }));
  }

  function setStatus(state, message) {
    syncState = state;
    syncMessage = message;
    emit();
  }

  function read() {
    try {
      const key = storageKey();
      let raw = localStorage.getItem(key);
      if (raw === null) {
        const legacyKey = typeof window.tozraStorageKey === "function"
          ? window.tozraStorageKey("tozra-personal-memory-v1")
          : "tozra-guest:tozra-personal-memory-v1";
        const legacy = localStorage.getItem(legacyKey);
        if (legacy !== null) {
          raw = legacy;
          localStorage.setItem(key, legacy);
          localStorage.removeItem(legacyKey);
        }
      }
      const data = JSON.parse(raw || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(items));
      return true;
    } catch (error) {
      console.error("TOZRA hafıza kayıt hatası:", error);
      return false;
    }
  }

  function validate(content) {
    if (typeof content !== "string") throw new Error("Hafıza metni geçersiz.");
    const value = content.trim();
    if (!value || value.length > MAX_LENGTH) {
      throw new Error("Hafıza metni boş veya çok uzun.");
    }
    if (BLOCKED_PATTERNS.some(pattern => pattern.test(value))) {
      throw new Error("Şifre, API anahtarı veya gizli bilgiler hafızaya kaydedilemez.");
    }
    return value;
  }

  function clientAndUser() {
    const auth = window.TozraAuth;
    const client = auth?.getClient?.();
    const userId = auth?.userId?.();
    return client && userId && userId !== "guest" ? { client, userId } : null;
  }

  async function cloudLoad() {
    const auth = clientAndUser();
    if (!auth) {
      setStatus("local", "Giriş yapılmadı: hafıza yalnızca bu cihazda saklanıyor.");
      return;
    }

    setStatus("syncing", "Hafıza buluttan yükleniyor…");
    const { data, error } = await auth.client
      .from(TABLE)
      .select("id,user_id,content,category,created_at,updated_at")
      .eq("user_id", auth.userId)
      .order("updated_at", { ascending: true })
      .limit(MAX_MEMORIES);

    if (error) {
      console.warn("TOZRA cloud memory unavailable:", error.message);
      setStatus("local", "Bulut hafızası hazır değil. SQL kurulumunu kontrol et; yerel hafıza çalışıyor.");
      return;
    }

    const local = read();
    const remote = (data || []).map(row => ({
      id: String(row.id),
      content: String(row.content || "").slice(0, MAX_LENGTH),
      category: String(row.category || "Genel").slice(0, 60),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
    })).filter(item => item.content);

    const merged = new Map();
    remote.forEach(item => merged.set(item.id, item));
    local.forEach(item => {
      const existing = merged.get(item.id);
      if (!existing || Number(item.updatedAt || 0) > Number(existing.updatedAt || 0)) {
        merged.set(item.id, item);
      }
    });

    const all = Array.from(merged.values())
      .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
      .slice(-MAX_MEMORIES);

    if (!write(all)) {
      setStatus("error", "Hafıza yerel depolamaya yazılamadı.");
      return;
    }

    const remoteById = new Map(remote.map(item => [item.id, item]));
    const toUpload = all.filter(item => {
      const cloudItem = remoteById.get(item.id);
      return !cloudItem || Number(item.updatedAt || 0) > Number(cloudItem.updatedAt || 0);
    });
    if (toUpload.length) {
      const { error: uploadError } = await auth.client.from(TABLE).upsert(
        toUpload.map(item => toRow(item, auth.userId)),
        { onConflict: "id" }
      );
      if (uploadError) {
        console.warn("TOZRA memory upload:", uploadError.message);
        setStatus("local", "Hafıza cihazda yüklendi; buluta aktarım bekliyor.");
        return;
      }
    }
    setStatus("synced", "Hafıza hesabınla buluta senkronize.");
  }

  function toRow(item, userId) {
    return {
      id: String(item.id),
      user_id: userId,
      content: item.content,
      category: item.category || "Genel",
      created_at: new Date(item.createdAt || Date.now()).toISOString(),
      updated_at: new Date(item.updatedAt || Date.now()).toISOString()
    };
  }

  async function cloudUpsert(item) {
    const auth = clientAndUser();
    if (!auth) {
      setStatus("local", "Kaydedildi. Giriş yaptığında bulut senkronizasyonu kullanılabilir.");
      return;
    }
    const { error } = await auth.client.from(TABLE).upsert(
      toRow(item, auth.userId), { onConflict: "id" }
    );
    if (error) {
      console.warn("TOZRA memory sync:", error.message);
      setStatus("local", "Cihaza kaydedildi; bulut senkronizasyonu başarısız.");
      return;
    }
    setStatus("synced", "Hafıza hesabınla buluta senkronize.");
  }

  function queueSync(task) {
    syncPromise = syncPromise.then(task).catch(error => {
      console.warn("TOZRA memory queue:", error);
      setStatus("local", "Hafıza cihazda kayıtlı; bulut eşitlemesi tamamlanamadı.");
    });
    return syncPromise;
  }

  async function init() {
    if (initialized) return syncPromise;
    initialized = true;
    await cloudLoad();
    return syncPromise;
  }

  async function reload() {
    initialized = false;
    await init();
    emit();
  }

  function add(content, category = "Genel") {
    const value = validate(content);
    const items = read();
    const duplicate = items.find(item =>
      item.content.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR")
    );
    if (duplicate) return { success: true, duplicate: true, memory: duplicate };
    if (items.length >= MAX_MEMORIES) throw new Error("Hafıza kapasitesi doldu.");

    const now = Date.now();
    const memory = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random().toString(36).slice(2)}`,
      content: value,
      category: String(category || "Genel").slice(0, 60),
      createdAt: now,
      updatedAt: now
    };
    items.push(memory);
    if (!write(items)) throw new Error("Hafıza kaydedilemedi.");
    setStatus("syncing", "Hafıza kaydedildi; bulut eşitlemesi yapılıyor…");
    queueSync(() => cloudUpsert(memory));
    emit();
    return { success: true, duplicate: false, memory };
  }

  function getAll() {
    return read();
  }

  function update(id, content, category) {
    const value = validate(content);
    const items = read();
    const index = items.findIndex(item => item.id === id);
    if (index < 0) throw new Error("Hafıza kaydı bulunamadı.");
    items[index] = {
      ...items[index],
      content: value,
      category: category === undefined ? items[index].category : String(category).slice(0, 60),
      updatedAt: Date.now()
    };
    if (!write(items)) throw new Error("Hafıza güncellenemedi.");
    setStatus("syncing", "Hafıza güncelleniyor…");
    queueSync(() => cloudUpsert(items[index]));
    emit();
    return items[index];
  }

  function remove(id) {
    const items = read();
    const next = items.filter(item => item.id !== id);
    if (next.length === items.length) return false;
    if (!write(next)) return false;
    const auth = clientAndUser();
    if (auth) {
      setStatus("syncing", "Hafıza siliniyor…");
      queueSync(async () => {
        const { error } = await auth.client.from(TABLE)
          .delete().eq("id", id).eq("user_id", auth.userId);
        if (error) throw error;
        setStatus("synced", "Hafıza hesabınla buluta senkronize.");
      });
    } else {
      setStatus("local", "Hafıza bu cihazdan silindi.");
    }
    emit();
    return true;
  }

  function clear() {
    const items = read();
    if (!write([])) return false;
    const auth = clientAndUser();
    if (auth && items.length) {
      setStatus("syncing", "Hafıza buluttan siliniyor…");
      queueSync(async () => {
        const { error } = await auth.client.from(TABLE)
          .delete().eq("user_id", auth.userId);
        if (error) throw error;
        setStatus("synced", "Hafıza hesabınla buluta senkronize.");
      });
    } else {
      setStatus("local", "Bu cihazdaki hafıza temizlendi.");
    }
    emit();
    return true;
  }

  function tokenize(value) {
    return String(value || "").toLocaleLowerCase("tr-TR")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/).filter(word => word.length > 2);
  }

  function getRelevant(prompt, limit = 12) {
    const query = new Set(tokenize(prompt));
    const items = read();
    if (!query.size) return items.slice(-Math.min(limit, 8));
    return items.map(item => {
      const words = tokenize(`${item.content} ${item.category}`);
      let score = 0;
      words.forEach(word => { if (query.has(word)) score += 2; });
      const content = item.content.toLocaleLowerCase("tr-TR");
      query.forEach(word => { if (content.includes(word)) score += 1; });
      if (["proje", "hedef", "tercih"].includes(String(item.category).toLocaleLowerCase("tr-TR"))) score += 0.25;
      return { item, score };
    }).filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.item.updatedAt || 0) - Number(a.item.updatedAt || 0))
      .slice(0, Math.max(1, Math.min(limit, 20)))
      .map(entry => entry.item);
  }

  window.TozraMemory = Object.freeze({
    init, reload, add, getAll, getRelevant, update, remove, clear,
    getStatus: () => ({ state: syncState, message: syncMessage }),
    whenSynced: () => syncPromise
  });
})();
