import { ref } from 'vue'

export function useDebounce(fn: (...args: any[]) => void, ms = 300) {
  const timer = ref<ReturnType<typeof setTimeout> | null>(null)

  function debounced(...args: any[]) {
    if (timer.value) clearTimeout(timer.value)
    timer.value = setTimeout(() => fn(...args), ms)
  }

  return debounced
}
