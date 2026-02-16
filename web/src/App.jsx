import { useRef } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import { useAppState } from './hooks/useAppState';
import { useKeyboard } from './hooks/useKeyboard';
import { useSceneSync } from './hooks/useSceneSync';
import styles from './App.module.css';

export default function App() {
  const { state, dispatch, currentChapter, currentStep, isFirstOverall, isLastOverall, totalChapters } = useAppState();
  const sceneManagerRef = useRef(null);

  useKeyboard(dispatch);
  useSceneSync(currentStep, sceneManagerRef);

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.body}>
        <LeftPanel
          state={state}
          dispatch={dispatch}
          currentChapter={currentChapter}
          currentStep={currentStep}
          isLastOverall={isLastOverall}
          totalChapters={totalChapters}
        />
        <RightPanel
          sceneManagerRef={sceneManagerRef}
          chapterId={currentChapter.id}
        />
      </div>
    </div>
  );
}
