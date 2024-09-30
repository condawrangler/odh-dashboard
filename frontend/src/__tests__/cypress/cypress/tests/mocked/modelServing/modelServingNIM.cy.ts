import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import { mockInferenceServiceK8sResource } from '~/__mocks__/mockInferenceServiceK8sResource';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import {
  mockServingRuntimeK8sResource,
  mockServingRuntimeK8sResourceLegacy,
} from '~/__mocks__/mockServingRuntimeK8sResource';
import {
  mockInvalidTemplateK8sResource,
  mockServingRuntimeTemplateK8sResource,
} from '~/__mocks__/mockServingRuntimeTemplateK8sResource';
import {
  inferenceServiceModal,
  modelServingGlobal,
  modelServingSection,
} from '~/__tests__/cypress/cypress/pages/modelServing';
import {
  AcceleratorProfileModel,
  ConfigMapModel,
  InferenceServiceModel,
  ODHDashboardConfigModel,
  ProjectModel,
  SecretModel,
  ServingRuntimeModel,
  TemplateModel,
} from '~/__tests__/cypress/cypress/utils/models';
import type { InferenceServiceKind, ServingRuntimeKind } from '~/k8sTypes';
import { ServingRuntimeAPIProtocol, ServingRuntimePlatform, TolerationEffect } from '~/types';
import { asClusterAdminUser } from '~/__tests__/cypress/cypress/utils/mockUsers';
import { mockConfigMap } from '~/__mocks__/mockConfigMap';
import { createProjectModal, projectDetails, projectListPage } from '../../../pages/projects';
import { mockAcceleratorProfile } from '~/__mocks__/mockAcceleratorProfile';
import { StackComponent } from '~/concepts/areas';
import { mockComponents } from '~/__mocks__';

type HandlersProps = {
  disableKServeConfig?: boolean;
  disableModelMeshConfig?: boolean;
  projectEnableModelMesh?: boolean;
  servingRuntimes?: ServingRuntimeKind[];
  inferenceServices?: InferenceServiceKind[];
  delayInferenceServices?: boolean;
  delayServingRuntimes?: boolean;
  disableKServeMetrics?: boolean;
  rejectDataConnection?: boolean;
  disableNIMModelServing: boolean;
  isPresent?: boolean;
};

const nvdaServingRuntime = mockServingRuntimeK8sResource({
  name: 'nvidia-nim-runtime',
  displayName: 'NVIDIA NIM',
  namespace: 'test-project',
  apiProtocol: ServingRuntimeAPIProtocol.REST,
  auth: true,
  route: true,
});
nvdaServingRuntime.metadata.annotations?.['opendatahub.io/recommended-accelerators'] ===
  '["nvidia.com/gpu"]';
nvdaServingRuntime.metadata.annotations?.['openshift.io/display-name'] === 'NVIDIA NIM';

const servingRuntimesList = [
  nvdaServingRuntime,
];

const initIntercepts = ({
  disableKServeConfig,
  disableModelMeshConfig,
  projectEnableModelMesh,
  servingRuntimes = servingRuntimesList,
  inferenceServices = [
    mockInferenceServiceK8sResource({ name: 'test-inference', isModelMesh: false }),
  ],
  rejectDataConnection = false,
  disableNIMModelServing = false,
  delayInferenceServices,
  delayServingRuntimes,
  disableKServeMetrics,
  isPresent = true,
}: HandlersProps) => {
  cy.interceptK8s(
    { model: AcceleratorProfileModel, ns: 'redhat-ods-applications', name: 'test-accelerator' },
    isPresent
      ? mockAcceleratorProfile({
          namespace: 'redhat-ods-applications',
          name: 'test-accelerator',
          displayName: 'Test Accelerator',
          description: 'Test description',
          identifier: 'nvidia.com/gpu',
          tolerations: [
            {
              key: 'nvidia.com/gpu',
            },
          ],
        })
      : {
          statusCode: 404,
        },
  );
  cy.interceptOdh(
    'GET /api/dsc/status',
    mockDscStatus({
      installedComponents: { kserve: true, 'model-mesh': false },
    }),
  );
  const dashboardConfig = mockDashboardConfig({
    disableKServe: disableKServeConfig,
    disableModelMesh: disableModelMeshConfig,
    disableKServeMetrics: disableKServeMetrics,
    disableNIMModelServing: disableNIMModelServing,
  });
  // Dashboard
  cy.interceptOdh('GET /api/config', dashboardConfig);
  cy.interceptOdh('GET /api/dashboardConfig/opendatahub/odh-dashboard-config', dashboardConfig);
  cy.interceptK8s(ODHDashboardConfigModel, dashboardConfig);
  cy.interceptOdh('GET /api/config', mockDashboardConfig({ disableNIMModelServing: false }));
  // Project
  const testProject = mockProjectK8sResource({
    enableModelMesh: projectEnableModelMesh,
    hasAnnotations: true,
  });
  testProject.metadata.annotations?.['opendatahub.io/nim-support'] === 'true';
  cy.interceptK8sList(ProjectModel, mockK8sResourceList([testProject]));
  // Inference services
  // cy.interceptK8sList(InferenceServiceModel, mockK8sResourceList(inferenceServices));
  // Runtimes
  cy.interceptK8sList(ServingRuntimeModel, mockK8sResourceList(servingRuntimes));
  cy.interceptK8sList(SecretModel, mockK8sResourceList([mockSecretK8sResource({})]));
  cy.interceptK8sList(
    ServingRuntimeModel,
    mockK8sResourceList(servingRuntimes, { namespace: 'test-project' }),
  );
  cy.interceptK8sList(
    { model: ServingRuntimeModel, ns: 'test-project' },
    {
      delay: delayServingRuntimes ? 500 : 0, //TODO: Remove the delay when we add support for loading states
      body: mockK8sResourceList(servingRuntimes),
    },
  ).as('getServingRuntimes');
  // Secrets
  cy.interceptK8sList(
    SecretModel,
    mockK8sResourceList([
      mockSecretK8sResource({ namespace: 'redhat-ods-applications', name: 'nvidia-nim-access' }),
    ]),
  );
  cy.interceptK8sList(
    SecretModel,
    mockK8sResourceList([
      mockSecretK8sResource({ namespace: 'redhat-ods-applications', name: 'nvidia-nim-image-pull' }),
    ]),
  );
  // Templates
  cy.interceptK8sList(
    TemplateModel,
    mockK8sResourceList(
      [
        mockServingRuntimeTemplateK8sResource({
          name: 'nvidia-nim-serving-template',
          displayName: 'NVIDIA NIM',
          isModelmesh: false,
          apiProtocol: ServingRuntimeAPIProtocol.REST,
          platforms: [ServingRuntimePlatform.SINGLE],
        }),
      ],
      { namespace: 'redhat-ods-applications' },
    ),
  );
  // ConfigMaps
  cy.interceptK8s(
    'GET',
    ConfigMapModel,
    mockConfigMap({
      data: {
        validation_result: 'true',
      },
      namespace: 'redhat-ods-applications',
      name: 'nvidia-nim-validation-result',
    }),
  ).as('validationResultConfigMap');
};

describe('NIM', () => {
  beforeEach(() => {
    cy.interceptOdh('GET /api/components', { query: { installed: 'true' } }, mockComponents());
  });
  it('NIM Deploy', () => {
    asClusterAdminUser();
    initIntercepts({
      disableKServeConfig: false,
      disableModelMeshConfig: true,
      projectEnableModelMesh: false,
      disableKServeMetrics: false,
      disableNIMModelServing: false,
    });
    projectDetails.visitSection('test-project', 'overview');
    modelServingSection.getServingPlatformCard('nvidia-nim').findDeployModelButton().click();
  });
});
