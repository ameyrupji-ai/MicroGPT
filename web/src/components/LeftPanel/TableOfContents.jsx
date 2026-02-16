import { useEffect, useRef } from 'react';
import { CHAPTERS } from '../../data/chapters';
import styles from './TableOfContents.module.css';

export default function TableOfContents({ isOpen, currentIdx, dispatch }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        dispatch({ type: 'CLOSE_TOC' });
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, dispatch]);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={() => dispatch({ type: 'TOGGLE_TOC' })}
      >
        Table of Contents
        <span className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`}>&#9660;</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} ref={ref}>
          {CHAPTERS.map((ch, i) => (
            <button
              key={ch.id}
              className={`${styles.item} ${i === currentIdx ? styles.active : ''}`}
              onClick={() => dispatch({ type: 'GOTO_CHAPTER', idx: i })}
            >
              <span className={styles.num}>{i + 1}.</span>
              {ch.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
