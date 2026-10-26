import { computed, onBeforeUnmount, ref, watch } from 'vue';

/**
 * Hitung mundur ke waktu ISO.
 * @param {import('vue').Ref<string|null>} targetIso
 */
export function useCountdown(targetIso) {
  const remainingMs = ref(0);
  let timer = null;

  const tick = () => {
    remainingMs.value = Math.max(0, new Date(targetIso.value).getTime() - Date.now());
    if (remainingMs.value === 0) stop();
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  watch(targetIso, (value) => {
    stop();
    if (!value) { remainingMs.value = 0; return; }
    tick();
    if (remainingMs.value > 0) timer = setInterval(tick, 1000);
  }, { immediate: true });

  onBeforeUnmount(stop);

  const label = computed(() => {
    const total = Math.ceil(remainingMs.value / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  });
  const expired = computed(() => Boolean(targetIso.value) && remainingMs.value === 0);

  return { label, expired, remainingMs };
}
