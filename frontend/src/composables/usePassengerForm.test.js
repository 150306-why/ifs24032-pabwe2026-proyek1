import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { MAX_PASSENGERS, usePassengerForm } from './usePassengerForm';

describe('usePassengerForm', () => {
  const fares = ref({ dewasa: 20000, anak: 12000 });

  it('mulai dengan 1 penumpang dan menghitung total live', () => {
    const form = usePassengerForm(fares, ref(100));
    expect(form.passengers.value).toHaveLength(1);
    expect(form.total.value).toBe(20000);

    form.add();
    form.passengers.value[1].category = 'anak';
    expect(form.total.value).toBe(32000);
  });

  it('tidak bisa menghapus penumpang terakhir', () => {
    const form = usePassengerForm(fares, ref(100));
    form.remove(form.passengers.value[0].id);
    expect(form.passengers.value).toHaveLength(1);
  });

  it('dibatasi oleh sisa kursi dan maksimal per booking', () => {
    const limited = usePassengerForm(fares, ref(2));
    limited.add();
    limited.add();
    expect(limited.passengers.value).toHaveLength(2);

    const roomy = usePassengerForm(fares, ref(500));
    for (let i = 0; i < 20; i += 1) roomy.add();
    expect(roomy.passengers.value).toHaveLength(MAX_PASSENGERS);
  });

  it('valid hanya jika semua nama terisi', () => {
    const form = usePassengerForm(fares, ref(10));
    expect(form.isValid.value).toBe(false);
    form.passengers.value[0].name = 'Budi';
    expect(form.isValid.value).toBe(true);
    expect(form.payload()).toEqual([{ name: 'Budi', category: 'dewasa' }]);
  });
});
