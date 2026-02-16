import { useEffect, useRef } from 'react';
import { SceneManager } from './scene/SceneManager.js';
import ModelStats from './ModelStats';
import MiniMap from './MiniMap';
import styles from './RightPanel.module.css';

export default function RightPanel({ sceneManagerRef, chapterId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sm = new SceneManager(containerRef.current);
    sceneManagerRef.current = sm;

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, [sceneManagerRef]);

  return (
    <div className={styles.panel}>
      <div className={styles.canvasContainer} ref={containerRef} />
      <ModelStats />
      <MiniMap chapterId={chapterId} />
      <div className={styles.controls}>
        <span>Left-drag: orbit</span>
        <span>Right-drag: pan</span>
        <span>Scroll: zoom</span>
      </div>
    </div>
  );
}
