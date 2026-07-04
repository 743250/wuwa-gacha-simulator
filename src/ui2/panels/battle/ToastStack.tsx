// Toast 队列 — 自动弹出后 2 秒淡出
import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { battleToastSignal } from './battleSignals';

export function ToastStack() {
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; fading: boolean }>>([]);
  const idRef = useRef(0);
  const mountedRef = useRef(true);

  // Subscribe to toast signal
  useEffect(() => {
    mountedRef.current = true;
    const unsub = battleToastSignal.subscribe((newArr: string[]) => {
      if (!mountedRef.current || !newArr?.length) return;
      // Only react to the last new toast
      const latest = newArr[newArr.length - 1];
      const id = ++idRef.current;
      setToasts(prev => [...prev, { id, text: latest, fading: false }]);
      // Start fade after 1.8s
      setTimeout(() => {
        if (!mountedRef.current) return;
        setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t));
        setTimeout(() => {
          if (!mountedRef.current) return;
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 450);
      }, 1800);
    });
    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  return (
    <div class="bf-toast-stack" id="bfToastStack">
      {toasts.map(t => (
        <div
          key={t.id}
          class="bf-toast"
          style={{ opacity: t.fading ? 0 : 1, transition: 'opacity .4s' }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
