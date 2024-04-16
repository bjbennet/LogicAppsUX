import { VSCodeContext } from '../../../webviewCommunication';
import { FontIcon, mergeStyles, mergeStyleSets, Spinner, SpinnerSize, CommandBar } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { TrafficLightDot } from '@microsoft/designer-ui';
import {
  serializeWorkflow as serializeBJSWorkflow,
  store as DesignerStore,
  serializeUnitTestDefinition,
  useIsDesignerDirty,
  validateParameter,
  updateParameterValidation,
  openPanel,
  useAssertionsValidationErrors,
  useWorkflowParameterValidationErrors,
  useAllSettingsValidationErrors,
  useAllConnectionErrors,
} from '@microsoft/logic-apps-designer';
import type { RootState } from '@microsoft/logic-apps-designer';
import { RUN_AFTER_COLORS, isNullOrEmpty } from '@microsoft/logic-apps-shared';
import { ExtensionCommand } from '@microsoft/vscode-extension-logic-apps';
import { createSelector } from '@reduxjs/toolkit';
import { useContext, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useMutation } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

export interface DesignerCommandBarProps {
  isRefreshing: boolean;
  isDisabled: boolean;
  onRefresh(): void;
  isDarkMode: boolean;
  isUnitTest: boolean;
  isLocal: boolean;
  runId: string;
}

export const DesignerCommandBar: React.FC<DesignerCommandBarProps> = ({
  isRefreshing,
  isDisabled,
  onRefresh,
  isDarkMode,
  isUnitTest,
  isLocal,
  runId,
}) => {
  const intl = useIntl();
  const vscode = useContext(VSCodeContext);
  const dispatch = useDispatch();

  const isMonitoringView: boolean = useSelector(
    createSelector(
      (state: RootState) => state.designerOptions,
      (state: any) => state.isMonitoringView
    )
  );

  const designerIsDirty = useIsDesignerDirty();

  const { isLoading: isSaving, mutate: saveWorkflowMutate } = useMutation(async () => {
    const designerState = DesignerStore.getState();
    const { definition, parameters, connectionReferences } = await serializeBJSWorkflow(designerState, {
      skipValidation: false,
      ignoreNonCriticalErrors: true,
    });

    let validationErrorsList: Record<string, boolean> = {};
    const arr = Object.entries(designerState.operations.inputParameters);
    for (const [id, nodeInputs] of arr) {
      const hasValidationErrors = Object.values(nodeInputs.parameterGroups).some((parameterGroup) => {
        return parameterGroup.parameters.some((parameter) => {
          const validationErrors = validateParameter(parameter, parameter.value);
          if (validationErrors.length > 0) {
            dispatch(updateParameterValidation({ nodeId: id, groupId: parameterGroup.id, parameterId: parameter.id, validationErrors }));
          }
          return validationErrors.length;
        });
      });
      if (hasValidationErrors) {
        validationErrorsList[id] = hasValidationErrors;
      }
    }

    const hasParametersErrors = !isNullOrEmpty(validationErrorsList);

    if (!hasParametersErrors) {
      await vscode.postMessage({
        command: ExtensionCommand.save,
        definition,
        parameters,
        connectionReferences,
      });
    }
  });

  const { isLoading: isSavingUnitTest, mutate: saveUnitTestMutate } = useMutation(async () => {
    const designerState = DesignerStore.getState();
    const definition = await serializeUnitTestDefinition(designerState);

    await vscode.postMessage({
      command: ExtensionCommand.saveUnitTest,
      definition,
    });
  });

  const onResubmit = async () => {
    vscode.postMessage({
      command: ExtensionCommand.resubmitRun,
    });
  };

  const onCreateUnitTest = async () => {
    vscode.postMessage({
      command: ExtensionCommand.createUnitTest,
      runId: runId,
    });
  };

  const Resources = {
    DESIGNER_SAVE: intl.formatMessage({
      defaultMessage: 'Save',
      id: 'ZvAp7m',
      description: 'Button text for save',
    }),
    DESIGNER_PARAMETERS: intl.formatMessage({
      defaultMessage: 'Parameters',
      id: '+0ua83',
      description: 'Button text for parameters',
    }),
    DESIGNER_ERRORS: intl.formatMessage({
      defaultMessage: 'Errors',
      id: 'ohOaXj',
      description: 'Button text for errors',
    }),
    MONITORING_VIEW_REFRESH: intl.formatMessage({
      defaultMessage: 'Refresh',
      id: 'pr9GwA',
      description: 'Button text for refresh',
    }),
    MONITORING_VIEW_RESUBMIT: intl.formatMessage({
      defaultMessage: 'Resubmit',
      id: 'sOnphB',
      description: 'Button text for resubmit',
    }),
    CREATE_UNIT_TEST: intl.formatMessage({
      defaultMessage: 'Create unit test',
      id: '7eo4/d',
      description: 'Button text for create unit test',
    }),
    UNIT_TEST_SAVE: intl.formatMessage({
      defaultMessage: 'Save unit test definition',
      id: 'QQmbz+',
      description: 'Button text for save unit test definition',
    }),
    UNIT_TEST_ASSERTIONS: intl.formatMessage({
      defaultMessage: 'Assertions',
      id: 'LxRzQm',
      description: 'Button text for unit test asssertions',
    }),
  };

  const iconClass = mergeStyles({
    fontSize: 16,
    height: 16,
    width: 16,
  });

  const classNames = mergeStyleSets({
    azureBlue: [{ color: 'rgb(0, 120, 212)' }, iconClass],
    disableGrey: [{ color: 'rgb(121, 119, 117)' }, iconClass],
  });

  const allInputErrors = useSelector((state: RootState) => {
    return (Object.entries(state.operations.inputParameters) ?? []).filter(([_id, nodeInputs]) =>
      Object.values(nodeInputs.parameterGroups).some((parameterGroup) =>
        parameterGroup.parameters.some((parameter) => (parameter?.validationErrors?.length ?? 0) > 0)
      )
    );
  });

  const haveInputErrors = allInputErrors.length > 0;
  const allWorkflowParameterErrors = useWorkflowParameterValidationErrors();
  const haveWorkflowParameterErrors = Object.keys(allWorkflowParameterErrors ?? {}).length > 0;
  const allSettingsErrors = useAllSettingsValidationErrors();
  const haveSettingsErrors = Object.keys(allSettingsErrors ?? {}).length > 0;
  const allConnectionErrors = useAllConnectionErrors();
  const haveConnectionErrors = Object.keys(allConnectionErrors ?? {}).length > 0;

  const allAssertionsErrors = useAssertionsValidationErrors();
  const haveAssertionErrors = Object.keys(allAssertionsErrors ?? {}).length > 0;

  const isSaveUnitTestDisabled = isSavingUnitTest || haveAssertionErrors;
  const haveErrors = useMemo(
    () => haveInputErrors || haveWorkflowParameterErrors || haveSettingsErrors || haveConnectionErrors,
    [haveInputErrors, haveWorkflowParameterErrors, haveSettingsErrors, haveConnectionErrors]
  );

  const isSaveDisabled = useMemo(() => isSaving || haveErrors || !designerIsDirty, [isSaving, haveErrors, designerIsDirty]);

  const desingerItems: ICommandBarItemProps[] = [
    {
      key: 'Save',
      disabled: isSaveDisabled,
      text: Resources.DESIGNER_SAVE,
      onRenderIcon: () => {
        return isSaving ? (
          <Spinner size={SpinnerSize.small} />
        ) : (
          <FontIcon
            aria-label={Resources.DESIGNER_SAVE}
            iconName="Save"
            className={isSaveDisabled ? classNames.disableGrey : classNames.azureBlue}
          />
        );
      },
      onClick: () => {
        saveWorkflowMutate();
      },
    },
    {
      ariaLabel: Resources.DESIGNER_PARAMETERS,
      iconProps: { iconName: 'Parameter' },
      key: 'Parameter',
      text: Resources.DESIGNER_PARAMETERS,
      onRenderText: (item: { text: string }) => {
        return (
          <>
            {item.text}
            {haveWorkflowParameterErrors ? (
              <div style={{ display: 'inline-block', marginLeft: 8 }}>
                <TrafficLightDot fill={RUN_AFTER_COLORS[isDarkMode ? 'dark' : 'light']['FAILED']} />
              </div>
            ) : null}
          </>
        );
      },
      onClick: () => !!dispatch(openPanel({ panelMode: 'WorkflowParameters' })),
    },
    {
      key: 'errors',
      disabled: !haveErrors,
      text: Resources.DESIGNER_ERRORS,
      ariaLabel: Resources.DESIGNER_ERRORS,
      iconProps: {
        iconName: haveErrors ? 'StatusErrorFull' : 'ErrorBadge',
        style: haveErrors ? { color: RUN_AFTER_COLORS[isDarkMode ? 'dark' : 'light']['FAILED'] } : undefined,
      },
      onClick: () => !!dispatch(openPanel({ panelMode: 'Error' })),
    },
  ];

  const monitoringViewItems: ICommandBarItemProps[] = [
    {
      ariaLabel: Resources.MONITORING_VIEW_REFRESH,
      iconProps: { iconName: 'Refresh' },
      key: 'Refresh',
      disabled: isDisabled ? isDisabled : isRefreshing,
      text: Resources.MONITORING_VIEW_REFRESH,
      onClick: onRefresh,
    },
    {
      ariaLabel: Resources.MONITORING_VIEW_RESUBMIT,
      iconProps: { iconName: 'Rerun' },
      key: 'Rerun',
      disabled: isDisabled,
      text: Resources.MONITORING_VIEW_RESUBMIT,
      onClick: () => {
        onResubmit();
      },
    },
    ...(isLocal
      ? [
          {
            ariaLabel: Resources.CREATE_UNIT_TEST,
            iconProps: { iconName: 'TestBeaker' },
            key: 'CreateUnitTest',
            disabled: isDisabled,
            text: Resources.CREATE_UNIT_TEST,
            onClick: () => {
              onCreateUnitTest();
            },
          },
        ]
      : []),
  ];

  const unitTestItems: ICommandBarItemProps[] = [
    {
      key: 'Save',
      disabled: isSaveUnitTestDisabled,
      text: Resources.UNIT_TEST_SAVE,
      ariaLabel: Resources.UNIT_TEST_SAVE,
      onRenderIcon: () => {
        return isSavingUnitTest ? (
          <Spinner size={SpinnerSize.small} />
        ) : (
          <FontIcon
            aria-label={Resources.DESIGNER_SAVE}
            iconName="Save"
            className={isSaveUnitTestDisabled ? classNames.disableGrey : classNames.azureBlue}
          />
        );
      },
      onClick: () => {
        saveUnitTestMutate();
      },
    },
    {
      key: 'Assertions',
      text: Resources.UNIT_TEST_ASSERTIONS,
      ariaLabel: Resources.UNIT_TEST_ASSERTIONS,
      iconProps: { iconName: 'CheckMark' },
      onRenderText: (item: { text: string }) => {
        return (
          <>
            {item.text}
            {haveAssertionErrors ? (
              <div style={{ display: 'inline-block', marginLeft: 8 }}>
                <TrafficLightDot fill={RUN_AFTER_COLORS[isDarkMode ? 'dark' : 'light']['FAILED']} />
              </div>
            ) : null}
          </>
        );
      },
      onClick: () => !!dispatch(openPanel({ panelMode: 'Assertions' })),
    },
  ];

  return (
    <CommandBar
      items={isUnitTest ? unitTestItems : isMonitoringView ? monitoringViewItems : desingerItems}
      ariaLabel="Use left and right arrow keys to navigate between commands"
      styles={{
        root: { borderBottom: `1px solid ${isDarkMode ? '#333333' : '#d6d6d6'}`, padding: '0 20px' },
      }}
    />
  );
};
