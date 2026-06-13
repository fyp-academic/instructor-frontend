import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SpotlightTour } from './SpotlightTour';
import { getTourForRole } from './tourSteps';

interface OnboardingTutorialProps {
  onDismiss: () => void;
}

export function OnboardingTutorial({ onDismiss }: OnboardingTutorialProps) {
  const { setOnboardingCompleted } = useApp();
  const { isAdmin } = useAuth();

  const steps = getTourForRole(isAdmin ? 'admin' : 'instructor');
  const badge = isAdmin ? 'Admin tour' : 'Instructor tour';

  const handleComplete = () => {
    setOnboardingCompleted(true);
    onDismiss();
  };

  return (
    <SpotlightTour
      steps={steps}
      badge={badge}
      onClose={onDismiss}
      onComplete={handleComplete}
    />
  );
}
