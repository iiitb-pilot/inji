import React from 'react';
import {Platform, Pressable} from 'react-native';
import {Icon, ListItem, Switch} from 'react-native-elements';
import {Column, Row, Text} from '../../components/ui';
import {Theme} from '../../components/ui/styleUtils';
import {MessageOverlay} from '../../components/MessageOverlay';
import {useSettingsScreen} from './SettingScreenController';
import {useTranslation} from 'react-i18next';
import {LanguageSelector} from '../../components/LanguageSelector';
import {ScrollView} from 'react-native-gesture-handler';
import {Modal} from '../../components/ui/Modal';
import {CREDENTIAL_REGISTRY_EDIT} from 'react-native-dotenv';
import {AboutInji} from './AboutInji';
import {EditableListItem} from '../../components/EditableListItem';
import {RequestRouteProps, RootRouteProps} from '../../routes';
import {ReceivedCards} from './ReceivedCards';
import testIDProps from '../../shared/commonUtil';
import {SvgImage} from '../../components/ui/svg';
import {DataBackupAndRestore} from './DataBackupAndRestore';
import {BannerNotificationContainer} from '../../components/BannerNotificationContainer';

const LanguageSetting: React.FC = () => {
  const {t} = useTranslation('SettingScreen');

  return (
    <LanguageSelector
      triggerComponent={
        <ListItem {...testIDProps('language')}>
          <Icon
            name="globe"
            size={22}
            type="simple-line-icon"
            color={Theme.Colors.Icon}
          />
          <ListItem.Content>
            <ListItem.Title
              {...testIDProps('languageTitle')}
              style={{paddingTop: 3}}>
              <Text weight="semibold" color={Theme.Colors.settingsLabel}>
                {t('language')}
              </Text>
            </ListItem.Title>
          </ListItem.Content>
          <Icon
            {...testIDProps('chevronRightIcon')}
            name="chevron-right"
            size={21}
            color={Theme.Colors.chevronRightColor}
            style={{marginRight: 15}}
          />
        </ListItem>
      }
    />
  );
};

export const SettingScreen: React.FC<
  SettingProps & RootRouteProps & RequestRouteProps
> = props => {
  const {t} = useTranslation('SettingScreen');
  const controller = useSettingsScreen(props);

  const updateRegistry = items => {
    controller.UPDATE_CREDENTIAL_REGISTRY(items[0].value, items[1].value);
  };

  return (
    <React.Fragment>
      <Pressable accessible={false} onPress={controller.TOGGLE_SETTINGS}>
        {props.triggerComponent}
      </Pressable>
      <Modal
        testID="settingsScreen"
        isVisible={controller.isVisible}
        arrowLeft={true}
        headerTitle={t('header')}
        headerElevation={2}
        onDismiss={controller.TOGGLE_SETTINGS}>
        <BannerNotificationContainer />
        <ScrollView>
          <Column
            style={{display: Platform.OS !== 'ios' ? 'flex' : 'none'}}
            backgroundColor={Theme.Colors.lightGreyBackgroundColor}>
            <Text
              style={{paddingTop: 3}}
              testID="injiAsVerifierApp"
              weight="semibold"
              margin="10"
              color={Theme.Colors.aboutVersion}>
              {t('injiAsVerifierApp')}
            </Text>
            <Row
              align="space-evenly"
              backgroundColor={Theme.Colors.whiteBackgroundColor}>
              <Pressable
                {...testIDProps('receiveCardPressableArea')}
                onPress={controller.RECEIVE_CARD}>
                <Column
                  align="center"
                  style={Theme.Styles.receiveCardsContainer}>
                  {SvgImage.ReceiveCard()}
                  <Text
                    testID="receiveCard"
                    margin="6"
                    style={{paddingTop: 3}}
                    weight="semibold">
                    {t('receiveCard')}
                  </Text>
                </Column>
              </Pressable>

              <ReceivedCards />
            </Row>

            <Text
              weight="semibold"
              style={{paddingTop: 3}}
              margin="10"
              color={Theme.Colors.aboutVersion}>
              {t('basicSettings')}
            </Text>
          </Column>
          <Column fill>
            <MessageOverlay
              isVisible={controller.alertMsg != ''}
              onBackdropPress={controller.hideAlert}
              title={controller.alertMsg}
            />

            <LanguageSetting />

            <ListItem topDivider disabled={!controller.canUseBiometrics}>
              <Icon
                type={'MaterialCommunityIcons'}
                name={'fingerprint'}
                color={Theme.Colors.Icon}
                size={25}
              />
              <ListItem.Content>
                <ListItem.Title
                  {...testIDProps('bioUnlock')}
                  style={{paddingTop: 3}}>
                  <Text weight="semibold" color={Theme.Colors.settingsLabel}>
                    {t('bioUnlock')}
                  </Text>
                </ListItem.Title>
              </ListItem.Content>
              <Switch
                value={controller.isBiometricUnlockEnabled}
                onValueChange={controller.useBiometrics}
                trackColor={{
                  false: Theme.Colors.switchTrackFalse,
                  true:
                    Platform.OS == 'ios'
                      ? Theme.Colors.switchHead
                      : Theme.Colors.switchTrackTrue,
                }}
                color={Theme.Colors.switchHead}
              />
            </ListItem>

            <AboutInji appId={controller.appId} />

            <DataBackupAndRestore />

            {CREDENTIAL_REGISTRY_EDIT === 'true' && (
              <EditableListItem
                testID="credentialRegistry"
                title={t('credentialRegistry')}
                content={controller.credentialRegistry}
                items={[
                  {
                    label: t('credentialRegistry'),
                    value: controller.credentialRegistry,
                    testID: 'credentialRegistry',
                  },
                  {
                    label: t('esignethosturl'),
                    value: controller.esignetHostUrl,
                    testID: 'esignetHost',
                  },
                ]}
                response={controller.credentialRegistryResponse}
                onCancel={controller.CANCEL}
                onEdit={updateRegistry}
                Icon="star"
                errorMessage={t('errorMessage')}
                progress={controller.isResetInjiProps}
                titleColor={Theme.Colors.settingsLabel}
              />
            )}

            <ListItem
              topDivider
              bottomDivider
              onPress={() => controller.INJI_TOUR_GUIDE()}>
              <Icon
                type={'antdesign'}
                name={'book'}
                color={Theme.Colors.Icon}
                size={25}
              />
              <ListItem.Content>
                <ListItem.Title
                  {...testIDProps('injiTourGuide')}
                  style={{paddingTop: 3}}>
                  <Text weight="semibold" color={Theme.Colors.settingsLabel}>
                    {t('injiTourGuide')}
                  </Text>
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>

            <ListItem onPress={controller.LOGOUT}>
              <Icon
                name="logout"
                type="fontawesome"
                size={22}
                color={Theme.Colors.Icon}
              />
              <ListItem.Content>
                <ListItem.Title
                  {...testIDProps('logout')}
                  style={{paddingTop: 3}}>
                  <Text weight="semibold" color={Theme.Colors.settingsLabel}>
                    {t('logout')}
                  </Text>
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          </Column>
        </ScrollView>
      </Modal>
    </React.Fragment>
  );
};

interface SettingProps {
  testID?: string;
  triggerComponent: React.ReactElement;
}
