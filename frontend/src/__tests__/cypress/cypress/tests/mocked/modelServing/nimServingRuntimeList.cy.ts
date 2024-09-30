import { mockAcceleratorProfile } from '~/__mocks__/mockAcceleratorProfile';
import { mockDashboardConfig } from '~/__mocks__/mockDashboardConfig';
import { mockDscStatus } from '~/__mocks__/mockDscStatus';
import { mockInferenceServiceK8sResource } from '~/__mocks__/mockInferenceServiceK8sResource';
import { mockK8sResourceList } from '~/__mocks__/mockK8sResourceList';
import { mock200Status, mock404Error, mock409Error } from '~/__mocks__/mockK8sStatus';
import { mockNotebookK8sResource } from '~/__mocks__/mockNotebookK8sResource';
import { mockPVCK8sResource } from '~/__mocks__/mockPVCK8sResource';
import { mockPodK8sResource } from '~/__mocks__/mockPodK8sResource';
import { mockProjectK8sResource } from '~/__mocks__/mockProjectK8sResource';
import { mockRoleBindingK8sResource } from '~/__mocks__/mockRoleBindingK8sResource';
import {
  mockRouteK8sResource,
  mockRouteK8sResourceModelServing,
} from '~/__mocks__/mockRouteK8sResource';
import { mockSecretK8sResource } from '~/__mocks__/mockSecretK8sResource';
import { mockServiceAccountK8sResource } from '~/__mocks__/mockServiceAccountK8sResource';
import {
  mockServingRuntimeK8sResource,
  mockServingRuntimeK8sResourceLegacy,
} from '~/__mocks__/mockServingRuntimeK8sResource';
import {
  mockInvalidTemplateK8sResource,
  mockServingRuntimeTemplateK8sResource,
} from '~/__mocks__/mockServingRuntimeTemplateK8sResource';
import {
  createServingRuntimeModal,
  editServingRuntimeModal,
  inferenceServiceModal,
  kserveModal,
  kserveModalEdit,
  modelServingSection,
} from '~/__tests__/cypress/cypress/pages/modelServing';
import { projectDetails } from '~/__tests__/cypress/cypress/pages/projects';
import { be } from '~/__tests__/cypress/cypress/utils/should';
import type { InferenceServiceKind, ServingRuntimeKind } from '~/k8sTypes';
import { ServingRuntimePlatform } from '~/types';
import { deleteModal } from '~/__tests__/cypress/cypress/pages/components/DeleteModal';
import { StackCapability } from '~/concepts/areas/types';
import { mockDsciStatus } from '~/__mocks__/mockDsciStatus';
import {
  AcceleratorProfileModel,
  InferenceServiceModel,
  NotebookModel,
  ODHDashboardConfigModel,
  PVCModel,
  PodModel,
  ProjectModel,
  RoleBindingModel,
  RouteModel,
  SecretModel,
  ServiceAccountModel,
  ServingRuntimeModel,
  TemplateModel,
} from '~/__tests__/cypress/cypress/utils/models';

type HandlersProps = {
  disableKServeConfig?: boolean;
  disableKServeAuthConfig?: boolean;
  disableModelMeshConfig?: boolean;
  disableAccelerator?: boolean;
  projectEnableModelMesh?: boolean;
  servingRuntimes?: ServingRuntimeKind[];
  inferenceServices?: InferenceServiceKind[];
  rejectAddSupportServingPlatformProject?: boolean;
  serviceAccountAlreadyExists?: boolean;
  roleBindingAlreadyExists?: boolean;
  rejectInferenceService?: boolean;
  rejectServingRuntime?: boolean;
  rejectDataConnection?: boolean;
  requiredCapabilities?: StackCapability[];
  disableNIMModelServing?: boolean;
};

const initIntercepts = ({
  disableKServeConfig,
  disableKServeAuthConfig,
  disableModelMeshConfig,
  disableAccelerator,
  projectEnableModelMesh,
  servingRuntimes = [
    mockServingRuntimeK8sResourceLegacy({}),
    mockServingRuntimeK8sResource({
      name: 'test-model',
      namespace: 'test-project',
      auth: true,
      route: true,
    }),
  ],
  inferenceServices = [
    mockInferenceServiceK8sResource({ name: 'test-inference' }),
    mockInferenceServiceK8sResource({
      name: 'another-inference-service',
      displayName: 'Another Inference Service',
      deleted: true,
    }),
    mockInferenceServiceK8sResource({
      name: 'llama-caikit',
      displayName: 'Llama Caikit',
      url: 'http://llama-caikit.test-project.svc.cluster.local',
      activeModelState: 'Loaded',
    }),
  ],
  rejectAddSupportServingPlatformProject = false,
  serviceAccountAlreadyExists = false,
  roleBindingAlreadyExists = false,
  rejectInferenceService = false,
  rejectServingRuntime = false,
  rejectDataConnection = false,
  requiredCapabilities = [],
  disableNIMModelServing = false,
}: HandlersProps) => {
  cy.interceptOdh(
    'GET /api/dsc/status',
    mockDscStatus({
      installedComponents: { kserve: true, 'model-mesh': true },
    }),
  );
  cy.interceptOdh(
    'GET /api/dsci/status',
    mockDsciStatus({
      requiredCapabilities,
    }),
  );
  cy.interceptOdh(
    'GET /api/config',
    mockDashboardConfig({
      disableKServe: disableKServeConfig,
      disableModelMesh: disableModelMeshConfig,
      disableKServeAuth: disableKServeAuthConfig,
      disableNIMModelServing: disableNIMModelServing,
    }),
  );
  cy.interceptK8sList(
    ProjectModel,
    mockK8sResourceList([mockProjectK8sResource({ enableModelMesh: projectEnableModelMesh })]),
  );
  cy.interceptK8s(
    ProjectModel,
    mockProjectK8sResource({ enableModelMesh: projectEnableModelMesh }),
  );
  // TODO: Maybe use this in your tests to submit -- this is in generic test intercepts
  cy.interceptK8s(
    'POST',
    {
      model: InferenceServiceModel,
      ns: 'test-project',
    },
    rejectInferenceService
      ? { statusCode: 404 }
      : {
          statusCode: 200,
          body: mockInferenceServiceK8sResource({ name: 'test-inference' }),
        },
  ).as('createInferenceService');
  cy.interceptK8sList(
    TemplateModel,
    mockK8sResourceList(
      [
        mockServingRuntimeTemplateK8sResource({
          name: 'template-1',
          displayName: 'Multi Platform',
          platforms: [ServingRuntimePlatform.SINGLE, ServingRuntimePlatform.MULTI],
        }),
        mockServingRuntimeTemplateK8sResource({
          name: 'template-2',
          displayName: 'Caikit',
          platforms: [ServingRuntimePlatform.SINGLE],
        }),
        mockServingRuntimeTemplateK8sResource({
          name: 'template-3',
          displayName: 'New OVMS Server',
          platforms: [ServingRuntimePlatform.MULTI],
        }),
        mockServingRuntimeTemplateK8sResource({
          name: 'template-4',
          displayName: 'Serving Runtime with No Annotations',
        }),
        mockInvalidTemplateK8sResource({}),
      ],
      { namespace: 'opendatahub' },
    ),
  );
  // TODO: you may need to add more here to handle Project resource NIM annotation
  // used by addSupportServingPlatformProject - context 3
  cy.interceptOdh(
    'GET /api/namespaces/:namespace/:context',
    { path: { namespace: 'test-project', context: '*' } },
    rejectAddSupportServingPlatformProject ? { statusCode: 401 } : { applied: true },
  );
  // TODO: for submit of serving runtime -- add to test itself
  cy.interceptK8s(
    'POST',
    {
      model: ServingRuntimeModel,
      ns: 'test-project',
    },
    rejectServingRuntime
      ? { statusCode: 401 }
      : {
          statusCode: 200,
          body: mockServingRuntimeK8sResource({
            name: 'test-model',
            namespace: 'test-project',
            auth: true,
            route: true,
          }),
        },
  ).as('createServingRuntime');
  const NIM_TEMPLATE = {
    apiVersion: 'template.openshift.io/v1',
    kind: 'Template',
    metadata: {
      annotations: {
        'opendatahub.io/apiProtocol': 'REST',
        'opendatahub.io/modelServingSupport': '["single"]',
      },
      name: 'nvidia-nim-serving-template',
    },
    objects: [
      {
        apiVersion: 'serving.kserve.io/v1alpha1',
        kind: 'ServingRuntime',
        labels: {
          'opendatahub.io/dashboard': 'true',
        },
        metadata: {
          annotations: {
            'opendatahub.io/recommended-accelerators': '["nvidia.com/gpu"]',
            'openshift.io/display-name': 'NVIDIA NIM',
          },
          name: 'nvidia-nim-runtime',
        },
        spec: {
          containers: [
            {
              env: [
                {
                  name: 'NIM_CACHE_PATH',
                  value: '/mnt/models/cache',
                },
                {
                  name: 'NGC_API_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      key: 'NGC_API_KEY',
                      name: 'nvidia-nim-secrets',
                    },
                  },
                },
              ],
              image: null,
              name: 'kserve-container',
              ports: [
                {
                  containerPort: 8000,
                  protocol: 'TCP',
                },
              ],
              resources: {
                limits: {
                  cpu: '2',
                  memory: '8Gi',
                  'nvidia.com/gpu': 2,
                },
                requests: {
                  cpu: '1',
                  memory: '4Gi',
                  'nvidia.com/gpu': 2,
                },
              },
              volumeMounts: [
                {
                  mountPath: '/dev/shm',
                  name: 'shm',
                },
                {
                  mountPath: '/mnt/models/cache',
                  name: 'nim-pvc',
                },
              ],
            },
          ],
          imagePullSecrets: [
            {
              name: 'ngc-secret',
            },
          ],
          multiModel: false,
          protocolVersions: ['grpc-v2', 'v2'],
          supportedModelFormats: [],
          volumes: [
            {
              name: 'nim-pvc',
              persistentVolumeClaim: {
                claimName: 'nim-pvc',
              },
            },
          ],
        },
      },
    ],
  };
  cy.interceptK8s(
    'GET',
    {
      model: TemplateModel,
      ns: 'opendatahub',
    },
    NIM_TEMPLATE,
  );
};

describe('Serving Runtime List', () => {
  describe('KServe', () => {
    it('Deploy KServe model', () => {
      initIntercepts({
        disableModelMeshConfig: false,
        disableKServeConfig: false,
        servingRuntimes: [],
        requiredCapabilities: [StackCapability.SERVICE_MESH, StackCapability.SERVICE_MESH_AUTHZ],
      });

      projectDetails.visitSection('test-project', 'overview');

      modelServingSection.getServingPlatformCard('nvidia-nim').findDeployModelButton().click();

      kserveModal.shouldBeOpen();

      // test that you can not submit on empty
      kserveModal.findSubmitButton().should('be.disabled');

      // test filling in minimum required fields
      kserveModal.findModelNameInput().type('Test Name');
      kserveModal.findServingRuntimeTemplateDropdown().findSelectOption('Caikit').click();
      kserveModal.findModelFrameworkSelect().findSelectOption('onnx - 1').click();
      kserveModal.findSubmitButton().should('be.disabled');
      // check external route, token should be checked and no alert
      kserveModal.findAuthenticationCheckbox().check();
      kserveModal.findExternalRouteError().should('not.exist');
      kserveModal.findServiceAccountNameInput().should('have.value', 'default-name');
      kserveModal.findExistingConnectionSelect().findSelectOption('Test Secret').click();
      kserveModal.findLocationPathInput().type('test-model/');
      kserveModal.findSubmitButton().should('be.enabled');
      kserveModal.findNewDataConnectionOption().click();
      kserveModal.findLocationPathInput().clear();
      kserveModal.findSubmitButton().should('be.disabled');
      kserveModal.findLocationNameInput().type('Test Name');
      kserveModal.findLocationAccessKeyInput().type('test-key');
      kserveModal.findLocationSecretKeyInput().type('test-secret-key');
      kserveModal.findLocationEndpointInput().type('test-endpoint');
      kserveModal.findLocationBucketInput().type('test-bucket');
      kserveModal.findLocationPathInput().type('test-model/');
      kserveModal.findSubmitButton().should('be.enabled');

      // test submitting form, the modal should close to indicate success.
      kserveModal.findSubmitButton().click();
      kserveModal.shouldBeOpen(false);

      // dry run request
      cy.wait('@createServingRuntime').then((interception) => {
        expect(interception.request.url).to.include('?dryRun=All');
        expect(interception.request.body).to.containSubset({
          metadata: {
            name: 'test-name',
            annotations: {
              'openshift.io/display-name': 'test-name',
              'opendatahub.io/apiProtocol': 'REST',
              'opendatahub.io/template-name': 'template-2',
              'opendatahub.io/template-display-name': 'Caikit',
              'opendatahub.io/accelerator-name': '',
            },
            namespace: 'test-project',
          },
          spec: {
            protocolVersions: ['grpc-v1'],
            supportedModelFormats: [
              { autoSelect: true, name: 'openvino_ir', version: 'opset1' },
              { autoSelect: true, name: 'onnx', version: '1' },
            ],
          },
        });
      });

      // Actual request
      cy.wait('@createServingRuntime').then((interception) => {
        expect(interception.request.url).not.to.include('?dryRun=All');
      });

      // the serving runtime should have been created
      cy.get('@createServingRuntime.all').then((interceptions) => {
        expect(interceptions).to.have.length(2); // 1 dry-run request and 1 actual request
      });
    });
  });
});
