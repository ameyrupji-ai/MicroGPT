import styles from './RightPanel.module.css';

export default function ModelStats() {
  return (
    <div className={styles.statsOverlay}>
      <div className={styles.modelName}>micro-gpt</div>
      <div className={styles.paramCount}>n_params: <strong>4,192</strong></div>
    </div>
  );
}
