document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "spk_saw_bibit_padi_saved_state_v1";

  const defaultAlternatives = [
    { code: "A1", name: "Bibit Padi Ciherang", c1: 4, c2: 4, c3: 4, c4: 3 },
    { code: "A2", name: "Bibit Padi Inpari 32", c1: 5, c2: 4, c3: 5, c4: 4 },
    { code: "A3", name: "Bibit Padi Inpari 42", c1: 5, c2: 5, c3: 4, c4: 4 },
    { code: "A4", name: "Bibit Padi Mekongga", c1: 4, c2: 5, c3: 4, c4: 3 },
    { code: "A5", name: "Bibit Padi IR64", c1: 3, c2: 4, c3: 4, c4: 5 },
    { code: "A6", name: "Bibit Padi Situ Bagendit", c1: 4, c2: 3, c3: 3, c4: 2 },
    { code: "A7", name: "Bibit Padi Ciliwung", c1: 3, c2: 4, c3: 3, c4: 3 },
    { code: "A8", name: "Bibit Padi Pandan Wangi", c1: 4, c2: 5, c3: 4, c4: 3 },
    { code: "A9", name: "Bibit Padi Sintanur", c1: 4, c2: 4, c3: 5, c4: 4 },
    { code: "A10", name: "Bibit Padi Rojolele", c1: 5, c2: 5, c3: 3, c4: 2 },
    { code: "A11", name: "Bibit Padi Inpari 30", c1: 4, c2: 4, c3: 4, c4: 3 },
    { code: "A12", name: "Bibit Padi Inpari 33", c1: 5, c2: 4, c3: 5, c4: 3 },
    { code: "A13", name: "Bibit Padi Inpago 8", c1: 4, c2: 3, c3: 3, c4: 2 },
    { code: "A14", name: "Bibit Padi Hipa 8", c1: 5, c2: 4, c3: 5, c4: 4 },
    { code: "A15", name: "Bibit Padi Logawa", c1: 3, c2: 3, c3: 4, c4: 3 }
  ];

  const state = {
    alternatives: [],
    dataSearch: "",
    resultSearch: "",
    dataSort: { key: "code", dir: "asc" },
    resultSort: { key: "score", dir: "desc" },
    dirty: false,
    lastSavedAt: null
  };

  const els = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    menuToggle: document.getElementById("menuToggle"),
    statusBadge: document.getElementById("statusBadge"),
    saveBtn: document.getElementById("saveBtn"),
    restoreBtn: document.getElementById("restoreBtn"),
    printBtn: document.getElementById("printBtn"),
    pages: document.querySelectorAll(".page"),
    statAlternatives: document.getElementById("statAlternatives"),
    statCriteria: document.getElementById("statCriteria"),
    statWeight: document.getElementById("statWeight"),
    statBest: document.getElementById("statBest"),
    homeBestName: document.getElementById("homeBestName"),
    homeBestDescription: document.getElementById("homeBestDescription"),
    homeBestScore: document.getElementById("homeBestScore"),
    homeBestSummary: document.getElementById("homeBestSummary"),
    addForm: document.getElementById("addForm"),
    newName: document.getElementById("newName"),
    newC1: document.getElementById("newC1"),
    newC2: document.getElementById("newC2"),
    newC3: document.getElementById("newC3"),
    newC4: document.getElementById("newC4"),
    dataSearch: document.getElementById("dataSearch"),
    dataTableBody: document.getElementById("dataTableBody"),
    decisionMatrixBody: document.getElementById("decisionMatrixBody"),
    normalizationBody: document.getElementById("normalizationBody"),
    weightedBody: document.getElementById("weightedBody"),
    preferenceBody: document.getElementById("preferenceBody"),
    resultSearch: document.getElementById("resultSearch"),
    downloadCsvBtn: document.getElementById("downloadCsvBtn"),
    downloadJsonBtn: document.getElementById("downloadJsonBtn"),
    resultTableBody: document.getElementById("resultTableBody"),
    bestCard: document.getElementById("bestCard"),
    chartRoot: document.getElementById("chartRoot"),
    toast: document.getElementById("toast")
  };

  const cloneData = (data) => data.map((item) => ({ ...item }));
  const clampScore = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(5, Math.round(n)));
  };
  const escapeHtml = (text) =>
    String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const formatScore = (value, digits = 4) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "0.0000";

  function loadInitialData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneData(defaultAlternatives);

      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.alternatives)) {
        state.lastSavedAt = parsed.savedAt || null;
        return parsed.alternatives.map((item) => ({
          code: String(item.code || "").trim() || "A1",
          name: String(item.name || "").trim() || "Alternatif Baru",
          c1: clampScore(item.c1),
          c2: clampScore(item.c2),
          c3: clampScore(item.c3),
          c4: clampScore(item.c4)
        }));
      }
    } catch (error) {
      console.warn(error);
    }
    return cloneData(defaultAlternatives);
  }

  function nextAlternativeCode() {
    const numbers = state.alternatives
      .map((item) => parseInt(String(item.code).replace(/[^\d]/g, ""), 10))
      .filter((n) => Number.isFinite(n));
    return `A${(numbers.length ? Math.max(...numbers) : 0) + 1}`;
  }

  function renderStatus() {
    if (!els.statusBadge) return;

    if (state.dirty) {
      els.statusBadge.textContent = "Perubahan belum disimpan";
      return;
    }

    if (state.lastSavedAt) {
      const d = new Date(state.lastSavedAt);
      els.statusBadge.textContent = Number.isNaN(d.getTime())
        ? "Data tersimpan"
        : `Tersimpan ${d.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          })}`;
    } else {
      els.statusBadge.textContent = "Data bawaan aktif";
    }
  }

  function toast(message, type = "info") {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => (els.toast.className = "toast"), 2200);
  }

  function openSidebar() {
    els.sidebar?.classList.add("open");
    els.overlay?.classList.add("show");
  }

  function closeSidebar() {
    els.sidebar?.classList.remove("open");
    els.overlay?.classList.remove("show");
  }

  function calculateSAW(alternatives) {
    if (!alternatives.length) return { rows: [], ranked: [], best: null };

    const max = {
      c1: Math.max(...alternatives.map((a) => Number(a.c1) || 0)),
      c2: Math.max(...alternatives.map((a) => Number(a.c2) || 0)),
      c3: Math.max(...alternatives.map((a) => Number(a.c3) || 0)),
      c4: Math.max(...alternatives.map((a) => Number(a.c4) || 0))
    };

    const min = {
      c1: Math.min(...alternatives.map((a) => Number(a.c1) || 0)),
      c2: Math.min(...alternatives.map((a) => Number(a.c2) || 0)),
      c3: Math.min(...alternatives.map((a) => Number(a.c3) || 0)),
      c4: Math.min(...alternatives.map((a) => Number(a.c4) || 0))
    };

    const rows = alternatives.map((alt, index) => {
      const values = {
        c1: Number(alt.c1) || 0,
        c2: Number(alt.c2) || 0,
        c3: Number(alt.c3) || 0,
        c4: Number(alt.c4) || 0
      };

      const normalized = {
        c1: max.c1 ? values.c1 / max.c1 : 0,
        c2: max.c2 ? values.c2 / max.c2 : 0,
        c3: max.c3 ? values.c3 / max.c3 : 0,
        c4: values.c4 ? min.c4 / values.c4 : 0
      };

      const weighted = {
        c1: normalized.c1 * 0.25,
        c2: normalized.c2 * 0.30,
        c3: normalized.c3 * 0.25,
        c4: normalized.c4 * 0.20
      };

      const score = weighted.c1 + weighted.c2 + weighted.c3 + weighted.c4;
      return { ...alt, index, values, normalized, weighted, score };
    });

    const ranked = [...rows].sort(
      (a, b) =>
        b.score - a.score ||
        String(a.code).localeCompare(String(b.code), "id", { numeric: true })
    );

    return { rows, ranked, best: ranked[0] || null };
  }

  function compareValues(a, b, key, dir) {
    const direction = dir === "asc" ? 1 : -1;
    if (typeof a[key] === "number" && typeof b[key] === "number") return (a[key] - b[key]) * direction;
    return String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "id", {
      numeric: true,
      sensitivity: "base"
    }) * direction;
  }

  function getFilteredSortedAlternatives() {
    const query = state.dataSearch.trim().toLowerCase();
    let rows = state.alternatives.map((alt, index) => ({ ...alt, index }));

    if (query) {
      rows = rows.filter((alt) => `${alt.code} ${alt.name}`.toLowerCase().includes(query));
    }

    rows.sort((a, b) => compareValues(a, b, state.dataSort.key, state.dataSort.dir));
    return rows;
  }

  function getFilteredSortedResults(calc) {
    const query = state.resultSearch.trim().toLowerCase();
    let rows = [...calc.ranked];

    if (query) {
      rows = rows.filter((alt) => `${alt.code} ${alt.name}`.toLowerCase().includes(query));
    }

    rows.sort((a, b) => compareValues(a, b, state.resultSort.key, state.resultSort.dir));
    return rows;
  }

  function medalBadge(rank) {
    if (rank === 1) return `<span class="medal medal-gold">🥇 Juara 1</span>`;
    if (rank === 2) return `<span class="medal medal-silver">🥈 Juara 2</span>`;
    if (rank === 3) return `<span class="medal medal-bronze">🥉 Juara 3</span>`;
    return `<span class="rank-chip">${rank}</span>`;
  }

  function getStatusLabel(rank, isBest) {
    if (isBest || rank === 1) return { text: "Alternatif Terbaik", className: "status-best" };
    if (rank === 2) return { text: "Juara 2", className: "status-silver" };
    if (rank === 3) return { text: "Juara 3", className: "status-bronze" };
    if (rank <= 5) return { text: "Layak Dipertimbangkan", className: "status-consider" };
    return { text: "Perlu Evaluasi", className: "status-review" };
  }

  function renderHome(calc) {
    const best = calc.best;
    els.statAlternatives.textContent = String(state.alternatives.length);
    els.statCriteria.textContent = "4";
    els.statWeight.textContent = "100%";
    els.statBest.textContent = best ? best.code : "-";

    if (best) {
      els.homeBestName.textContent = `${best.code} — ${best.name}`;
      els.homeBestDescription.textContent = `Alternatif ini memiliki nilai preferensi tertinggi saat ini sebesar ${formatScore(best.score)}.`;
      els.homeBestScore.textContent = formatScore(best.score);

      const percent = Math.max(0, Math.min(100, best.score * 100));
      const ring = els.homeBestSummary.querySelector(".progress-ring");
      if (ring) {
        ring.style.background = `conic-gradient(var(--primary) 0deg, var(--accent) ${percent * 3.6}deg, rgba(255,255,255,0.06) ${percent * 3.6}deg)`;
      }
    } else {
      els.homeBestName.textContent = "-";
      els.homeBestDescription.textContent = "Belum ada data untuk dihitung.";
      els.homeBestScore.textContent = "0.0000";
    }
  }

  function renderDataTable() {
    const rows = getFilteredSortedAlternatives();
    els.dataTableBody.innerHTML = rows.length
      ? rows.map((alt) => `
        <tr>
          <td>${escapeHtml(alt.code)}</td>
          <td><input type="text" value="${escapeHtml(alt.name)}" data-index="${alt.index}" data-field="name" class="alt-field" /></td>
          <td><input type="number" min="1" max="5" value="${alt.c1}" data-index="${alt.index}" data-field="c1" class="alt-field" /></td>
          <td><input type="number" min="1" max="5" value="${alt.c2}" data-index="${alt.index}" data-field="c2" class="alt-field" /></td>
          <td><input type="number" min="1" max="5" value="${alt.c3}" data-index="${alt.index}" data-field="c3" class="alt-field" /></td>
          <td><input type="number" min="1" max="5" value="${alt.c4}" data-index="${alt.index}" data-field="c4" class="alt-field" /></td>
          <td><button type="button" class="btn btn-ghost delete-row" data-index="${alt.index}">Hapus</button></td>
        </tr>`).join("")
      : `<tr><td colspan="7">Tidak ada data yang cocok.</td></tr>`;
  }

  function renderDecisionMatrix(calc) {
    els.decisionMatrixBody.innerHTML = calc.rows.length
      ? calc.rows.map((row) => `<tr><td>${escapeHtml(row.code)}</td><td>${escapeHtml(row.name)}</td><td>${row.values.c1}</td><td>${row.values.c2}</td><td>${row.values.c3}</td><td>${row.values.c4}</td></tr>`).join("")
      : `<tr><td colspan="6">Belum ada data.</td></tr>`;
  }

  function renderNormalization(calc) {
    els.normalizationBody.innerHTML = calc.rows.length
      ? calc.rows.map((row) => `<tr><td>${escapeHtml(row.code)}</td><td>${escapeHtml(row.name)}</td><td>${formatScore(row.normalized.c1)}</td><td>${formatScore(row.normalized.c2)}</td><td>${formatScore(row.normalized.c3)}</td><td>${formatScore(row.normalized.c4)}</td></tr>`).join("")
      : `<tr><td colspan="6">Belum ada data.</td></tr>`;
  }

  function renderWeighted(calc) {
    els.weightedBody.innerHTML = calc.rows.length
      ? calc.rows.map((row) => `<tr><td>${escapeHtml(row.code)}</td><td>${formatScore(row.weighted.c1)}</td><td>${formatScore(row.weighted.c2)}</td><td>${formatScore(row.weighted.c3)}</td><td>${formatScore(row.weighted.c4)}</td><td>${formatScore(row.score)}</td></tr>`).join("")
      : `<tr><td colspan="6">Belum ada data.</td></tr>`;
  }

  function renderPreference(calc) {
    const sorted = [...calc.rows].sort((a, b) => b.score - a.score);
    els.preferenceBody.innerHTML = sorted.length
      ? sorted.map((row) => `<tr><td>${escapeHtml(row.code)}</td><td>${escapeHtml(row.name)}</td><td><strong>${formatScore(row.score)}</strong></td></tr>`).join("")
      : `<tr><td colspan="3">Belum ada data.</td></tr>`;
  }

  function renderResults(calc) {
    const rows = getFilteredSortedResults(calc);
    els.resultTableBody.innerHTML = rows.length
      ? rows.map((row, index) => {
          const rank = index + 1;
          const isBest = calc.best && row.code === calc.best.code;
          const status = getStatusLabel(rank, isBest);
          return `<tr class="${isBest ? "best-row" : ""}">
            <td>${medalBadge(rank)}</td>
            <td>${escapeHtml(row.code)}</td>
            <td>${escapeHtml(row.name)}</td>
            <td><strong>${formatScore(row.score)}</strong></td>
            <td><span class="status-pill ${status.className}">${status.text}</span></td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="5">Tidak ada data yang cocok.</td></tr>`;
  }

  function renderBest(calc) {
    if (!calc.best) {
      els.bestCard.innerHTML = `<div class="best-card-shell"><div class="best-card-main"><h3>Belum Ada Data</h3><p>Tambahkan alternatif terlebih dahulu untuk menampilkan peringkat juara.</p></div></div>`;
      return;
    }

    const top3 = [...calc.ranked].slice(0, 3);
    els.bestCard.innerHTML = `
      <div class="best-card-shell">
        <div class="best-card-main">
          <div class="best-badge">🏆 Juara 1</div>
          <h3>${escapeHtml(calc.best.code)} — ${escapeHtml(calc.best.name)}</h3>
          <p>Alternatif ini memperoleh skor SAW tertinggi dan menjadi juara utama pada sistem.</p>
          <div class="best-score">${formatScore(calc.best.score)}</div>
          <div class="best-meta">Peringkat ditentukan berdasarkan nilai preferensi SAW.</div>
        </div>
        <div class="best-list">
          ${top3.map((item, index) => {
            const place = index + 1;
            const label = place === 1 ? "Juara 1" : place === 2 ? "Juara 2" : "Juara 3";
            return `<div class="best-item">
              <div><strong>${label} — ${escapeHtml(item.code)} — ${escapeHtml(item.name)}</strong><span>Skor SAW: ${formatScore(item.score)}</span></div>
              <div class="chip">${formatScore(item.score)}</div>
            </div>`;
          }).join("")}
        </div>
      </div>`;
  }

  function renderChart(calc) {
    const root = els.chartRoot;
    if (!root) return;

    if (!calc || !calc.ranked || !calc.ranked.length) {
      root.innerHTML = `<div class="chart-dom"><div class="chart-empty">Belum ada data untuk ditampilkan.</div></div>`;
      return;
    }

    const items = [...calc.ranked].sort((a, b) => b.score - a.score);
    const maxScore = Math.max(...items.map((i) => Number(i.score) || 0), 1);
    const ticks = [1, 0.75, 0.5, 0.25, 0];

    root.innerHTML = `
      <div class="chart-dom">
        <div class="chart-head">Grafik Nilai Akhir Bibit Padi</div>
        <div class="chart-figure">
          <div class="chart-yaxis">
            ${ticks.map((t) => `<span>${t.toFixed(2)}</span>`).join("")}
          </div>

          <div class="chart-plot">
            <div class="chart-grid">
              ${ticks.map(() => `<div class="chart-grid-line"></div>`).join("")}
            </div>

            <div class="chart-bars">
              ${items.map((item) => {
                const value = Number(item.score) || 0;
                const height = (value / maxScore) * 100;
                return `
                  <div class="chart-column">
                    <div class="chart-bar-value">${formatScore(value)}</div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill" style="height:${height}%;"></div>
                    </div>
                    <div class="chart-bar-label">${escapeHtml(item.code)}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
        <div class="chart-legend">Batang tertinggi menunjukkan alternatif terbaik.</div>
      </div>
    `;
  }

  function renderDerivedViews() {
    const calc = calculateSAW(state.alternatives);
    renderHome(calc);
    renderDecisionMatrix(calc);
    renderNormalization(calc);
    renderWeighted(calc);
    renderPreference(calc);
    renderResults(calc);
    renderBest(calc);
    renderChart(calc);
    renderStatus();
    return calc;
  }

  function renderAll() {
    renderDataTable();
    renderDerivedViews();
  }

  function validateForm() {
    const name = els.newName.value.trim();
    if (!name) {
      toast("Nama alternatif belum diisi.", "error");
      return null;
    }

    return {
      code: nextAlternativeCode(),
      name,
      c1: clampScore(els.newC1.value),
      c2: clampScore(els.newC2.value),
      c3: clampScore(els.newC3.value),
      c4: clampScore(els.newC4.value)
    };
  }

  function saveToLocalStorage() {
    try {
      const payload = {
        alternatives: state.alternatives,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      state.lastSavedAt = payload.savedAt;
      state.dirty = false;
      renderStatus();
      toast("Data berhasil disimpan di browser.", "success");
    } catch (error) {
      console.error(error);
      toast("Gagal menyimpan data.", "error");
    }
  }

  function restoreFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        state.alternatives = cloneData(defaultAlternatives);
        state.lastSavedAt = null;
        state.dirty = false;
        renderAll();
        toast("Belum ada data tersimpan. Data bawaan ditampilkan.", "info");
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.alternatives)) {
        state.alternatives = parsed.alternatives.map((item) => ({
          code: String(item.code || "").trim() || "A1",
          name: String(item.name || "").trim() || "Alternatif Baru",
          c1: clampScore(item.c1),
          c2: clampScore(item.c2),
          c3: clampScore(item.c3),
          c4: clampScore(item.c4)
        }));
        state.lastSavedAt = parsed.savedAt || null;
        state.dirty = false;
        renderAll();
        toast("Data tersimpan berhasil dipulihkan.", "success");
      } else {
        throw new Error("Format data tidak valid.");
      }
    } catch (error) {
      console.error(error);
      toast("Gagal memulihkan data.", "error");
    }
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv(calc) {
    const rows = [...calc.ranked].sort((a, b) => b.score - a.score);
    const header = ["Rank", "Kode", "Nama", "C1", "C2", "C3", "C4", "Nilai_Akhir"];
    const lines = [header.join(",")];

    rows.forEach((row, index) => {
      lines.push([
        index + 1,
        `"${String(row.code).replaceAll('"', '""')}"`,
        `"${String(row.name).replaceAll('"', '""')}"`,
        row.values.c1,
        row.values.c2,
        row.values.c3,
        row.values.c4,
        formatScore(row.score)
      ].join(","));
    });

    downloadFile("hasil_saw_bibit_padi.csv", lines.join("\n"), "text/csv;charset=utf-8");
    toast("CSV berhasil diunduh.", "success");
  }

  function exportJson(calc) {
    const payload = {
      title: "PadiSmartApp",
      generatedAt: new Date().toISOString(),
      criteria: [
        { code: "C1", name: "Produktivitas", type: "Benefit", weight: 0.25 },
        { code: "C2", name: "Ketahanan Hama", type: "Benefit", weight: 0.30 },
        { code: "C3", name: "Umur Panen", type: "Benefit", weight: 0.25 },
        { code: "C4", name: "Harga Benih", type: "Cost", weight: 0.20 }
      ],
      results: [...calc.ranked].map((row, index) => ({
        rank: index + 1,
        code: row.code,
        name: row.name,
        values: row.values,
        normalized: row.normalized,
        weighted: row.weighted,
        score: Number(formatScore(row.score))
      }))
    };

    downloadFile("hasil_saw_bibit_padi.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    toast("JSON berhasil diunduh.", "success");
  }

  function showSection(sectionId) {
    els.pages.forEach((page) => page.classList.toggle("active", page.id === sectionId));

    document.querySelectorAll("[data-section]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === sectionId);
    });

    closeSidebar();

    requestAnimationFrame(() => {
      renderDerivedViews();
      if (sectionId === "chart") {
        setTimeout(() => renderChart(calculateSAW(state.alternatives)), 60);
      }
    });
  }

  function bindEvents() {
    document.querySelectorAll("[data-section]").forEach((btn) => {
      btn.addEventListener("click", () => showSection(btn.dataset.section));
    });

    els.menuToggle?.addEventListener("click", () => {
      const isOpen = els.sidebar.classList.contains("open");
      if (isOpen) closeSidebar();
      else openSidebar();
    });

    els.overlay?.addEventListener("click", closeSidebar);
    els.saveBtn?.addEventListener("click", saveToLocalStorage);
    els.restoreBtn?.addEventListener("click", restoreFromLocalStorage);
    els.printBtn?.addEventListener("click", () => window.print());

    els.addForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = validateForm();
      if (!data) return;

      state.alternatives.push(data);
      state.dirty = true;
      renderAll();

      els.newName.value = "";
      els.newC1.value = 3;
      els.newC2.value = 3;
      els.newC3.value = 3;
      els.newC4.value = 3;

      toast(`Data ${data.code} berhasil ditambahkan.`, "success");
    });

    els.dataSearch?.addEventListener("input", () => {
      state.dataSearch = els.dataSearch.value;
      renderDataTable();
    });

    els.resultSearch?.addEventListener("input", () => {
      state.resultSearch = els.resultSearch.value;
      renderDerivedViews();
    });

    document.getElementById("dataTable")?.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest(".delete-row");
      if (!deleteBtn) return;

      const idx = Number(deleteBtn.dataset.index);
      const target = state.alternatives[idx];
      if (!target) return;
      if (!confirm(`Hapus ${target.code} — ${target.name}?`)) return;

      state.alternatives.splice(idx, 1);
      state.dirty = true;
      renderAll();
      toast("Data alternatif berhasil dihapus.", "success");
    });

    document.getElementById("dataTable")?.addEventListener("change", (event) => {
      const input = event.target.closest(".alt-field");
      if (!input) return;

      const idx = Number(input.dataset.index);
      const field = input.dataset.field;
      const target = state.alternatives[idx];
      if (!target || !field) return;

      if (field === "name") {
        target.name = input.value.trim() || target.name;
      } else {
        target[field] = clampScore(input.value);
        input.value = target[field];
      }

      state.dirty = true;
      renderAll();
    });

    [document.getElementById("dataTable"), document.getElementById("resultTable")].forEach((table) => {
      table?.querySelector("thead")?.addEventListener("click", (event) => {
        const th = event.target.closest("th[data-sort-key]");
        if (!th) return;

        const key = th.dataset.sortKey;
        const isDataTable = table.id === "dataTable";
        const sortState = isDataTable ? state.dataSort : state.resultSort;

        if (sortState.key === key) sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
        else {
          sortState.key = key;
          sortState.dir = key === "score" || key === "rank" ? "desc" : "asc";
        }

        if (isDataTable) renderDataTable();
        else renderDerivedViews();
      });
    });

    els.downloadCsvBtn?.addEventListener("click", () => exportCsv(calculateSAW(state.alternatives)));
    els.downloadJsonBtn?.addEventListener("click", () => exportJson(calculateSAW(state.alternatives)));
    window.addEventListener("resize", () => renderChart(calculateSAW(state.alternatives)));
  }

  state.alternatives = loadInitialData();
  renderStatus();
  bindEvents();
  renderAll();
  showSection("home");
});