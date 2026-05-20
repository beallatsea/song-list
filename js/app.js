'use strict';

const App = {
  songs: [],
  currentTab: 'all',
  query: '',

  // ===== Init =====

  async init() {
    this.applyTheme();
    this.bindEvents();
    await this.loadSongs();
  },

  async loadSongs() {
    const loading = document.getElementById('loadingState');
    const error = document.getElementById('errorState');

    try {
      const res = await fetch('./data/songs.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.songs = await res.json();
      loading.classList.add('hidden');
      this.render();
    } catch (e) {
      loading.classList.add('hidden');
      error.classList.remove('hidden');
      console.error('songs.json の読み込みに失敗しました:', e);
    }
  },

  // ===== Theme =====

  applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  // ===== Search / Filter =====

  normalize(str) {
    return str
      .toLowerCase()
      // カタカナ → ひらがな（検索でひらがな/カタカナ両方にマッチ）
      .replace(/[ァ-ヶ]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
      );
  },

  getDisplayList() {
    let list = [...this.songs];

    if (this.currentTab === 'recent') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      list = list.filter(s => new Date(s.addedDate) >= threshold);
      list.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
    } else if (this.currentTab === 'popular') {
      list = list
        .map(s => ({ ...s, reqCount: this.getRequestCount(s) }))
        .filter(s => s.reqCount > 0)
        .sort((a, b) => b.reqCount - a.reqCount);
    } else {
      // 全曲: 50音順（アーティスト → 曲名）
      list.sort((a, b) => {
        const cmp = a.artist.localeCompare(b.artist, 'ja');
        return cmp !== 0 ? cmp : a.title.localeCompare(b.title, 'ja');
      });
    }

    if (this.query) {
      const q = this.normalize(this.query);
      list = list.filter(s =>
        this.normalize(s.artist).includes(q) ||
        this.normalize(s.title).includes(q)
      );
    }

    return list;
  },

  // ===== Request Count (localStorage) =====

  storageKey(song) {
    return `req__${song.artist}__${song.title}`;
  },

  getRequestCount(song) {
    return parseInt(localStorage.getItem(this.storageKey(song)) || '0', 10);
  },

  incrementRequest(song) {
    const key = this.storageKey(song);
    const next = this.getRequestCount(song) + 1;
    localStorage.setItem(key, next);
    return next;
  },

  // ===== Render =====

  render() {
    const list = this.getDisplayList();
    const container = document.getElementById('songList');
    const empty = document.getElementById('emptyState');
    const emptyMsg = document.getElementById('emptyMessage');
    const count = document.getElementById('songCount');

    if (list.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      emptyMsg.textContent = this.getEmptyMessage();
    } else {
      empty.classList.add('hidden');
      container.innerHTML = list.map((s, i) => this.renderCard(s, i)).join('');
      this.bindCardEvents(container, list);
    }

    count.textContent = this.getCountText(list.length);
  },

  getEmptyMessage() {
    if (this.query) return `「${this.query}」は見つかりませんでした`;
    if (this.currentTab === 'recent') return '最近追加された曲はありません（30日以内）';
    if (this.currentTab === 'popular') return 'まだリクエストがありません\n下の「全曲」から曲をリクエストしてみてください！';
    return '曲が登録されていません';
  },

  getCountText(shown) {
    const total = this.songs.length;
    if (this.currentTab === 'all' && !this.query) return `全 ${total} 曲`;
    if (this.currentTab === 'popular') return `リクエスト ${shown} 曲`;
    if (this.currentTab === 'recent') return `最近追加 ${shown} 曲`;
    return `${shown} 曲 / 全 ${total} 曲`;
  },

  renderCard(song, index) {
    const reqCount = this.getRequestCount(song);
    const rank = this.currentTab === 'popular' ? index + 1 : null;

    const rankBadge = rank
      ? `<span class="rank-badge rank-badge--${rank <= 3 ? rank : 'other'}">${rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}</span>`
      : '';

    const practiceBadge = song.practice
      ? '<span class="badge badge--practice">練習中</span>'
      : '';

    const reqDisplay = reqCount > 0
      ? `<span class="req-count">${reqCount}リクエスト</span>`
      : '';

    return `
      <div class="song-card" role="listitem">
        <div class="song-card__info">
          <div class="song-card__artist">${this.esc(song.artist)}</div>
          <div class="song-card__title">
            ${rankBadge}${this.esc(song.title)}${practiceBadge}
          </div>
        </div>
        <div class="song-card__actions">
          ${reqDisplay}
          <button
            class="request-btn"
            data-artist="${this.esc(song.artist)}"
            data-title="${this.esc(song.title)}"
            aria-label="${this.esc(song.title)} をリクエスト"
          >リクエスト♪</button>
        </div>
      </div>
    `;
  },

  bindCardEvents(container, list) {
    container.querySelectorAll('.request-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const song = list.find(
          s => s.artist === btn.dataset.artist && s.title === btn.dataset.title
        );
        if (!song) return;

        const count = this.incrementRequest(song);
        this.showToast(`「${song.title}」をリクエストしました！`);

        // ボタン一時フィードバック
        btn.textContent = '✓ リクエスト済';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'リクエスト♪';
          btn.disabled = false;
          // リクエスト数表示を更新
          const actions = btn.closest('.song-card__actions');
          let countEl = actions.querySelector('.req-count');
          if (!countEl) {
            countEl = document.createElement('span');
            countEl.className = 'req-count';
            actions.insertBefore(countEl, btn);
          }
          countEl.textContent = `${count}リクエスト`;
          // 人気タブなら並び替えを反映
          if (this.currentTab === 'popular') this.render();
        }, 1800);
      });
    });
  },

  // ===== Toast =====

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
  },

  // ===== XSS対策エスケープ =====

  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // ===== Event Binding =====

  bindEvents() {
    // ダークモード
    document.getElementById('themeToggle')
      .addEventListener('click', () => this.toggleTheme());

    // 検索
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    searchInput.addEventListener('input', e => {
      this.query = e.target.value;
      searchClear.classList.toggle('visible', this.query.length > 0);
      this.render();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      this.query = '';
      searchClear.classList.remove('visible');
      searchInput.focus();
      this.render();
    });

    // タブ切替
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
