import axios from 'axios';
import { localize } from '../../../../localize';
import type { SlotTreeItem } from '../../../tree/slotsTree/SlotTreeItem';
import { executeCommand } from '../../../utils/funcCoreTools/cpUtils';
import { azurePublicBaseUrl, hybridApiVersion, Platform } from '../../../../constants';
import * as fse from 'fs-extra';
import * as path from 'path';
import { isSuccessResponse } from '@microsoft/vscode-extension-logic-apps';
/**
 * Creates a hybrid app using the provided context.
 * @param context - The context object containing the necessary information for creating the hybrid app.
 * @returns A Promise that resolves when the hybrid app is created.
 */
export const cleanSMB = async (node: SlotTreeItem, accessToken: string): Promise<void> => {
  const url = `${azurePublicBaseUrl}/subscriptions/${node.subscription.subscriptionId}/resourceGroups/${node.resourceGroupName}/providers/Microsoft.App/connectedEnvironments/${node.connectedEnvironment.name}/storages/${node.hybridSite.name}?api-version=${hybridApiVersion}`;
  try {
    const response = await axios.delete(url, {
      headers: { authorization: accessToken },
    });

    if (!isSuccessResponse(response.status)) {
      throw new Error(response.statusText);
    }
  } catch (error) {
    throw new Error(`${localize('errorCleaningSMB', 'Error in cleaning SMB')} - ${error.message}`);
  }
};

export const deleteSMBFolder = async (mountDrive: string, smbFolderName: string) => {
  try {
    const smbFolderPath = path.join(mountDrive, smbFolderName);

    await fse.rmdir(smbFolderPath, { recursive: true });
  } catch (error) {
    throw new Error(`${localize('errorDeletingSMBFolder', 'Error deleting SMB folder')} - ${error.message}`);
  }
};

export const unMountSMB = async (mountDrive: string) => {
  let unMountCommand: string;

  try {
    if (process.platform === Platform.windows) {
      unMountCommand = `net use ${mountDrive} /delete`;
    } else if (process.platform === Platform.mac) {
      unMountCommand = `umount -f /mnt//${mountDrive}`;
    } else {
      unMountCommand = `umount -f /mnt//${mountDrive}`;
    }
    await executeCommand(undefined, undefined, unMountCommand);
  } catch (error) {
    throw new Error(`${localize('errorUnmountingSMB', 'Error unmounting SMB')} - ${error.message}`);
  }
};
