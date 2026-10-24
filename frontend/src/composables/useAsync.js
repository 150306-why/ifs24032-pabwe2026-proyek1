import { ref } from 'vue';
import { getErrorMessage } from '@/utils/errors';

/** Membungkus fungsi async dengan state loading/error/data. */
export function useAsync(fn) {
  const data = ref(null);
  const error = ref('');
  const loading = ref(false);

  async function run(...args) {
    loading.value = true;
    error.value = '';
    try {
      data.value = await fn(...args);
      return data.value;
    } catch (err) {
      error.value = getErrorMessage(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { data, error, loading, run };
}
