'use strict';

const App = {
  songs: [],
  query: '',
  currentTab: 'all',

  async init() {
    this.applyTheme();
    this.bindEvents();
    await this.loadSongs();
  },

  async loadSongs() {
    const loading = document.getElementById('loadingState');
    const error   = document.getElementById('errorState');
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

  applyTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  normalize(str) {
    return str
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  },

  getDisplayList() {
    let list = [...this.songs];

    if (this.currentTab === 'recent') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      list = list
        .filter(s => new Date(s.addedDate) >= threshold)
        .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
    } else {
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

  render() {
    const list      = this.getDisplayList();
    const container = document.getElementById('songList');
    const empty     = document.getElementById('emptyState');
    const emptyMsg  = document.getElementById('emptyMessage');
    const count     = document.getElementById('songCount');

    if (list.length === 0) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      emptyMsg.textContent = this.query
        ? `「${this.query}」は見つかりませんでした`
        : this.currentTab === 'recent'
          ? '最近追加された曲はありません（30日以内）'
          : '曲が登録されていません';
    } else {
      empty.classList.add('hidden');
      container.innerHTML = list.map(s => this.renderCard(s)).join('');
    }

    if (this.currentTab === 'recent' && !this.query) {
      count.textContent = `最近追加 ${list.length} 曲`;
    } else if (this.query) {
      count.textContent = `${list.length} 曲 / 全 ${this.songs.length} 曲`;
    } else {
      count.textContent = `全 ${this.songs.length} 曲`;
    }
  },

  renderCard(song) {
    const practiceBadge = song.practice
      ? '<span class="badge badge--practice">練習中</span>'
      : '';
    return `
      <div class="song-card" role="listitem">
        <div class="song-card__info">
          <div class="song-card__artist">${this.esc(song.artist)}</div>
          <div class="song-card__title">${this.esc(song.title)}${practiceBadge}</div>
        </div>
      </div>
    `;
  },

  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  bindEvents() {
    document.getElementById('themeToggle')
      .addEventListener('click', () => this.toggleTheme());

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
