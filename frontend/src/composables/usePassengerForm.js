import { computed, ref } from 'vue';

export const MAX_PASSENGERS = 10;

/**
 * Form penumpang dinamis. Total hanya tampilan; harga final dihitung server.
 * @param {import('vue').Ref<{dewasa:number, anak:number}|undefined>} fares
 * @param {import('vue').Ref<number>} seatsLeft
 */
export function usePassengerForm(fares, seatsLeft) {
  let nextId = 1;
  const passengers = ref([{ id: nextId++, name: '', category: 'dewasa' }]);

  const maxAllowed = computed(() => Math.min(MAX_PASSENGERS, seatsLeft?.value ?? MAX_PASSENGERS));
  const canAdd = computed(() => passengers.value.length < maxAllowed.value);
  const total = computed(() => passengers.value.reduce((sum, p) => sum + (fares.value?.[p.category] ?? 0), 0));
  const isValid = computed(() => passengers.value.every((p) => p.name.trim().length >= 2));

  function add() {
    if (canAdd.value) passengers.value.push({ id: nextId++, name: '', category: 'dewasa' });
  }
  function remove(id) {
    if (passengers.value.length > 1) passengers.value = passengers.value.filter((p) => p.id !== id);
  }
  const payload = () => passengers.value.map((p) => ({ name: p.name.trim(), category: p.category }));

  return { passengers, canAdd, maxAllowed, total, isValid, add, remove, payload };
}
