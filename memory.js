
"use strict";

/* TOZRA MEMORY SYSTEM v1 */

(() => {
  const STORAGE_KEY = "tozra-personal-memory-v1";
  const MAX_MEMORIES = 200;
  const MAX_LENGTH = 1500;

  const BLOCKED_PATTERNS = [
    /api[_ -]?key/i,
    /password|şifre|parola/i,
    /secret|token/i,
    /kredi kartı/i
  ];

  function storageKey() {
    return typeof window.tozraStorageKey === "function"
      ? window.tozraStorageKey(STORAGE_KEY)
      : `tozra-guest:${STORAGE_KEY}`;
  }

  function read() {
    try {
      const key = storageKey();
      let raw = localStorage.getItem(key);

      // Eski, hesaba bağlı olmayan hafızayı yalnızca ilk oturum açan
      // hesaba bir kez aktar; sonraki hesaplar bu veriyi göremez.
      if (raw === null && key.startsWith("tozra-user:")) {
        const legacy = localStorage.getItem(STORAGE_KEY);
        if (legacy !== null) {
          raw = legacy;
          localStorage.setItem(key, legacy);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const data = JSON.parse(raw || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function write(memories) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(memories));
      if (window.TozraCloudSync) window.TozraCloudSync.schedule();
      return true;
    } catch (error) {
      console.error("TOZRA hafıza kayıt hatası:", error);
      return false;
    }
  }

  function validate(content) {
    if (typeof content !== "string") {
      throw new Error("Hafıza metni geçersiz.");
    }

    const value = content.trim();

    if (!value || value.length > MAX_LENGTH) {
      throw new Error("Hafıza metni boş veya çok uzun.");
    }

    if (BLOCKED_PATTERNS.some(pattern => pattern.test(value))) {
      throw new Error("Gizli bilgiler hafızaya kaydedilemez.");
    }

    return value;
  }

  function add(content, category = "genel") {
    const value = validate(content);
    const memories = read();

    const duplicate = memories.find(
      item => item.content.toLowerCase() === value.toLowerCase()
    );

    if (duplicate) {
      return {
        success: true,
        duplicate: true,
        memory: duplicate
      };
    }

    if (memories.length >= MAX_MEMORIES) {
      throw new Error("Hafıza kapasitesi doldu.");
    }

    const memory = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random(),
      content: value,
      category: String(category).slice(0, 60),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    memories.push(memory);

    if (!write(memories)) {
      throw new Error("Hafıza kaydedilemedi.");
    }

    return {
      success: true,
      duplicate: false,
      memory
    };
  }

  function getAll() {
    return read();
  }

  function update(id, content, category) {
    const value = validate(content);
    const memories = read();

    const index = memories.findIndex(
      item => item.id === id
    );

    if (index === -1) {
      throw new Error("Hafıza kaydı bulunamadı.");
    }

    memories[index] = {
      ...memories[index],
      content: value,
      category: category === undefined
        ? memories[index].category
        : String(category).slice(0, 60),
      updatedAt: Date.now()
    };

    if (!write(memories)) {
      throw new Error("Hafıza güncellenemedi.");
    }

    return memories[index];
  }

  function remove(id) {
    const memories = read();
    const updated = memories.filter(
      item => item.id !== id
    );

    if (updated.length === memories.length) {
      return false;
    }

    return write(updated);
  }

  function clear() {
    return write([]);
  }

  function buildContext(limit = 30) {
    return read()
      .slice(-limit)
      .map(item => `- ${item.content}`)
      .join("\n");
  }

  window.TozraMemory = Object.freeze({
    add,
    getAll,
    update,
    remove,
    clear,
    buildContext
  });

})();
