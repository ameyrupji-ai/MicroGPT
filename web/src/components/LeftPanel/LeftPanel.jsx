import { useEffect, useRef } from 'react';
import ChapterNav from './ChapterNav';
import TableOfContents from './TableOfContents';
import StepContent from './StepContent';
import BottomBar from './BottomBar';
import styles from './LeftPanel.module.css';

export default function LeftPanel({ state, dispatch, currentChapter, currentStep, isLastOverall, totalChapters }) {
  const scrollRef = useRef(null);

  // Reset scroll on chapter change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [state.chapterIdx]);

  return (
    <div className={styles.panel}>
      <ChapterNav
        chapter={currentChapter}
        chapterIdx={state.chapterIdx}
        totalChapters={totalChapters}
        dispatch={dispatch}
      />
      <TableOfContents
        isOpen={state.tocOpen}
        currentIdx={state.chapterIdx}
        dispatch={dispatch}
      />
      <div className={styles.scrollArea} ref={scrollRef}>
        <StepContent step={currentStep} />
      </div>
      <BottomBar dispatch={dispatch} isLastOverall={isLastOverall} />
    </div>
  );
}
