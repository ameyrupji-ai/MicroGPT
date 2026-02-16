import styles from './ChapterNav.module.css';

export default function ChapterNav({ chapter, chapterIdx, totalChapters, dispatch }) {
  return (
    <div className={styles.nav}>
      <button
        className={styles.arrow}
        onClick={() => dispatch({ type: 'PREV_CHAPTER' })}
        disabled={chapterIdx === 0}
      >
        &lsaquo;
      </button>
      <span className={styles.label}>
        Chapter: <strong>{chapter.title}</strong>
      </span>
      <button
        className={styles.arrow}
        onClick={() => dispatch({ type: 'SKIP_CHAPTER' })}
        disabled={chapterIdx === totalChapters - 1}
      >
        &rsaquo;
      </button>
    </div>
  );
}
