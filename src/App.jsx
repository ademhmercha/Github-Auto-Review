import { useState, useCallback } from 'react';
import InputForm from './components/InputForm.jsx';
import ResultsView from './components/ResultsView.jsx';
import { runOrchestrator } from './orchestrator/orchestrator.js';

const INITIAL_STATES = {
  explorer: { status: 'waiting' },
  reviewer: { status: 'waiting' },
  doc: { status: 'waiting' },
  reporter: { status: 'waiting' },
};

export default function App() {
  const [screen, setScreen] = useState('input'); // 'input' | 'results'
  const [agentStates, setAgentStates] = useState(INITIAL_STATES);

  const handleAnalyze = useCallback(async (repoUrl, apiKey) => {
    setAgentStates(INITIAL_STATES);
    setScreen('results');

    await runOrchestrator(repoUrl, apiKey, ({ agent, status, result, error }) => {
      setAgentStates((prev) => ({
        ...prev,
        [agent]: { status, result, error },
      }));
    });
  }, []);

  const handleReset = useCallback(() => {
    setScreen('input');
    setAgentStates(INITIAL_STATES);
  }, []);

  if (screen === 'input') {
    return <InputForm onAnalyze={handleAnalyze} />;
  }

  return <ResultsView agentStates={agentStates} onReset={handleReset} />;
}
