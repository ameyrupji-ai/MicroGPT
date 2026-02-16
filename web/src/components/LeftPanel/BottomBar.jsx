import styles from './BottomBar.module.css';

export default function BottomBar({ dispatch, isLastOverall }) {
  return (
    <div className={styles.bar}>
      <button
        className={styles.continueBtn}
        onClick={() => dispatch({ type: 'NEXT_STEP' })}
        disabled={isLastOverall}
      >
        Continue
      </button>
      <button
        className={styles.skipBtn}
        onClick={() => dispatch({ type: 'SKIP_CHAPTER' })}
      >
        Skip
      </button>
    </div>
  );
}
