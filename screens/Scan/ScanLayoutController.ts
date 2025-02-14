import {NavigationProp, useNavigation} from '@react-navigation/native';
import {useSelector} from '@xstate/react';
import {useContext, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {MessageOverlayProps} from '../../components/MessageOverlay';
import {MainBottomTabParamList, changeTabBarVisible} from '../../routes/main';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  selectIsConnecting,
  selectIsConnectingTimeout,
  selectIsInvalid,
  selectIsLocationDenied,
  selectIsLocationDisabled,
  selectIsQrLoginDone,
  selectIsScanning,
  selectIsSendingVc,
  selectIsSendingVcTimeout,
  selectIsSent,
  selectIsDone,
} from '../../machines/bleShare/scan/selectors';
import {
  selectIsAccepted,
  selectIsDisconnected,
  selectIsExchangingDeviceInfo,
  selectIsExchangingDeviceInfoTimeout,
  selectIsHandlingBleError,
  selectIsOffline,
  selectIsRejected,
  selectIsReviewing,
} from '../../machines/bleShare/commonSelectors';
import {ScanEvents} from '../../machines/bleShare/scan/scanMachine';
import {BOTTOM_TAB_ROUTES, SCAN_ROUTES} from '../../routes/routesConstants';
import {ScanStackParamList} from '../../routes/routesConstants';

type ScanLayoutNavigation = NavigationProp<
  ScanStackParamList & MainBottomTabParamList
>;

// TODO: refactor
// eslint-disable-next-line sonarjs/cognitive-complexity
export function useScanLayout() {
  const {t} = useTranslation('ScanScreen');
  const {appService} = useContext(GlobalContext);
  const scanService = appService.children.get('scan');
  const navigation = useNavigation<ScanLayoutNavigation>();

  const isLocationDisabled = useSelector(scanService, selectIsLocationDisabled);
  const isLocationDenied = useSelector(scanService, selectIsLocationDenied);
  const isBleError = useSelector(scanService, selectIsHandlingBleError);

  const locationError = {message: '', button: ''};

  if (isLocationDisabled) {
    locationError.message = t('errors.locationDisabled.message');
    locationError.button = t('errors.locationDisabled.button');
  } else if (isLocationDenied) {
    locationError.message = t('errors.locationDenied.message');
    locationError.button = t('errors.locationDenied.button');
  }

  const DISMISS = () => scanService.send(ScanEvents.DISMISS());
  const CANCEL = () => scanService.send(ScanEvents.CANCEL());
  const onStayInProgress = () =>
    scanService.send(ScanEvents.STAY_IN_PROGRESS());
  const onRetry = () => scanService.send(ScanEvents.RETRY());
  const GOTO_HOME = () => {
    scanService.send(ScanEvents.DISMISS());
    changeTabBarVisible('flex');
    navigation.navigate(BOTTOM_TAB_ROUTES.home);
  };
  const GOTO_HISTORY = () => {
    scanService.send(ScanEvents.DISMISS());
    changeTabBarVisible('flex');
    navigation.navigate(BOTTOM_TAB_ROUTES.history);
  };

  const isInvalid = useSelector(scanService, selectIsInvalid);
  const isConnecting = useSelector(scanService, selectIsConnecting);
  const isConnectingTimeout = useSelector(
    scanService,
    selectIsConnectingTimeout,
  );
  const isExchangingDeviceInfo = useSelector(
    scanService,
    selectIsExchangingDeviceInfo,
  );
  const isExchangingDeviceInfoTimeout = useSelector(
    scanService,
    selectIsExchangingDeviceInfoTimeout,
  );
  const isAccepted = useSelector(scanService, selectIsAccepted);
  const isRejected = useSelector(scanService, selectIsRejected);
  const isSent = useSelector(scanService, selectIsSent);
  const isOffline = useSelector(scanService, selectIsOffline);
  const isSendingVc = useSelector(scanService, selectIsSendingVc);
  const isSendingVcTimeout = useSelector(scanService, selectIsSendingVcTimeout);
  const isStayInProgress = isConnectingTimeout || isSendingVcTimeout;

  let statusOverlay: Pick<
    MessageOverlayProps,
    | 'title'
    | 'message'
    | 'hint'
    | 'onButtonPress'
    | 'minHeight'
    | 'buttonText'
    | 'onStayInProgress'
    | 'onRetry'
    | 'progress'
    | 'onBackdropPress'
    | 'requester'
  > = null;
  if (isConnecting) {
    statusOverlay = {
      title: t('status.inProgress.title'),
      hint: t('status.inProgress.hint'),
      progress: true,
      onButtonPress: CANCEL,
    };
  } else if (isConnectingTimeout) {
    statusOverlay = {
      title: t('status.connectionInProgress'),
      hint: t('status.connectingTimeout'),
      onButtonPress: CANCEL,
      onStayInProgress,
      onRetry,
      progress: true,
    };
  } else if (isExchangingDeviceInfo) {
    statusOverlay = {
      message: t('status.exchangingDeviceInfo'),
      progress: true,
    };
  } else if (isExchangingDeviceInfoTimeout) {
    statusOverlay = {
      message: t('status.exchangingDeviceInfo'),
      hint: t('status.exchangingDeviceInfoTimeout'),
      onButtonPress: CANCEL,
      progress: true,
    };
  } else if (isSendingVc) {
    statusOverlay = {
      title: t('status.sharing.title'),
      hint: t('status.sharing.hint'),
      onButtonPress: CANCEL,
      progress: true,
    };
  } else if (isSent) {
    statusOverlay = {
      title: t('status.sharing.title'),
      hint: t('status.sharing.hint'),
      progress: true,
    };
  } else if (isSendingVcTimeout) {
    statusOverlay = {
      title: t('status.sharing.title'),
      hint: t('status.sharing.timeoutHint'),
      onButtonPress: CANCEL,
      onStayInProgress,
      onRetry,
      progress: true,
    };
  } else if (isAccepted) {
    statusOverlay = {
      title: t('status.accepted.title'),
      message: t('status.accepted.message'),
      onButtonPress: DISMISS,
    };
  } else if (isRejected) {
    statusOverlay = {
      title: t('status.rejected.title'),
      message: t('status.rejected.message'),
      onBackdropPress: DISMISS,
    };
  } else if (isInvalid) {
    statusOverlay = {
      message: t('status.invalid'),
      onBackdropPress: DISMISS,
    };
  } else if (isOffline) {
    statusOverlay = {
      message: t('status.offline'),
      onBackdropPress: DISMISS,
    };
  } else if (isBleError) {
    statusOverlay = {
      title: t('status.bleError.title'),
      hint: t('status.bleError.message'),
      onButtonPress: DISMISS,
      onRetry,
      progress: true,
    };
  }

  useEffect(() => {
    const subscriptions = [
      navigation.addListener('focus', () =>
        scanService.send(ScanEvents.SCREEN_FOCUS()),
      ),
      navigation.addListener('blur', () =>
        scanService.send(ScanEvents.SCREEN_BLUR()),
      ),
    ];

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const isDone = useSelector(scanService, selectIsDone);
  const isReviewing = useSelector(scanService, selectIsReviewing);
  const isScanning = useSelector(scanService, selectIsScanning);
  const isQrLoginDone = useSelector(scanService, selectIsQrLoginDone);

  useEffect(() => {
    if (isDone) {
      changeTabBarVisible('flex');
      navigation.navigate(BOTTOM_TAB_ROUTES.home);
    } else if (isReviewing) {
      changeTabBarVisible('none');
      navigation.navigate(SCAN_ROUTES.SendVcScreen);
    } else if (isScanning) {
      changeTabBarVisible('flex');
      navigation.navigate(SCAN_ROUTES.ScanScreen);
    } else if (isQrLoginDone) {
      changeTabBarVisible('flex');
      navigation.navigate(BOTTOM_TAB_ROUTES.history);
    }
  }, [isDone, isReviewing, isScanning, isQrLoginDone, isBleError]);

  return {
    isInvalid,
    isDone,
    GOTO_HOME,
    GOTO_HISTORY,
    isDisconnected: useSelector(scanService, selectIsDisconnected),
    statusOverlay,
    isStayInProgress,
    isBleError,
    DISMISS,
    isAccepted,
    onRetry,
    CANCEL,
    isSendingVc,
  };
}
