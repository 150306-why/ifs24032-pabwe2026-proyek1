import { defineStore } from 'pinia';

let nextId = 1;

/** Notifikasi singkat di pojok layar; hilang sendiri setelah beberapa detik. */
export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    push(message, type = 'success', duration = 4000) {
      const id = nextId++;
      this.items.push({ id, message, type });
      if (duration > 0) setTimeout(() => this.dismiss(id), duration);
      return id;
    },
    success(message) { return this.push(message, 'success'); },
    error(message) { return this.push(message, 'error', 6000); },
    dismiss(id) { this.items = this.items.filter((t) => t.id !== id); },
  },
});
