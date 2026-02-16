import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>MicroGPT Visualization</span>
      </div>
      <div className={styles.right}>
        <span className={styles.modelBadge}>micro-gpt</span>
        <span className={styles.link}>Home</span>
      </div>
    </header>
  );
}
