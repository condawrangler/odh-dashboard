import React from 'react';
import { APIState } from '~/concepts/proxy/types';
import { ModelRegistryAPIs } from '~/concepts/modelRegistry/types';
import {
  createModelArtifact,
  createModelVersion,
  createRegisteredModel,
  getListModelArtifacts,
  getListModelVersions,
  getListRegisteredModels,
  getModelArtifact,
  getModelVersion,
  getModelVersionsByRegisteredModel,
  getRegisteredModel,
  patchModelArtifact,
  patchModelVersion,
  patchRegisteredModel,
} from '~/api';
import useAPIState from '~/concepts/proxy/useAPIState';

export type ModelRegistryAPIState = APIState<ModelRegistryAPIs>;

const useModelRegistryAPIState = (
  hostPath: string | null,
): [apiState: ModelRegistryAPIState, refreshAPIState: () => void] => {
  const createAPI = React.useCallback(
    (path: string) => ({
      createRegisteredModel: createRegisteredModel(path),
      createModelVersion: createModelVersion(path),
      createModelArtifact: createModelArtifact(path),
      getRegisteredModel: getRegisteredModel(path),
      getModelVersion: getModelVersion(path),
      getModelArtifact: getModelArtifact(path),
      listModelArtifacts: getListModelArtifacts(path),
      listModelVersions: getListModelVersions(path),
      listRegisteredModels: getListRegisteredModels(path),
      getModelVersionsByRegisteredModel: getModelVersionsByRegisteredModel(path),
      patchRegisteredModel: patchRegisteredModel(path),
      patchModelVersion: patchModelVersion(path),
      patchModelArtifact: patchModelArtifact(path),
    }),
    [],
  );

  return useAPIState(hostPath, createAPI);
};

export default useModelRegistryAPIState;
