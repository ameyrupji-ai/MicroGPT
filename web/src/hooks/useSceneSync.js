import { useEffect, useRef } from 'react';

export function useSceneSync(currentStep, sceneManagerRef) {
  const pendingStepRef = useRef(currentStep);
  pendingStepRef.current = currentStep;

  useEffect(() => {
    const apply = (sm, step) => {
      if (step.camera) {
        sm.cameraController.animateTo(step.camera);
      }
      sm.highlightManager.applyStep(step);
    };

    // Try to apply immediately
    const sm = sceneManagerRef.current;
    if (sm) {
      apply(sm, currentStep);
      return;
    }

    // If scene not ready yet, poll briefly
    const interval = setInterval(() => {
      const sm = sceneManagerRef.current;
      if (sm) {
        clearInterval(interval);
        apply(sm, pendingStepRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, sceneManagerRef]);
}
