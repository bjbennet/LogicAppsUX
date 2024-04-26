import type { AppDispatch } from '../../state/store';
import {
  useAreCustomEditorsEnabled,
  useIsDarkMode,
  useIsMonitoringView,
  useIsReadOnly,
  useShowConnectionsPanel,
  useHostOptions,
  useShowPerformanceDebug,
  useSuppressDefaultNodeSelect,
  useHybridLogicAppsEnabled,
} from '../../state/workflowLoadingSelectors';
import {
  setDarkMode,
  setMonitoringView,
  setReadOnly,
  loadRun,
  loadWorkflow,
  setAreCustomEditorsEnabled,
  setShowConnectionsPanel,
  setHostOptions,
  setShowPerformanceDebug,
  setSuppressDefaultNodeSelect,
  setAreHybridLogicAppsEnabled,
} from '../../state/workflowLoadingSlice';
import { Checkbox } from '@fluentui/react';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

const ContextSettings = () => {
  const isReadOnly = useIsReadOnly();
  const isMonitoringView = useIsMonitoringView();
  const isDarkMode = useIsDarkMode();
  const isHybridLogicAppsEnabled = useHybridLogicAppsEnabled();
  const showConnectionsPanel = useShowConnectionsPanel();
  const areCustomEditorsEnabled = useAreCustomEditorsEnabled();
  const suppressDefaultNodeSelect = useSuppressDefaultNodeSelect();
  const hostOptions = useHostOptions();
  const showPerformanceDebug = useShowPerformanceDebug();
  const dispatch = useDispatch<AppDispatch>();

  const changeMonitoringView = useCallback(
    (_: unknown, checked?: boolean) => {
      dispatch(setMonitoringView(!!checked));
      if (checked) {
        dispatch(loadRun());
        dispatch(loadWorkflow());
      }
    },
    [dispatch]
  );

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <Checkbox
        label="Read Only"
        disabled={isMonitoringView}
        checked={isReadOnly}
        onChange={(_, checked) => dispatch(setReadOnly(!!checked))}
      />
      <Checkbox label="Monitoring View" checked={isMonitoringView} onChange={changeMonitoringView} />
      <Checkbox label="Dark Mode" checked={isDarkMode} onChange={(_, checked) => dispatch(setDarkMode(!!checked))} />
      <Checkbox
        label="Hybrid Logic Apps"
        checked={isHybridLogicAppsEnabled}
        onChange={(_, checked) => dispatch(setAreHybridLogicAppsEnabled(!!checked))}
      />
      <Checkbox
        label="Custom Editors"
        checked={areCustomEditorsEnabled}
        onChange={(_, checked) => dispatch(setAreCustomEditorsEnabled(!!checked))}
      />
      <Checkbox
        label="Connections Panel"
        checked={showConnectionsPanel}
        onChange={(_, checked) => dispatch(setShowConnectionsPanel(!!checked))}
      />
      <Checkbox
        label="Display Runtime Info"
        checked={hostOptions.displayRuntimeInfo}
        onChange={(_, checked) => dispatch(setHostOptions({ displayRuntimeInfo: !!checked }))}
      />
      <Checkbox
        label="Force Enable Split-On"
        checked={hostOptions.forceEnableSplitOn}
        onChange={(_, checked) => dispatch(setHostOptions({ forceEnableSplitOn: !!checked }))}
      />
      <Checkbox
        label="Suppress default node click"
        checked={suppressDefaultNodeSelect}
        onChange={(_, checked) => dispatch(setSuppressDefaultNodeSelect(!!checked))}
      />
      <Checkbox
        label="Show Performance Debug"
        checked={showPerformanceDebug}
        onChange={(_, checked) => dispatch(setShowPerformanceDebug(!!checked))}
      />
    </div>
  );
};

export default ContextSettings;
