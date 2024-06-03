import type { ReactNode } from 'react';
import { TemplatesDataProvider } from '@microsoft/logic-apps-designer';
import { loadToken } from '../../environments/environment';
import { DevToolbox } from '../components/DevToolbox';
import type { RootState } from '../state/Store';
import { TemplatesDesigner, TemplatesDesignerProvider } from '@microsoft/logic-apps-designer';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { Template, LogicAppsV2 } from '@microsoft/logic-apps-shared';
import {
  getConnectionsData,
  saveWorkflowStandard,
  useWorkflowApp,
} from '../../designer/app/AzureLogicAppsDesigner/Services/WorkflowAndArtifacts';
import type { ParametersData } from '../../designer/app/AzureLogicAppsDesigner/Models/Workflow';
import { ArmParser } from '../../designer/app/AzureLogicAppsDesigner/Utilities/ArmParser';
import { WorkflowUtility } from '../../designer/app/AzureLogicAppsDesigner/Utilities/Workflow';

const LoadWhenArmTokenIsLoaded = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useQuery(['armToken'], loadToken);
  return isLoading ? null : <>{children}</>;
};
export const TemplatesStandaloneDesigner = () => {
  const theme = useSelector((state: RootState) => state.workflowLoader.theme);
  const { appId, isConsumption, workflowName: existingWorkflowName } = useSelector((state: RootState) => state.workflowLoader);
  const navigate = useNavigate();

  const { data: workflowAppData } = useWorkflowApp(appId ?? '');
  const { subscriptionId, resourceGroup, topResourceName } = new ArmParser(appId ?? '');
  const canonicalLocation = WorkflowUtility.convertToCanonicalFormat(workflowAppData?.location ?? '');

  const uri = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/sites/${topResourceName}/workflowsconfiguration/connections?api-version=2018-11-01`;
  console.log(uri);
  const originalConnectionsData = getConnectionsData(uri);
  console.log(originalConnectionsData);

  const createWorkflowCall = async (
    workflowName: string,
    workflowKind: string,
    workflowDefinition: LogicAppsV2.WorkflowDefinition,
    _connectionsData: any,
    parametersData: Record<string, Template.ParameterDefinition>
  ) => {
    console.log('--create workflow call ');
    const workflowNameToUse = existingWorkflowName ?? workflowName;
    const workflow = {
      definition: workflowDefinition,
      connectionReferences: undefined, //TODO: change this after connections is done
      parameters: parametersData,
      kind: workflowKind,
    };
    const callBack = () => {
      console.log('Created workflow, TODO: now redirect');
      navigate('/');
    };
    if (appId) {
      if (isConsumption) {
        console.log('Consumption is not ready yet!');
        // await saveWorkflowConsumption({
        //   id: appId,
        //   name: workflowNameToUse,
        //   type: "json", //TODO: figure out what this type is and replace it
        //   kind: workflowKind,
        //   properties: {
        //     files: {
        //       [Artifact.WorkflowFile]: workflow,
        //       [Artifact.ParametersFile]: parametersData as ParametersData,
        //       [Artifact.ConnectionsFile]: _connectionsData
        //     },
        //     health: {},
        //   }
        // }, workflow);
      } else {
        console.log('calling create workflow standard');
        await saveWorkflowStandard(
          appId,
          workflowNameToUse,
          workflow,
          undefined,
          parametersData as ParametersData,
          undefined,
          undefined,
          callBack,
          true
        );
      }
    } else {
      console.log('Select App Id first!');
    }
  };

  return (
    <LoadWhenArmTokenIsLoaded>
      <DevToolbox />
      <TemplatesDesignerProvider locale="en-US" theme={theme}>
        <TemplatesDataProvider
          isConsumption={isConsumption}
          workflowName={existingWorkflowName}
          subscriptionId={subscriptionId}
          location={canonicalLocation}
          resourceGroup={resourceGroup}
          topResourceName={topResourceName}
        >
          <TemplatesDesigner createWorkflowCall={createWorkflowCall} />
        </TemplatesDataProvider>
      </TemplatesDesignerProvider>
    </LoadWhenArmTokenIsLoaded>
  );
};
