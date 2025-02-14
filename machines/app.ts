import NetInfo, {NetInfoStateType} from '@react-native-community/netinfo';
import {AppState, AppStateStatus} from 'react-native';
import {getDeviceId, getDeviceName} from 'react-native-device-info';
import {assign, EventFrom, send, spawn, StateFrom} from 'xstate';
import {createModel} from 'xstate/lib/model';
import {authMachine, createAuthMachine} from './auth';
import {createSettingsMachine, settingsMachine} from './settings';
import {StoreEvents, storeMachine} from './store';
import {createVcMachine, vcMachine} from './VCItemMachine/vc';
import {activityLogMachine, createActivityLogMachine} from './activityLog';
import {
  createRequestMachine,
  requestMachine,
} from './bleShare/request/requestMachine';
import {createScanMachine, scanMachine} from './bleShare/scan/scanMachine';
import {createRevokeMachine, revokeVidsMachine} from './revoke';
import {pure, respond} from 'xstate/lib/actions';
import {AppServices} from '../shared/GlobalContext';
import {
  changeCrendetialRegistry,
  changeEsignetUrl,
  ESIGNET_BASE_URL,
  isAndroid,
  MIMOTO_BASE_URL,
  SETTINGS_STORE_KEY,
} from '../shared/constants';
import {logState} from '../shared/commonUtil';
import {backupMachine, createBackupMachine} from './backupAndRestore/backup';
import {
  backupRestoreMachine,
  createBackupRestoreMachine,
} from './backupAndRestore/backupRestore';

const model = createModel(
  {
    info: {} as AppInfo,
    serviceRefs: {} as AppServices,
    isReadError: false,
    isDecryptError: false,
    isKeyInvalidateError: false,
  },
  {
    events: {
      ACTIVE: () => ({}),
      INACTIVE: () => ({}),
      ERROR: () => ({}),
      DECRYPT_ERROR: () => ({}),
      DECRYPT_ERROR_DISMISS: () => ({}),
      KEY_INVALIDATE_ERROR: () => ({}),
      OFFLINE: () => ({}),
      ONLINE: (networkType: NetInfoStateType) => ({networkType}),
      REQUEST_DEVICE_INFO: () => ({}),
      READY: (data?: unknown) => ({data}),
      APP_INFO_RECEIVED: (info: AppInfo) => ({info}),
      STORE_RESPONSE: (response: unknown) => ({response}),
      RESET_KEY_INVALIDATE_ERROR_DISMISS: () => ({}),
    },
  },
);

export const APP_EVENTS = model.events;

export const appMachine = model.createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QEMAOqB0BLAdlgLhrPgPYBOYAxAEoCiAggCICaA2gAwC6ioqJsBLCRw8QAD0QBmdgE4MMgIwAmSaoDsADmkb2agDQgAnoiUAWJRnNqZayVvYKArDdMBfVwbSZcBIqQqUtNTUAPLUHNxIIHwC+EIiURIICpJypgBsaqaOSjmOqfmmBsbJjuzyaimaMpJq7BqOOe6e6Nh4hLBgZABuWADGcDQMLBGiMYLCokmZ6RiSSro5NQrsjcUm5pZK1rb2Ti7NIF5tvn0UEGA4ccgANtRgUFjEZIaUAMoAKmG0APp0bwAFEIAOTetFGUXGcUmiUQCgU6VMFW0tVkOXY6XWCCUCjkakqBNMMl0ZjcHiOrR8hFwADMSJR6ACAT8AJLAgBiIT+tAAwrQWQA1WiMCG8fgTBKgJIIjJzdRqRGmDQEjRYnF4gkKLLEtSkw7HKkYC69HB0ygAIXoPIA0rRgYxWRyuXQ+YLhaLouLoZLxCZlI55DjTJJ0jV0vlJGrcRh8VqtUSSaYyS1MBRkBBXnQAIoAVVonx+jFoApZfMdnI9UPiUxM9Rj6URGmJMh0Zg0mKMiEc6Q0GA0GmyPd180kyYpqbA6cMGDpfQArrAGTyPm7K17q7Dkroscre+l2KknAoB8qbPrWmmMzOSPPF2yrSuhWvYhupXDt52EDIbBhGnVJN27CyA2SjnhOU4YDgYD4AA7uQADWlAggAMmy4JcGM64wm+W76J+yhEpYaiOKYGL4jI+4hmBGCXtOUGwQhSHsuyqHAuhkRii+2G+rhWIpD2WwNNsuLdjI7jkjgJAXPAUReJhXE+kkAC0tRYkpZgYEBWnaTpajUVS8kSjW2IyFi6SSJYDS2FqjgaPCMi2fp7R+OQYCGd6xn4mqGKWKimimMoTaOLqTm+J0PT9HA7mvjx5gWeYChJmYEbth2JQLLMwZ1P5gUOSF5IGs5ZyQJc1x3A8Tz4C80XcUk1R9koLbpAiDghgoUZpNImgkSsGhmLUoXUqaJA1YpcJJrM4aVCkShaDI5hFJ+6q+bouz4tIqgaINRpgCadKjcZx7pBYDakZoo6OCkjgdSt1ihkmF1UQVF6ThmB2bvCZmqBgIGaPU5FONRtHXre704c4WK6goGCJQOs2rD2Ohic94FXrOC4YH0AAWYB9PBuBQGDPHwtDWoLDUtn1LN35YjUcgYhRiUNhiTbIymNGvdO6OwBgyB9HE3RuZCWFjdipE-YopE1O2f12DujQ-WR0jNUBl2OEDnMgxjuB8wLQucUZm5mOUoaJbIdiZDocufi4v7OA0KxKM1tRbSjHMQfRcFkPBRNJBD+GyBYDjfri4YtRkGse9BXvwZjON4wTvvvnhJQpLI8gBSsx2NAFdiR1ensIRgwg3Lg+uegpxkqBYo66ko9e5MoZh8fXmWaA3CymPiTRu8Dhfe8XNI0qXUFJ9i8xzF3HeN-Xi2pxdvkpOYx31M16Tia4QA */
    predictableActionArguments: true,
    preserveActionOrder: true,
    tsTypes: {} as import('./app.typegen').Typegen0,
    schema: {
      context: model.initialContext,
      events: {} as EventFrom<typeof model>,
    },
    id: 'app',
    initial: 'init',
    on: {
      DECRYPT_ERROR: {
        actions: ['setIsDecryptError'],
      },
      DECRYPT_ERROR_DISMISS: {
        actions: ['unsetIsDecryptError'],
      },
      KEY_INVALIDATE_ERROR: {
        actions: ['updateKeyInvalidateError'],
        target: 'waiting',
      },
      RESET_KEY_INVALIDATE_ERROR_DISMISS: {
        actions: ['resetKeyInvalidateError'],
        target: 'init',
      },
    },
    states: {
      init: {
        initial: 'store',
        states: {
          store: {
            entry: ['spawnStoreActor', 'logStoreEvents'],
            on: {
              READY: {
                actions: [
                  'unsetIsReadError',
                  'unsetIsDecryptError',
                  'resetKeyInvalidateError',
                ],
                target: 'services',
              },
              ERROR: {
                actions: ['setIsReadError', 'updateKeyInvalidateError'],
              },
            },
          },
          services: {
            entry: ['spawnServiceActors', 'logServiceEvents'],
            on: {
              READY: 'credentialRegistry',
            },
          },
          credentialRegistry: {
            entry: [
              'loadCredentialRegistryHostFromStorage',
              'loadEsignetHostFromStorage',
            ],
            on: {
              STORE_RESPONSE: {
                actions: [
                  'loadCredentialRegistryInConstants',
                  'loadEsignetHostFromConstants',
                ],
                target: 'info',
              },
            },
          },
          info: {
            invoke: {
              src: 'getAppInfo',
            },
            on: {
              APP_INFO_RECEIVED: {
                target: '#ready',
                actions: ['setAppInfo'],
              },
            },
          },
        },
      },
      ready: {
        id: 'ready',
        type: 'parallel',
        on: {
          REQUEST_DEVICE_INFO: {
            actions: ['requestDeviceInfo'],
          },
        },
        states: {
          focus: {
            invoke: {
              src: 'checkFocusState',
            },
            on: {
              ACTIVE: '.active',
              INACTIVE: '.inactive',
            },
            initial: 'checking',
            states: {
              checking: {},
              active: {
                entry: ['forwardToServices'],
              },
              inactive: {
                entry: ['forwardToServices'],
              },
            },
          },
          network: {
            invoke: {
              src: 'checkNetworkState',
            },
            on: {
              ONLINE: '.online',
              OFFLINE: '.offline',
            },
            initial: 'checking',
            states: {
              checking: {},
              online: {
                entry: ['forwardToServices'],
              },
              offline: {
                entry: ['forwardToServices'],
              },
            },
          },
        },
      },
      waiting: {},
    },
  },
  {
    actions: {
      forwardToServices: pure((context, event) =>
        Object.values(context.serviceRefs).map(serviceRef =>
          send({...event, type: `APP_${event.type}`}, {to: serviceRef}),
        ),
      ),
      setIsReadError: assign({
        isReadError: true,
      }),
      setIsDecryptError: assign({
        isDecryptError: true,
      }),
      unsetIsDecryptError: assign({
        isDecryptError: false,
      }),
      unsetIsReadError: assign({
        isReadError: false,
      }),

      updateKeyInvalidateError: model.assign({
        isKeyInvalidateError: (_, event) => {
          if (event.type === 'KEY_INVALIDATE_ERROR') {
            return true;
          }
        },
      }),

      resetKeyInvalidateError: model.assign({
        isKeyInvalidateError: false,
      }),

      requestDeviceInfo: respond(context => ({
        type: 'RECEIVE_DEVICE_INFO',
        info: {
          ...context.info,
          name: context.serviceRefs.settings.getSnapshot().context.name,
        },
      })),

      spawnStoreActor: assign({
        serviceRefs: context => ({
          ...context.serviceRefs,
          store: spawn(storeMachine, storeMachine.id),
        }),
      }),

      logStoreEvents: context => {
        if (__DEV__) {
          context.serviceRefs.store.subscribe(logState);
        }
      },

      spawnServiceActors: model.assign({
        serviceRefs: context => {
          const serviceRefs = {
            ...context.serviceRefs,
          };

          serviceRefs.auth = spawn(
            createAuthMachine(serviceRefs),
            authMachine.id,
          );

          serviceRefs.vc = spawn(createVcMachine(serviceRefs), vcMachine.id);

          serviceRefs.settings = spawn(
            createSettingsMachine(serviceRefs),
            settingsMachine.id,
          );

          serviceRefs.backup = spawn(
            createBackupMachine(serviceRefs),
            backupMachine.id,
          );

          serviceRefs.backupRestore = spawn(
            createBackupRestoreMachine(serviceRefs),
            backupRestoreMachine.id,
          );

          serviceRefs.activityLog = spawn(
            createActivityLogMachine(serviceRefs),
            activityLogMachine.id,
          );

          serviceRefs.scan = spawn(
            createScanMachine(serviceRefs),
            scanMachine.id,
          );

          if (isAndroid()) {
            serviceRefs.request = spawn(
              createRequestMachine(serviceRefs),
              requestMachine.id,
            );
          }

          serviceRefs.revoke = spawn(
            createRevokeMachine(serviceRefs),
            revokeVidsMachine.id,
          );

          return serviceRefs;
        },
      }),

      logServiceEvents: context => {
        if (__DEV__) {
          context.serviceRefs.auth.subscribe(logState);
          context.serviceRefs.vc.subscribe(logState);
          context.serviceRefs.settings.subscribe(logState);
          context.serviceRefs.activityLog.subscribe(logState);
          context.serviceRefs.scan.subscribe(logState);
          context.serviceRefs.backup.subscribe(logState);
          context.serviceRefs.backupRestore.subscribe(logState);

          if (isAndroid()) {
            context.serviceRefs.request.subscribe(logState);
          }

          context.serviceRefs.revoke.subscribe(logState);
        }
      },

      setAppInfo: model.assign({
        info: (_, event) => event.info,
      }),

      loadCredentialRegistryHostFromStorage: send(
        StoreEvents.GET(SETTINGS_STORE_KEY),
        {
          to: context => context.serviceRefs.store,
        },
      ),

      loadEsignetHostFromStorage: send(StoreEvents.GET(SETTINGS_STORE_KEY), {
        to: context => context.serviceRefs.store,
      }),

      loadCredentialRegistryInConstants: (_context, event) => {
        changeCrendetialRegistry(
          !event.response?.encryptedData?.credentialRegistry
            ? MIMOTO_BASE_URL
            : event.response?.encryptedData?.credentialRegistry,
        );
      },

      loadEsignetHostFromConstants: (_context, event) => {
        changeEsignetUrl(
          !event.response?.encryptedData?.esignetHostUrl
            ? ESIGNET_BASE_URL
            : event.response?.encryptedData?.esignetHostUrl,
        );
      },
    },

    services: {
      getAppInfo: () => async callback => {
        const appInfo = {
          deviceId: getDeviceId(),
          deviceName: await getDeviceName(),
        };
        callback(model.events.APP_INFO_RECEIVED(appInfo));
      },

      checkFocusState: () => callback => {
        const changeHandler = (newState: AppStateStatus) => {
          switch (newState) {
            case 'background':
            case 'inactive':
              callback({type: 'INACTIVE'});
              break;
            case 'active':
              callback({type: 'ACTIVE'});
              break;
          }
        };

        const blurHandler = () => callback({type: 'INACTIVE'});
        const focusHandler = () => callback({type: 'ACTIVE'});

        AppState.addEventListener('change', changeHandler);

        if (isAndroid()) {
          AppState.addEventListener('blur', blurHandler);
          AppState.addEventListener('focus', focusHandler);
        }

        return () => {
          AppState.removeEventListener('change', changeHandler);

          if (isAndroid()) {
            AppState.removeEventListener('blur', blurHandler);
            AppState.removeEventListener('focus', focusHandler);
          }
        };
      },

      checkNetworkState: () => callback => {
        return NetInfo.addEventListener(state => {
          if (state.isConnected) {
            callback({type: 'ONLINE', networkType: state.type});
          } else {
            callback({type: 'OFFLINE'});
          }
        });
      },
    },
  },
);

interface AppInfo {
  deviceId: string;
  deviceName: string;
}

type State = StateFrom<typeof appMachine>;

export function selectAppInfo(state: State) {
  return state.context.info;
}
export function selectIsReady(state: State) {
  return state.matches('ready');
}

export function selectIsOnline(state: State) {
  return state.matches('ready.network.online');
}

export function selectIsActive(state: State) {
  return state.matches('ready.focus.active');
}

export function selectIsFocused(state: State) {
  return state.matches('ready.focus');
}

export function selectIsReadError(state: State) {
  return state.context.isReadError;
}

export function selectIsDecryptError(state: State) {
  return state.context.isDecryptError;
}

export function selectIsKeyInvalidateError(state: State) {
  return state.context.isKeyInvalidateError;
}
